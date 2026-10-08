import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Camera, Phone, UserRound } from 'lucide-react';
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
  const [isProfileCompletionDismissed, setIsProfileCompletionDismissed] = useState(false);
  const language = getStorefrontLanguage(i18n);
  const isCustomerUser = String(user?.role || '').trim().toLowerCase() === 'customer';
  const profileCompletionItems = [
    { key: 'avatar', label: language === 'ar' ? 'الصورة الشخصية' : 'Profile image', value: user?.avatar, icon: Camera },
    { key: 'name', label: language === 'ar' ? 'الاسم' : 'Name', value: user?.name, icon: UserRound },
    { key: 'phone', label: language === 'ar' ? 'رقم الهاتف' : 'Phone number', value: user?.phone, icon: Phone },
  ];
  const completedProfileItems = profileCompletionItems.filter((item) => String(item.value || '').trim());
  const profileCompletionPercentage = Math.round((completedProfileItems.length / profileCompletionItems.length) * 100);
  const showProfileCompletion = !isProfileCompletionDismissed && profileCompletionPercentage < 100;

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

  const handleProfileCompletion = useCallback(() => {
    setIsProfileCompletionDismissed(true);
    navigate('/account');
  }, [navigate]);

  return (
    <div className="space-y-5 pb-5 sm:space-y-6">
      <div className="grid gap-3 lg:grid-cols-2">
        {showProfileCompletion ? (
          <section className="relative overflow-hidden rounded-xl border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[linear-gradient(135deg,rgb(var(--color-card-rgb)/0.96),rgb(var(--color-primary-rgb)/0.1))] p-2.5 shadow-[0_14px_35px_-30px_rgb(var(--color-primary-rgb)/0.8)] sm:p-3 lg:col-span-2">
            <div className="relative flex w-full min-w-0 items-center justify-center gap-2">
              <div
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-3 border-[color:rgb(var(--color-primary-rgb)/0.18)] text-[0.6rem] font-black text-[var(--color-text)] sm:h-10 sm:w-10 sm:text-[0.65rem]"
                style={{ background: `conic-gradient(var(--color-primary) ${profileCompletionPercentage}%, rgb(var(--color-primary-rgb) / 0.12) 0)` }}
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-card)] sm:h-7 sm:w-7">{profileCompletionPercentage}%</span>
              </div>
              <h2 className="min-w-0 truncate text-center text-xs font-black text-[var(--color-text)] sm:text-sm">
                {language === 'ar' ? 'اكمل بيانات حسابك من فضلك لسهوله التواصل' : 'Complete your details for easier communication'}
              </h2>
              <button type="button" onClick={handleProfileCompletion} className="order-last inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg bg-[var(--color-primary)] px-2.5 text-[0.68rem] font-black text-[var(--color-button-text)] shadow-[0_8px_18px_-12px_rgb(var(--color-primary-rgb)/0.95)] transition hover:brightness-105 sm:gap-1.5 sm:px-3 sm:text-xs">
              {language === 'ar' ? 'إكمال' : 'Complete'}
              <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </button>
            </div>
          </section>
        ) : null}

      </div>

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
