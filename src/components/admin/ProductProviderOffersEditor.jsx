import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import apiClient from '../../services/client';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input, { selectClassName } from '../ui/Input';
import ConfirmDialog from '../account/ConfirmDialog';

const PRICE_SEMANTICS = [
    { value: 'FIXED_OFFER', label: 'Fixed offer price' },
    { value: 'PER_UNIT', label: 'Price per unit' },
    { value: 'QUOTE_REQUIRED', label: 'Quote / manual only' },
];

const AGE_UNITS = {
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
};

const newOffer = () => ({
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    isDraft: true,
    providerId: '',
    providerProductId: '',
    provider: null,
    providerProduct: null,
    enabled: true,
    allowAutomaticRouting: false,
    priceSemantics: 'FIXED_OFFER',
    supplierCurrency: 'USD',
    maxPriceAgeValue: '6',
    maxPriceAgeUnit: 'hours',
    providerMapping: {},
    priority: 0,
    notes: '',
});

const normalizeOffer = (offer) => {
    const maxPriceAgeMs = Number(offer?.maxPriceAgeMs || 0);
    const maxPriceAgeValue = maxPriceAgeMs > 0 ? maxPriceAgeMs / AGE_UNITS.hours : '';
    return {
        ...newOffer(),
        ...offer,
        id: offer?.id || offer?._id,
        isDraft: false,
        providerId: String(offer?.providerId || offer?.provider?._id || offer?.provider?.id || offer?.provider || ''),
        providerProductId: String(offer?.providerProductId || offer?.providerProduct?._id || offer?.providerProduct?.id || offer?.providerProduct || ''),
        providerMapping: offer?.providerMapping || {},
        // Existing disabled mappings can legitimately have no known supplier
        // currency. Keep that unknown state visible instead of inventing USD.
        supplierCurrency: String(offer?.supplierCurrency || '').toUpperCase(),
        maxPriceAgeValue: maxPriceAgeMs > 0 ? String(maxPriceAgeValue) : '',
        maxPriceAgeUnit: 'hours',
        priority: Number.isInteger(Number(offer?.priority)) ? Number(offer.priority) : 0,
    };
};

const getProviderProductName = (product) => product?.translatedName || product?.rawName || product?.name || product?.externalProductId || '';
const getProviderProductId = (product) => String(product?.id || product?._id || '');
const getProviderProductPrice = (product) => product?.rawPrice ?? product?.priceCoins ?? product?.price ?? null;
const toAgeMs = (value, unit) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric * (AGE_UNITS[unit] || AGE_UNITS.hours)) : null;
};

const getLocalEligibility = (offer, providerProduct) => {
    if (!offer.enabled) return { eligible: false, reason: 'Disabled' };
    if (!offer.allowAutomaticRouting) return { eligible: false, reason: 'Automatic routing disabled' };
    if (offer.priceSemantics === 'QUOTE_REQUIRED') return { eligible: false, reason: 'Quote required' };
    if (!['FIXED_OFFER', 'PER_UNIT'].includes(offer.priceSemantics)) return { eligible: false, reason: 'Unsupported price semantics' };
    if (offer.supplierCurrency !== 'USD') return { eligible: false, reason: 'Phase 1 automatic routing supports USD only' };
    if (!toAgeMs(offer.maxPriceAgeValue, offer.maxPriceAgeUnit)) return { eligible: false, reason: 'Missing freshness setting' };
    if (!offer.providerProductId || !providerProduct) return { eligible: false, reason: 'Missing provider product' };
    if (providerProduct.isActive === false) return { eligible: false, reason: 'Provider product inactive' };
    return { eligible: true, reason: 'Configuration complete' };
};

const formatSyncedAt = (value) => {
    if (!value) return 'Not synced';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString();
};

