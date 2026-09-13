import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import { resolveImageUrl } from '../../utils/imageUrl';

// Helper to determine contextual note for each payment method
export const getMethodNote = (method, isRTL) => {
  const rawNote = String(method?.description || method?.instructions || method?.note || '').trim();
  if (rawNote) {
    if (rawNote.length <= 25) return rawNote;
    const firstPart = rawNote.split(/[.\n،]/)[0].trim();
    if (firstPart && firstPart.length <= 25) return firstPart;
  }

  const token = `${method?.id || ''} ${method?.name || ''} ${method?.type || ''} ${method?.groupName || ''}`.toLowerCase();

  if (token.includes('vodafone') || token.includes('فودافون')) {
    return isRTL ? 'اي مبلغ' : 'Any amount';
  }
  if (token.includes('instapay') || token.includes('انستا') || token.includes('insta')) {
    return isRTL ? 'تحويل انستا فقط' : 'InstaPay only';
  }
  if (token.includes('binance') || token.includes('بينانس') || token.includes('usdt') || token.includes('crypto')) {
    return isRTL ? 'تحويل ID' : 'ID transfer';
  }
  if (token.includes('cih') || token.includes('المغرب') || token.includes('morocco')) {
    return isRTL ? 'استلام المغرب' : 'Morocco receipt';
  }
  if (token.includes('baridi') || token.includes('بريدي') || token.includes('الجزائر') || token.includes('algeria')) {
    return isRTL ? 'استلام الجزائر' : 'Algeria receipt';
  }
  if (token.includes('sham') || token.includes('شام') || token.includes('سوريا') || token.includes('syria')) {
    return isRTL ? 'محفظه سوريا' : 'Syria wallet';
  }
  if (token.includes('orange') || token.includes('اورانج') || token.includes('أورانج')) {
    return isRTL ? 'اي مبلغ' : 'Any amount';
  }
  if (token.includes('etisalat') || token.includes('اتصالات')) {
    return isRTL ? 'اي مبلغ' : 'Any amount';
  }
  if (token.includes('stc') || token.includes('urpay') || token.includes('السعودية')) {
    return isRTL ? 'استلام السعودية' : 'KSA receipt';
  }
  if (token.includes('bank') || token.includes('بنك') || token.includes('تحويل')) {
    return isRTL ? 'تحويل بنكي مباشر' : 'Bank transfer';
  }

  if (method?.groupCurrency) {
    return isRTL ? `دفع عملة ${method.groupCurrency}` : `${method.groupCurrency} payment`;
  }
  return isRTL ? 'تحويل فوري وسريع' : 'Instant transfer';
};

// Helper to determine country flag badge
export const getMethodCountry = (method) => {
  const token = `${method?.id || ''} ${method?.name || ''} ${method?.groupName || ''} ${method?.groupCurrency || ''}`.toLowerCase();
  if (token.includes('المغرب') || token.includes('morocco') || token.includes('mad') || token.includes('cih')) {
    return { flag: '🇲🇦', label: 'المغرب' };
  }
  if (token.includes('الجزائر') || token.includes('algeria') || token.includes('dzd') || token.includes('baridi')) {
    return { flag: '🇩🇿', label: 'الجزائر' };
  }
  if (token.includes('سوريا') || token.includes('syria') || token.includes('syp') || token.includes('sham')) {
    return { flag: '🇸🇾', label: 'سوريا' };
  }
  if (token.includes('مصر') || token.includes('egypt') || token.includes('egp') || token.includes('vodafone') || token.includes('instapay') || token.includes('orange') || token.includes('etisalat')) {
    return { flag: '🇪🇬', label: 'مصر' };
  }
  if (token.includes('السعودية') || token.includes('saudi') || token.includes('sar') || token.includes('stc')) {
    return { flag: '🇸🇦', label: 'السعودية' };
  }
  if (token.includes('عالمي') || token.includes('global') || token.includes('usd') || token.includes('binance') || token.includes('usdt')) {
    return { flag: '🌐', label: 'عالمي' };
  }
  return null;
};

