import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, CalendarDays, CheckCircle2, CircleAlert,
  ClipboardList, Copy, CreditCard, Hash, LoaderCircle, RefreshCw, Search,
  ShieldCheck, WalletCards, XCircle,
} from 'lucide-react';
import apiClient from '../services/client';
import useAuthStore from '../store/useAuthStore';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../components/ui/Button';
import { formatDateTime } from '../utils/intl';
import { formatWalletAmount } from '../utils/storefront';

const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const TRANSACTIONS_PER_PAGE = 30;

const statusMeta = (status) => {
  const token = String(status || 'completed').toLowerCase();
  if (['completed', 'complete', 'success', 'approved'].includes(token)) return { label: 'مكتملة', tone: 'text-emerald-600 dark:text-emerald-300 border-emerald-400/30 bg-emerald-500/10', Icon: CheckCircle2 };
  if (['failed', 'rejected', 'cancelled', 'canceled'].includes(token)) return { label: 'غير مكتملة', tone: 'text-rose-600 dark:text-rose-300 border-rose-400/30 bg-rose-500/10', Icon: XCircle };
  return { label: 'قيد المعالجة', tone: 'text-amber-600 dark:text-amber-300 border-amber-400/30 bg-amber-500/10', Icon: CircleAlert };
};

const paymentMethod = (tx) => tx.paymentMethodName || tx.paymentChannel || tx.methodName || tx.method || tx.paymentMethod || tx.source?.paymentMethod || 'محفظة الموقع';
const transactionRef = (tx) => tx.transactionId || tx.transactionNumber || tx.paymentReference || tx.reference?.transactionId || tx.reference?.orderNumber || (typeof tx.reference === 'string' ? tx.reference : '') || tx.id;
const copyText = async (value) => {
  const text = String(value || '').trim();
  if (!text) return false;
  try { await navigator.clipboard?.writeText(text); return true; } catch { return false; }
};
const isAdminOperation = (tx) => {
  const source = `${tx.sourceType || ''} ${tx.createdBy?.role || ''} ${tx.actor?.role || ''} ${tx.description || ''}`.toLowerCase();
  return Boolean(tx.isAdminAdjustment || tx.adminId || tx.createdByAdmin || /admin|أدمن|ادمن/.test(source));
};
const typeMeta = (tx) => {
  const signed = tx.signedAmount;
  const token = String(tx.type || '').toLowerCase();
  if (signed < 0 || ['debit', 'purchase', 'charge', 'deduct', 'deduction'].includes(token)) return { key: 'debit', label: token === 'purchase' ? 'شراء' : 'خصم رصيد', prefix: '−', tone: 'rose', Icon: ArrowUpRight };
  if (token === 'refund' || token === 'reversal') return { key: 'credit', label: 'استرداد رصيد', prefix: '+', tone: 'emerald', Icon: ArrowDownLeft };
  return { key: 'credit', label: 'إضافة رصيد', prefix: '+', tone: 'emerald', Icon: ArrowDownLeft };
};
const productName = (tx) => tx.productName || tx.product?.name || tx.order?.productName || tx.order?.productNameAr
  || tx.reference?.productName || tx.reference?.productNameAr || tx.reference?.product?.name || '';
const operationText = (tx, isAdmin) => {
  const meta = typeMeta(tx);
  if (meta.key !== 'debit') return tx.description || 'إضافة إلى رصيد المحفظة';
  if (isAdmin) return 'خصم بواسطة الأدمن';
  const name = String(productName(tx) || tx.description || '')
    .replace(/^payment\s+for\s*:\s*/i, '')
    .replace(/^order\s+purchase\s*:?\s*/i, '')
    .trim();
  return name ? `تم شراء: ${name}` : 'شراء من رصيد المحفظة';
};
const operationTitle = (tx, isAdmin) => {
  const meta = typeMeta(tx);
  if (isAdmin && meta.key === 'debit') return 'خصم بواسطة الأدمن';
  if (meta.key !== 'debit') return meta.label;
  const name = String(productName(tx) || tx.description || '')
    .replace(/^payment\s+for\s*:\s*/i, '')
    .replace(/^order\s+purchase\s*:?\s*/i, '')
    .trim();
  return name || meta.label;
};

