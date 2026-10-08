import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Coins,
  CreditCard,
  CircleAlert,
  Copy,
  Eye,
  Hash,
  History,
  MinusCircle,
  PlusCircle,
  Search,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import DashboardDateRangeFilter from '../../components/admin-dashboard/DashboardDateRangeFilter';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import useAuthStore from '../../store/useAuthStore';
import useAdminStore from '../../store/useAdminStore';
import useGroupStore from '../../store/useGroupStore';
import useOrderStore from '../../store/useOrderStore';
import useTopupStore from '../../store/useTopupStore';
import useSystemStore from '../../store/useSystemStore';
import { formatDateTime, formatNumber, getNumericLocale } from '../../utils/intl';
import { formatCurrencyAmount } from '../../utils/pricing';
import {
  resolveOrderExecutionCurrency,
  resolveTopupExecutionCurrency,
  resolveWalletTransactionExecutionCurrency,
} from '../../utils/transactionCurrency';

const COMPLETED_STATUSES = ['completed', 'approved', 'success'];
const REJECTED_STATUSES = ['rejected', 'denied', 'cancelled', 'canceled', 'failed'];
const DASHBOARD_DEFAULT_RANGE_DAYS = 30;
const OPERATIONS_PER_PAGE = 30;

const asNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const referenceText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value);
  return String(value.orderNumber || value.transactionNumber || value.transactionId || value.reference || value._id || value.id || '');
};

const normalizeStatus = (status) => String(status || '').trim().toLowerCase();
const isCompletedStatus = (status) => COMPLETED_STATUSES.includes(normalizeStatus(status));
const isRejectedStatus = (status) => REJECTED_STATUSES.includes(normalizeStatus(status));

const shiftDateByDays = (inputDate, days) => {
  const nextDate = new Date(inputDate);
  nextDate.setHours(0, 0, 0, 0);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const toDateInputValue = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateInputValue = (value) => {
  const [year, month, day] = String(value || '').split('-').map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getDateRangeBoundary = (value, { endOfDay = false } = {}) => {
  const parsed = parseDateInputValue(value);
  if (!parsed) return null;
  if (endOfDay) {
    parsed.setHours(23, 59, 59, 999);
  } else {
    parsed.setHours(0, 0, 0, 0);
  }
  return parsed;
};

const isDateWithinRange = (value, { startDate, endDate }) => {
  if (!startDate && !endDate) return true;
  if (!value) return false;

  const itemDate = new Date(value);
  if (Number.isNaN(itemDate.getTime())) return false;

  const startBoundary = getDateRangeBoundary(startDate);
  const endBoundary = getDateRangeBoundary(endDate, { endOfDay: true });

  if (startBoundary && itemDate < startBoundary) return false;
  if (endBoundary && itemDate > endBoundary) return false;
  return true;
};

const getOrderDashboardDate = (order) => (
  order?.createdAt
  || order?.date
  || order?.updatedAt
  || null
);

const getTopupDashboardDate = (topup) => (
  topup?.createdAt
  || topup?.updatedAt
  || topup?.reviewedAt
  || null
);

const getSnapshotCurrency = (snapshot = {}, fallbackCurrency = 'USD') => String(
  snapshot?.pricingSnapshot?.currency
  || snapshot?.originalCurrency
  || fallbackCurrency
  || 'USD'
).trim().toUpperCase();

const getCurrencyRate = (currencies, currencyCode) => {
  const normalizedCode = String(currencyCode || 'USD').trim().toUpperCase();
  const matchedCurrency = (currencies || []).find(
    (entry) => String(entry?.code || '').trim().toUpperCase() === normalizedCode
  );
  return asNumber(matchedCurrency?.rate) || 1;
};

const getOrderProfitUsd = (order) => {
  const explicitProfitUsd = order?.profitUsd ?? order?.financialSnapshot?.profitUsd;
  if (explicitProfitUsd !== undefined && explicitProfitUsd !== null) {
    return asNumber(explicitProfitUsd);
  }

  const snapshot = order?.financialSnapshot || {};
  const finalPrice = asNumber(
    snapshot?.pricingSnapshot?.finalPrice
    ?? snapshot?.finalAmountAtExecution
    ?? order?.priceCoins
    ?? order?.totalAmount
  );
  const basePrice = asNumber(
    snapshot?.pricingSnapshot?.basePrice
    ?? snapshot?.originalAmount
    ?? order?.unitPriceBase
  );
  const profitAmount = finalPrice - basePrice;
  const currency = getSnapshotCurrency(snapshot, order?.currency);
  const exchangeRate = asNumber(snapshot?.exchangeRateAtExecution || order?.rateSnapshot);

  if (currency === 'USD') return profitAmount;
  if (exchangeRate > 0) return profitAmount / exchangeRate;
  return profitAmount;
};

const sortByNewestDate = (left, right) => (
  new Date(right?.date || right?.createdAt || 0) - new Date(left?.date || left?.createdAt || 0)
);

const buildWalletOperation = (transaction, wallet, isArabic) => {
  const rawAmount = asNumber(transaction?.amount);
  const signedAmount = transaction?.signedAmount !== undefined && transaction?.signedAmount !== null
    ? asNumber(transaction.signedAmount)
    : (String(transaction?.type || '').trim().toLowerCase() === 'debit' ? -Math.abs(rawAmount) : Math.abs(rawAmount));
  const typeToken = String(transaction?.type || '').trim().toLowerCase();
  const kind = signedAmount < 0 ? 'debit' : 'credit';
  const sourceType = String(transaction?.sourceType || '').trim().toLowerCase();

  let title = isArabic ? 'إضافة رصيد' : 'Wallet credit';
  if (typeToken === 'refund') {
    title = isArabic ? 'استرجاع رصيد' : 'Wallet refund';
  } else if (kind === 'debit') {
    title = isArabic ? 'خصم رصيد' : 'Wallet debit';
  }

  return {
    id: `wallet-${wallet?.userId || 'unknown'}-${transaction?.id || transaction?.reference || transaction?.createdAt || Math.random()}`,
    kind,
    source: 'wallet',
    sourceType,
    sourceId: transaction?.sourceId || transaction?.reference || transaction?.id || null,
    date: transaction?.createdAt || transaction?.date || wallet?.lastTransactionAt || null,
    amount: signedAmount,
    currencyCode: resolveWalletTransactionExecutionCurrency(transaction, wallet?.currency || 'USD'),
    userId: wallet?.userId || transaction?.userId || '',
    userName: wallet?.userName || wallet?.user?.name || transaction?.user?.name || '',
    userEmail: wallet?.userEmail || wallet?.user?.email || transaction?.user?.email || '',
    title,
    description: transaction?.description || transaction?.reference || '-',
    raw: transaction,
  };
};

const buildTopupOperation = (topup, usersById, isArabic) => {
  const user = usersById.get(String(topup?.userId || '').trim()) || null;
  const amount = asNumber(
    topup?.actualPaidAmount
    ?? topup?.financialSnapshot?.originalAmount
    ?? topup?.requestedAmount
    ?? topup?.amount
    ?? 0
  );

  return {
    id: `topup-${topup?.id}`,
    kind: 'credit',
    source: 'topup',
    sourceType: 'topup',
    sourceId: topup?.id || null,
    date: getTopupDashboardDate(topup),
    amount: Math.abs(amount),
    currencyCode: resolveTopupExecutionCurrency(topup, user?.currency || 'USD'),
    userId: topup?.userId || '',
    userName: topup?.userName || user?.name || '',
    userEmail: user?.email || '',
    title: isArabic ? 'شحن رصيد' : 'Balance topup',
    description: topup?.paymentChannel || topup?.method || '-',
    raw: topup,
  };
};

const buildOrderOperation = (order, usersById, isArabic) => {
  const user = usersById.get(String(order?.userId || '').trim()) || null;
  const amount = asNumber(
    order?.financialSnapshot?.finalAmountAtExecution
    ?? order?.priceCoins
    ?? order?.totalAmount
    ?? 0
  );

  return {
    id: `order-${order?.id}`,
    kind: 'debit',
    source: 'order',
    sourceType: 'order',
    sourceId: order?.id || null,
    date: getOrderDashboardDate(order),
    amount: -Math.abs(amount),
    currencyCode: resolveOrderExecutionCurrency(order, user?.currency || 'USD'),
    userId: order?.userId || '',
    userName: order?.userName || user?.name || '',
    userEmail: user?.email || '',
    title: isArabic ? 'شراء منتج' : 'Product purchase',
    description: order?.productNameAr || order?.productName || order?.productId || '-',
    raw: order,
  };
};

const buildOperationDedupKey = (operation) => {
  const normalizedAmount = String(asNumber(operation?.amount));
  const normalizedDate = String(operation?.date || '');
  const normalizedSourceId = String(operation?.sourceId || '');
  const normalizedSourceType = String(operation?.sourceType || operation?.source || '');

  if (normalizedSourceType && normalizedSourceId) {
    return `${normalizedSourceType}:${normalizedSourceId}:${normalizedAmount}`;
  }

  return `${operation?.source}:${normalizedDate}:${normalizedAmount}:${operation?.userId || ''}:${operation?.description || ''}`;
};

const mergeOperations = (...groups) => {
  const merged = [];
  const seen = new Set();

  groups.flat().forEach((entry) => {
    if (!entry) return;
    const key = buildOperationDedupKey(entry);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(entry);
  });

  return merged.sort(sortByNewestDate);
};

const SummaryCard = ({ icon: Icon, label, value, note }) => (
  <Card className="admin-premium-stat h-full p-3 sm:p-3.5">
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.95rem] border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] text-[var(--color-primary)] sm:h-10 sm:w-10">
        <Icon className="h-4 w-4 sm:h-[1.05rem] sm:w-[1.05rem]" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-[var(--color-text-secondary)] sm:text-[11px]">{label}</p>
        <p className="mt-1 break-words text-[0.96rem] font-semibold leading-6 text-[var(--color-text)] sm:text-lg">{value}</p>
        {note ? <p className="mt-1 text-[10px] leading-4.5 text-[var(--color-muted)] sm:text-[11px]">{note}</p> : null}
      </div>
    </div>
  </Card>
);

