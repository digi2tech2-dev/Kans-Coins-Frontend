import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  CheckCircle2,
  Code2,
  ExternalLink,
  Globe,
  Layers,
  Menu,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  Zap,
} from 'lucide-react';
import { buttonClassName, cn } from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useLanguage } from '../context/LanguageContext';
import useAuthStore from '../store/useAuthStore';
import ThemeToggle from '../components/ui/ThemeToggle';
import HeaderBrand from '../components/layout/HeaderBrand';
import PublicSidebar from '../components/layout/PublicSidebar';
import SiteCopyrightFooter from '../components/layout/SiteCopyrightFooter';
import { useBodyScrollLock } from '../utils/bodyScrollLock';
import digitechLogo from '../assets/digitech-solutions.webp';
import ahmedImage from '../assets/about-img-1.webp';
import kareemImage from '../assets/about-img-2.webp';
import bahaaImage from '../assets/about-img-3.webp';

const CreatedBy = () => {
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isArabic = dir === 'rtl';

  const whatsappMessage = encodeURIComponent(
    'مرحبًا، أود استشارة هندسية لتنفيذ وتطوير موقع إلكتروني جديد مع شركة ديجي تك'
  );
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
      name: 'ENG: AHMED ELSHARKAWY',
      role: isArabic
        ? 'مهندس برمجيات ومسؤول الشركة ومتخصص Frontend Development'
        : 'Software engineer, company lead, and Frontend Development specialist',
      image: ahmedImage,
    },
    {
      name: 'ENG: KAREEM MOHAMED',
      role: isArabic
        ? 'مهندس برمجيات ومدير الشركة ومتخصص Cyber Security'
        : 'Software engineer, company manager, and Cyber Security specialist',
      image: kareemImage,
    },
    {
      name: 'ENG: BAHAA MOHAMED',
      role: isArabic
        ? 'مهندس برمجيات وأحد مؤسسي الشركة ومتخصص Backend Development'
        : 'Software engineer, co-founder, and Backend Development specialist',
      image: bahaaImage,
    },
  ];

  const features = [
    {
      icon: Zap,
      title: isArabic ? 'سرعة فائقة وتجاوب كامل' : 'Lightning Fast & Responsive',
      desc: isArabic
        ? 'بناء منصات خفيفة ومحسّنة تفتح بلمح البصر على كافة الأجهزة والهواتف لضمان أعلى معدل مبيعات.'
        : 'High-performance platforms optimized for speed across all mobile and desktop devices.',
    },
    {
      icon: ShieldCheck,
      title: isArabic ? 'حماية وأمان سيبراني متقدم' : 'Advanced Cyber Security',
      desc: isArabic
        ? 'هندسة برمجية متينة مضادة للهجمات وثغرات الدفع الإلكتروني لحماية بياناتك وأموال عملائك.'
        : 'Rock-solid security engineering safeguarding transactions, user data, and system integrity.',
    },
    {
      icon: Layers,
      title: isArabic ? 'لوحات تحكم ذكية وشاملة' : 'Intelligent Admin Dashboards',
      desc: isArabic
        ? 'إدارة كاملة لموقعك، المبيعات، المخزون، والتقارير المالية بضغطة زر وبواجهة سهلة ومباشرة.'
        : 'Full control over orders, inventory, pricing, and finances with intuitive dashboards.',
    },
    {
      icon: Code2,
      title: isArabic ? 'ربط API وبوابات دفع متكاملة' : 'Seamless API & Payments',
      desc: isArabic
        ? 'تكامل فوري مع محافظ الدفع، البنوك، وشبكات شحن الألعاب والخدمات الرقمية المحلية والدولية.'
        : 'Instant integration with local and global payment gateways and automated service APIs.',
    },
  ];

  return (
    <div className="min-h-screen pb-6 pt-[4.75rem]">
      {typeof document !== 'undefined' &&
        createPortal(
          <header className="pointer-events-none fixed inset-x-0 top-0 z-[90]">
            <div className="mx-auto max-w-[var(--shell-max-width)] px-3 py-2 sm:px-4 lg:px-6">
              <div
                dir="ltr"
                className="kanz-coins-panel pointer-events-auto grid min-h-[2.95rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-[20px] border px-2.5 py-1 sm:min-h-[3.25rem] sm:gap-5 sm:rounded-[28px] sm:px-5 sm:py-1.5"
              >
                <div className="col-start-1 row-start-1 justify-self-start">
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
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-400/25 bg-[linear-gradient(180deg,rgb(217_119_6/0.24),rgb(14_11_7/0.85))] text-amber-200 sm:h-10 sm:w-10"
                    aria-label={isArabic ? 'تسجيل الدخول' : 'Login'}
                  >
                    <UserRound className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen((value) => !value)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[linear-gradient(180deg,rgb(16_13_8/0.9),rgb(10_8_5/0.78))] text-[var(--color-text)] sm:h-10 sm:w-10"
                    aria-label={isArabic ? 'القائمة' : 'Menu'}
                  >
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

      <main className="mx-auto w-full max-w-4xl space-y-6 px-3 py-4 sm:px-4 sm:py-6">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-[2.2rem] border border-[color:rgb(var(--color-primary-rgb)/0.32)] bg-[linear-gradient(155deg,rgb(var(--color-card-rgb)/0.96),rgb(var(--color-surface-rgb)/0.94))] p-6 text-center shadow-[0_30px_90px_-40px_rgb(217_119_6/0.35)] sm:p-10">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--color-primary-rgb)/0.25),transparent_70%)] blur-2xl" />

          {/* Golden DigiTech Logo */}
          <div className="relative mx-auto mb-5 flex h-28 w-28 items-center justify-center sm:h-36 sm:w-36">
            <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgb(var(--color-primary-rgb)/0.35),transparent_70%)] blur-xl" />
            <img
              src={digitechLogo}
              alt="DIGI TECH SOLUTIONS"
              className="relative z-10 h-full w-full object-contain filter drop-shadow-[0_12px_28px_rgba(245,158,11,0.45)] transition-transform duration-500 hover:scale-105"
            />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.3)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] px-4 py-1 text-xs font-black tracking-widest text-[var(--color-primary)]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>DIGI TECH SOLUTIONS</span>
          </div>

          <h1 className="mt-4 text-2xl font-black leading-tight text-[var(--color-text)] sm:text-4xl">
            {isArabic ? (
              <>
                حوّل فكرتك إلى <span className="text-[var(--color-primary)]">منصة رقمية ناجحة</span> ومربحة
              </>
            ) : (
              <>
                Turn Your Vision into a <span className="text-[var(--color-primary)]">High-Performing</span> Platform
              </>
            )}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-7 text-[var(--color-text-secondary)] sm:text-base">
            {isArabic
              ? 'هل ترغب في امتلاك موقع إلكتروني، متجر ذكي، أو منصة شحن وخدمات رقمية بنفس كفاءة وسرعة KANZ COINS؟ نحن الشريك التقني الذي يبني لك مشروعك من الصفر بأحدث التقنيات وأعلى معايير الأمان العالمية.'
              : 'Looking to launch a powerful web platform, digital storefront, or automated services website with the speed and elegance of KANZ COINS? DIGI TECH is your technical partner from concept to scale.'}
          </p>

          {/* Key Stats */}
          <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            {[
              { label: isArabic ? 'سرعة استجابة' : 'Ultra Fast', val: '0.1s' },
              { label: isArabic ? 'استقرار وأمان' : 'Uptime & Security', val: '99.9%' },
              { label: isArabic ? 'تصميم مخصص' : 'Custom UI/UX', val: '100%' },
              { label: isArabic ? 'دعم مستمر' : 'Engineer Support', val: '24/7' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.7)] bg-[color:rgb(var(--color-surface-rgb)/0.5)] p-3 backdrop-blur-sm"
              >
                <div className="text-xl font-black text-[var(--color-primary)] sm:text-2xl">{stat.val}</div>
                <div className="mt-0.5 text-xs font-semibold text-[var(--color-text-secondary)]">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonClassName,
                'glow-button flex h-12 items-center justify-center gap-2.5 rounded-xl border border-[color:rgb(var(--color-primary-rgb)/0.3)] bg-[linear-gradient(135deg,rgb(var(--color-primary-rgb)/0.96),rgb(var(--color-primary-hover)/0.98))] px-7 text-sm font-black text-[var(--color-primary-foreground)] shadow-[0_18px_44px_-26px_rgba(var(--color-primary-rgb),0.55)] transition-all hover:-translate-y-0.5 sm:text-base'
              )}
            >
              <Phone className="h-4 w-4" />
              <span>{isArabic ? 'تواصل مع المهندسين لطلب موقعك' : 'Contact Engineers on WhatsApp'}</span>
            </a>

            <a
              href="https://digiteech.me"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.8)] bg-[color:rgb(var(--color-card-rgb)/0.85)] px-6 text-sm font-black text-[var(--color-text)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.4)]"
            >
              <Globe className="h-4 w-4 text-[var(--color-primary)]" />
              <span>DIGITEECH.ME</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </a>
          </div>
        </section>

        {/* Value Proposition Services */}
        <section className="space-y-3">
          <div className="text-center">
            <h2 className="text-xl font-black text-[var(--color-text)] sm:text-2xl">
              {isArabic ? 'لماذا تبني موقعك ومشروعك معنا؟' : 'Why Build Your Platform With Us?'}
            </h2>
            <p className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)] sm:text-sm">
              {isArabic
                ? 'خبرة هندسية متكاملة تقدم لك حلاً رقمياً متكاملاً من التخطيط حتى الإطلاق'
                : 'Full-stack engineering delivering end-to-end digital excellence from architecture to launch'}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card
                  key={idx}
                  className="rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.7)] bg-[linear-gradient(145deg,rgb(var(--color-card-rgb)/0.9),rgb(var(--color-surface-rgb)/0.7))] p-4 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.3)] transition-all hover:border-[color:rgb(var(--color-primary-rgb)/0.35)]"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[color:rgb(var(--color-primary-rgb)/0.25)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] text-[var(--color-primary)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[var(--color-text)] sm:text-base">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs font-medium leading-5 text-[var(--color-text-secondary)] sm:text-sm">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Living Proof Box */}
        <Card className="rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.25)] bg-[linear-gradient(135deg,rgb(var(--color-card-rgb)/0.92),rgb(var(--color-primary-rgb)/0.06))] p-5 shadow-[0_16px_40px_-24px_rgba(245,158,11,0.2)] sm:p-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.3)] bg-[color:rgb(var(--color-primary-rgb)/0.12)] text-[var(--color-primary)]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-black text-[var(--color-text)] sm:text-lg">
                {isArabic ? 'منصة KANZ COINS نموذج حي لجودة أعمالنا' : 'KANZ COINS is Living Proof of Our Quality'}
              </h3>
              <p className="mt-1 text-xs font-medium leading-6 text-[var(--color-text-secondary)] sm:text-sm">
                {isArabic
                  ? 'تم تصميم وهندسة وبرمجة منصة KANZ COINS بالكامل بواسطة فريق ديجي تك، لتقديم تجربة دفع وشحن فائقة السرعة، نظام حماية متعدد المستويات، ولوحة تحكم متطورة تخدم آلاف المستخدمين يومياً بكل استقرار.'
                  : 'KANZ COINS was architected and developed entirely by DIGI TECH, providing high-concurrency payment and top-up pipelines, multi-tier security, and real-time operations for thousands of daily users.'}
              </p>
            </div>
          </div>
        </Card>

        {/* Team Section */}
        <section className="space-y-4 pt-2 text-center text-[var(--color-text)]">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] px-4 py-1.5 text-xs font-black tracking-widest text-[var(--color-primary)]">
            <UsersRound className="h-4 w-4" />
            <span>{isArabic ? 'الفريق الهندسي القيادي' : 'Lead Engineering Team'}</span>
          </div>

          <p className="mx-auto max-w-xl text-xs font-semibold leading-6 text-[var(--color-text-secondary)] sm:text-sm">
            {isArabic
              ? 'نخبة من المهندسين المتخصصين يعملون بروح واحدة لتحويل مشروعك إلى صرح تقني متكامل'
              : 'Dedicated senior engineers collaborating as one team to bring your digital vision to life'}
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            {teamMembers.map((member) => (
              <Card
                key={member.name}
                className="flex flex-col items-center rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.75)] bg-[linear-gradient(155deg,rgb(var(--color-card-rgb)/0.95),rgb(var(--color-surface-rgb)/0.8))] p-5 text-center transition-all hover:-translate-y-1 hover:border-[color:rgb(var(--color-primary-rgb)/0.35)]"
              >
                <div className="relative mb-3.5">
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgb(var(--color-primary-rgb)/0.3),transparent_70%)] blur-md" />
                  <img
                    src={member.image}
                    alt={member.name}
                    className="relative z-10 h-24 w-24 rounded-full border-2 border-[color:rgb(var(--color-primary-rgb)/0.35)] object-cover shadow-[0_10px_24px_-12px_rgba(0,0,0,0.5)] sm:h-28 sm:w-28"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <h3 className="text-sm font-black tracking-wide text-[var(--color-text)] sm:text-base">
                  {member.name}
                </h3>

                <p className="mt-1.5 text-xs font-medium leading-5 text-[var(--color-text-secondary)]">
                  {member.role}
                </p>
              </Card>
            ))}
          </div>

          {/* Bottom WhatsApp CTA */}
          <div className="pt-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonClassName,
                'glow-button mx-auto flex h-12 w-full max-w-xl items-center justify-center gap-2 rounded-xl border border-[color:rgb(var(--color-primary-rgb)/0.3)] bg-[linear-gradient(135deg,rgb(var(--color-primary-rgb)/0.96),rgb(var(--color-primary-hover)/0.98))] px-6 text-sm font-black text-[var(--color-primary-foreground)] shadow-[0_18px_44px_-26px_rgba(var(--color-primary-rgb),0.55)] hover:brightness-105 sm:text-base'
              )}
            >
              <Phone className="h-4 w-4" />
              <span>{isArabic ? 'تواصل مع مهندسين الموقع عبر واتساب' : 'Contact Site Engineers on WhatsApp'}</span>
            </a>
          </div>
        </section>
      </main>

      <SiteCopyrightFooter isArabic={isArabic} />
    </div>
  );
};

export default CreatedBy;
