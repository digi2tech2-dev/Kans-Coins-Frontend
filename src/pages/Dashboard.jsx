import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useMediaStore from '../store/useMediaStore';
import useGroupStore from '../store/useGroupStore';
import HeroSlider from '../components/home/HeroSlider';
import CategoryCard from '../components/home/CategoryCard';
import ProductSearchBar from '../components/products/ProductSearchBar';
import ProductPurchaseDialog from '../components/products/ProductPurchaseDialog';
import slideOneHeroImage from '../assets/slide-1-opt.webp';
import slideTwoHeroImage from '../assets/slide-2-opt.webp';
import slideThreeHeroImage from '../assets/slide-3-opt.webp';
import slideFourHeroImage from '../assets/slide-4-opt.webp';
import coinsImage from '../assets/logo.webp';
import { resolveImageUrl } from '../utils/imageUrl';
import {
  createStorefrontCategories,
  createStorefrontProducts,
  getStorefrontLanguage,
} from '../utils/storefront';

const Dashboard = () => {
  const { user, refreshProfile } = useAuthStore();
  const { categories, products, loadProducts } = useMediaStore();
  const groupsLastLoadedAt = useGroupStore((state) => state.groupsLastLoadedAt);
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const language = getStorefrontLanguage(i18n);
  const isTwoFactorEnabled = Boolean(user?.twoFactorEnabled ?? user?.isTwoFactorEnabled);
  const isCustomerUser = String(user?.role || '').trim().toLowerCase() === 'customer';

  useEffect(() => {
    if (refreshProfile) refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    const refreshProducts = () => {
      void loadProducts({ force: true, bypassCache: true });
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshProducts();
    };

    refreshProducts();
    window.addEventListener('focus', refreshProducts);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    const refreshInterval = window.setInterval(refreshProducts, 30_000);

    return () => {
      window.removeEventListener('focus', refreshProducts);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.clearInterval(refreshInterval);
    };
  }, [loadProducts]);

  const slideTwoUrl = 'https://chat.whatsapp.com/FE7DF2bKaaWG3snAGaFjpg';
  const heroSlides = useMemo(() => ([
    { id: 'landing-slide-1', image: slideOneHeroImage, title: '' },
    { id: 'landing-slide-2', image: slideTwoHeroImage, title: '', href: slideTwoUrl },
    { id: 'landing-slide-3', image: slideThreeHeroImage, title: '', href: '/referral' },
    { id: 'landing-slide-4', image: slideFourHeroImage, title: '' },
  ]), []);

  const storefrontProducts = useMemo(
    () => createStorefrontProducts(products, {
      language,
      userGroup: user?.groupId || user?.group || 'Normal',
      userGroupPercentage: user?.groupPercentage ?? null,
    }),
    [groupsLastLoadedAt, language, products, user?.group, user?.groupId, user?.groupPercentage]
  );

  const storefrontCategories = useMemo(
    () => createStorefrontCategories(categories, storefrontProducts, language),
    [categories, storefrontProducts, language]
  );

  const visibleHomepageCategories = useMemo(
    () => storefrontCategories.filter((category) => {
      if (category.id === 'all') return false;
      const p = category.parentCategory;
      if (!p) return true;
      if (typeof p === 'string' && !p.trim()) return true;
      return false;
    }),
    [storefrontCategories]
  );

  const categoryChildrenByParent = useMemo(() => (
    storefrontCategories.reduce((map, category) => {
      const parentId = String(category?.parentCategory || '').trim();
      if (!parentId) return map;
      if (!map.has(parentId)) map.set(parentId, []);
      map.get(parentId).push(category.id);
      return map;
    }, new Map())
  ), [storefrontCategories]);

  const collectCategoryIds = useCallback((categoryId) => {
    const seen = new Set();
    const stack = [String(categoryId || '').trim()].filter(Boolean);
    while (stack.length) {
      const currentId = stack.pop();
      if (!currentId || seen.has(currentId)) continue;
      seen.add(currentId);
      (categoryChildrenByParent.get(currentId) || []).forEach((childId) => {
        if (!seen.has(childId)) stack.push(childId);
      });
    }
    return seen;
  }, [categoryChildrenByParent]);

  const bestSellingProducts = useMemo(() => {
    const firstCategory = visibleHomepageCategories[0];
    const secondCategory = visibleHomepageCategories[1];
    const pickedIds = new Set();

    const pickFromCategory = (category, limit) => {
      if (!category) return [];
      const categoryIds = collectCategoryIds(category.id);
      const selected = [];

      for (const product of storefrontProducts) {
        if (selected.length >= limit) break;
        if (!categoryIds.has(String(product?.category || '').trim())) continue;
        if (pickedIds.has(product.id)) continue;
        pickedIds.add(product.id);
        selected.push(product);
      }

      return selected;
    };

    return [
      ...pickFromCategory(firstCategory, 4),
      ...pickFromCategory(secondCategory, 4),
    ];
  }, [collectCategoryIds, storefrontProducts, visibleHomepageCategories]);

  const handleCategorySelect = useCallback((categoryId) => {
    navigate(categoryId === 'all' ? '/products' : `/products?category=${encodeURIComponent(categoryId)}`);
  }, [navigate]);

  const handleProductSelect = useCallback((product) => {
    const next = new URLSearchParams();
    if (product?.category) next.set('category', product.category);
    next.set('request', product.id);
    navigate(`/products?${next.toString()}`);
  }, [navigate]);

  const openPurchaseDialog = useCallback((product) => {
    setSelectedProduct(product);
  }, []);

  const closePurchaseDialog = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  const viewCreatedOrder = useCallback((orderId) => {
    setSelectedProduct(null);
    navigate(`/orders/${encodeURIComponent(orderId)}`);
  }, [navigate]);

  return (
    <div className="space-y-5 pb-5 sm:space-y-6">
      {!isTwoFactorEnabled ? (
        <section className="group relative mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-amber-400/25 bg-[linear-gradient(120deg,rgb(245_158_11/0.12),rgb(var(--color-card-rgb)/0.92)_48%,rgb(217_119_6/0.08))] p-2 shadow-[0_16px_40px_-34px_rgb(245_158_11/0.6)] backdrop-blur-xl sm:p-2.5">
          <span className="pointer-events-none absolute -start-8 -top-10 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl" />
          <div className="relative flex items-center justify-between gap-2.5">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-300/30 bg-[linear-gradient(145deg,rgb(245_158_11/0.2),rgb(217_119_6/0.14))] text-amber-400 shadow-[inset_0_1px_0_rgb(255_255_255/0.16)] sm:h-10 sm:w-10">
                <span className="absolute end-0 top-0 h-2 w-2 -translate-y-1/4 translate-x-1/4 rounded-full border-2 border-[rgb(var(--color-card-rgb))] bg-amber-400" />
                <ShieldCheck className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2.2} />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[0.75rem] font-bold text-[var(--color-text)] sm:text-[0.84rem]">
                  {language === 'ar' ? 'حماية إضافية لحسابك' : 'Extra protection for your account'}
                </p>
                <p className="mt-0.5 truncate text-[0.64rem] font-medium text-[var(--color-text-secondary)] sm:text-[0.71rem]">
                  {language === 'ar' ? 'فعّل المصادقة الثنائية في أقل من دقيقة.' : 'Enable two-factor authentication in under a minute.'}
                </p>
              </div>
            </div>

            <Link
              to="/account-security"
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-xl border border-amber-400/30 bg-amber-500/15 px-2.5 text-[0.66rem] font-extrabold text-amber-400 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400/50 hover:bg-amber-500/25 hover:shadow-[0_10px_24px_-16px_rgb(245_158_11/0.8)] sm:h-9 sm:px-3 sm:text-[0.73rem]"
            >
              <span>{language === 'ar' ? 'تفعيل الحماية' : 'Protect now'}</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.4} />
            </Link>
          </div>
        </section>
      ) : null}

      <HeroSlider slides={heroSlides} />

      <section id="categories" className="scroll-mt-28 space-y-3 sm:space-y-3.5">
        <div className="relative z-10 mx-auto flex w-full max-w-5xl justify-center px-0.5 sm:px-2">
          <ProductSearchBar products={storefrontProducts} language={language} onSelectProduct={handleProductSelect} forceIconRight placeholder={language === 'ar' ? 'ابحث عن منتج...' : 'Search for a product...'} noResultsLabel={language === 'ar' ? 'لا يوجد منتج مطابق' : 'No matching product found'} className="mx-auto w-full" inputClassName="h-10 rounded-full" />
        </div>

        <div className="relative z-0 grid grid-cols-2 gap-2 sm:gap-2.5 md:grid-cols-3 xl:grid-cols-4">
          {visibleHomepageCategories.map((category, index) => (
            <CategoryCard key={category.id} category={category} active={false} index={index} onSelect={handleCategorySelect} />
          ))}
        </div>

      </section>


      {bestSellingProducts.length ? (
        <section className="mx-auto w-full max-w-5xl overflow-hidden rounded-[1.35rem] border border-[color:rgb(var(--color-primary-rgb)/0.16)] bg-[linear-gradient(145deg,rgb(var(--color-card-rgb)/0.9),rgb(var(--color-primary-rgb)/0.045))] p-3 shadow-[0_20px_55px_-45px_rgb(var(--color-primary-rgb)/0.65)] sm:p-5" aria-labelledby="best-selling-title">
          <div className="mb-3.5 flex items-center justify-between gap-3 sm:mb-4">
            <div className="flex items-center gap-2.5">
              <span className="h-7 w-1 rounded-full bg-[linear-gradient(180deg,var(--color-primary),rgb(var(--color-primary-rgb)/0.35))]" aria-hidden="true" />
              <h2 id="best-selling-title" className="text-base font-black text-[var(--color-text)] sm:text-lg">
                {language === 'ar' ? 'الأكثر مبيعًا' : 'Best sellers'}
              </h2>
            </div>
            <Link to="/products" className="inline-flex min-h-8 items-center rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] px-3 text-[0.7rem] font-extrabold text-[var(--color-primary)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.38)] hover:bg-[color:rgb(var(--color-primary-rgb)/0.13)] sm:text-xs">
              {language === 'ar' ? 'عرض الكل' : 'View all'}
            </Link>
          </div>

          <div
            className="scrollbar-hide flex snap-x snap-mandatory items-stretch gap-2.5 overflow-x-auto scroll-smooth pb-1 sm:gap-3"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            {bestSellingProducts.map((product) => {
              const productName = product.displayName || product.nameAr || product.name || '';
              const imageSrc = product.image ? resolveImageUrl(product.image) : coinsImage;
              const isUnavailable = product.storefrontStatus?.isPurchasable === false;
              const unavailableLabel = product.storefrontStatus?.badgeLabel || (language === 'ar' ? 'غير متاح' : 'Unavailable');

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    if (!isUnavailable) openPurchaseDialog(product);
                  }}
                  disabled={isUnavailable}
                  className={`group relative isolate min-w-[42%] snap-start overflow-hidden rounded-[1rem] border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-card-rgb)/0.82)] p-2 text-start shadow-[0_14px_34px_-30px_rgb(var(--color-primary-rgb)/0.72)] transition-all hover:-translate-y-1 hover:border-[color:rgb(var(--color-primary-rgb)/0.38)] hover:shadow-[0_20px_42px_-30px_rgb(var(--color-primary-rgb)/0.82)] min-[430px]:min-w-[32%] sm:min-w-[23%] sm:p-2.5 lg:min-w-[18%] ${isUnavailable ? 'cursor-not-allowed hover:translate-y-0' : ''}`}
                  aria-label={productName}
                >
                  <span className="best-selling-media relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[0.78rem] border border-[color:rgb(var(--color-border-rgb)/0.45)] bg-[radial-gradient(circle_at_50%_36%,rgb(var(--color-primary-rgb)/0.09),rgb(var(--color-surface-rgb)/0.78))]">
                    <img
                      src={imageSrc}
                      alt={productName}
                      className={`best-selling-image h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.06] ${isUnavailable ? 'opacity-45 grayscale-[0.35]' : ''}`}
                      loading="lazy"
                      decoding="async"
                    />
                    {isUnavailable ? <span className="absolute inset-0 bg-[color:rgb(var(--color-card-rgb)/0.22)]" aria-hidden="true" /> : null}
                  </span>
                  <span className="mt-2.5 line-clamp-2 block min-h-10 text-[0.75rem] font-extrabold leading-5 text-[var(--color-text)] sm:text-[0.82rem]">
                    {productName}
                  </span>
                  <span className={`mt-1.5 inline-flex items-center gap-1.5 text-[0.65rem] font-bold sm:text-[0.7rem] ${isUnavailable ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isUnavailable ? 'bg-rose-500' : 'bg-emerald-500'}`} aria-hidden="true" />
                    {isUnavailable ? unavailableLabel : (language === 'ar' ? 'متوفر للطلب' : 'Available now')}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <ProductPurchaseDialog
        isOpen={Boolean(selectedProduct)}
        productId={selectedProduct?.id}
        initialProduct={selectedProduct}
        onClose={closePurchaseDialog}
        onViewOrder={viewCreatedOrder}
      />

    </div>
  );
};

export default Dashboard;
