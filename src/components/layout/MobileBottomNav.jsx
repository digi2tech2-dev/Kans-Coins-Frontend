import React, { useEffect, useMemo } from 'react';
import { CirclePlus, House, Search, ShoppingCart, WalletCards } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import useHideOnScroll from '../../hooks/useHideOnScroll';
import useAuthStore from '../../store/useAuthStore';
import { isAdminRole, isSupervisorRole } from '../../utils/authRoles';
import { preloadRoute } from '../../transitions/routeModules';

const HIDDEN_PATHS = ['/auth', '/login', '/email-verified', '/verify-account', '/account-pending', '/account-rejected'];
const isPathActive = (pathname, matches) => matches.some((path) => pathname === path || pathname.startsWith(`${path}/`));

const MobileBottomNav = () => {
  const location = useLocation();
  const { language, dir } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const isArabic = language === 'ar' || dir === 'rtl';
  const isStaff = isAdminRole(user?.role) || isSupervisorRole(user?.role);
  const shouldShow = Boolean(user) && !isStaff && !location.pathname.startsWith('/admin')
    && !HIDDEN_PATHS.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));
  const { isHidden, isScrolled } = useHideOnScroll({ enabled: shouldShow, hideAfter: 15, minimumDelta: 5 });

  const items = useMemo(() => ([
    { to: '/orders', label: isArabic ? 'طلباتي' : 'Orders', icon: ShoppingCart, matches: ['/orders', '/target-orders'], accent: '245 158 11' },
    { to: '/wallet/add-balance', label: isArabic ? 'إضافة رصيد' : 'Add balance', icon: CirclePlus, matches: ['/wallet/add-balance', '/wallet/payment-details'], accent: '251 191 36' },
    { to: '/dashboard', label: isArabic ? 'الرئيسية' : 'Home', icon: House, matches: ['/dashboard'], accent: '217 119 6' },
    { to: '/wallet/topup-history', label: isArabic ? 'سجل الرصيد' : 'Wallet history', icon: WalletCards, matches: ['/wallet/topup-history', '/wallet/topups'], accent: '180 83 9' },
    { to: '/products', label: isArabic ? 'البحث' : 'Search', icon: Search, matches: ['/products', '/purchase'], accent: '234 179 8', colorShift: true, state: { openProductSearch: true } },
  ]), [isArabic]);

  useEffect(() => {
    document.body.dataset.mobileBottomNav = shouldShow ? 'true' : 'false';
    return () => delete document.body.dataset.mobileBottomNav;
  }, [shouldShow]);

  if (!shouldShow) return null;

  return (
    <nav className={`mobile-bottom-nav mobile-auto-hide-bar fixed inset-x-0 bottom-0 z-[65] px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] md:hidden ${isHidden ? 'is-hidden' : 'is-visible'} ${isScrolled ? 'is-scrolled' : 'is-at-top'}`} aria-label={isArabic ? 'التنقل الرئيسي' : 'Main navigation'} dir={dir}>
      <div className="mobile-bottom-nav__panel relative mx-auto grid h-[4.15rem] max-w-md grid-cols-5 items-stretch overflow-visible rounded-[1.65rem] border px-1.5 pb-1 pt-0.5">
        <span className="mobile-bottom-nav__surface pointer-events-none absolute inset-0 overflow-hidden rounded-[1.65rem]" aria-hidden="true"><span className="absolute inset-1 rounded-[1.35rem] border border-white/10" /><span className="absolute inset-x-9 top-0 h-px bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.72),transparent)]" /><span className="absolute -left-10 -top-12 h-24 w-40 rotate-[-18deg] rounded-full bg-white/10 blur-2xl" /><span className="absolute -bottom-12 right-4 h-20 w-36 rotate-[-18deg] rounded-full bg-black/15 blur-2xl" /></span>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = isPathActive(location.pathname, item.matches);
          return <Link key={item.to} to={item.to} state={item.state} aria-current={isActive ? 'page' : undefined} aria-label={item.label} style={{ '--mobile-nav-accent': item.accent }} onPointerEnter={() => { void preloadRoute(item.to); }} onTouchStart={() => { void preloadRoute(item.to); }} onFocus={() => { void preloadRoute(item.to); }} className={`mobile-bottom-nav__item group relative z-10 flex h-full min-w-0 flex-col items-center justify-end rounded-2xl px-0.5 text-center ${isActive ? 'is-active text-white' : 'text-white/70'}`}><span className={`mobile-bottom-nav__item-icon relative grid place-items-center border ${isActive ? 'h-[3.15rem] w-[3.15rem] rounded-full border-white/30 text-white' : 'h-8 w-10 rounded-[0.85rem] border border-white/[0.06] bg-black/10 shadow-[inset_0_1px_rgb(255_255_255/0.06)]'} ${item.colorShift && !isActive ? 'mobile-bottom-nav__search-color' : ''}`}><Icon className={`${isActive ? 'h-[1.35rem] w-[1.35rem] drop-shadow-[0_2px_4px_rgb(0_0_0/0.2)]' : 'h-[1.15rem] w-[1.15rem]'} transition-[width,height] duration-100`} strokeWidth={isActive ? 2.45 : 2.1} />{isActive ? <span className="absolute -bottom-1 h-0.5 w-3 rounded-full bg-white/90" /> : null}</span><span className="mobile-bottom-nav__item-label max-w-full truncate text-[0.62rem] font-black leading-none tracking-tight" aria-hidden={!isActive}>{item.label}</span></Link>;
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