const OperationSnapshotCard = ({
  icon: Icon,
  label,
  operation,
  formatMoney,
  formatWhen,
  isArabic,
}) => (
  <Card className="admin-premium-stat h-full p-3 sm:p-3.5">
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.95rem] border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] text-[var(--color-primary)] sm:h-10 sm:w-10">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium text-[var(--color-text-secondary)] sm:text-[11px]">{label}</p>
        {operation ? (
          <>
            <p className="mt-1 break-words text-[0.96rem] font-semibold leading-6 text-[var(--color-text)] sm:text-base">{formatMoney(operation.amount, operation.currencyCode)}</p>
            <p className="mt-1 truncate text-[11px] font-medium text-[var(--color-text)]">
              {operation.userName || operation.userEmail || (isArabic ? 'بدون اسم' : 'No user')}
            </p>
            <p className="mt-1 truncate text-[10px] leading-4.5 text-[var(--color-muted)]">{operation.description}</p>
            <p className="mt-1 text-[10px] leading-4.5 text-[var(--color-muted)]">{formatWhen(operation.date)}</p>
          </>
        ) : (
          <p className="mt-1 text-[11px] leading-5 text-[var(--color-muted)]">
            {isArabic ? 'لا توجد عملية في المدة المحددة' : 'No operation in the selected range'}
          </p>
        )}
      </div>
    </div>
  </Card>
);

