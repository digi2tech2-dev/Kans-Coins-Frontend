import React from 'react';
import BrandMark from './BrandMark';
import { cn } from '../ui/Button';

const HeaderBrand = ({ className, iconClassName, textClassName }) => (
  <span dir="ltr" className={cn('inline-flex items-center gap-1 rounded-[14px] sm:gap-1.5', className)}>
    <BrandMark
      size="xs"
      compact
      showCaption={false}
      className={cn('-mx-1.5 scale-[0.72] min-[380px]:scale-[0.78] sm:scale-[0.84]', iconClassName)}
    />
    <span className={cn('min-w-0 text-center leading-none', textClassName)}>
      <span className="kanz-brand-title block font-['Orbitron'] text-[0.98rem] font-black leading-none tracking-[0.12em] text-transparent bg-clip-text bg-[linear-gradient(120deg,#fffbeb_0%,#fef08a_28%,#f59e0b_52%,#d97706_76%,#b45309_100%)] animate-shimmer-slow min-[380px]:text-[1.1rem] sm:text-[1.5rem]">
        KANZ
      </span>
      <span className="mt-0.5 block font-['Orbitron'] text-[0.38rem] font-bold uppercase tracking-[0.5em] text-[#f59e0b] sm:text-[0.5rem]">
        COINS
      </span>
    </span>
  </span>
);

export default HeaderBrand;
