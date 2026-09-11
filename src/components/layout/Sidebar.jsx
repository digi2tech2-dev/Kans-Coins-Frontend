import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Banknote,
  Boxes,
  ChevronLeft,
  Check,
  ClipboardCheck,
  Code2,
  Coins,
  Copy,
  CreditCard,
  Headset,
  FolderKanban,
  Gauge,
  House,
  IdCard,
  Landmark,
  LockKeyhole,
  LogOut,
  MessageCircle,
  Share2,
  ReceiptText,
  SlidersHorizontal,
  Target,
  Truck,
  UserCog,
  UsersRound
} from 'lucide-react';
import ConfirmDialog from '../account/ConfirmDialog';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import { cn } from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import WalletSidebarCard from './WalletSidebarCard';
import HeaderBrand from './HeaderBrand';
import { SUPERVISOR_ROLES, getDefaultRouteForRole, hasRequiredRole } from '../../utils/authRoles';
import { PERMISSIONS, hasPermission } from '../../utils/permissions';
import { resolveUserAvatar } from '../../utils/avatar';

const ADMIN_NAV_ROLES = ['admin', 'super_admin', ...SUPERVISOR_ROLES];

const copyToClipboard = async (value) => {
  const text = String(value || '').trim();
  if (!text) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back to the hidden textarea copy path below.
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textArea);
    return copied;
  } catch {
    return false;
  }
};