// SVG Logos for high-fidelity fallback rendering when image isn't uploaded
const BrandSvgLogo = ({ token, isRTL = true }) => {
  if (token.includes('vodafone') || token.includes('فودافون')) {
    return (
      <div className="flex items-center justify-center gap-2 sm:gap-3 py-0.5">
        <div className="flex flex-col items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-9 w-9 sm:h-10 sm:w-10" fill="none">
            <circle cx="50" cy="50" r="45" stroke="#E60000" strokeWidth="8" />
            <path
              d="M50 24C38.95 24 30 32.95 30 44c0 9.2 6.2 16.94 14.7 19.26l-1.9 8.74 13.6-7.85C62.8 61.4 68 53.3 68 44c0-11.05-8.95-20-18-20z"
              fill="#E60000"
            />
          </svg>
          <span className="mt-0.5 font-['Arial',sans-serif] text-[10px] sm:text-xs font-black tracking-tight text-[#E60000]">
            vodafone
          </span>
        </div>

        {/* High-tech Bot Mascot Shape */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-amber-400/80 bg-gradient-to-b from-stone-900 via-stone-950 to-amber-950 px-2 py-1 shadow-[0_4px_12px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(245,158,11,0.3)]">
          <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 shadow-md">
            <Bot className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white" />
            </span>
          </div>
          <span className="mt-1 text-[8px] sm:text-[9px] font-black text-amber-300 leading-none">
            {isRTL ? 'بوت آلي' : 'AUTO BOT'}
          </span>
        </div>
      </div>
    );
  }

  if (token.includes('usdt') || token.includes('tether') || token.includes('يو اس دي تي')) {
    return (
      <div className="flex items-center justify-center gap-2">
        {/* Tether USDT Official Emblem */}
        <div className="flex flex-col items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-8 w-8 sm:h-9 sm:w-9" fill="none">
            <circle cx="50" cy="50" r="48" fill="#26A17B" />
            <path
              d="M57.6 37.8h17.2V27.4H25.2v10.4h17.2c-5.8.4-11.8 1.4-16.8 3 7.8 2.5 18.6 3.6 24.4 3.9v10.2c-15.6-.8-27.4-4-27.4-8 0-1.6 1.8-3.1 5.2-4.4V34C20.8 36.6 18 40.1 18 44c0 7.4 14.3 13.4 32 13.4s32-6 32-13.4c0-3.9-2.8-7.4-9.8-10v8.5c3.4 1.3 5.2 2.8 5.2 4.4 0 4-11.8 7.2-27.4 8V44.3c5.8-.3 16.6-1.4 24.4-3.9-5-1.6-11-2.6-16.8-3v-7.6z"
              fill="white"
            />
          </svg>
          <span className="mt-0.5 font-['Arial',sans-serif] text-[10px] sm:text-xs font-black tracking-tight text-[#26A17B]">
            USDT (TRC20)
          </span>
        </div>

        {/* High-tech Bot Mascot Shape */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-400/80 bg-gradient-to-b from-stone-900 via-stone-950 to-emerald-950 px-2 py-1 shadow-[0_4px_12px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(16,185,129,0.3)]">
          <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-stone-950 shadow-md">
            <Bot className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse text-stone-950" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white" />
            </span>
          </div>
          <span className="mt-1 text-[8px] sm:text-[9px] font-black text-emerald-300 leading-none">
            {isRTL ? 'بوت آلي' : 'AUTO BOT'}
          </span>
        </div>
      </div>
    );
  }

  if (token.includes('instapay') || token.includes('انستا')) {
    return (
      <div className="flex flex-col items-center justify-center">
        <svg viewBox="0 0 140 60" className="h-8 w-24 sm:h-9 sm:w-28" fill="none">
          <path d="M15 12h10v36H15z" fill="#582C83" />
          <path d="M38 12l16 18-16 18h12l16-18-16-18H38z" fill="#EE3124" />
          <path d="M56 12l16 18-16 18h12l16-18-16-18H56z" fill="#582C83" />
          <path d="M88 12h18c7.7 0 14 6.3 14 14s-6.3 14-14 14h-8v8H88V12zm10 20h8c3.3 0 6-2.7 6-6s-2.7-6-6-6h-8v12z" fill="#582C83" />
        </svg>
        <span className="mt-0.5 font-black tracking-wider text-[#582C83] text-[11px] sm:text-xs">
          INSTAPAY
        </span>
      </div>
    );
  }

  if (token.includes('binance') || token.includes('بينانس')) {
    return (
      <div className="flex flex-col items-center justify-center">
        <svg viewBox="0 0 120 120" className="h-8 w-8 sm:h-10 sm:w-10" fill="none">
          <path d="M60 18l14 14-30 30-14-14 30-30zM76 34l14 14-14 14-14-14 14-14zM28 50l14 14-14 14-14-14 14-14zM60 52l14 14-14 14-14-14 14-14zM44 68l14 14-30 30-14-14 30-30zM92 68l14 14-30 30-14-14 30-30zM76 84l14 14-14 14-14-14 14-14z" fill="#F3BA2F" />
        </svg>
        <span className="mt-1 font-['Arial',sans-serif] text-xs font-black tracking-widest text-[#F3BA2F] sm:text-sm">
          BINANCE
        </span>
      </div>
    );
  }

  if (token.includes('cih') || token.includes('المغرب')) {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <svg viewBox="0 0 80 80" className="h-8 w-8 sm:h-9 sm:w-9" fill="none">
          <path d="M22 18l20 22-20 22h16l20-22-20-22H22z" fill="#0066B3" />
          <path d="M42 18l20 22-20 22h16l20-22-20-22H42z" fill="#F39200" />
        </svg>
        <div className="text-start">
          <span className="block font-black text-slate-900 text-xs sm:text-sm tracking-tight leading-none">
            CIH
          </span>
          <span className="block font-black text-[#F39200] text-[10px] sm:text-xs tracking-tight leading-none mt-0.5">
            BANK
          </span>
        </div>
      </div>
    );
  }

  if (token.includes('baridi') || token.includes('بريدي') || token.includes('الجزائر')) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center gap-1">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border-2 border-[#005BAC] bg-amber-50">
            <span className="text-xs font-black text-[#005BAC]">✉️</span>
          </div>
          <span className="text-xs sm:text-sm font-black text-[#005BAC]">بريدي موب</span>
        </div>
        <span className="text-[9px] font-bold text-amber-600">BARIDIMOB</span>
      </div>
    );
  }

  if (token.includes('sham') || token.includes('شام') || token.includes('سوريا')) {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <div className="grid grid-cols-2 gap-0.5 rotate-45 h-6 w-6">
          <div className="bg-emerald-500 rounded-sm" />
          <div className="bg-teal-500 rounded-sm" />
          <div className="bg-cyan-500 rounded-sm" />
          <div className="bg-emerald-600 rounded-sm" />
        </div>
        <div className="text-start">
          <span className="block font-black text-emerald-700 text-xs sm:text-sm leading-tight">شام</span>
          <span className="block font-black text-teal-600 text-xs sm:text-sm leading-tight">كاش</span>
        </div>
      </div>
    );
  }

  if (token.includes('orange') || token.includes('اورانج') || token.includes('أورانج')) {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md bg-[#FF7900] flex items-center justify-center text-white font-black text-xs shadow-sm">
          O
        </div>
        <span className="font-black text-xs sm:text-sm text-[#FF7900] tracking-wide">
          orange
        </span>
      </div>
    );
  }

  if (token.includes('etisalat') || token.includes('اتصالات')) {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-[#719E19] flex items-center justify-center text-white font-black text-xs shadow-sm">
          e&
        </div>
        <span className="font-black text-xs sm:text-sm text-[#719E19] tracking-tight">
          etisalat
        </span>
      </div>
    );
  }

  // Generic Bank or Wallet
  if (token.includes('bank') || token.includes('بنك')) {
    return (
      <div className="flex flex-col items-center justify-center">
        <span className="text-2xl sm:text-3xl">🏦</span>
        <span className="font-black text-xs text-amber-900 mt-1">BANK TRANSFER</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <span className="text-2xl sm:text-3xl">💳</span>
      <span className="font-black text-[11px] text-amber-900 mt-1">PAYMENT</span>
    </div>
  );
};

