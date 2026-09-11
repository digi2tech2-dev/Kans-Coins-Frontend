import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Code2, Menu, Phone, Sparkles, UserRound, UsersRound } from 'lucide-react';
import Card from '../components/ui/Card';
import { buttonClassName, cn } from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext';
import useAuthStore from '../store/useAuthStore';
import ThemeToggle from '../components/ui/ThemeToggle';
import HeaderBrand from '../components/layout/HeaderBrand';
import PublicSidebar from '../components/layout/PublicSidebar';
import SiteCopyrightFooter from '../components/layout/SiteCopyrightFooter';
import { useBodyScrollLock } from '../utils/bodyScrollLock';
import digitechImage from '../assets/digitech-solutions.webp';
import ahmedImage from '../assets/about-img-1.webp';
import kareemImage from '../assets/about-img-2.webp';
import bahaaImage from '../assets/about-img-3.webp';

const CreatedBy = () => {
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isArabic = dir === 'rtl';
  const whatsappMessage = encodeURIComponent('كنت محتاج تفاصيل عن انشاء موقع');
  const whatsappUrl = `https://wa.me/201019603238?text=${whatsappMessage}`;

  useBodyScrollLock(isMenuOpen);

  const handleHome = useCallback(() => navigate('/'), [navigate]);
  const handleAbout = useCallback(() => navigate('/about-us'), [navigate]);
  const handleContact = useCallback(() => navigate('/public-contact-us'), [navigate]);
  const handleLogin = useCallback(() => navigate('/auth?mode=login'), [navigate]);
  const handleCreateAccount = useCallback(() => navigate('/auth?mode=signup'), [navigate]);
  const handleGoogleLogin = useCallback(() => {
    Promise.resolve(loginWithGoogle());
  }, [loginWithGoogle]);

  const teamMembers = [
    {
      name: isArabic ? 'ENG: AHMED ELSHARKAWY' : 'ENG: AHMED ELSHARKAWY',
      role: isArabic
        ? 'مهندس برمجيات ومسؤول الشركة ومتخصص Frontend Development'
        : 'Software engineer, company lead, and Frontend Development specialist',
      image: ahmedImage,
    },
    {
      name: isArabic ? 'ENG: KAREEM MOHAMED' : 'ENG: KAREEM MOHAMED',
      role: isArabic
        ? 'مهندس برمجيات ومدير الشركة ومتخصص Cyber Security'
        : 'Software engineer, company manager, and Cyber Security specialist',
      image: kareemImage,
    },
    {
      name: isArabic ? 'ENG: BAHAA MOHAMED' : 'ENG: BAHAA MOHAMED',
      role: isArabic
        ? 'مهندس برمجيات وأحد أفضل مؤسسي الشركة ومتخصص Backend Development'
        : 'Software engineer, one of the founders, and Backend Development specialist',
      image: bahaaImage,
    },
  ];

  return (
    <div className="min-h-screen pb-5 pt-[4.75rem]">
      {typeof document !== 'undefined' && createPortal(
        <header className="pointer-events-none fixed inset-x-0 top-0 z-[90]">
          <div className="mx-auto max-w-[var(--shell-max-width)] px-3 py-2 sm:px-4 lg:px-6">
            <div dir="ltr" className="kanz-coins-panel pointer-events-auto grid min-h-[2.95rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-[20px] border px-2.5 py-1 sm:min-h-[3.25rem] sm:gap-5 sm:rounded-[28px] sm:px-5 sm:py-1.5">
              <div className="col-start-1 row-start-1 justify-self-start">
                <ThemeToggle variant="glass" compact className="h-9 w-9 sm:h-10 sm:w-10" />
              </div>
              <button type="button" onClick={handleHome} className="col-start-2 row-start-1 justify-self-center rounded-[20px] transition-all hover:-translate-y-0.5" aria-label={isArabic ? 'العودة للرئيسية' : 'Back to home'}>
                <HeaderBrand />
              </button>
              <div className="col-start-3 row-start-1 flex items-center gap-1.5 justify-self-end sm:gap-2">
                <button type="button" onClick={handleLogin} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-violet-200/20 bg-[linear-gradient(180deg,rgb(124_58_237/0.22),rgb(3_8_22/0.78))] text-violet-50 sm:h-10 sm:w-10" aria-label={isArabic ? 'تسجيل الدخول' : 'Login'}>
                  <UserRound className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => setIsMenuOpen((value) => !value)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[linear-gradient(180deg,rgb(3_8_22/0.9),rgb(2_6_19/0.78))] text-[var(--color-text)] sm:h-10 sm:w-10" aria-label={isArabic ? 'القائمة' : 'Menu'}>
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>,
        document.body
      )}

      <PublicSidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onHome={handleHome}
        onAbout={handleAbout}
        onContact={handleContact}
        onLogin={handleLogin}
        onCreateAccount={handleCreateAccount}
        onGoogleLogin={handleGoogleLogin}
        isBusy={false}
        isArabic={isArabic}
      />

      <main className="mx-auto w-full max-w-4xl space-y-5 px-3 py-4 sm:px-4 sm:py-6">
      <Card className="overflow-hidden rounded-[2rem] border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[linear-gradient(145deg,rgb(var(--color-card-rgb)/0.98),rgb(var(--color-surface-rgb)/0.9))] p-5 shadow-[0_26px_90px_-58px_rgba(20,24,35,0.16)] sm:p-7">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[1.35rem] border border-[color:rgb(var(--color-primary-rgb)/0.22)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] text-[var(--color-primary)]">
            <Code2 className="h-8 w-8" />
          </div>

          <p className="inline-flex items-center gap-2 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] px-3 py-1 text-xs font-black text-[var(--color-primary)]">
            <Sparkles className="h-3.5 w-3.5" />
            KANZ COINS
          </p>

          <h1 className="mt-4 text-2xl font-black text-[var(--color-text)] sm:text-3xl">
            {isArabic ? 'KANZ COINS من تنفيذ DIGI TECH' : 'KANZ COINS built by DIGI TECH'}
          </h1>

          <a
            href="https://digiteech.me"
            target="_blank"
            rel="noreferrer"
            className="group mt-4 block w-full max-w-[26rem]"
            aria-label={isArabic ? 'زيارة موقع DIGI TECH' : 'Visit DIGI TECH website'}
          >
            <img
              src={digitechImage}
              alt="DIGI TECH"
              className="h-auto w-full rounded-[1.25rem] border border-[color:rgb(var(--color-border-rgb)/0.7)] object-cover shadow-[0_18px_42px_-28px_rgba(15,23,42,0.26)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[color:rgb(var(--color-primary-rgb)/0.4)] group-hover:shadow-[0_24px_48px_-28px_rgb(var(--color-primary-rgb)/0.5)]"
              loading="lazy"
              decoding="async"
            />
            <span dir="ltr" className="mt-2 inline-flex items-center rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.22)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] px-3 py-1 text-xs font-black tracking-[0.08em] text-[var(--color-primary)] transition-colors group-hover:bg-[color:rgb(var(--color-primary-rgb)/0.14)]">
              DIGITEECH.ME
            </span>
          </a>

          <p className="mt-3 max-w-xl text-sm font-semibold leading-7 text-[var(--color-text-secondary)]">
            {isArabic
              ? 'نحن شركة برمجة نصمم ونبني منتجات رقمية احترافية، وKANZ COINS أحد أعمالنا التي تعكس اهتمامنا بالتفاصيل وسهولة الاستخدام.'
              : 'We are a software company that designs and builds professional digital products, and KANZ COINS is one of our works that reflects our focus on detail and usability.'}
          </p>
        </div>
      </Card>
      <div className="space-y-5 px-1 py-1 text-center text-[var(--color-text)] sm:px-2 sm:py-2">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] px-4 py-1.5 text-[0.78rem] font-black tracking-[0.12em] text-[var(--color-primary)] shadow-[0_8px_22px_-18px_rgba(15,23,42,0.22)]">
            <UsersRound className="h-4 w-4" />
            {isArabic ? 'فريق DigiTech Solutions' : 'DigiTech Solutions Team'}
          </div>

          <p className="mx-auto mt-4 max-w-2xl text-[0.92rem] font-medium leading-7 text-[var(--color-text-secondary)] sm:text-[1rem]">
            {isArabic
              ? 'خيارات مخصصة تعمل بروح واحدة: بناء منتج يليق بطموحاتك.'
              : 'Custom options working as one team: building a product that matches your ambitions.'}
          </p>

          <div className="mt-8 grid gap-8 sm:gap-10">
            {teamMembers.map((member) => (
              <section key={member.name} className="mx-auto max-w-xl text-center">
                <div className="mx-auto flex justify-center">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-28 w-28 rounded-full border-[4px] border-[color:rgb(var(--color-primary-rgb)/0.22)] object-cover shadow-[0_12px_28px_-18px_rgba(15,23,42,0.24)] sm:h-32 sm:w-32"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <h2 className="mt-4 text-lg font-black tracking-[0.02em] text-[var(--color-text)] sm:text-xl">
                  {member.name}
                </h2>

                <p className="mx-auto mt-2 max-w-md text-[0.9rem] font-medium leading-7 text-[var(--color-text-secondary)] sm:text-[0.95rem]">
                  {member.role}
                </p>
              </section>
            ))}
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonClassName,
              'glow-button mt-8 h-12 w-full rounded-[1.1rem] border border-[color:rgb(var(--color-primary-rgb)/0.24)] bg-[linear-gradient(135deg,rgb(var(--color-primary-rgb)/0.96),rgb(var(--color-primary-soft)/0.96)_55%,rgb(var(--color-primary-hover)/0.98))] px-6 text-base text-[var(--color-primary-foreground)] shadow-[0_18px_44px_-26px_rgba(var(--color-primary-rgb),0.38)] hover:brightness-[1.02]'
            )}
          >
            <Phone className="h-4 w-4" />
            {isArabic ? 'تواصل مع مهندسين الموقع' : 'Contact Site Engineers'}
          </a>
      </div>
      </main>
      <SiteCopyrightFooter isArabic={isArabic} />
    </div>
  );
};

export default CreatedBy;
