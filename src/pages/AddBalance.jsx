import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Wallet, Zap } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import useAuthStore from '../store/useAuthStore';
import useSystemStore from '../store/useSystemStore';
import { formatWalletNumber } from '../utils/storefront';
import { getActivePaymentGroups } from '../utils/paymentSettings';
import PaymentMethodCard from '../components/wallet/PaymentMethodCard';
import { cn } from '../components/ui/Button';

const AddBalance = ({
  embedded = false,
  automaticAmount = null,
  automaticCurrency = '',
  onSelectMethod = null,
}) => {
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const paymentSettings = useSystemStore((state) => state.paymentSettings);
  const loadPaymentSettings = useSystemStore((state) => state.loadPaymentSettings);
  const isRTL = dir === 'rtl';

  useEffect(() => {
    void loadPaymentSettings({ force: true }).catch(() => null);
  }, [loadPaymentSettings]);

  const currentBalance = Number(user?.walletBalance ?? user?.coins ?? user?.balance ?? 0);
  const currentCurrency = String(user?.currency || 'USD').toUpperCase();
  const suggestedAmount = Number(automaticAmount ?? searchParams.get('amount') ?? 0);
  const suggestedCurrency = String(automaticCurrency || searchParams.get('currency') || currentCurrency).toUpperCase();
  const isAutomaticTopup = (embedded || searchParams.get('mode') === 'auto')
    && Number.isFinite(suggestedAmount)
    && suggestedAmount > 0;

  const [selectedGroupId, setSelectedGroupId] = useState('all');

  const paymentGroups = useMemo(
    () => getActivePaymentGroups(paymentSettings, { fallbackToDefault: true }),
    [paymentSettings]
  );

  const allMethods = useMemo(() => {
    return paymentGroups.flatMap((group) => (
      group.methods.map((method) => ({
        ...method,
        groupId: group.id,
        groupName: group.name,
        groupCurrency: group.currency,
      }))
    ));
  }, [paymentGroups]);

  const displayedMethods = useMemo(() => {
    if (selectedGroupId === 'all') return allMethods;
    return allMethods.filter((m) => String(m.groupId) === String(selectedGroupId));
  }, [allMethods, selectedGroupId]);

  const handleMethodSelect = (method) => {
    if (onSelectMethod) {
      onSelectMethod(method);
      return;
    }

    const next = new URLSearchParams();
    if (isAutomaticTopup) {
      next.set('amount', String(suggestedAmount));
      next.set('currency', suggestedCurrency);
      next.set('mode', 'auto');
    }
    const query = next.toString();
    navigate(`/wallet/payment-details/${method.id}${query ? `?${query}` : ''}`);
  };

  return (
    <div className={embedded ? 'w-full min-w-0 overflow-x-hidden pb-1' : 'min-h-full pb-6'} dir={dir}>
      <div className="mx-auto w-full min-w-0 max-w-4xl space-y-3 px-1 sm:space-y-4 sm:px-2">
        <section className="relative isolate overflow-hidden rounded-[1.55rem] border border-amber-400/30 bg-[radial-gradient(22rem_circle_at_95%_-20%,rgba(251,191,36,0.35),transparent_48%),radial-gradient(18rem_circle_at_4%_115%,rgba(217,119,6,0.4),transparent_52%),linear-gradient(135deg,#1c1305_0%,#451a03_38%,#78350f_70%,#b45309_115%)] p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_30px_70px_-38px_rgba(217,119,6,0.7)] sm:p-5">
          <span className="pointer-events-none absolute -end-8 -top-12 -z-10 h-32 w-32 rounded-full border border-amber-300/20 bg-amber-400/10 blur-[1px]" />
          <span className="pointer-events-none absolute end-12 top-2 -z-10 h-20 w-20 rounded-full bg-amber-400/20 blur-3xl" />
          <span className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(255_255_255/0.025)_1px,transparent_1px),linear-gradient(180deg,rgb(255_255_255/0.025)_1px,transparent_1px)] bg-[length:28px_28px] [mask-image:linear-gradient(110deg,black,transparent_72%)]" />

          <div className="relative flex items-center justify-between gap-3 sm:gap-5">
            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/15 px-2 py-1 text-[0.62rem] font-black text-amber-200 backdrop-blur-md">
                <Wallet className="h-3 w-3" />
                {isRTL ? 'المحفظة' : 'Wallet'}
              </p>
              <h1 className="mt-2 text-lg font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgb(0_0_0/0.24)] sm:text-2xl">
                {t('wallet.addBalance')}
              </h1>
              <p className="mt-1 max-w-sm text-[0.68rem] font-semibold leading-5 text-amber-100/80 sm:text-xs">
                {isRTL ? 'اختر وسيلة الدفع المناسبة وأكمل البيانات' : 'Choose a payment method and complete the details'}
              </p>
            </div>

            <div className="relative shrink-0 overflow-hidden rounded-2xl border border-amber-300/25 bg-[linear-gradient(145deg,rgba(255,255,255,0.15),rgba(217,119,6,0.1))] px-3 py-2.5 text-end shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_16px_35px_-26px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:min-w-36 sm:px-4 sm:py-3">
              <span className="pointer-events-none absolute -end-3 -top-5 h-14 w-14 rounded-full bg-amber-400/20 blur-xl" />
              <span className="relative text-[0.58rem] font-bold text-amber-100/80 sm:text-[0.65rem]">
                {isRTL ? 'الرصيد الحالي' : 'Current balance'}
              </span>
              <div className="relative mt-1 flex items-baseline justify-end gap-1.5" dir="ltr">
                <strong className="font-['Poppins'] text-xl font-extrabold tracking-tight text-white [font-variant-numeric:tabular-nums] sm:text-2xl">
                  {formatWalletNumber(currentBalance, false, { maximumFractionDigits: 3 })}
                </strong>
                <span className="rounded-md bg-amber-400/20 px-1.5 py-0.5 font-['Poppins'] text-[0.58rem] font-extrabold text-amber-200 sm:text-[0.65rem]">{currentCurrency}</span>
              </div>
            </div>
          </div>
        </section>

        {isAutomaticTopup ? (
          <section className="flex items-center gap-3 rounded-[1rem] border border-amber-400/25 bg-[linear-gradient(115deg,rgb(245_158_11/0.1),rgb(var(--color-primary-rgb)/0.08))] p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-[0_12px_24px_-16px_rgb(245_158_11/0.8)]">
              <Zap className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <strong className="block text-xs font-black text-[var(--color-text)]">
                {isRTL ? 'شحن آلي لإكمال الشراء' : 'Auto top-up for your purchase'}
              </strong>
              <span className="mt-0.5 block text-[0.68rem] font-semibold text-[var(--color-text-secondary)]">
                {isRTL ? 'سنضع المبلغ المطلوب تلقائيًا بعد اختيار وسيلة الدفع' : 'The required amount will be entered automatically'}
              </span>
            </div>
            <strong className="shrink-0 text-sm font-black text-amber-600 dark:text-amber-300" dir="ltr">
              {formatWalletNumber(suggestedAmount, false, { maximumFractionDigits: 3 })} {suggestedCurrency}
            </strong>
          </section>
        ) : null}

        <section className="rounded-[1.3rem] border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-card-rgb)/0.64)] p-3 sm:p-5">
          {/* Optional quick filter tabs if more than one group */}
          {paymentGroups.length > 1 ? (
            <div className="mb-4 flex flex-wrap items-center gap-1.5" role="tablist">
              <button
                type="button"
                onClick={() => setSelectedGroupId('all')}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-black transition-all',
                  selectedGroupId === 'all'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                    : 'border border-[color:rgb(var(--color-border-rgb)/0.8)] bg-[color:rgb(var(--color-card-rgb)/0.7)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                )}
              >
                {isRTL ? 'الكل' : 'All'}
                <span className="ms-1.5 opacity-80 text-[10px]">({allMethods.length})</span>
              </button>
              {paymentGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-black transition-all',
                    selectedGroupId === group.id
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                      : 'border border-[color:rgb(var(--color-border-rgb)/0.8)] bg-[color:rgb(var(--color-card-rgb)/0.7)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                  )}
                >
                  {group.name}
                  {group.currency ? (
                    <span className="ms-1 text-[9px] font-bold opacity-75">({group.currency})</span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}

          {displayedMethods.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              {displayedMethods.map((method) => (
                <PaymentMethodCard
                  key={`${method.groupId || ''}-${method.id}`}
                  method={method}
                  onSelect={handleMethodSelect}
                  isRTL={isRTL}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[1rem] border border-dashed border-[color:rgb(var(--color-border-rgb)/0.82)] px-4 py-8 text-center">
              <Wallet className="mx-auto h-7 w-7 text-[var(--color-text-secondary)]" />
              <h3 className="mt-2 text-sm font-black text-[var(--color-text)]">
                {isRTL ? 'لا توجد وسائل دفع متاحة الآن' : 'No payment methods available'}
              </h3>
              <p className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                {isRTL ? 'يرجى المحاولة لاحقًا أو التواصل مع الدعم' : 'Try again later or contact support'}
              </p>
            </div>
          )}
        </section>

        <div className="flex items-center justify-center gap-2 py-1 text-[0.68rem] font-semibold text-[var(--color-text-secondary)]">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          {isRTL ? 'بيانات التحويل محمية وتُراجع بأمان' : 'Payment details are protected and reviewed securely'}
        </div>
      </div>
    </div>
  );
};

export default AddBalance;