// 3D Golden Coins Illustration underneath the white card
const GoldCoinsCluster = () => (
  <div className="pointer-events-none absolute -bottom-3 inset-x-2 flex items-center justify-between px-1 z-10">
    <div className="flex items-center -space-x-1.5 drop-shadow-md">
      <span className="inline-block text-base sm:text-lg select-none transform -rotate-12 hover:scale-110 transition-transform">🪙</span>
      <span className="inline-block text-xs sm:text-sm select-none transform rotate-12">✨</span>
      <span className="inline-block text-sm sm:text-base select-none transform -translate-y-0.5">🪙</span>
    </div>
    <div className="flex items-center -space-x-1.5 drop-shadow-md">
      <span className="inline-block text-sm sm:text-base select-none transform translate-y-0.5">🪙</span>
      <span className="inline-block text-xs sm:text-sm select-none transform -rotate-12">✨</span>
      <span className="inline-block text-base sm:text-lg select-none transform rotate-12 hover:scale-110 transition-transform">🪙</span>
    </div>
  </div>
);

const PaymentMethodCard = ({ method, onSelect, isRTL = true }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const token = `${method?.id || ''} ${method?.name || ''} ${method?.type || ''} ${method?.groupName || ''}`.toLowerCase();
  const showImage = Boolean(method?.image) && !imageFailed;
  const noteText = getMethodNote(method, isRTL);
  const country = getMethodCountry(method);

  const isVodafone = token.includes('vodafone') || token.includes('فودافون');
  const isUsdt = token.includes('usdt') || token.includes('tether') || token.includes('يو اس دي تي') || method?.type === 'usdt' || method?.type === 'crypto';
  const isAutomated = isVodafone || isUsdt;
  const displayName = isVodafone
    ? (isRTL ? 'فودافون كاش دفع آلي' : 'Vodafone Cash Automated')
    : isUsdt
    ? (isRTL ? 'USDT دفع آلي' : 'USDT Automated')
    : (method?.name || '');

  return (
    <button
      type="button"
      onClick={() => onSelect({ ...method, name: displayName })}
      className="group relative flex w-full flex-col overflow-hidden rounded-[1.6rem] sm:rounded-[1.85rem] border-2 border-amber-400/90 bg-[radial-gradient(ellipse_at_top,#f59e0b_0%,#b45309_45%,#78350f_80%,#451a03_100%)] p-2.5 sm:p-3 text-center shadow-[0_12px_32px_-12px_rgba(217,119,6,0.65),inset_0_1px_1px_rgba(255,255,255,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-[0_20px_40px_-10px_rgba(245,158,11,0.75)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-300/80"
    >
      {/* Background Sparkles / Festive Golden Stars */}
      <span className="pointer-events-none absolute left-2 top-3 text-[10px] text-amber-200/50 select-none">✦</span>
      <span className="pointer-events-none absolute right-3 top-4 text-[8px] text-amber-300/40 select-none">★</span>
      <span className="pointer-events-none absolute left-3 bottom-10 text-[9px] text-amber-300/40 select-none">★</span>
      <span className="pointer-events-none absolute right-2 bottom-12 text-[11px] text-amber-200/50 select-none">✦</span>

      {/* TOP BANNER: اشحن رصيدك / Recharge */}
      <div className="relative mx-auto mb-2 inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-300/50 bg-gradient-to-r from-amber-800 via-amber-600 to-amber-800 px-3 py-0.5 shadow-sm">
        <span className="text-xs select-none">👛</span>
        <div className="flex flex-col items-center leading-none">
          <span className="text-[11px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:text-xs">
            {isRTL ? 'اشحن رصيدك' : 'Top up balance'}
          </span>
          <span className="text-[7px] font-extrabold uppercase tracking-wider text-amber-100/90 sm:text-[8px]">
            Recharge
          </span>
        </div>
        <span className="text-xs select-none">💳</span>
      </div>

      {/* CENTER WHITE TICKET BOX */}
      <div className="relative w-full rounded-[1.15rem] sm:rounded-[1.3rem] border border-amber-200/70 bg-gradient-to-b from-white via-white to-amber-50/50 p-2 sm:p-3 shadow-[inset_0_2px_5px_rgba(0,0,0,0.06),0_6px_16px_rgba(0,0,0,0.22)]">
        {/* Country Flag Badge (in corner) */}
        {country ? (
          <div
            className="absolute top-1.5 end-1.5 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full border border-amber-300/60 bg-white shadow-sm text-xs sm:text-sm select-none"
            title={country.label}
          >
            {country.flag}
          </div>
        ) : null}

        {/* Bot Badge for Automated Methods (Vodafone Cash & USDT) */}
        {isAutomated ? (
          <div
            className="absolute top-1.5 start-1.5 z-10 flex items-center gap-1 rounded-full border border-amber-400 bg-gradient-to-r from-stone-950 to-stone-900 px-2 py-0.5 shadow-sm text-[8px] sm:text-[9px] font-black text-amber-300 select-none"
            title={isRTL ? 'دفع آلي فوري عبر البوت' : 'Auto Bot'}
          >
            <Bot className="h-3 w-3 text-emerald-400 animate-pulse" />
            <span>{isRTL ? 'دفع آلي' : 'Auto Bot'}</span>
          </div>
        ) : null}

        {/* Logo / Image Display Area */}
        <div className="flex min-h-[58px] sm:min-h-[72px] w-full items-center justify-center px-1 py-1.5">
          {showImage ? (
            <img
              src={resolveImageUrl(method.image)}
              alt={displayName}
              className="max-h-14 sm:max-h-18 w-full object-contain"
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <BrandSvgLogo token={token} isRTL={isRTL} />
          )}
        </div>

        {/* Method Name Ribbon at Bottom of White Ticket */}
        <div className="mt-1 flex items-center justify-center">
          <span className="inline-flex max-w-[95%] items-center justify-center gap-1.5 truncate rounded-full border border-amber-300/60 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-3 py-0.5 text-center text-[10px] sm:text-xs font-black text-white shadow-[0_2px_6px_rgba(180,83,9,0.4)]">
            {isAutomated ? <Bot className="h-3.5 w-3.5 text-amber-200 shrink-0" /> : null}
            <span className="truncate">{displayName}</span>
          </span>
        </div>

        {/* 3D Gold Coins Clusters across bottom edge */}
        <GoldCoinsCluster />
      </div>

      {/* BOTTOM SECTION: ملاحظة & العملية & ختم الأمان */}
      <div className="relative mt-3.5 flex w-full flex-col items-center gap-1">
        {/* "ملاحظة" Dark Badge */}
        <span className="rounded-full border border-amber-400/50 bg-stone-950/85 px-3 py-0.5 text-[8px] sm:text-[9px] font-black text-amber-300 shadow-sm">
          {isRTL ? 'ملاحظة' : 'Note'}
        </span>

        {/* Operation Value Pill (e.g. اي مبلغ / استلام المغرب / تحويل ID) */}
        <div className="w-full px-1">
          <div className="mx-auto flex max-w-[85%] items-center justify-center rounded-full border border-amber-300 bg-white px-2.5 py-0.5 sm:py-1 shadow-[0_2px_6px_rgba(0,0,0,0.15)]">
            <span className="truncate text-[10px] sm:text-xs font-black text-stone-900">
              {noteText}
            </span>
          </div>
        </div>

        {/* 100% Security Seal Stamp / Auto Bot Stamp */}
        <div
          className={`absolute -bottom-1 end-0 flex h-8 w-8 sm:h-9 sm:w-9 flex-col items-center justify-center rounded-full border-2 border-dashed text-center shadow-md select-none ${
            isAutomated
              ? 'border-emerald-400/90 bg-gradient-to-br from-emerald-800 via-teal-950 to-stone-950'
              : 'border-amber-300/90 bg-gradient-to-br from-amber-700 via-amber-800 to-stone-950'
          }`}
          title={isAutomated ? (isRTL ? 'دفع آلي فوري 24/7' : 'Instant Auto 24/7') : (isRTL ? 'أمان 100%' : '100% Secure')}
        >
          {isAutomated ? (
            <>
              <Bot className="h-3.5 w-3.5 text-emerald-300" />
              <span className="text-[6px] sm:text-[7px] font-black leading-none text-emerald-200">
                {isRTL ? 'آلي' : 'AUTO'}
              </span>
            </>
          ) : (
            <>
              <span className="text-[5px] text-amber-300 leading-none">★★★</span>
              <span className="text-[6px] sm:text-[7px] font-black leading-tight text-amber-100">
                {isRTL ? 'أمان' : 'SAFE'}
              </span>
              <span className="text-[6px] sm:text-[7px] font-black leading-none text-amber-300">
                100%
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
};

export default PaymentMethodCard;
