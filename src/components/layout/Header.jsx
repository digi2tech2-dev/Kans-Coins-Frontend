import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCircle2, Clock3, CreditCard, Menu, ShoppingBag, UserCheck, Wallet, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import useNotificationStore from '../../store/useNotificationStore';
import { useLanguage } from '../../context/LanguageContext';
import ThemeToggle from '../ui/ThemeToggle';
import HeaderBrand from './HeaderBrand';
import { formatWalletAmount } from '../../utils/storefront';
import { getDefaultRouteForRole, isAdminRole, isSupervisorRole } from '../../utils/authRoles';
import { cn } from '../ui/Button';

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { user } = useAuthStore();
  const { notifications, unreadCount, isLoading, loadNotifications, loadUnreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const { dir } = useLanguage();

  const language = String(i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().startsWith('ar') ? 'ar' : 'en';
  const isRTL = dir === 'rtl';
  const isCustomer = String(user?.role || '').toLowerCase() === 'customer';
  const isAdmin = isAdminRole(user?.role);
  const isBackoffice = isAdmin || isSupervisorRole(user?.role);
  const walletValue = Number(user?.coins || 0);
  const walletDisplayValue = formatWalletAmount(walletValue, user?.currency || 'USD');
  const walletTargetPath = isCustomer ? '/wallet/add-balance' : '/admin/wallet';
  const shouldShowWallet = isCustomer || isBackoffice;
  const displayedNotifications = useMemo(() => (
    [...notifications].sort((left, right) => {
      const rightTime = new Date(right?.createdAt || 0).getTime();
      const leftTime = new Date(left?.createdAt || 0).getTime();
      return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
    })
  ), [notifications]);
  const latestNotificationId = displayedNotifications[0]?.id || '';

  useEffect(() => {
    if (!user?.id) return undefined;
    void loadUnreadCount().catch(() => {});
    const timer = setInterval(() => {
      void loadUnreadCount().catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, [loadUnreadCount, user?.id]);

  const resolveNotificationTarget = (notification) => {
    if (notification?.targetUrl) {
      const explicitTarget = String(notification.targetUrl).trim();
      if (isCustomer && explicitTarget.startsWith('/admin/payments')) {
        return '/wallet/topups';
      }
      return explicitTarget;
    }

    const source = String(notification?.source || notification?.context || notification?.category || '').toLowerCase();
    const targetType = String(notification?.targetType || '').toLowerCase();
    const orderId = notification?.orderId || (targetType === 'order' ? notification?.targetId : '');
    const topupId = notification?.topupId || (targetType === 'topup' || targetType === 'wallet' ? notification?.targetId : '');
    const userId = notification?.userId || (targetType === 'user' ? notification?.targetId : '');
    const text = `${notification?.title || ''} ${notification?.message || ''} ${source} ${targetType}`;
    if (source.includes('target') || targetType.includes('target') || /target/i.test(text)) {
      return isBackoffice ? '/admin/target-requests' : '/buy-target';
    }

    if (
      source.includes('deposit')
      || source.includes('wallet')
      || targetType === 'deposit'
      || topupId
      || targetType === 'topup'
      || targetType === 'wallet'
      || /wallet|topup|payment|deposit/i.test(text)
    ) {
      return isBackoffice ? '/admin/payments' : '/wallet/topups';
    }
    const inferredId = text.match(/(?:الطلب|طلب|order|#)\s*([A-Za-z0-9_-]{4,})/i)?.[1] || '';

    if (orderId || targetType === 'order' || /طلب(?! شحن)|order/i.test(text)) {
      const id = orderId || inferredId;
      const basePath = isBackoffice ? '/admin/orders' : '/orders';
      return id ? `${basePath}?orderId=${encodeURIComponent(id)}` : basePath;
    }

    if (topupId || targetType === 'topup' || targetType === 'wallet' || /شحن|رصيد|محفظة|wallet|topup|payment/i.test(text)) {
      return isBackoffice ? '/admin/payments' : '/wallet/topups';
    }

    if (userId || targetType === 'user' || /حساب|account|user/i.test(text)) {
      return isBackoffice ? '/admin/users' : '/account';
    }

    return getDefaultRouteForRole(user?.role);
  };

  const getNotificationTone = (type) => {
    const normalizedType = String(type || 'info').toLowerCase();
    if (normalizedType === 'success') return 'border-emerald-400/30 bg-emerald-500/10';
    if (normalizedType === 'warning') return 'border-amber-400/30 bg-amber-500/10';
    if (normalizedType === 'error') return 'border-red-400/30 bg-red-500/10';
    return 'border-sky-400/30 bg-sky-500/10';
  };

  const getNotificationMeta = (notification) => {
    const text = `${notification?.title || ''} ${notification?.message || ''} ${notification?.targetType || ''}`.toLowerCase();
    const type = String(notification?.type || 'info').toLowerCase();

    if (type === 'success' || /قبول|نجاح|اكتمل|completed|approved/.test(text)) {
      return {
        icon: CheckCircle2,
        label: 'تم بنجاح',
        className: 'bg-emerald-500/12 text-emerald-500 ring-emerald-400/24',
      };
    }

    if (type === 'warning' || /رفض|rejected|denied/.test(text)) {
      return {
        icon: XCircle,
        label: 'يحتاج متابعة',
        className: 'bg-amber-500/12 text-amber-500 ring-amber-400/24',
      };
    }

    if (/شحن|رصيد|محفظة|wallet|topup|payment/.test(text)) {
      return {
        icon: CreditCard,
        label: 'عملية رصيد',
        className: 'bg-indigo-500/12 text-indigo-500 ring-violet-400/24',
      };
    }

    if (/حساب|account|user/.test(text)) {
      return {
        icon: UserCheck,
        label: 'حساب',
        className: 'bg-indigo-500/12 text-indigo-500 ring-indigo-400/24',
      };
    }

    if (/طلب|order|manual/.test(text)) {
      return {
        icon: ShoppingBag,
        label: 'طلب',
        className: 'bg-sky-500/12 text-sky-500 ring-sky-400/24',
      };
    }

    return {
      icon: Clock3,
      label: 'تحديث',
      className: 'bg-slate-500/12 text-slate-500 ring-slate-400/24',
    };
  };

  const closeNotifications = useCallback(() => {
    setIsNotificationsOpen(false);
    if (unreadCount > 0 || notifications.some((notification) => !notification.read)) {
      void markAllAsRead();
    }
  }, [markAllAsRead, notifications, unreadCount]);

  useEffect(() => {
    if (!isNotificationsOpen) return undefined;

    const handlePointerDown = (event) => {
      if (notificationsRef.current?.contains(event.target)) return;
      closeNotifications();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [closeNotifications, isNotificationsOpen]);

  const handleNotificationsToggle = () => {
    if (isNotificationsOpen) {
      closeNotifications();
      return;
    }

    setIsNotificationsOpen(true);
    void loadNotifications().catch(() => {});
  };

  const handleNotificationClick = (notification) => {
    if (notification?.id && !notification?.read) {
      void markAsRead(notification.id);
    }
    navigate(resolveNotificationTarget(notification));
    closeNotifications();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <header dir={isRTL ? 'rtl' : 'ltr'} className="w-full max-w-full">
      <div className={cn(
        'app-shell-header-panel kanz-coins-panel w-full max-w-full overflow-visible rounded-[18px] border px-2 py-0.5 backdrop-blur-[22px] sm:rounded-[24px] sm:px-4 sm:py-1',
        isAdmin && 'border-[color:rgb(var(--color-primary-rgb)/0.26)]'
      )}>
        <div dir="ltr" className="grid min-h-[2.55rem] min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 sm:min-h-[2.9rem] sm:gap-4">
          <div className="col-start-2 row-start-1 min-w-0 justify-self-center">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 rounded-[14px] px-0 py-0 transition-all hover:-translate-y-0.5 sm:gap-4"
            >
              <HeaderBrand
                className="translate-x-11 scale-[0.96] min-[380px]:translate-x-16 sm:translate-x-28 sm:scale-[1.02] lg:translate-x-52"
                iconClassName="scale-[0.98]"
              />
            </button>
          </div>

          <div className={cn(
            'header-mobile-actions col-start-1 row-start-1 flex min-w-0 shrink-0 items-center gap-1 justify-self-start px-0 sm:gap-2'
          )}>
            <ThemeToggle compact className="h-[1.875rem] w-[1.875rem] shrink-0 rounded-full border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[radial-gradient(circle_at_35%_25%,rgb(255_255_255/0.16),transparent_34%),linear-gradient(180deg,rgb(10_17_42/0.88),rgb(2_6_19/0.78))] shadow-[inset_0_0_18px_rgb(245_158_11/0.1),0_0_28px_-18px_rgb(245_158_11/0.7)] min-[380px]:h-8 min-[380px]:w-8 sm:h-8 sm:w-8" />

            <div ref={notificationsRef} className="relative">
              <button
                type="button"
                onClick={handleNotificationsToggle}
                className="relative inline-flex h-[1.875rem] w-[1.875rem] shrink-0 items-center justify-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[radial-gradient(circle_at_35%_25%,rgb(255_255_255/0.14),transparent_34%),linear-gradient(180deg,rgb(10_17_42/0.88),rgb(2_6_19/0.78))] text-[var(--color-text)] shadow-[inset_0_0_18px_rgb(245_158_11/0.12),0_0_28px_-18px_rgb(245_158_11/0.95)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.38)] hover:text-[var(--color-primary)] min-[380px]:h-8 min-[380px]:w-8 sm:h-8 sm:w-8"
                aria-label="الإشعارات"
              >
                <Bell className="h-3.5 w-3.5" />
                {unreadCount > 0 ? (
                  <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[linear-gradient(135deg,#d97706,#f59e0b)] px-1 text-[10px] font-black text-white shadow-[0_0_18px_rgb(245_158_11/0.6)]">
                    {unreadCount > 9 ? '+9' : unreadCount}
                  </span>
                ) : null}
              </button>

              {isNotificationsOpen ? (
                <div className={`absolute top-12 z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[color:rgb(var(--color-card-rgb)/0.96)] shadow-[0_26px_70px_-42px_rgb(0_0_0/0.92)] backdrop-blur-xl ${isRTL ? 'left-0' : 'right-0'}`}>
                  <div className="border-b border-[color:rgb(var(--color-border-rgb)/0.68)] px-4 py-3">
                    <p className="text-sm font-bold text-[var(--color-text)]">الإشعارات</p>
                  </div>
                  <div className="max-h-[calc(50vh-3.25rem)] overflow-y-auto p-2">
                    {isLoading ? (
                      <p className="px-3 py-6 text-center text-sm text-[var(--color-text-secondary)]">
                        جاري تحميل الإشعارات...
                      </p>
                    ) : displayedNotifications.length ? displayedNotifications.map((notification) => {
                      const meta = getNotificationMeta(notification);
                      const NotificationIcon = meta.icon;
                      const isLatestNotification = String(notification.id) === String(latestNotificationId);

                      return (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className={cn(
                            'block w-full rounded-xl border px-3 py-2.5 text-start transition hover:-translate-y-0.5 hover:bg-[color:rgb(var(--color-primary-rgb)/0.08)]',
                            notification.read ? 'border-transparent opacity-75' : getNotificationTone(notification.type),
                            isLatestNotification && 'border-[color:rgb(var(--color-primary-rgb)/0.46)] bg-[color:rgb(var(--color-primary-rgb)/0.08)]'
                          )}
                        >
                          <span className="flex items-start gap-3">
                            <span className={cn('mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1', meta.className)}>
                              <NotificationIcon className="h-4.5 w-4.5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <span className="block truncate text-sm font-semibold text-[var(--color-text)]">{notification.title}</span>
                                {!notification.read ? (
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                                ) : null}
                              </span>
                              {notification.message ? (
                                <span className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-secondary)]">{notification.message}</span>
                              ) : null}
                              <span className="mt-2 inline-flex rounded-full bg-[color:rgb(var(--color-surface-rgb)/0.72)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                                {meta.label}
                              </span>
                            </span>
                          </span>
                        </button>
                      );
                    }) : (
                      <p className="px-3 py-6 text-center text-sm text-[var(--color-text-secondary)]">
                        لا توجد إشعارات
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {shouldShowWallet && (
              <>
                <button
                  type="button"
                  onClick={() => navigate(walletTargetPath)}
                  className="inline-flex h-[1.875rem] shrink-0 items-center gap-1 rounded-full border border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[linear-gradient(180deg,rgb(10_17_42/0.88),rgb(2_6_19/0.72))] px-1.5 text-start shadow-[inset_0_0_18px_rgb(34_211_238/0.08),0_0_28px_-18px_rgb(34_211_238/0.9)] transition-all hover:-translate-y-0.5 min-[380px]:h-8 sm:hidden"
                  aria-label={language === 'ar' ? 'الرصيد' : 'Balance'}
                >
                  <span className="header-wallet-balance max-w-[48px] truncate text-[0.62rem] font-semibold text-white dark:text-[var(--color-text)] min-[380px]:max-w-[62px]">
                    {walletDisplayValue}
                  </span>
                  <span className="inline-flex h-[1.375rem] w-[1.375rem] items-center justify-center rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.14)] text-[var(--color-primary)]">
                    <Wallet className="h-3 w-3" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate(walletTargetPath)}
                  className="hidden h-9 items-center gap-2 rounded-full border border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[linear-gradient(180deg,rgb(10_17_42/0.88),rgb(2_6_19/0.72))] px-3 text-start shadow-[inset_0_0_18px_rgb(34_211_238/0.08),0_0_28px_-18px_rgb(34_211_238/0.9)] transition-all hover:-translate-y-0.5 sm:inline-flex"
                  aria-label={language === 'ar' ? 'المحفظة' : 'Wallet'}
                >
                  <span className="min-w-0">
                    <span className="header-wallet-balance block truncate text-xs font-semibold text-white dark:text-[var(--color-text)]">
                      {walletDisplayValue}
                    </span>
                  </span>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.14)] text-[var(--color-primary)]">
                    <Wallet className="h-4 w-4" />
                  </span>
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            className="col-start-3 row-start-1 inline-flex h-[1.875rem] w-[1.875rem] shrink-0 items-center justify-center justify-self-end rounded-full border border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[linear-gradient(180deg,rgb(3_8_22/0.9),rgb(2_6_19/0.78))] text-[var(--color-text)] shadow-[inset_0_0_18px_rgb(255_255_255/0.035),0_0_26px_-18px_rgb(34_211_238/0.9)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.38)] hover:text-[var(--color-primary)] min-[380px]:h-8 min-[380px]:w-8 sm:h-8 sm:w-8"
            aria-label={language === 'ar' ? 'فتح القائمة' : 'Open menu'}
          >
            <Menu className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