const ProviderOfferCard = ({ offer, providers, customerFields, lowestOfferId, onChange, onSave, onDelete, isSaving }) => {
    const [providerProducts, setProviderProducts] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        if (!offer.providerId) {
            setProviderProducts([]);
            return () => { active = false; };
        }
        setIsLoadingProducts(true);
        apiClient.products.listProviderProducts(offer.providerId, { limit: 2000 })
            .then((items) => { if (active) setProviderProducts(Array.isArray(items) ? items : []); })
            .catch(() => { if (active) setProviderProducts([]); })
            .finally(() => { if (active) setIsLoadingProducts(false); });
        return () => { active = false; };
    }, [offer.providerId]);

    const selectedProviderProduct = useMemo(() => (
        providerProducts.find((product) => getProviderProductId(product) === offer.providerProductId)
        || offer.providerProduct
        || null
    ), [offer.providerProduct, offer.providerProductId, providerProducts]);
    const localEligibility = getLocalEligibility(offer, selectedProviderProduct);

    const update = (changes) => onChange({ ...offer, ...changes });
    const save = async () => {
        setError('');
        if (!offer.providerId || !offer.providerProductId) {
            setError('Choose a supplier and an equivalent provider product.');
            return;
        }
        if (offer.allowAutomaticRouting && !localEligibility.eligible) {
            setError(localEligibility.reason);
            return;
        }
        try {
            await onSave(offer);
        } catch (saveError) {
            const message = String(saveError?.response?.data?.message || saveError?.message || 'Could not save supplier offer.');
            setError(message);
        }
    };

    return (
        <div className="space-y-4 rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-elevated-rgb)/0.55)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h4 className="text-sm font-bold text-[var(--color-text)]">Supplier offer</h4>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Supplier cost affects routing only; it never changes the customer sale price.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {localEligibility.eligible ? <Badge variant="success"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />Automatic eligible: yes</Badge> : <Badge variant="warning"><AlertCircle className="mr-1 inline h-3.5 w-3.5" />{localEligibility.reason}</Badge>}
                    {lowestOfferId === offer.id ? <Badge variant="info">Lowest current catalog cost in this price model</Badge> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-[var(--color-text-secondary)]">
                    <span>Supplier</span>
                    <select className={`${selectClassName} h-11 w-full`} value={offer.providerId} onChange={(event) => update({ providerId: event.target.value, providerProductId: '', providerProduct: null })}>
                        <option value="">Choose supplier</option>
                        {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
                    </select>
                </label>
                <label className="space-y-1.5 text-sm font-medium text-[var(--color-text-secondary)]">
                    <span>Provider product</span>
                    <select className={`${selectClassName} h-11 w-full`} value={offer.providerProductId} disabled={!offer.providerId || isLoadingProducts} onChange={(event) => {
                        const selected = providerProducts.find((product) => getProviderProductId(product) === event.target.value) || null;
                        update({ providerProductId: event.target.value, providerProduct: selected });
                    }}>
                        <option value="">{isLoadingProducts ? 'Loading provider products…' : 'Choose equivalent provider product'}</option>
                        {providerProducts.map((product) => <option key={getProviderProductId(product)} value={getProviderProductId(product)}>{getProviderProductName(product)} — {product.externalProductId || getProviderProductId(product)}</option>)}
                    </select>
                </label>
            </div>

            {selectedProviderProduct ? (
                <div className="flex flex-wrap gap-2 rounded-lg bg-[color:rgb(var(--color-card-rgb)/0.7)] p-3 text-xs text-[var(--color-text-secondary)]">
                    <Badge variant={selectedProviderProduct.isActive === false ? 'danger' : 'success'}>{selectedProviderProduct.isActive === false ? 'Inactive' : 'Active'}</Badge>
                    <span>{getProviderProductName(selectedProviderProduct)}</span>
                    <span>Remote ID: {selectedProviderProduct.externalProductId || '-'}</span>
                    <span>Current catalog price: {getProviderProductPrice(selectedProviderProduct) ?? '-'}</span>
                    <span>Min/Max: {selectedProviderProduct.minQty ?? '-'} / {selectedProviderProduct.maxQty ?? '-'}</span>
                    <span>Last synced: {formatSyncedAt(selectedProviderProduct.lastSyncedAt)}</span>
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="flex items-center gap-2 text-sm text-[var(--color-text)]"><input type="checkbox" checked={Boolean(offer.enabled)} onChange={(event) => update({ enabled: event.target.checked })} /> Enabled</label>
                <label className="flex items-center gap-2 text-sm text-[var(--color-text)]"><input type="checkbox" checked={Boolean(offer.allowAutomaticRouting)} disabled={offer.priceSemantics === 'QUOTE_REQUIRED'} onChange={(event) => update({ allowAutomaticRouting: event.target.checked })} /> Automatic routing enabled</label>
                <label className="space-y-1 text-sm font-medium text-[var(--color-text-secondary)]"><span>Supplier currency</span><select className={`${selectClassName} h-10 w-full`} value={offer.supplierCurrency} onChange={(event) => update({ supplierCurrency: event.target.value })}><option value="">Unknown / not configured</option>{offer.supplierCurrency && offer.supplierCurrency !== 'USD' ? <option value={offer.supplierCurrency}>{offer.supplierCurrency} (legacy metadata)</option> : null}<option value="USD">USD</option></select></label>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="space-y-1 text-sm font-medium text-[var(--color-text-secondary)]"><span>Price semantics</span><select className={`${selectClassName} h-10 w-full`} value={offer.priceSemantics} onChange={(event) => update({ priceSemantics: event.target.value, allowAutomaticRouting: event.target.value === 'QUOTE_REQUIRED' ? false : offer.allowAutomaticRouting })}>{PRICE_SEMANTICS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <label className="space-y-1 text-sm font-medium text-[var(--color-text-secondary)]"><span>Maximum price age</span><div className="flex gap-2"><Input type="number" min="1" value={offer.maxPriceAgeValue} onChange={(event) => update({ maxPriceAgeValue: event.target.value })} /><select className={`${selectClassName} h-11`} value={offer.maxPriceAgeUnit} onChange={(event) => update({ maxPriceAgeUnit: event.target.value })}>{Object.keys(AGE_UNITS).map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></div></label>
                <Input label="Priority (lower wins ties)" type="number" value={offer.priority} onChange={(event) => update({ priority: event.target.value })} />
            </div>

            {customerFields.length ? <div className="space-y-2"><p className="text-sm font-semibold text-[var(--color-text)]">Offer-specific provider field mapping</p><p className="text-xs text-[var(--color-text-secondary)]">These mappings do not change the legacy Product provider mapping.</p><div className="grid grid-cols-1 gap-2 md:grid-cols-2">{customerFields.map((field) => <Input key={field} label={field} placeholder="Provider parameter name" value={offer.providerMapping?.[field] || ''} onChange={(event) => update({ providerMapping: { ...offer.providerMapping, [field]: event.target.value } })} />)}</div></div> : <p className="text-xs text-[var(--color-text-secondary)]">Add customer fields to the product to configure offer-specific parameter names.</p>}
            <Input label="Notes (optional)" value={offer.notes || ''} onChange={(event) => update({ notes: event.target.value })} />

            {error ? <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">{error}</p> : null}
            <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="danger" size="sm" onClick={() => onDelete(offer)} disabled={isSaving}><Trash2 className="h-4 w-4" /> Delete</Button><Button type="button" size="sm" onClick={save} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{offer.isDraft ? 'Add offer' : 'Save offer'}</Button></div>
        </div>
    );
};

const ProductProviderOffersEditor = ({ productId, providers, customerFields = [], onChanged }) => {
    const [offers, setOffers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [savingId, setSavingId] = useState('');
    const [offerToDelete, setOfferToDelete] = useState(null);
    const [editorError, setEditorError] = useState('');

    const loadOffers = async () => {
        if (!productId) return;
        setIsLoading(true);
        try {
            const result = await apiClient.products.getProviderOffers(productId);
            setOffers((Array.isArray(result) ? result : []).map(normalizeOffer));
            setEditorError('');
        } catch (error) {
            const message = String(
                error?.response?.data?.message || error?.message || 'Could not load supplier offers.'
            ).trim();
            setEditorError(message || 'Could not load supplier offers.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { void loadOffers(); }, [productId]);

    const lowestBySemantics = useMemo(() => {
        const result = {};
        offers.forEach((offer) => {
            const price = Number(getProviderProductPrice(offer.providerProduct));
            if (!getLocalEligibility(offer, offer.providerProduct).eligible || !Number.isFinite(price) || price <= 0) return;
            const existing = result[offer.priceSemantics];
            if (!existing || price < existing.price) result[offer.priceSemantics] = { id: offer.id, price };
        });
        return result;
    }, [offers]);

    const saveOffer = async (offer) => {
        const payload = {
            provider: offer.providerId,
            providerProduct: offer.providerProductId,
            enabled: Boolean(offer.enabled),
            allowAutomaticRouting: Boolean(offer.allowAutomaticRouting),
            priceSemantics: offer.priceSemantics,
            supplierCurrency: offer.supplierCurrency || null,
            maxPriceAgeMs: toAgeMs(offer.maxPriceAgeValue, offer.maxPriceAgeUnit),
            providerMapping: Object.fromEntries(Object.entries(offer.providerMapping || {}).filter(([, value]) => String(value || '').trim())),
            priority: Number(offer.priority || 0),
            notes: String(offer.notes || '').trim() || null,
        };
        setSavingId(offer.id);
        try {
            if (offer.isDraft) await apiClient.products.createProviderOffer(productId, payload);
            else await apiClient.products.updateProviderOffer(offer.id, payload);
            await loadOffers();
            onChanged?.();
        } finally {
            setSavingId('');
        }
    };

    const deleteOffer = async () => {
        const offer = offerToDelete;
        if (!offer) return;
        if (offer.isDraft) {
            setOffers((items) => items.filter((item) => item.id !== offer.id));
            setOfferToDelete(null);
            return;
        }
        setSavingId(offer.id);
        setEditorError('');
        try {
            await apiClient.products.deleteProviderOffer(offer.id);
            await loadOffers();
            onChanged?.();
            setOfferToDelete(null);
        } catch (error) {
            const message = String(error?.response?.data?.message || error?.message || 'Could not delete supplier offer.');
            setEditorError(message.includes('historical') ? 'This supplier offer has historical orders and cannot be deleted. Disable it instead.' : message);
        } finally {
            setSavingId('');
        }
    };

    if (!productId) return <div className="rounded-xl border border-dashed border-[color:rgb(var(--color-primary-rgb)/0.38)] bg-[color:rgb(var(--color-primary-rgb)/0.06)] p-4 text-sm text-[var(--color-text-secondary)]">Save this product first. It will be created in LEGACY mode, then you can add Supplier Offers here and activate multi-supplier routing.</div>;

    return (
        <section className="space-y-4 rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.28)] bg-[color:rgb(var(--color-primary-rgb)/0.04)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-base font-bold text-[var(--color-text)]">Supplier Offers</h3><p className="mt-1 text-xs text-[var(--color-text-secondary)]">Backend selects the lowest eligible comparable supplier cost at order time. Customer sale pricing is unchanged.</p></div><Button type="button" size="sm" onClick={() => setOffers((items) => [...items, newOffer()])}><Plus className="h-4 w-4" /> Add supplier offer</Button></div>
            {isLoading ? <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"><RefreshCw className="h-4 w-4 animate-spin" /> Loading supplier offers…</div> : null}
            {editorError ? <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">{editorError}</p> : null}
            {!isLoading && !offers.length ? <p className="rounded-lg border border-dashed border-[color:rgb(var(--color-border-rgb)/0.9)] p-4 text-sm text-[var(--color-text-secondary)]">No supplier offers configured yet.</p> : null}
            {offers.map((offer) => <ProviderOfferCard key={offer.id} offer={offer} providers={providers} customerFields={customerFields} lowestOfferId={lowestBySemantics[offer.priceSemantics]?.id} isSaving={savingId === offer.id} onChange={(next) => setOffers((items) => items.map((item) => item.id === offer.id ? next : item))} onSave={saveOffer} onDelete={setOfferToDelete} />)}
            <ConfirmDialog open={Boolean(offerToDelete)} title="Delete supplier offer?" description="This removes only this routing mapping. Historical offers may need to be disabled instead." confirmLabel="Delete offer" cancelLabel="Cancel" onConfirm={deleteOffer} onCancel={() => setOfferToDelete(null)} isLoading={Boolean(offerToDelete && savingId === offerToDelete.id)} />
        </section>
    );
};

export default ProductProviderOffersEditor;
