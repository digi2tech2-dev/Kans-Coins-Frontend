import React, { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Home, Menu, MessageCircle, ShieldCheck, UserRound, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/useAuthStore';
import ThemeToggle from '../components/ui/ThemeToggle';
import HeaderBrand from '../components/layout/HeaderBrand';
import PublicSidebar from '../components/layout/PublicSidebar';
import SiteCopyrightFooter from '../components/layout/SiteCopyrightFooter';
import { useBodyScrollLock } from '../utils/bodyScrollLock';
import { buildWhatsAppLink, getAdminWhatsAppNumber } from '../utils/whatsapp';
import brandIconImage from '../assets/logo.webp';

const AboutUsPage = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isArabic = String(i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().startsWith('ar');

  useBodyScrollLock(isMenuOpen);

  const whatsappLink = useMemo(() => buildWhatsAppLink({
    number: getAdminWhatsAppNumber(),
    message: isArabic
      ? 'مرحبا، أريد التواصل مع خدمة العملاء بخصوص شكوى.'
      : 'Hello, I want to contact customer support about a complaint.',
  }), [isArabic]);

  const handleLogin = useCallback(() => {
    navigate('/auth?mode=login');
  }, [navigate]);

  const handleCreateAccount = useCallback(() => {
    navigate('/auth?mode=signup');
  }, [navigate]);

  const handleGoogleLogin = useCallback(() => {
    Promise.resolve(loginWithGoogle());
  }, [loginWithGoogle]);

  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleAbout = useCallback(() => {
    navigate('/about-us');
  }, [navigate]);

  const handleContact = useCallback(() => {
    navigate('/public-contact-us');
  }, [navigate]);

  const featureCards = [
    {
      icon: Zap,
      label: isArabic ? 'سرعة' : 'Speed',
      cardClass: 'border-sky-300/70 bg-sky-50 text-sky-950 shadow-sky-200/70 dark:border-sky-400/22 dark:bg-sky-400/10 dark:text-sky-50 dark:shadow-sky-950/20',
      iconClass: 'bg-sky-500 text-white shadow-sky-300/70 dark:bg-sky-400 dark:text-sky-950 dark:shadow-sky-400/20',
    },
    {
      icon: CheckCircle2,
      label: isArabic ? 'دقة' : 'Accuracy',
      cardClass: 'border-violet-300/70 bg-violet-50 text-violet-950 shadow-violet-200/70 dark:border-violet-400/22 dark:bg-violet-400/10 dark:text-violet-50 dark:shadow-violet-950/20',
      iconClass: 'bg-violet-500 text-white shadow-violet-300/70 dark:bg-violet-400 dark:text-violet-950 dark:shadow-violet-400/20',
    },
    {
      icon: ShieldCheck,
      label: isArabic ? 'مصداقية في العمل' : 'Trust in our work',
      cardClass: 'border-amber-300/80 bg-amber-50 text-amber-950 shadow-amber-200/70 dark:border-amber-300/24 dark:bg-amber-300/10 dark:text-amber-50 dark:shadow-amber-950/20',
      iconClass: 'bg-amber-500 text-white shadow-amber-300/70 dark:bg-amber-300 dark:text-amber-950 dark:shadow-amber-300/20',
    },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8ea_0%,#f4fbff_48%,#fffdf8_100%)] pb-5 pt-[4.75rem] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.16),transparent_34%),linear-gradient(180deg,#041019_0%,#07111f_52%,#03070d_100%)]">
      {typeof document !== 'undefined' && createPortal(
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[90]">
        <div className="mx-auto max-w-[var(--shell-max-width)] px-3 py-2 sm:px-4 lg:px-6">
          <div dir="ltr" className="kanz-coins-panel pointer-events-auto grid min-h-[2.95rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-[20px] border px-2.5 py-1 sm:min-h-[3.25rem] sm:gap-5 sm:rounded-[28px] sm:px-5 sm:py-1.5">
            <div className="col-start-1 row-start-1 flex items-center gap-1 justify-self-start sm:gap-2">
              <ThemeToggle variant="glass" compact className="h-9 w-9 sm:h-10 sm:w-10" />
            </div>

            <button
              type="button"
              onClick={handleHome}
              className="col-start-2 row-start-1 justify-self-center rounded-[20px] transition-all hover:-translate-y-0.5"
              aria-label={isArabic ? 'العودة للرئيسية' : 'Back to home'}
            >
              <HeaderBrand />
            </button>

            <div className="col-start-3 row-start-1 flex items-center gap-1.5 justify-self-end sm:gap-2">
              <button
                type="button"
                onClick={handleLogin}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-200/20 bg-[linear-gradient(180deg,rgb(124_58_237/0.22),rgb(3_8_22/0.78))] text-violet-50 shadow-[inset_0_0_18px_rgb(255_255_255/0.035),0_0_26px_-18px_rgb(124_58_237/0.9)] transition-all hover:-translate-y-0.5 hover:border-amber-200/30 hover:text-amber-100 sm:h-10 sm:w-10"
                aria-label={isArabic ? 'تسجيل الدخول' : 'Login'}
              >
                <UserRound className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </button>

              <button
                type="button"
                onClick={() => setIsMenuOpen((previous) => !previous)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[linear-gradient(180deg,rgb(3_8_22/0.9),rgb(2_6_19/0.78))] text-[var(--color-text)] shadow-[inset_0_0_18px_rgb(255_255_255/0.035),0_0_26px_-18px_rgb(34_211_238/0.9)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.38)] hover:text-[var(--color-primary)] sm:h-10 sm:w-10"
                aria-label={isArabic ? 'القائمة' : 'Menu'}
              >
                <Menu className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
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

      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto mb-3 flex max-w-5xl justify-start">
          <button
            type="button"
            onClick={handleHome}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[color:rgb(var(--color-border-rgb)/0.7)] bg-[color:rgb(var(--color-card-rgb)/0.72)] px-4 text-sm font-extrabold text-[var(--color-text-secondary)] shadow-[var(--shadow-subtle)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.32)] hover:text-[var(--color-primary)]"
          >
            <Home className="h-4 w-4" />
            {isArabic ? 'العودة للرئيسية' : 'Back to home'}
          </button>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-5xl items-center"
        >
          <div className="relative w-full overflow-hidden rounded-[18px] border border-amber-200/80 bg-white p-4 shadow-[0_28px_80px_-56px_rgba(15,23,42,0.55)] ring-1 ring-white/80 sm:p-6 lg:p-8 dark:border-violet-300/18 dark:bg-[linear-gradient(135deg,rgba(5,18,30,0.96),rgba(12,10,27,0.92))] dark:shadow-[0_28px_90px_-62px_rgba(124,58,237,0.75)] dark:ring-white/5">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#f59e0b,#7c3aed,#8b5cf6)] dark:bg-[linear-gradient(90deg,#f472d0,#7c3aed,#8b5cf6)]" />

            <div className="grid items-stretch gap-5 lg:grid-cols-[0.82fr_1.18fr]">
              <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-[14px] border border-sky-200 bg-[linear-gradient(160deg,#e0f7ff_0%,#fff7df_56%,#ffffff_100%)] px-5 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:py-10 dark:border-violet-300/16 dark:bg-[linear-gradient(160deg,rgba(124,58,237,0.18)_0%,rgba(244,114,208,0.1)_54%,rgba(139,92,246,0.12)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="absolute -left-14 -top-14 h-32 w-32 rounded-full bg-violet-200/70 blur-2xl dark:bg-violet-400/10" />
                <div className="absolute -bottom-16 -right-12 h-36 w-36 rounded-full bg-amber-200/75 blur-2xl dark:bg-amber-300/10" />
                <div className="relative flex flex-col items-center gap-3">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-[18px] border border-amber-300/80 bg-white/88 p-2 shadow-[0_18px_38px_-24px_rgba(245,158,11,0.95),0_0_0_6px_rgba(14,165,233,0.08)] dark:border-violet-300/26 dark:bg-slate-950/58 dark:shadow-[0_18px_40px_-24px_rgba(34,211,238,0.8),0_0_0_6px_rgba(244,114,208,0.08)]">
                    <span className="absolute inset-0 rounded-[18px] bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(6,182,212,0.12),rgba(139,92,246,0.13))]" />
                    <img
                      src={brandIconImage}
                      alt="KANZ COINS"
                      loading="eager"
                      decoding="async"
                      className="relative h-full w-full object-contain drop-shadow-[0_10px_18px_rgba(15,23,42,0.18)] dark:drop-shadow-[0_10px_18px_rgba(34,211,238,0.2)]"
                    />
                  </div>
                  <div dir="ltr" className="text-center">
                    <p className="text-[1.15rem] font-black uppercase leading-none tracking-[0.12em] sm:text-[1.35rem]">
                      <span className="bg-[linear-gradient(120deg,#0f172a_0%,#2563eb_34%,#f59e0b_70%,#7c3aed_100%)] bg-clip-text text-transparent dark:bg-[linear-gradient(120deg,#fff7d6_0%,#f472d0_30%,#a855f7_66%,#a78bfa_100%)]">
                        KANZ
                      </span>
                      <span className="mx-1 text-sky-600 dark:text-violet-200">/</span>
                      <span className="bg-[linear-gradient(120deg,#7c2d12_0%,#d97706_38%,#0f766e_100%)] bg-clip-text text-transparent dark:bg-[linear-gradient(120deg,#fef3c7_0%,#c4b5fd_48%,#67e8f9_100%)]">
                        COINS
                      </span>
                    </p>
                  </div>
                </div>
                <h1 className="relative mt-5 text-3xl font-black text-slate-950 sm:text-4xl dark:text-white">
                  {isArabic ? 'من نحن' : 'About us'}
                </h1>
              </div>

              <div className="space-y-5">
                <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-4 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.8)] dark:border-white/10 dark:bg-white/[0.045]">
                  <p className="text-center text-lg font-extrabold leading-9 text-slate-950 sm:text-xl lg:text-start dark:text-white">
                  {isArabic
                    ? 'موقعنا يقدم خدمات شحن التطبيقات و الالعاب'
                    : 'Our website provides app and game top-up services.'}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {featureCards.map((item) => (
                    <div
                      key={item.label}
                      className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-[14px] border px-3 py-4 text-sm font-black shadow-[0_16px_34px_-28px_currentColor] ${item.cardClass}`}
                    >
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-lg ${item.iconClass}`}>
                        <item.icon className="h-5 w-5 shrink-0" />
                      </span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-stretch gap-3 rounded-[14px] border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5,#f8fafc)] p-3 shadow-[0_18px_38px_-30px_rgba(16,185,129,0.72)] sm:flex-row sm:items-center sm:justify-between dark:border-emerald-300/18 dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(15,23,42,0.24))]">
                  <p className="text-center text-sm font-bold leading-7 text-emerald-950 sm:text-start dark:text-emerald-50">
                    {isArabic
                      ? 'للشكوي تواصل مع خدمه العملاء'
                      : 'For complaints, contact customer support.'}
                  </p>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-emerald-300/45 bg-[linear-gradient(135deg,#20c66b,#128c7e)] px-5 text-sm font-extrabold text-white shadow-[0_18px_34px_-24px_rgba(34,197,94,0.95)] transition-all hover:-translate-y-0.5"
                  >
                    <MessageCircle className="h-4.5 w-4.5" />
                    {isArabic ? 'تواصل عبر واتساب' : 'Contact on WhatsApp'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      <SiteCopyrightFooter isArabic={isArabic} />
    </div>
  );
};

export default AboutUsPage;