const Sidebar = ({ isOpen, setIsOpen, isMobile }) => {
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { t } = useTranslation();

  const isExpanded = isOpen || isMobile || isPreviewExpanded;
  const userId = String(user?.id || user?._id || user?.userId || '').trim();

  useEffect(() => {
    if (!copiedUserId) return undefined;
    const timer = window.setTimeout(() => setCopiedUserId(false), 1400);
    return () => window.clearTimeout(timer);
  }, [copiedUserId]);

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    closeSidebarOnMobile();
    logout();
    navigate('/auth');
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await handleLogout();
  };

  const handleOpenMyAccount = () => {
    closeSidebarOnMobile();
    navigate('/account');
  };

  const handleCopyUserId = async () => {
    if (!userId) return;

    if (await copyToClipboard(userId)) {
      setCopiedUserId(true);
      return;
    }

    setCopiedUserId(false);
  };

  const handleContactClick = () => {
    navigate('/contact-us');
    closeSidebarOnMobile();
  };

  const navItems = [
    {
      icon: House,
      label: t('header.home', { defaultValue: dir === 'rtl' ? 'الرئيسية' : 'Home' }),
      path: '/dashboard',
      roles: ['customer', 'admin', ...SUPERVISOR_ROLES]
    },
    {
      icon: Gauge,
      label: t('sidebar.adminDashboard', { defaultValue: dir === 'rtl' ? 'لوحة التحكم' : 'Dashboard' }),
      path: '/admin/dashboard',
      roles: ['admin', 'super_admin'],
      section: 'admin',
    },
    {
      icon: Landmark,
      label: t('sidebar.adminWallet', { defaultValue: dir === 'rtl' ? 'محفظة الأدمن' : 'Admin Wallet' }),
      path: '/admin/wallet',
      roles: ADMIN_NAV_ROLES,
      permission: PERMISSIONS.ADMIN_WALLET,
      section: 'admin',
    },
    { icon: IdCard, label: t('sidebar.myAccount', { defaultValue: dir === 'rtl' ? 'حسابي' : 'My Account' }), path: '/account', roles: ['admin', 'customer', ...SUPERVISOR_ROLES] },
    { icon: LockKeyhole, label: t('sidebar.accountProtection', { defaultValue: dir === 'rtl' ? 'حماية الحساب' : 'Account Security' }), path: '/account-security', roles: ['admin', 'customer', ...SUPERVISOR_ROLES] },
    { icon: Share2, label: dir === 'rtl' ? 'رابط الإحالة اكسب واسحب' : 'Referral Link — Earn & Withdraw', path: '/referral', roles: ['customer'] },
    {
      icon: ReceiptText,
      label: t('sidebar.myOrders', { defaultValue: dir === 'rtl' ? 'طلباتي' : 'My Orders' }),
      path: '/orders',
      roles: ['customer', 'admin', ...SUPERVISOR_ROLES]
    },
    { icon: Target, label: 'بيع التارجت', path: '/buy-target', roles: ['customer'] },
    {
      icon: Code2,
      label: dir === 'rtl' ? 'للمطورين (API)' : 'Developer API',
      path: '/developers/api',
      roles: ['customer', 'admin', ...SUPERVISOR_ROLES],
      visible: (currentUser) => currentUser?.isApiEnabled === true,
    },
    { icon: Code2, label: dir === 'rtl' ? 'تم الإنشاء بواسطة' : 'Created By', path: '/created-by', roles: ['customer'] },
    { icon: UsersRound, label: t('sidebar.users'), path: '/admin/users', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_USERS, section: 'admin' },
    { icon: Share2, label: dir === 'rtl' ? 'أرباح كود الإحالة' : 'Referral Earnings', path: '/admin/referrals', roles: ADMIN_NAV_ROLES, section: 'admin' },
    { icon: UserCog, label: t('sidebar.supervisors'), path: '/admin/supervisors', roles: ['admin'], section: 'admin' },
    { icon: Activity, label: 'مراقبة المشرفين', path: '/admin/supervisor-monitoring', roles: ['admin'], section: 'admin' },
    { icon: FolderKanban, label: t('sidebar.groupsManager'), path: '/admin/groups', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_GROUPS, section: 'admin' },
    { icon: Boxes, label: t('sidebar.productsManager'), path: '/admin/products', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_PRODUCTS, section: 'admin' },
    {
      icon: ClipboardCheck,
      label: t('sidebar.ordersManager', { defaultValue: dir === 'rtl' ? 'إدارة الطلبات' : 'Orders Manager' }),
      path: '/admin/orders',
      roles: ADMIN_NAV_ROLES,
      permission: PERMISSIONS.ADMIN_ORDERS,
      section: 'admin',
    },
    { icon: Target, label: 'طلبات التارجت', path: '/admin/target-requests', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_TARGET_REQUESTS, section: 'admin' },
    { icon: Truck, label: t('sidebar.suppliersManager'), path: '/admin/suppliers', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_SUPPLIERS, section: 'admin' },
    { icon: Banknote, label: t('sidebar.paymentsManager'), path: '/admin/payments', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_PAYMENTS, section: 'admin' },
    { icon: CreditCard, label: t('sidebar.paymentMethods'), path: '/admin/payment-methods', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_PAYMENT_METHODS, section: 'admin' },
    { icon: MessageCircle, label: 'تكامل الواتساب', path: '/admin/whatsapp', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_WHATSAPP, section: 'admin' },
    { icon: Coins, label: t('sidebar.currencies'), path: '/admin/currencies', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_CURRENCIES, section: 'admin' },
    {
      icon: Headset,
      label: t('sidebar.contactUs', { defaultValue: 'اتصل بنا' }),
      path: '/contact-us',
      roles: ['customer', ...SUPERVISOR_ROLES],
      onClick: handleContactClick,
    },
    { icon: SlidersHorizontal, label: t('sidebar.settings'), path: '/settings', roles: ['admin', 'customer', ...SUPERVISOR_ROLES] }
  ];

  const filteredNavItems = navItems.filter((item) => (
    hasRequiredRole(user?.role || 'customer', item.roles)
    && hasPermission(user, item.permission)
    && (typeof item.visible !== 'function' || item.visible(user))
  ));
  const accountNavItems = filteredNavItems.filter((item) => item.section !== 'admin');
  const adminNavItems = filteredNavItems.filter((item) => item.section === 'admin');
  const sidebarSections = [
    {
      key: 'account',
      label: t('sidebar.accountSection', { defaultValue: dir === 'rtl' ? 'الحساب' : 'Account' }),
      items: accountNavItems,
    },
    {
      key: 'admin',
      label: t('sidebar.adminSection', { defaultValue: dir === 'rtl' ? 'الإدارة' : 'Administration' }),
      items: adminNavItems,
    },
  ].filter((section) => section.items.length > 0);
  const showWalletCard = String(user?.role || '').toLowerCase() === 'customer' && isExpanded;
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
  const userDisplayName = user?.name || user?.email || (dir === 'rtl' ? 'حسابي' : 'My Account');
  const userAvatar = resolveUserAvatar(user, userDisplayName);
  const userRoleLabel = isAdmin
    ? (dir === 'rtl' ? 'مدير المنصة' : 'Platform Admin')
    : (dir === 'rtl' ? 'عضو المتجر' : 'Store Member');

  const renderNavItem = (item) => (
    item.isExternal ? (
      <button
        key={item.path}
        type="button"
        onClick={item.onClick}
        className={cn(
          'kanz-sidebar-nav-item group relative flex w-full items-center gap-2 overflow-hidden px-2.5 py-1.5 text-[var(--color-text-secondary)] transition-all',
          !isExpanded && 'justify-center'
        )}
      >
        <span className="kanz-sidebar-icon-bubble">
          <item.icon className="h-5 w-5" strokeWidth={2.15} />
        </span>
        {isExpanded && <span className="truncate text-[0.8rem] font-semibold">{item.label}</span>}
      </button>
    ) : (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={closeSidebarOnMobile}
        className={({ isActive }) =>
          cn(
            'kanz-sidebar-nav-item group relative flex items-center gap-2 overflow-hidden px-2.5 py-1.5 transition-all',
            !isExpanded && 'justify-center',
            isActive
              ? 'is-active text-[var(--color-text)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          )
        }
      >
        {({ isActive }) => (
          <>
            <span className={cn('kanz-sidebar-icon-bubble', isActive && 'is-active')}>
              <item.icon className="h-5 w-5" strokeWidth={2.15} />
            </span>
            {isExpanded && <span className="truncate text-[0.8rem] font-semibold">{item.label}</span>}
          </>
        )}
      </NavLink>
    )
  );

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/72 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? 274 : isExpanded ? 264 : 84,
          x: isMobile && !isOpen ? (dir === 'rtl' ? 320 : -320) : 0
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        onMouseEnter={() => {
          if (!isMobile && !isOpen) {
            setIsPreviewExpanded(true);
          }
        }}
        onMouseLeave={() => {
          if (!isMobile) {
            setIsPreviewExpanded(false);
          }
        }}
        className={cn(
          'fixed top-4 z-[70] h-[calc(100vh-4rem)] overflow-hidden',
          dir === 'rtl' ? 'right-4' : 'left-4',
          isMobile && !isOpen && 'hidden'
        )}
      >
        <div className={cn(
          'app-shell-sidebar-panel kanz-sidebar-panel relative flex h-full flex-col rounded-[32px] border backdrop-blur-[24px]',
          isAdmin && 'border-[color:rgb(var(--color-primary-rgb)/0.26)]'
        )}>
          <div className="relative z-10 px-4 pb-4 pt-5">
            <div className={cn('relative flex items-center', isExpanded ? 'justify-center' : 'justify-center')}>
              <button
                type="button"
                onClick={() => navigate(getDefaultRouteForRole(user?.role))}
                className={cn(
                  'flex items-center rounded-[24px] transition-all hover:-translate-y-0.5',
                  isExpanded ? 'bg-transparent' : 'mx-auto'
                )}
              >
                <HeaderBrand
                  className={cn(
                    'transition-transform',
                    isExpanded
                      ? 'scale-[1.18]'
                      : 'max-w-11 scale-[0.82] justify-center overflow-hidden [&>span:first-child]:hidden'
                  )}
                  iconClassName={isExpanded ? 'scale-[1.14]' : 'scale-[1.04]'}
                  textClassName="shrink-0"
                />
              </button>

              {!isMobile && (
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className={cn(
                    'kanz-sidebar-collapse absolute top-1 inline-flex h-9 w-9 items-center justify-center rounded-full transition-all',
                    dir === 'rtl' ? 'left-0' : 'right-0',
                    !isExpanded && 'mx-auto'
                  )}
                  aria-label={dir === 'rtl' ? 'تصغير الشريط الجانبي' : 'Collapse sidebar'}
                >
                  <ChevronLeft className={cn('h-4.5 w-4.5 transition-transform', (dir === 'rtl' ? isExpanded : !isExpanded) && 'rotate-180')} />
                </button>
              )}
            </div>

            {isExpanded && (
              <>
                <div className="mt-4">
                  <LanguageSwitcher showIcon variant="sidebar" className="kanz-sidebar-language w-full justify-center" />
                </div>

                <div className="kanz-sidebar-user-card mt-2 px-2.5 py-2">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex shrink-0 flex-col items-center">
                      {userId ? (
                        <button
                          type="button"
                          onClick={handleCopyUserId}
                          className="kanz-sidebar-id-chip absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2"
                          title={copiedUserId ? 'تم نسخ ID المستخدم' : 'اضغط لنسخ ID المستخدم'}
                          aria-label={copiedUserId ? 'تم نسخ ID المستخدم' : 'نسخ ID المستخدم'}
                        >
                          {copiedUserId ? <Check className="h-3 w-3 shrink-0" /> : <Copy className="h-3 w-3 shrink-0" />}
                          <span className="truncate">{copiedUserId ? 'تم النسخ' : `...${userId.slice(-8)}`}</span>
                        </button>
                      ) : null}

                      <div className="relative">
                        <button
                          type="button"
                          onClick={handleOpenMyAccount}
                          className="kanz-sidebar-avatar h-9 w-9"
                          aria-label={dir === 'rtl' ? 'فتح الحساب' : 'Open account'}
                        >
                          <img
                            src={userAvatar}
                            alt={userDisplayName}
                          />
                        </button>
                        <span
                          className="absolute -bottom-0.5 -right-0.5 z-10 h-3.5 w-3.5 rounded-full border-2 border-[color:rgb(var(--color-card-rgb)/0.98)] bg-emerald-400 shadow-[0_0_0_3px_rgb(16_185_129/0.16),0_0_14px_rgb(16_185_129/0.76)]"
                          role="status"
                          aria-label={dir === 'rtl' ? 'متصل الآن' : 'Online now'}
                          title={dir === 'rtl' ? 'متصل الآن' : 'Online now'}
                        />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[0.74rem] font-semibold leading-tight text-[var(--color-text)]">{userDisplayName}</div>
                      <div className="mt-0.5 truncate text-[0.62rem] font-bold text-[var(--color-primary-hover)]">{userRoleLabel}</div>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogoutClick}
                      className="kanz-sidebar-user-action h-8 w-8"
                      aria-label={dir === 'rtl' ? 'تسجيل الخروج' : 'Logout'}
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto px-3 py-3 scrollbar-hide">
            {showWalletCard && (
              <WalletSidebarCard
                className="mb-3"
                isVisible={showWalletCard}
                onNavigate={closeSidebarOnMobile}
              />
            )}

            <div className="space-y-4">
              {sidebarSections.map((section, sectionIndex) => (
                <div key={section.key} className="space-y-1.5">
                  {isExpanded ? (
                    <div
                      className="flex select-none items-center gap-2.5 px-2 pb-1 pt-1.5 text-[0.72rem] font-black"
                    >
                      <span className="shrink-0 tracking-wide text-[var(--color-text-secondary)]">
                        {section.label}
                      </span>
                      <span className="h-px flex-1 bg-[color:rgb(var(--color-border-rgb)/0.5)]" />
                    </div>
                  ) : (
                    sectionIndex > 0 && <div className="mx-auto my-2 h-px w-7 bg-[color:rgb(var(--color-border-rgb)/0.5)]" />
                  )}
                  <div id={`sidebar-section-${section.key}`} className="space-y-1.5">
                    {section.items.map(renderNavItem)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={cn('relative z-10 px-4 pb-5 pt-1', !isExpanded && 'px-3')}>
            <button
              type="button"
              onClick={handleLogoutClick}
              className={cn('kanz-sidebar-logout-pill w-full', !isExpanded && 'is-icon-only')}
              aria-label={dir === 'rtl' ? 'تسجيل الخروج' : 'Logout'}
            >
              <LogOut className="h-5 w-5" />
              {isExpanded && <span>{dir === 'rtl' ? 'تسجيل الخروج' : 'Logout'}</span>}
            </button>
          </div>
        </div>
      </motion.aside>
      <ConfirmDialog
        open={showLogoutConfirm}
        title={dir === 'rtl' ? 'تسجيل الخروج' : 'Logout'}
        description={dir === 'rtl' ? 'هل متأكد من تسجيل الخروج؟' : 'Are you sure you want to logout?'}
        confirmLabel={dir === 'rtl' ? 'نعم، تسجيل الخروج' : 'Yes, logout'}
        cancelLabel={dir === 'rtl' ? 'إلغاء' : 'Cancel'}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};

export default Sidebar;