// Balance snapshots from the ledger are authoritative. We only connect adjacent
// entries when that connection is mathematically exact; missing snapshots stay blank.
const reconcileBalances = (items, currentBalance) => {
  const chronological = [...items].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  const rows = chronological.map((item) => ({
    ...item,
    before: null,
    after: item.balanceAfter !== null && item.balanceAfter !== undefined && Number.isFinite(Number(item.balanceAfter))
      ? number(item.balanceAfter)
      : null,
  }));
  if (rows.length && rows.at(-1).after === null && currentBalance !== null && currentBalance !== undefined && Number.isFinite(Number(currentBalance))) {
    rows.at(-1).after = number(currentBalance);
  }
  for (let pass = 0; pass < rows.length + 1; pass += 1) {
    let changed = false;
    rows.forEach((row, index) => {
      if (row.after !== null && row.before === null) { row.before = row.after - row.signedAmount; changed = true; }
      if (index && row.before !== null && rows[index - 1].after === null) { rows[index - 1].after = row.before; changed = true; }
    });
    if (!changed) break;
  }
  return rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

const WalletTransactions = () => {
  const { user } = useAuthStore();
  const { dir } = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [walletBalance, setWalletBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ from: '', to: '', type: 'all', method: 'all', query: '' });
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [entries, stats] = await Promise.all([
        apiClient.wallet.getTransactions({ page: 1, limit: 500 }),
        apiClient.wallet.getStats().catch(() => null),
      ]);
      setTransactions(Array.isArray(entries) ? entries : []);
      const actual = [stats?.walletBalance, stats?.netBalance, user?.walletBalance, user?.coins, user?.balance]
        .find((value) => value !== null && value !== undefined && Number.isFinite(Number(value)));
      setWalletBalance(actual === undefined ? null : number(actual));
    } catch (_error) {
      setError('تعذر تحميل سجل العمليات الآن. يمكنك المحاولة مرة أخرى.');
      setTransactions([]);
    } finally { setLoading(false); }
  }, [user?.balance, user?.coins, user?.walletBalance]);

  useEffect(() => { void load(); }, [load]);

  const reconciled = useMemo(() => reconcileBalances(transactions.map((tx) => ({
    ...tx,
    signedAmount: Number.isFinite(Number(tx.signedAmount)) ? number(tx.signedAmount) : (String(tx.type).toLowerCase() === 'debit' ? -Math.abs(number(tx.amount)) : Math.abs(number(tx.amount))),
  })), walletBalance), [transactions, walletBalance]);
  const methods = useMemo(() => [...new Set(reconciled.map(paymentMethod).filter(Boolean))], [reconciled]);
  const visible = useMemo(() => reconciled.filter((tx) => {
    const date = tx.createdAt ? new Date(tx.createdAt) : null;
    const from = filters.from ? new Date(`${filters.from}T00:00:00`) : null;
    const to = filters.to ? new Date(`${filters.to}T23:59:59.999`) : null;
    const kind = typeMeta(tx).key;
    const query = filters.query.trim().toLowerCase();
    return (!from || (date && date >= from)) && (!to || (date && date <= to))
      && (filters.type === 'all' || filters.type === kind || (filters.type === 'purchase' && String(tx.type).toLowerCase() === 'purchase'))
      && (filters.method === 'all' || paymentMethod(tx) === filters.method)
      && (!query || `${transactionRef(tx)} ${tx.description || ''}`.toLowerCase().includes(query));
  }), [filters, reconciled]);
  const totalPages = Math.max(1, Math.ceil(visible.length / TRANSACTIONS_PER_PAGE));
  const pageTransactions = useMemo(() => visible.slice((currentPage - 1) * TRANSACTIONS_PER_PAGE, currentPage * TRANSACTIONS_PER_PAGE), [currentPage, visible]);
  useEffect(() => { setCurrentPage(1); }, [filters]);
  useEffect(() => { setCurrentPage((page) => Math.min(page, totalPages)); }, [totalPages]);
  const currency = String(user?.currency || transactions[0]?.currency || 'USD').toUpperCase();
  const update = (key, value) => setFilters((state) => ({ ...state, [key]: value }));

  return <main className="mx-auto w-full max-w-7xl space-y-4 pb-8 text-[var(--color-text)]" dir={dir}>
    <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-[#f5b700]/25 bg-[radial-gradient(30rem_circle_at_100%_-25%,rgb(245_183_0/0.28),transparent_50%),radial-gradient(26rem_circle_at_0%_110%,rgb(11_92_255/0.42),transparent_52%),linear-gradient(135deg,#071a3d,#0a2452_48%,#0b5cff)] px-4 py-5 text-white shadow-[0_28px_70px_-45px_rgb(7_26_61/0.95)] sm:px-6 sm:py-6">
      <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#f5b700]/35 bg-[#f5b700]/12 text-[#ffe28a]"><ClipboardList className="h-6 w-6" /></span><div><p className="text-[10px] font-black tracking-[.16em] text-[#ffe28a]">محفظتك المالية</p><h1 className="mt-1 text-xl font-black sm:text-2xl">سجل العمليات وحركة الرصيد</h1><p className="mt-1 text-xs text-blue-100/80">كل عملية موثقة برصيدها قبل وبعد التنفيذ.</p></div></div>
        <div className="rounded-2xl border border-[#f5b700]/30 bg-[#071a3d]/45 px-4 py-3 backdrop-blur"><p className="text-[10px] font-bold text-[#ffe28a]">إجمالي الرصيد الحالي</p><p className="mt-1 text-xl font-black text-white [direction:ltr]">{walletBalance === null ? '—' : formatWalletAmount(walletBalance, currency)}</p></div>
      </div>
    </section>

    <section className="rounded-[1.25rem] border border-[color:rgb(var(--color-border-rgb)/.75)] bg-[color:rgb(var(--color-card-rgb)/.82)] p-2.5 shadow-[0_20px_50px_-42px_rgb(var(--color-primary-rgb)/.7)]">
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 lg:grid-cols-4">
        <label className="text-[8px] font-bold text-[var(--color-text-secondary)]">من تاريخ<input type="date" value={filters.from} onChange={(e) => update('from', e.target.value)} className="mt-0.5 h-8 w-full rounded-lg border border-[color:rgb(var(--color-border-rgb)/.8)] bg-[color:rgb(var(--color-surface-rgb)/.7)] px-1.5 text-[10px] outline-none focus:border-cyan-400" /></label>
        <label className="text-[8px] font-bold text-[var(--color-text-secondary)]">إلى تاريخ<input type="date" value={filters.to} onChange={(e) => update('to', e.target.value)} className="mt-0.5 h-8 w-full rounded-lg border border-[color:rgb(var(--color-border-rgb)/.8)] bg-[color:rgb(var(--color-surface-rgb)/.7)] px-1.5 text-[10px] outline-none focus:border-cyan-400" /></label>
        <label className="text-[8px] font-bold text-[var(--color-text-secondary)]">نوع العملية<select value={filters.type} onChange={(e) => update('type', e.target.value)} className="mt-0.5 h-8 w-full rounded-lg border border-[color:rgb(var(--color-border-rgb)/.8)] bg-[color:rgb(var(--color-surface-rgb)/.7)] px-1.5 text-[10px] outline-none"><option value="all">الكل</option><option value="credit">إضافة</option><option value="purchase">شراء</option><option value="debit">خصم</option></select></label>
        <label className="text-[8px] font-bold text-[var(--color-text-secondary)]">طريقة الدفع<select value={filters.method} onChange={(e) => update('method', e.target.value)} className="mt-0.5 h-8 w-full rounded-lg border border-[color:rgb(var(--color-border-rgb)/.8)] bg-[color:rgb(var(--color-surface-rgb)/.7)] px-1.5 text-[10px] outline-none"><option value="all">كل الطرق</option>{methods.map((method) => <option key={method} value={method}>{method}</option>)}</select></label>
        <label className="relative col-span-2 text-[8px] font-bold text-[var(--color-text-secondary)]">بحث برقم العملية أو الوصف<Search className="absolute bottom-2 start-2 h-3 w-3 text-[var(--color-text-secondary)]" /><input value={filters.query} onChange={(e) => update('query', e.target.value)} placeholder="ابحث هنا..." className="mt-0.5 h-8 w-full rounded-lg border border-[color:rgb(var(--color-border-rgb)/.8)] bg-[color:rgb(var(--color-surface-rgb)/.7)] pe-2 ps-7 text-[10px] outline-none focus:border-cyan-400" /></label>
      </div>
    </section>

    <section className="overflow-hidden rounded-[1.5rem] border border-[color:rgb(var(--color-border-rgb)/.75)] bg-[color:rgb(var(--color-card-rgb)/.82)]">
      <header className="flex items-center justify-between border-b border-[color:rgb(var(--color-border-rgb)/.7)] px-4 py-3"><div><h2 className="text-sm font-black">العمليات المالية</h2><p className="mt-0.5 text-[10px] text-[var(--color-text-secondary)]">{visible.length} عملية معروضة</p></div><button type="button" onClick={load} disabled={loading} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-cyan-400/25 bg-cyan-500/8 px-3 text-xs font-black text-[var(--color-primary)] disabled:opacity-50"><RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />تحديث</button></header>
      {loading ? <div className="grid place-items-center gap-3 px-5 py-20 text-sm font-bold text-[var(--color-text-secondary)]"><LoaderCircle className="h-7 w-7 animate-spin text-[var(--color-primary)]" />جارٍ تحميل السجل...</div> : error ? <div className="px-5 py-16 text-center"><CircleAlert className="mx-auto h-8 w-8 text-rose-500" /><p className="mt-3 text-sm font-bold">{error}</p></div> : visible.length ? <div className="grid gap-2 p-2 sm:grid-cols-2">{pageTransactions.map((tx) => {
        const meta = typeMeta(tx); const Icon = meta.Icon; const state = statusMeta(tx.status); const StatusIcon = state.Icon; const admin = isAdminOperation(tx); const amount = Math.abs(tx.signedAmount); const description = operationText(tx, admin); const title = operationTitle(tx, admin);
        // Wallet balances always belong to the account currency. A transaction can
        // retain an old/original payment currency, which must not relabel its ledger balance.
        const balance = (value) => value === null ? 'غير متاح' : formatWalletAmount(value, currency);
        return <article key={tx.id} className={cn('relative overflow-hidden rounded-[1rem] border p-2.5 sm:p-3', meta.tone === 'emerald' ? 'border-emerald-400/25 bg-emerald-500/[.035]' : 'border-rose-400/25 bg-rose-500/[.035]')}><span className={cn('absolute inset-x-0 top-0 h-0.5', meta.tone === 'emerald' ? 'bg-emerald-400' : 'bg-rose-400')} />
          <div className="flex items-start justify-between gap-2"><div className="flex min-w-0 gap-2"><span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', meta.tone === 'emerald' ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300' : 'bg-rose-500/12 text-rose-600 dark:text-rose-300')}><Icon className="h-4 w-4" /></span><div className="min-w-0"><h3 className="truncate text-xs font-black">{title}</h3><p className="mt-0.5 truncate text-[9px] text-[var(--color-text-secondary)]">{admin ? description : (meta.key === 'debit' ? 'تم الشراء من رصيد المحفظة' : description)}</p></div></div><span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[8px] font-black', state.tone)}><StatusIcon className="h-2.5 w-2.5" />{state.label}</span></div>
          {admin && <p className="mt-2 flex items-center gap-1 rounded-lg border border-violet-400/25 bg-violet-500/10 px-2 py-1.5 text-[9px] font-black text-violet-700 dark:text-violet-200"><ShieldCheck className="h-3 w-3" />{meta.key === 'debit' ? 'تم خصم الرصيد بواسطة الأدمن' : 'تمت إضافة الرصيد بواسطة الأدمن'}</p>}
          <div className="mt-2 flex items-end justify-between rounded-xl border border-[color:rgb(var(--color-border-rgb)/.55)] bg-[color:rgb(var(--color-surface-rgb)/.48)] px-2.5 py-2"><div><p className="text-[8px] font-bold text-[var(--color-text-secondary)]">المبلغ {meta.prefix === '+' ? 'المضاف' : 'المخصوم'}</p><p className={cn('mt-0.5 text-base font-black [direction:ltr]', meta.tone === 'emerald' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300')}>{meta.prefix}{formatWalletAmount(amount, currency)}</p></div><p className="text-end text-[9px] font-bold text-[var(--color-text-secondary)]"><CreditCard className="mb-0.5 ms-auto h-3 w-3 text-[var(--color-primary)]" />{paymentMethod(tx)}</p></div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-center"><div className="rounded-lg bg-[color:rgb(var(--color-surface-rgb)/.55)] px-1 py-1.5"><p className="text-[7px] font-bold text-[var(--color-text-secondary)]">قبل العملية</p><p className="mt-0.5 truncate text-[9px] font-black [direction:ltr]">{balance(tx.before)}</p></div><div className="rounded-lg bg-[color:rgb(var(--color-surface-rgb)/.55)] px-1 py-1.5"><p className="text-[7px] font-bold text-[var(--color-text-secondary)]">التغيير</p><p className={cn('mt-0.5 text-[9px] font-black [direction:ltr]', meta.tone === 'emerald' ? 'text-emerald-600' : 'text-rose-600')}>{meta.prefix}{formatWalletAmount(amount, currency)}</p></div><div className="rounded-lg bg-[color:rgb(var(--color-surface-rgb)/.55)] px-1 py-1.5"><p className="text-[7px] font-bold text-[var(--color-text-secondary)]">بعد العملية</p><p className="mt-0.5 truncate text-[9px] font-black [direction:ltr]">{balance(tx.after)}</p></div></div>
          <div className="mt-2 grid gap-1 border-t border-[color:rgb(var(--color-border-rgb)/.55)] pt-2 text-[9px] text-[var(--color-text-secondary)] sm:grid-cols-2"><button type="button" onClick={() => void copyText(transactionRef(tx))} title="نسخ رقم العملية" className="flex min-w-0 items-center gap-1 text-start transition hover:text-[var(--color-primary)]"><Hash className="h-3 w-3 shrink-0 text-[var(--color-primary)]" /><span className="truncate [direction:ltr]">{transactionRef(tx) || 'لا يوجد رقم عملية'}</span><Copy className="h-2.5 w-2.5 shrink-0" /></button><p className="flex min-w-0 items-center gap-1"><CalendarDays className="h-3 w-3 shrink-0 text-[var(--color-primary)]" /><span className="truncate">{tx.createdAt ? formatDateTime(tx.createdAt, 'ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : 'بدون تاريخ'}</span></p></div>
        </article>;
      })}</div> : <div className="px-5 py-16 text-center"><WalletCards className="mx-auto h-10 w-10 text-[var(--color-primary)]" /><h2 className="mt-3 text-sm font-black">لا توجد عمليات مطابقة</h2><p className="mt-1 text-xs text-[var(--color-text-secondary)]">ستظهر هنا العمليات المسجلة فعليًا على محفظتك.</p></div>}
      {!loading && !error && visible.length > TRANSACTIONS_PER_PAGE ? <nav className="flex items-center justify-center gap-1.5 border-t border-[color:rgb(var(--color-border-rgb)/.65)] px-3 py-3" aria-label="صفحات العمليات"><button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)} className="h-8 rounded-lg border border-[color:rgb(var(--color-border-rgb)/.8)] px-2 text-[10px] font-bold disabled:opacity-40">السابق</button><span className="px-2 text-[10px] font-bold text-[var(--color-text-secondary)]">{currentPage} / {totalPages}</span><button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)} className="h-8 rounded-lg border border-[color:rgb(var(--color-border-rgb)/.8)] px-2 text-[10px] font-bold disabled:opacity-40">التالي</button></nav> : null}</section>
  </main>;
};

export default WalletTransactions;
