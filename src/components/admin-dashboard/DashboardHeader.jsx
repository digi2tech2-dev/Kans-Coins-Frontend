import React from 'react';
import { CalendarDays, Crown, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '../ui/Button';

const DashboardHeader = ({ isArabic, userName, currentDateLabel }) => {
  const displayName = userName || (isArabic ? 'مشرف النظام' : 'Platform Admin');

  return (
    <section className="admin-dashboard-header admin-dashboard-hero relative mx-auto w-[calc(100vw-1.5rem)] max-w-[42rem] overflow-hidden sm:w-full lg:max-w-none">
      <div className="admin-dashboard-hero-orbit admin-dashboard-hero-orbit--one" aria-hidden="true" />
      <div className="admin-dashboard-hero-orbit admin-dashboard-hero-orbit--two" aria-hidden="true" />
      <div className="admin-dashboard-hero-grid" aria-hidden="true" />
      <div className="admin-dashboard-hero-line" aria-hidden="true" />

      <div className={cn('relative grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-end lg:gap-8 lg:p-8', isArabic && 'lg:text-right')}>
        <div className={cn('min-w-0', isArabic ? 'text-right' : 'text-left')}>
          <div className={cn('flex items-center gap-2', isArabic && 'flex-row-reverse justify-end')}>
            <span className="admin-dashboard-hero-seal"><Crown className="h-3.5 w-3.5" /></span>
            <span className="admin-dashboard-hero-kicker"><Sparkles className="h-3.5 w-3.5" />{isArabic ? 'لوحة القيادة الإدارية' : 'Executive control center'}</span>
          </div>

          <h1 className="mt-4 text-[1.7rem] font-black leading-[1.15] tracking-[-0.04em] text-[var(--color-text)] sm:mt-5 sm:text-4xl">
            {isArabic ? 'إدارة أذكى، رؤية أوضح.' : 'Smarter management. Clearer vision.'}
          </h1>
          <p className="mt-3 max-w-2xl text-[12px] leading-6 text-[var(--color-text-secondary)] sm:text-[15px] sm:leading-7">
            {isArabic
              ? 'تابع نبض المتجر، راجع أحدث الطلبات، وأنهِ مهامك اليومية من مساحة واحدة مصممة للقرار السريع.'
              : 'Follow your store pulse, review latest orders, and finish daily work from one space built for fast decisions.'}
          </p>

          <div className={cn('mt-5 flex flex-wrap items-center gap-2.5', isArabic && 'justify-end')}>
            <span className="admin-dashboard-hero-status"><span className="admin-dashboard-hero-status-dot" />{isArabic ? 'النظام يعمل بكفاءة' : 'All systems operational'}</span>
            <span className="admin-dashboard-hero-security"><ShieldCheck className="h-3.5 w-3.5" />{isArabic ? 'وصول إداري آمن' : 'Secure admin access'}</span>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2.5 sm:gap-3">
          <div className={cn('admin-dashboard-identity-card min-w-0', isArabic && 'text-right')}>
            <div className={cn('flex items-center gap-3', isArabic && 'flex-row-reverse')}>
              <span className="admin-dashboard-identity-avatar" aria-hidden="true"><ShieldCheck className="h-5 w-5" /></span>
              <div className="min-w-0">
                <p className="admin-dashboard-card-label">{isArabic ? 'مرحبًا بعودتك' : 'Welcome back'}</p>
                <p className="mt-1 truncate text-sm font-extrabold text-[var(--color-text)] sm:text-[15px]">{displayName}</p>
              </div>
            </div>
          </div>

          <div className={cn('admin-dashboard-date-card', isArabic && 'text-right')}>
            <CalendarDays className="h-4 w-4 text-[var(--color-primary)]" />
            <p className="admin-dashboard-card-label mt-2">{isArabic ? 'تاريخ اليوم' : 'Today'}</p>
            <p className="mt-1 max-w-[12rem] text-[11px] font-bold leading-5 text-[var(--color-text)] sm:text-xs">{currentDateLabel}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardHeader;
