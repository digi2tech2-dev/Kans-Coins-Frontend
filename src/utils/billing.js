export const BILLING_MODES = Object.freeze({ STANDARD: 'standard', QUANTITY_ONLY: 'quantity_only' });

export const normalizeBillingMode = (value) => {
  const mode = String(value || '').trim().toLowerCase();
  return mode === 'quantity_only' || mode === 'quantity' ? BILLING_MODES.QUANTITY_ONLY : BILLING_MODES.STANDARD;
};

export const getUserBillingMode = (user) => normalizeBillingMode(user?.billingMode ?? user?.group?.billingMode);

export const normalizeQuota = (value = {}) => {
  const source = value?.quota && typeof value.quota === 'object' ? value.quota : value;
  const limit = Math.max(0, Number(source?.limit ?? source?.quantityLimit ?? 0) || 0);
  const used = Math.max(0, Number(source?.used ?? source?.quantityUsed ?? 0) || 0);
  return { limit, used, remaining: Math.max(0, Number(source?.remaining ?? (limit - used)) || 0) };
};