const OperationRow = ({ operation, formatMoney, formatWhen, isArabic, expanded, onToggle }) => (
  <div className="rounded-[1rem] border border-[color:rgb(var(--color-border-rgb)/0.82)] bg-[color:rgb(var(--color-card-rgb)/0.72)] px-3 py-3">
    <div className="flex items-start gap-2.5">
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.85rem] border ${operation.amount >= 0 ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600' : 'border-rose-500/20 bg-rose-500/10 text-rose-600'}`}>
        {operation.amount >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="wallet-accent-chip px-2 py-0.5 text-[10px] font-semibold">
            {operation.amount >= 0
              ? (isArabic ? 'إضافة' : 'Credit')
              : (isArabic ? 'خصم' : 'Debit')}
          </span>
          <p className="truncate text-[12px] font-semibold text-[var(--color-text)]">
            {operation.userName || operation.userEmail || (isArabic ? 'بدون اسم' : 'No user')}
          </p>
        </div>

        <p className="mt-1 truncate text-[11px] leading-5 text-[var(--color-text-secondary)]">{operation.description}</p>
        <p className="mt-1 text-[10px] leading-4.5 text-[var(--color-muted)]">{formatWhen(operation.date)}</p>
      </div>
    </div>

    <div className={`mt-2.5 flex items-center justify-between gap-3 border-t border-[color:rgb(var(--color-border-rgb)/0.55)] pt-2.5 ${isArabic ? 'text-right' : 'text-left'} sm:mt-3`}>
      <p className={`text-[12px] font-semibold ${operation.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
        {formatMoney(operation.amount, operation.currencyCode)}
      </p>
      <p className="text-[10px] text-[var(--color-muted)]">
        {operation.title}
      </p>
    </div>
    <button
      type="button"
      onClick={onToggle}
      className="mt-2.5 flex h-9 w-full items-center justify-center gap-1.5 rounded-[0.8rem] border border-[color:rgb(var(--color-primary-rgb)/0.24)] text-[11px] font-semibold text-[var(--color-text)] transition hover:bg-[color:rgb(var(--color-primary-rgb)/0.08)]"
    >
      <Eye className="h-3.5 w-3.5" />
      {expanded ? (isArabic ? 'إخفاء التفاصيل' : 'Hide details') : (isArabic ? 'عرض التفاصيل' : 'View details')}
    </button>
    {expanded ? (
      <div className="mt-2 grid gap-1 rounded-[0.8rem] bg-[color:rgb(var(--color-surface-rgb)/0.72)] p-2.5 text-[10px] text-[var(--color-text-secondary)]">
        <p>{isArabic ? 'نوع الحركة' : 'Type'}: {operation.sourceType || operation.source || '-'}</p>
        <p className="break-all">{isArabic ? 'المرجع' : 'Reference'}: {operation.sourceId || '-'}</p>
        <p>{isArabic ? 'التاريخ' : 'Date'}: {formatWhen(operation.date)}</p>
      </div>
    ) : null}
  </div>
);

const UserLedgerCard = ({ operation, formatMoney, formatWhen, isArabic }) => {
  const raw = operation.raw || {};
  const asDisplayText = (value, fallback = '') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value !== 'object') return String(value);
    return String(value.orderNumber || value.transactionNumber || value.transactionId || value.reference || value._id || value.id || fallback);
  };
  const isDebit = operation.amount < 0;
  const isAdmin = Boolean(raw.isAdminAdjustment || raw.adminId || raw.createdByAdmin || String(operation.sourceType || '').includes('admin'));
  const status = normalizeStatus(raw.status || 'completed');
  const isComplete = ['completed', 'complete', 'success', 'approved'].includes(status);
  const isRejected = REJECTED_STATUSES.includes(status);
  const StatusIcon = isComplete ? CheckCircle2 : (isRejected ? XCircle : CircleAlert);
  const statusLabel = isComplete ? (isArabic ? 'مكتملة' : 'Completed') : (isRejected ? (isArabic ? 'غير مكتملة' : 'Not completed') : (isArabic ? 'قيد المعالجة' : 'Processing'));
  const productOrDescription = asDisplayText(operation.description).replace(/^payment\s+for\s*:\s*/i, '').trim();
  const title = isAdmin && isDebit
    ? (isArabic ? 'خصم بواسطة الأدمن' : 'Admin balance deduction')
    : isDebit
      ? (productOrDescription || (isArabic ? 'شراء من الرصيد' : 'Wallet purchase'))
      : (isAdmin ? (isArabic ? 'إضافة بواسطة الأدمن' : 'Admin balance credit') : (isArabic ? 'إضافة رصيد' : 'Balance credit'));
  const method = asDisplayText(raw.paymentMethodName || raw.paymentChannel || raw.methodName || raw.method, operation.sourceType === 'order' ? (isArabic ? 'محفظة الموقع' : 'Site wallet') : (isArabic ? 'محفظة الموقع' : 'Site wallet'));
  const reference = asDisplayText(raw.transactionId || raw.transactionNumber || raw.paymentReference || operation.sourceId || raw.reference, '-');
  const balanceText = (value) => value === null || value === undefined ? (isArabic ? 'غير متاح' : 'Unavailable') : formatMoney(value, operation.currencyCode);

  return (
    <article className={`relative overflow-hidden rounded-[1rem] border p-2.5 sm:p-3 ${isDebit ? 'border-rose-400/25 bg-rose-500/[.035]' : 'border-emerald-400/25 bg-emerald-500/[.035]'}`}>
      <span className={`absolute inset-x-0 top-0 h-0.5 ${isDebit ? 'bg-rose-400' : 'bg-emerald-400'}`} />
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 gap-2">
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${isDebit ? 'bg-rose-500/12 text-rose-600 dark:text-rose-300' : 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300'}`}>
            {isDebit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
          </span>
          <div className="min-w-0"><h3 className="truncate text-xs font-black text-[var(--color-text)]">{title}</h3><p className="mt-0.5 truncate text-[9px] text-[var(--color-text-secondary)]">{isDebit && !isAdmin ? (isArabic ? 'تم الشراء من رصيد المحفظة' : 'Purchased from wallet') : asDisplayText(operation.description, '-')}</p></div>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[8px] font-black ${isComplete ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : isRejected ? 'border-rose-400/30 bg-rose-500/10 text-rose-600 dark:text-rose-300' : 'border-amber-400/30 bg-amber-500/10 text-amber-600 dark:text-amber-300'}`}><StatusIcon className="h-2.5 w-2.5" />{statusLabel}</span>
      </div>
      {isAdmin ? <p className="mt-2 flex items-center gap-1 rounded-lg border border-violet-400/25 bg-violet-500/10 px-2 py-1.5 text-[9px] font-black text-violet-700 dark:text-violet-200">{isDebit ? (isArabic ? 'تم خصم الرصيد بواسطة الأدمن' : 'Balance deducted by admin') : (isArabic ? 'تمت إضافة الرصيد بواسطة الأدمن' : 'Balance credited by admin')}</p> : null}
      <div className="mt-2 flex items-end justify-between rounded-xl border border-[color:rgb(var(--color-border-rgb)/.55)] bg-[color:rgb(var(--color-surface-rgb)/.48)] px-2.5 py-2"><div><p className="text-[8px] font-bold text-[var(--color-text-secondary)]">{isArabic ? (isDebit ? 'المبلغ المخصوم' : 'المبلغ المضاف') : 'Amount'}</p><p className={`mt-0.5 text-base font-black [direction:ltr] ${isDebit ? 'text-rose-600 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-300'}`}>{isDebit ? '−' : '+'}{formatMoney(Math.abs(operation.amount), operation.currencyCode)}</p></div><p className="text-end text-[9px] font-bold text-[var(--color-text-secondary)]"><CreditCard className="mb-0.5 ms-auto h-3 w-3 text-[var(--color-primary)]" />{method}</p></div>
      <div className="mt-2 grid grid-cols-3 gap-1 text-center"><div className="rounded-lg bg-[color:rgb(var(--color-surface-rgb)/.55)] px-1 py-1.5"><p className="text-[7px] font-bold text-[var(--color-text-secondary)]">{isArabic ? 'قبل العملية' : 'Before'}</p><p className="mt-0.5 truncate text-[9px] font-black [direction:ltr]">{balanceText(operation.balanceBefore)}</p></div><div className="rounded-lg bg-[color:rgb(var(--color-surface-rgb)/.55)] px-1 py-1.5"><p className="text-[7px] font-bold text-[var(--color-text-secondary)]">{isArabic ? 'التغيير' : 'Change'}</p><p className={`mt-0.5 text-[9px] font-black [direction:ltr] ${isDebit ? 'text-rose-600' : 'text-emerald-600'}`}>{isDebit ? '−' : '+'}{formatMoney(Math.abs(operation.amount), operation.currencyCode)}</p></div><div className="rounded-lg bg-[color:rgb(var(--color-surface-rgb)/.55)] px-1 py-1.5"><p className="text-[7px] font-bold text-[var(--color-text-secondary)]">{isArabic ? 'بعد العملية' : 'After'}</p><p className="mt-0.5 truncate text-[9px] font-black [direction:ltr]">{balanceText(operation.balanceAfter)}</p></div></div>
      <div className="mt-2 grid gap-1 border-t border-[color:rgb(var(--color-border-rgb)/.55)] pt-2 text-[9px] text-[var(--color-text-secondary)] sm:grid-cols-2"><button type="button" onClick={() => void navigator.clipboard?.writeText(String(reference || ''))} title={isArabic ? 'نسخ رقم العملية' : 'Copy transaction number'} className="flex min-w-0 items-center gap-1 text-start transition hover:text-[var(--color-primary)]"><Hash className="h-3 w-3 shrink-0 text-[var(--color-primary)]" /><span className="truncate [direction:ltr]">{reference}</span><Copy className="h-2.5 w-2.5 shrink-0" /></button><p className="flex min-w-0 items-center gap-1"><CalendarDays className="h-3 w-3 shrink-0 text-[var(--color-primary)]" /><span className="truncate">{formatWhen(operation.date)}</span></p></div>
    </article>
  );
};

const AdminWallet = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedUserId = String(searchParams.get('userId') || '').trim();
  const { i18n } = useTranslation();
  const actor = useAuthStore((state) => state.user);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const { addToast } = useToast();
  const {
    users,
    wallets,
    userWalletTransactions,
    loadUsers,
    loadWallets,
    getUserWallet,
    getUserWalletTransactions,
    updateUserCoins,
    setUserBalance,
    updateUserCurrency,
    updateUserGroup,
  } = useAdminStore();
  const { groups, loadGroups } = useGroupStore();
  const { orders, loadOrders } = useOrderStore();
  const { topups, loadTopups } = useTopupStore();
  const { currencies, loadCurrencies } = useSystemStore();

  const isArabic = String(i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().startsWith('ar');
  const locale = getNumericLocale(isArabic ? 'ar-EG' : 'en-US');

  const todayInputValue = useMemo(() => toDateInputValue(new Date()), []);
  const defaultRangeStart = useMemo(
    () => toDateInputValue(shiftDateByDays(new Date(), -(DASHBOARD_DEFAULT_RANGE_DAYS - 1))),
    []
  );

  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(selectedUserId ? '' : defaultRangeStart);
  const [endDate, setEndDate] = useState(todayInputValue);
  const [selfTopupAmount, setSelfTopupAmount] = useState('');
  const [isSelfTopupUpdating, setIsSelfTopupUpdating] = useState(false);
  const [settingsCurrency, setSettingsCurrency] = useState('');
  const [settingsGroup, setSettingsGroup] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [userAdjustmentAmount, setUserAdjustmentAmount] = useState('');
  const [userFixedBalance, setUserFixedBalance] = useState('');
  const [isUserBalanceUpdating, setIsUserBalanceUpdating] = useState(false);
  const [expandedOperationId, setExpandedOperationId] = useState('');
  const [operationSearch, setOperationSearch] = useState('');
  const [operationsPage, setOperationsPage] = useState(1);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    Promise.allSettled([
      Promise.resolve(loadUsers({ force: true })),
      Promise.resolve(loadWallets({ force: true })),
      Promise.resolve(loadOrders(undefined, { force: true })),
      Promise.resolve(loadTopups({ force: true })),
      Promise.resolve(loadGroups({ force: true })),
      Promise.resolve(loadCurrencies()),
    ]).finally(() => {
      if (active) {
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [loadCurrencies, loadGroups, loadOrders, loadTopups, loadUsers, loadWallets]);

  useEffect(() => {
    if (!selectedUserId) return;
    Promise.allSettled([
      Promise.resolve(getUserWallet(selectedUserId, { force: true })),
      Promise.resolve(getUserWalletTransactions(selectedUserId, { force: true })),
    ]);
  }, [getUserWallet, getUserWalletTransactions, selectedUserId]);

  const formatRangeDate = useCallback(
    (value) => formatDateTime(value, locale, { day: 'numeric', month: 'long', year: 'numeric' }),
    [locale]
  );

  const selectedRangeLabel = useMemo(() => {
    if (startDate && endDate) {
      return isArabic
        ? `من ${formatRangeDate(startDate)} إلى ${formatRangeDate(endDate)}`
        : `From ${formatRangeDate(startDate)} to ${formatRangeDate(endDate)}`;
    }

    if (startDate) {
      return isArabic
        ? `بدءًا من ${formatRangeDate(startDate)}`
        : `Starting from ${formatRangeDate(startDate)}`;
    }

    if (endDate) {
      return isArabic
        ? `حتى ${formatRangeDate(endDate)}`
        : `Up to ${formatRangeDate(endDate)}`;
    }

    return isArabic ? 'كل الفترات' : 'All time';
  }, [endDate, formatRangeDate, isArabic, startDate]);

  const formatMoney = useCallback(
    (amount, currencyCode = 'USD') => {
      const safeAmount = Math.abs(asNumber(amount));
      return formatCurrencyAmount(safeAmount, currencyCode, currencies, locale);
    },
    [currencies, locale]
  );

  const formatSignedMoney = useCallback(
    (amount, currencyCode = 'USD') => {
      const safeAmount = asNumber(amount);
      const sign = safeAmount > 0 ? '+' : safeAmount < 0 ? '-' : '';
      return `${sign}${formatMoney(safeAmount, currencyCode)}`;
    },
    [formatMoney]
  );

  const formatWhen = useCallback(
    (value) => formatDateTime(value, locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
    [locale]
  );

  const formatCount = useCallback(
    (value) => formatNumber(value, locale),
    [locale]
  );

  const usersById = useMemo(
    () => new Map((users || []).map((entry) => [String(entry?.id || '').trim(), entry])),
    [users]
  );

  const adminProfile = useMemo(() => {
    const actorId = String(actor?.id || '').trim();
    return usersById.get(actorId) || actor || null;
  }, [actor, usersById]);

  const adminCurrencyCode = String(adminProfile?.currency || actor?.currency || 'USD').toUpperCase();
  const selectedUser = selectedUserId ? usersById.get(selectedUserId) || null : null;
  const selectedWallet = useMemo(
    () => (wallets || []).find((entry) => String(entry?.userId || entry?.id || '').trim() === selectedUserId) || null,
    [selectedUserId, wallets]
  );
  const selectedCurrencyCode = String(selectedWallet?.currency || selectedUser?.currency || 'USD').toUpperCase();
  const selectedBalance = asNumber(selectedWallet?.walletBalance ?? selectedWallet?.balance ?? selectedUser?.coins ?? 0);

  const refreshSelectedWallet = useCallback(async () => {
    if (!selectedUserId) return;
    await Promise.allSettled([
      Promise.resolve(getUserWallet(selectedUserId, { force: true })),
      Promise.resolve(getUserWalletTransactions(selectedUserId, { force: true })),
      Promise.resolve(loadUsers({ force: true })),
    ]);
  }, [getUserWallet, getUserWalletTransactions, loadUsers, selectedUserId]);

  const handleUserAdjustment = useCallback(async (direction) => {
    const amount = Math.abs(asNumber(userAdjustmentAmount));
    if (!selectedUserId || amount <= 0) {
      addToast(isArabic ? 'أدخل مبلغًا صحيحًا أولًا.' : 'Enter a valid amount first.', 'error');
      return;
    }
    setIsUserBalanceUpdating(true);
    try {
      await updateUserCoins(selectedUserId, direction === 'debit' ? -amount : amount, actor);
      await refreshSelectedWallet();
      setUserAdjustmentAmount('');
      addToast(isArabic ? 'تم تحديث رصيد المستخدم وتسجيل الحركة.' : 'User balance updated and movement recorded.', 'success');
    } catch (error) {
      addToast(error?.message || (isArabic ? 'تعذر تحديث الرصيد.' : 'Unable to update balance.'), 'error');
    } finally {
      setIsUserBalanceUpdating(false);
    }
  }, [actor, addToast, isArabic, refreshSelectedWallet, selectedUserId, updateUserCoins, userAdjustmentAmount]);

  const handleSetUserBalance = useCallback(async () => {
    const balance = Number(userFixedBalance);
    if (!selectedUserId || !Number.isFinite(balance)) {
      addToast(isArabic ? 'أدخل رصيدًا صحيحًا.' : 'Enter a valid balance.', 'error');
      return;
    }
    setIsUserBalanceUpdating(true);
    try {
      await setUserBalance(selectedUserId, balance, actor);
      await refreshSelectedWallet();
      setUserFixedBalance('');
      addToast(isArabic ? 'تم تعيين رصيد المستخدم وتسجيل الحركة.' : 'User balance set and movement recorded.', 'success');
    } catch (error) {
      addToast(error?.message || (isArabic ? 'تعذر تعيين الرصيد.' : 'Unable to set balance.'), 'error');
    } finally {
      setIsUserBalanceUpdating(false);
    }
  }, [actor, addToast, isArabic, refreshSelectedWallet, selectedUserId, setUserBalance, userFixedBalance]);

  useEffect(() => {
    setSettingsCurrency(String(adminProfile?.currency || actor?.currency || currencies?.[0]?.code || 'USD').toUpperCase());
    setSettingsGroup(String(adminProfile?.groupId || '').trim());
  }, [actor?.currency, adminProfile?.currency, adminProfile?.groupId, currencies]);

  const handleSaveAdminSettings = useCallback(async () => {
    const adminId = String(adminProfile?.id || actor?.id || '').trim();
    if (!adminId) {
      addToast(isArabic ? 'تعذر تحديد حساب الأدمن الحالي.' : 'Unable to identify the current admin account.', 'error');
      return;
    }

    const normalizedCurrency = String(settingsCurrency || '').trim().toUpperCase();
    const normalizedGroup = String(settingsGroup || '').trim();

    setIsSavingSettings(true);
    try {
      const currentCurrency = String(adminProfile?.currency || actor?.currency || '').trim().toUpperCase();
      const currentGroup = String(adminProfile?.groupId || '').trim();

      if (normalizedGroup !== currentGroup) {
        await updateUserGroup(adminId, normalizedGroup || null, actor);
      }

      if (normalizedCurrency && normalizedCurrency !== currentCurrency) {
        await updateUserCurrency(adminId, normalizedCurrency, actor);
      }

      await Promise.allSettled([
        Promise.resolve(loadUsers({ force: true })),
        Promise.resolve(loadWallets({ force: true })),
        Promise.resolve(refreshProfile?.({ force: true })),
      ]);

      addToast(isArabic ? 'تم تحديث إعدادات الحساب بنجاح.' : 'Account settings were updated successfully.', 'success');
    } catch (error) {
      addToast(
        error?.message || (isArabic ? 'تعذر تحديث إعدادات الحساب الحالية.' : 'Unable to update the current account settings.'),
        'error'
      );
    } finally {
      setIsSavingSettings(false);
    }
  }, [
    actor,
    addToast,
    adminProfile?.currency,
    adminProfile?.groupId,
    adminProfile?.id,
    isArabic,
    loadUsers,
    loadWallets,
    refreshProfile,
    settingsCurrency,
    settingsGroup,
    updateUserCurrency,
    updateUserGroup,
  ]);

  const handleSelfTopup = useCallback(async () => {
    const adminId = String(adminProfile?.id || actor?.id || '').trim();
    const amount = asNumber(selfTopupAmount);

    if (!adminId) {
      addToast(isArabic ? 'تعذر تحديد حساب الأدمن الحالي.' : 'Unable to identify the current admin account.', 'error');
      return;
    }

    if (amount <= 0) {
      addToast(isArabic ? 'أدخل مبلغًا صحيحًا لإضافته.' : 'Enter a valid amount to add.', 'error');
      return;
    }

    setIsSelfTopupUpdating(true);

    try {
      await updateUserCoins(adminId, amount, actor, () => refreshProfile?.({ force: true }));
      await Promise.allSettled([
        Promise.resolve(loadUsers({ force: true })),
        Promise.resolve(refreshProfile?.({ force: true })),
      ]);
      setSelfTopupAmount('');
      addToast(
        isArabic
          ? `تمت إضافة ${formatMoney(amount, adminCurrencyCode)} إلى رصيدك.`
          : `${formatMoney(amount, adminCurrencyCode)} was added to your balance.`,
        'success'
      );
    } catch (error) {
      addToast(
        error?.message || (isArabic ? 'تعذر إضافة الرصيد للحساب الحالي.' : 'Unable to add balance to the current account.'),
        'error'
      );
    } finally {
      setIsSelfTopupUpdating(false);
    }
  }, [
    actor,
    addToast,
    adminCurrencyCode,
    adminProfile?.id,
    formatMoney,
    isArabic,
    loadUsers,
    refreshProfile,
    selfTopupAmount,
    updateUserCoins,
  ]);

  const customerWallets = useMemo(
    () => (wallets || []).filter((wallet) => {
      const role = String(
        wallet?.user?.role
        || usersById.get(String(wallet?.userId || '').trim())?.role
        || ''
      ).trim().toLowerCase();
      return role ? role === 'customer' : true;
    }),
    [usersById, wallets]
  );

  const totalCustomerBalanceUsd = useMemo(
    () => customerWallets.reduce((sum, wallet) => {
      const balance = asNumber(wallet?.walletBalance ?? wallet?.balance);
      const currencyCode = String(wallet?.currency || 'USD').toUpperCase();
      const exchangeRate = getCurrencyRate(currencies, currencyCode);
      if (currencyCode === 'USD') return sum + balance;
      if (exchangeRate > 0) return sum + (balance / exchangeRate);
      return sum + balance;
    }, 0),
    [currencies, customerWallets]
  );

  const filteredCompletedOrders = useMemo(
    () => (orders || []).filter((order) => (
      isCompletedStatus(order?.status)
      && isDateWithinRange(getOrderDashboardDate(order), { startDate, endDate })
    )),
    [endDate, orders, startDate]
  );

  const totalProfitUsd = useMemo(
    () => filteredCompletedOrders.reduce((sum, order) => sum + getOrderProfitUsd(order), 0),
    [filteredCompletedOrders]
  );

  const walletFeedOperations = useMemo(
    () => customerWallets
      .filter((wallet) => !selectedUserId || String(wallet?.userId || wallet?.id || '').trim() === selectedUserId)
      .flatMap((wallet) => {
        const walletUserId = String(wallet?.userId || wallet?.id || '').trim();
        const fullHistory = selectedUserId && walletUserId === selectedUserId
          ? userWalletTransactions?.[selectedUserId]
          : null;
        const transactions = Array.isArray(fullHistory) ? fullHistory : wallet?.recentTransactions;
        return Array.isArray(transactions) ? transactions.map((entry) => buildWalletOperation(entry, wallet, isArabic)) : [];
      })
      .sort(sortByNewestDate),
    [customerWallets, isArabic, selectedUserId, userWalletTransactions]
  );

  const fallbackOperations = useMemo(() => {
    const topupOps = (topups || [])
      .filter((topup) => isCompletedStatus(topup?.status))
      .filter((topup) => !selectedUserId || String(topup?.userId || '').trim() === selectedUserId)
      .map((topup) => buildTopupOperation(topup, usersById, isArabic));

    const orderOps = (orders || [])
      .filter((order) => !isRejectedStatus(order?.status))
      .filter((order) => !selectedUserId || String(order?.userId || '').trim() === selectedUserId)
      .map((order) => buildOrderOperation(order, usersById, isArabic));

    return [...topupOps, ...orderOps].sort(sortByNewestDate);
  }, [isArabic, orders, selectedUserId, topups, usersById]);

  const mergedOperations = useMemo(
    () => mergeOperations(walletFeedOperations, fallbackOperations),
    [fallbackOperations, walletFeedOperations]
  );

  const filteredOperations = useMemo(() => mergedOperations.filter((entry) => {
    if (!isDateWithinRange(entry?.date, { startDate, endDate })) return false;
    const query = operationSearch.trim().toLowerCase();
    if (!query) return true;
    const raw = entry?.raw || {};
    return [entry?.sourceId, raw.transactionId, raw.transactionNumber, raw.paymentReference, raw.reference, raw.id, raw._id]
      .map(referenceText).join(' ').toLowerCase().includes(query);
  }), [endDate, mergedOperations, operationSearch, startDate]);
  const operationsTotalPages = Math.max(1, Math.ceil(filteredOperations.length / OPERATIONS_PER_PAGE));
  const paginatedOperations = useMemo(
    () => filteredOperations.slice((operationsPage - 1) * OPERATIONS_PER_PAGE, operationsPage * OPERATIONS_PER_PAGE),
    [filteredOperations, operationsPage]
  );

  useEffect(() => { setOperationsPage(1); }, [startDate, endDate, selectedUserId]);
  useEffect(() => { setOperationsPage((page) => Math.min(page, operationsTotalPages)); }, [operationsTotalPages]);

  // Reconstruct before/after only from wallet snapshots and adjacent ledger entries.
  // A missing snapshot remains unavailable instead of fabricating a balance.
  const userLedgerOperations = useMemo(() => {
    if (!selectedUserId) return [];
    const rows = [...filteredOperations]
      .sort((left, right) => new Date(left?.date || 0) - new Date(right?.date || 0))
      .map((entry) => {
        const afterValue = entry?.raw?.balanceAfter ?? entry?.raw?.walletBalance ?? entry?.raw?.balance;
        const beforeValue = entry?.raw?.balanceBefore;
        return {
          ...entry,
          balanceBefore: beforeValue !== null && beforeValue !== undefined && Number.isFinite(Number(beforeValue)) ? asNumber(beforeValue) : null,
          balanceAfter: afterValue !== null && afterValue !== undefined && Number.isFinite(Number(afterValue)) ? asNumber(afterValue) : null,
          currencyCode: selectedCurrencyCode,
        };
      });

    if (rows.length && rows.at(-1).balanceAfter === null && Number.isFinite(Number(selectedBalance))) {
      rows.at(-1).balanceAfter = asNumber(selectedBalance);
    }
    for (let pass = 0; pass <= rows.length; pass += 1) {
      let changed = false;
      rows.forEach((row, index) => {
        if (row.balanceAfter !== null && row.balanceBefore === null) { row.balanceBefore = row.balanceAfter - asNumber(row.amount); changed = true; }
        if (index && row.balanceBefore !== null && rows[index - 1].balanceAfter === null) { rows[index - 1].balanceAfter = row.balanceBefore; changed = true; }
      });
      if (!changed) break;
    }
    return rows.sort(sortByNewestDate);
  }, [filteredOperations, selectedBalance, selectedCurrencyCode, selectedUserId]);

  const latestCredit = useMemo(
    () => filteredOperations.find((entry) => asNumber(entry?.amount) > 0) || null,
    [filteredOperations]
  );

  const latestDebit = useMemo(
    () => filteredOperations.find((entry) => asNumber(entry?.amount) < 0) || null,
    [filteredOperations]
  );

  const summaryCards = useMemo(
    () => selectedUserId ? [
      {
        icon: Wallet,
        label: isArabic ? 'الرصيد الحالي' : 'Current balance',
        value: formatMoney(selectedBalance, selectedCurrencyCode),
        note: selectedCurrencyCode,
      },
      {
        icon: History,
        label: isArabic ? 'حركات المحفظة' : 'Wallet movements',
        value: formatCount(filteredOperations.length),
        note: isArabic ? 'السجل المباشر من مسار المحفظة' : 'Live wallet transaction history',
      },
      {
        icon: PlusCircle,
        label: isArabic ? 'إجمالي الإضافات' : 'Total credits',
        value: formatMoney(filteredOperations.filter((entry) => entry.amount > 0).reduce((sum, entry) => sum + entry.amount, 0), selectedCurrencyCode),
        note: isArabic ? 'رصيد دخل المحفظة' : 'Balance credited to wallet',
      },
      {
        icon: ShoppingCart,
        label: isArabic ? 'إجمالي الخصومات' : 'Total debits',
        value: formatMoney(Math.abs(filteredOperations.filter((entry) => entry.amount < 0).reduce((sum, entry) => sum + entry.amount, 0)), selectedCurrencyCode),
        note: isArabic ? 'رصيد خرج من المحفظة' : 'Balance debited from wallet',
      },
    ] : [
      {
        icon: Wallet,
        label: isArabic ? 'رصيد الأدمن' : 'Admin balance',
        value: formatMoney(adminProfile?.coins ?? 0, adminProfile?.currency || 'USD'),
        note: adminProfile?.name || (isArabic ? 'الحساب الحالي' : 'Current account'),
      },
      {
        icon: Users,
        label: isArabic ? 'رصيد العملاء' : 'Customer balances',
        value: formatMoney(totalCustomerBalanceUsd, 'USD'),
        note: isArabic
          ? `${formatCount(customerWallets.length)} محفظة عميل`
          : `${formatCount(customerWallets.length)} customer wallets`,
      },
      {
        icon: TrendingUp,
        label: isArabic ? 'الأرباح' : 'Profits',
        value: formatMoney(totalProfitUsd, 'USD'),
        note: isArabic ? 'من الطلبات المكتملة داخل المدة' : 'From completed orders in range',
      },
    ],
    [adminProfile?.coins, adminProfile?.currency, adminProfile?.name, customerWallets.length, filteredOperations, formatCount, formatMoney, isArabic, selectedBalance, selectedCurrencyCode, selectedUserId, totalCustomerBalanceUsd, totalProfitUsd]
  );

  return (
    <div className="min-w-0 space-y-3.5 pb-5 sm:space-y-5">
      <section className="admin-premium-hero relative overflow-hidden p-3 sm:p-4 lg:p-5">
        <div className="pointer-events-none absolute -top-20 right-8 h-40 w-40 rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.16)] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-28 w-28 rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.1)] blur-3xl" />

        <div className="relative flex flex-col gap-3.5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <span className="section-kicker">
              <Coins className="h-3.5 w-3.5" />
              {isArabic ? 'المحفظة' : 'Wallet'}
            </span>
            <h1 className="page-heading mt-3">
              {selectedUserId
                ? (isArabic ? 'سجل حركة المستخدم' : 'User transaction history')
                : (isArabic ? 'محفظة الأدمن' : 'Admin Wallet')}
            </h1>
            {selectedUserId ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="wallet-accent-chip px-2.5 py-1 text-[10px] font-semibold">
                  {selectedUser?.name || selectedUser?.email || selectedUserId}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
                  onClick={() => {
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.delete('userId');
                    setSearchParams(nextParams);
                    setStartDate(defaultRangeStart);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  {isArabic ? 'عرض كل المستخدمين' : 'Show all users'}
                </button>
              </div>
            ) : null}
            <p className="mt-2 text-[11px] leading-5 text-[var(--color-text-secondary)] sm:text-sm">
              {selectedRangeLabel}
            </p>
          </div>

          <div className="relative w-full shrink-0 xl:w-auto">
            <DashboardDateRangeFilter
              isArabic={isArabic}
              formatRangeDate={formatRangeDate}
              todayInputValue={todayInputValue}
              startDate={startDate}
              endDate={endDate}
              onRangeChange={(nextStart, nextEnd) => {
                setStartDate(nextStart);
                setEndDate(nextEnd);
              }}
              className="w-full xl:w-auto"
              buttonClassName="!min-w-0 !w-full justify-between xl:!w-auto xl:min-w-[240px]"
            />
            {selectedUserId ? (
              <label className="relative mt-2 block xl:ms-auto xl:w-[240px]">
                <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                <input value={operationSearch} onChange={(event) => setOperationSearch(event.target.value)} placeholder={isArabic ? 'بحث برقم العملية' : 'Search transaction number'} className="h-9 w-full rounded-xl border border-[color:rgb(var(--color-border-rgb)/.8)] bg-[color:rgb(var(--color-surface-rgb)/.7)] pe-2 ps-8 text-[10px] outline-none focus:border-[var(--color-primary)]" />
              </label>
            ) : null}
          </div>
        </div>

        <div className="relative mt-3.5 grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.label}
              icon={card.icon}
              label={card.label}
              value={card.value}
              note={card.note}
            />
          ))}
        </div>

        {selectedUserId ? (
          <Card className="admin-premium-stat relative mt-3.5 p-3 sm:p-4">
            <div className="mb-3 border-b border-[color:rgb(var(--color-border-rgb)/0.6)] pb-3">
              <p className="text-sm font-semibold text-[var(--color-text)]">{selectedUser?.name || (isArabic ? 'مستخدم' : 'User')}</p>
              <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">{selectedUser?.email || '-'}</p>
              <p className="mt-1 break-all font-mono text-[10px] text-[var(--color-muted)]">ID: {selectedUserId}</p>
            </div>

            <h2 className="text-sm font-semibold text-[var(--color-text)]">{isArabic ? 'تعديل الرصيد' : 'Adjust balance'}</h2>
            <div className="mt-3 rounded-[1rem] border border-[color:rgb(var(--color-border-rgb)/0.72)] p-3">
              <label className="text-[11px] font-medium text-[var(--color-text-secondary)]">{isArabic ? 'زيادة / خصم' : 'Credit / debit'}</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={userAdjustmentAmount}
                onChange={(event) => setUserAdjustmentAmount(event.target.value)}
                placeholder={isArabic ? 'أدخل المبلغ' : 'Enter amount'}
                suffix={<span className="text-[10px] font-semibold text-[var(--color-muted)]">{selectedCurrencyCode}</span>}
                className="mt-2 h-11"
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button type="button" onClick={() => handleUserAdjustment('credit')} disabled={isUserBalanceUpdating} className="h-11 rounded-[0.95rem]">
                  <PlusCircle className="h-4 w-4" />{isArabic ? 'زيادة' : 'Credit'}
                </Button>
                <Button type="button" variant="danger" onClick={() => handleUserAdjustment('debit')} disabled={isUserBalanceUpdating} className="h-11 rounded-[0.95rem]">
                  <MinusCircle className="h-4 w-4" />{isArabic ? 'خصم' : 'Debit'}
                </Button>
              </div>
            </div>

            <div className="mt-3 rounded-[1rem] border border-[color:rgb(var(--color-border-rgb)/0.72)] p-3">
              <label className="text-[11px] font-medium text-[var(--color-text-secondary)]">{isArabic ? 'تعيين رصيد محدد' : 'Set exact balance'}</label>
              <Input
                type="number"
                step="0.01"
                value={userFixedBalance}
                onChange={(event) => setUserFixedBalance(event.target.value)}
                placeholder={isArabic ? 'مثال: 500' : 'Example: 500'}
                suffix={<span className="text-[10px] font-semibold text-[var(--color-muted)]">{selectedCurrencyCode}</span>}
                className="mt-2 h-11"
              />
              <Button type="button" variant="secondary" onClick={handleSetUserBalance} disabled={isUserBalanceUpdating} className="mt-2 h-11 w-full rounded-[0.95rem]">
                {isArabic ? 'تعيين الرصيد' : 'Set balance'}
              </Button>
            </div>
          </Card>
        ) : null}

        <Card className={`admin-premium-stat relative mt-3.5 p-3 sm:p-4 ${selectedUserId ? 'hidden' : ''}`}>
          <div className="flex flex-col gap-3.5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {isArabic ? 'إضافة رصيد لحساب الأدمن' : 'Add balance to admin account'}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-[var(--color-muted)]">
                {isArabic
                  ? `سيتم إضافة الرصيد مباشرة إلى حسابك الحالي بعملة ${adminCurrencyCode}.`
                  : `The amount will be added directly to your current account in ${adminCurrencyCode}.`}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2.5 sm:flex-row lg:max-w-[28rem]">
              <Input
                type="number"
                min="0"
                step="0.000001"
                value={selfTopupAmount}
                onChange={(event) => setSelfTopupAmount(event.target.value)}
                placeholder={isArabic ? 'أدخل مبلغ الإضافة' : 'Enter topup amount'}
                suffix={<span className="text-[10px] font-semibold uppercase text-[var(--color-muted)]">{adminCurrencyCode}</span>}
                className="h-11 px-3 py-2 text-sm"
              />
              <Button
                type="button"
                onClick={handleSelfTopup}
                disabled={isSelfTopupUpdating || !String(adminProfile?.id || actor?.id || '').trim()}
                className="h-11 shrink-0 rounded-[0.95rem] px-4 text-sm sm:min-w-[10.5rem]"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{isArabic ? 'إضافة رصيد لحسابي' : 'Add to my balance'}</span>
              </Button>
            </div>
          </div>
        </Card>

        <Card className={`admin-premium-stat relative mt-3.5 p-3 sm:p-4 ${selectedUserId ? 'hidden' : ''}`}>
          <div className="flex flex-col gap-3.5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {isArabic ? 'إعدادات حساب الأدمن' : 'Admin account settings'}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-[var(--color-muted)]">
                {isArabic
                  ? 'يمكنك تغيير العملة والمجموعة الحالية مباشرة من هنا بدون الخروج من صفحة المحفظة.'
                  : 'You can update the current admin currency and group directly from the wallet page.'}
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-2.5 min-[480px]:grid-cols-2 lg:max-w-[42rem]">
              <label className="min-w-0">
                <span className="mb-1 block text-[11px] font-semibold text-[var(--color-text-secondary)]">
                  {isArabic ? 'العملة' : 'Currency'}
                </span>
                <select
                  value={settingsCurrency}
                  onChange={(event) => setSettingsCurrency(event.target.value)}
                  className="h-11 w-full rounded-[0.95rem] border border-[color:rgb(var(--color-border-rgb)/0.88)] bg-[color:rgb(var(--color-card-rgb)/0.92)] px-3 text-sm text-[var(--color-text)]"
                >
                  {(currencies || []).map((currencyItem) => (
                    <option key={currencyItem.code} value={currencyItem.code}>
                      {currencyItem.code} - {currencyItem.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0">
                <span className="mb-1 block text-[11px] font-semibold text-[var(--color-text-secondary)]">
                  {isArabic ? 'المجموعة' : 'Group'}
                </span>
                <select
                  value={settingsGroup}
                  onChange={(event) => setSettingsGroup(event.target.value)}
                  className="h-11 w-full rounded-[0.95rem] border border-[color:rgb(var(--color-border-rgb)/0.88)] bg-[color:rgb(var(--color-card-rgb)/0.92)] px-3 text-sm text-[var(--color-text)]"
                >
                  <option value="">{isArabic ? 'بدون مجموعة' : 'No group'}</option>
                  {(groups || []).map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.discount ?? group.percentage ?? 0}%)
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-3.5 flex justify-stretch sm:justify-end">
            <Button
              type="button"
              onClick={handleSaveAdminSettings}
              disabled={isSavingSettings || !String(adminProfile?.id || actor?.id || '').trim()}
              className="h-11 w-full rounded-[0.95rem] px-4 text-sm sm:w-auto"
            >
              <span>{isArabic ? 'حفظ الإعدادات' : 'Save settings'}</span>
            </Button>
          </div>
        </Card>
      </section>

      <section className="admin-premium-panel p-3 sm:p-4">
        <div className="flex flex-col items-start justify-between gap-2.5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              {isArabic ? 'العمليات' : 'Operations'}
            </h2>
            <p className="mt-1 text-[11px] leading-5 text-[var(--color-muted)]">
              {selectedRangeLabel}
            </p>
          </div>
          <span className="wallet-accent-chip px-2.5 py-1 text-[10px] font-semibold">
            {isArabic
              ? `${formatCount(filteredOperations.length)} عملية`
              : `${formatCount(filteredOperations.length)} operations`}
          </span>
        </div>

        {!selectedUserId && <div className="mt-3.5 grid grid-cols-1 gap-2.5 xl:grid-cols-2">
          <OperationSnapshotCard
            icon={ArrowUpRight}
            label={isArabic ? 'آخر إضافة' : 'Latest credit'}
            operation={latestCredit}
            formatMoney={formatSignedMoney}
            formatWhen={formatWhen}
            isArabic={isArabic}
          />
          <OperationSnapshotCard
            icon={ArrowDownLeft}
            label={isArabic ? 'آخر خصم' : 'Latest debit'}
            operation={latestDebit}
            formatMoney={formatSignedMoney}
            formatWhen={formatWhen}
            isArabic={isArabic}
          />
        </div>}

        <div className="mt-3.5">
          <div className="mb-2.5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[0.85rem] border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] text-[var(--color-primary)]">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">
                {selectedUserId ? (isArabic ? 'سجل العمليات وحركة الرصيد' : 'Transaction & balance history') : (isArabic ? 'آخر الحركات' : 'Recent movements')}
              </h3>
              <p className="text-[10px] leading-4.5 text-[var(--color-muted)]">
                {isLoading
                  ? (isArabic ? 'جارٍ تحديث البيانات...' : 'Refreshing data...')
                  : selectedUserId
                    ? (isArabic ? 'كل معاملات المستخدم المسجلة' : 'All recorded user transactions')
                    : (isArabic ? 'عرض مختصر لأحدث العمليات' : 'Compact view of the latest operations')}
              </p>
            </div>
          </div>

          {filteredOperations.length ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {selectedUserId ? userLedgerOperations.filter((operation) => paginatedOperations.some((entry) => entry.id === operation.id)).map((operation) => (
                <UserLedgerCard key={operation.id} operation={operation} formatMoney={formatMoney} formatWhen={formatWhen} isArabic={isArabic} />
              )) : paginatedOperations.slice(0, 8).map((operation) => (
                <OperationRow key={operation.id} operation={operation} formatMoney={formatSignedMoney} formatWhen={formatWhen} isArabic={isArabic} expanded={expandedOperationId === operation.id} onToggle={() => setExpandedOperationId((current) => current === operation.id ? '' : operation.id)} />
              ))}
            </div>
          ) : (
            <Card className="admin-premium-stat p-4 text-center">
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {isArabic ? 'لا توجد عمليات في هذه المدة' : 'No operations in this range'}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-[var(--color-muted)]">
                {isArabic
                  ? 'جرّب تغيير التاريخ من الفلتر بالأعلى.'
                  : 'Try adjusting the date range above.'}
              </p>
            </Card>
          )}
          {filteredOperations.length > OPERATIONS_PER_PAGE ? <nav className="mt-3 flex items-center justify-center gap-1.5" aria-label={isArabic ? 'صفحات العمليات' : 'Transaction pages'}><button type="button" disabled={operationsPage === 1} onClick={() => setOperationsPage((page) => page - 1)} className="h-8 rounded-lg border border-[color:rgb(var(--color-border-rgb)/.8)] px-2 text-[10px] font-bold disabled:opacity-40">{isArabic ? 'السابق' : 'Previous'}</button><span className="px-2 text-[10px] font-bold text-[var(--color-text-secondary)]">{operationsPage} / {operationsTotalPages}</span><button type="button" disabled={operationsPage === operationsTotalPages} onClick={() => setOperationsPage((page) => page + 1)} className="h-8 rounded-lg border border-[color:rgb(var(--color-border-rgb)/.8)] px-2 text-[10px] font-bold disabled:opacity-40">{isArabic ? 'التالي' : 'Next'}</button></nav> : null}
        </div>
      </section>
    </div>
  );
};

export default AdminWallet;
