import React from 'react';
import { cn } from '../ui/Button';
import brandIconImage from '../../assets/logo.webp';

const stylesBySize = {
  xs: {
    wrapper: 'gap-2.5',
    iconShell: 'h-12 w-12 rounded-[9px]',
    title: 'text-[0.88rem]',
    caption: 'text-[0.54rem] tracking-[0.26em]',
  },
  sm: {
    wrapper: 'gap-3',
    iconShell: 'h-14 w-14 rounded-[10px]',
    title: 'text-[0.96rem]',
    caption: 'text-[0.58rem] tracking-[0.32em]',
  },
  md: {
    wrapper: 'gap-3.5',
    iconShell: 'h-16 w-16 rounded-[12px]',
    title: 'text-[1.05rem]',
    caption: 'text-[0.62rem] tracking-[0.34em]',
  },
  lg: {
    wrapper: 'gap-4',
    iconShell: 'h-20 w-20 rounded-[14px]',
    title: 'text-[1.16rem]',
    caption: 'text-[0.66rem] tracking-[0.38em]',
  },
};

const BrandMark = ({
  className,
  compact = false,
  iconPosition = 'start',
  showCaption = true,
  size = 'md',
  titleClassName,
  captionClassName,
}) => {
  const styles = stylesBySize[size] || stylesBySize.md;
  const isIconEnd = iconPosition === 'end';

  return (
    <div className={cn('flex items-center', isIconEnd && 'flex-row-reverse', styles.wrapper, className)}>
      <div className={cn('relative overflow-hidden', styles.iconShell)}>
        <img
          src={brandIconImage}
          alt="KANZ COINS"
          loading="eager"
          decoding="async"
          className="relative h-full w-full object-contain"
        />
      </div>

      {!compact && (
        <div className="min-w-0">
          <p
            className={cn(
              'kanz-brand-title whitespace-nowrap font-extrabold uppercase',
              styles.title,
              titleClassName
            )}
          >
            <span className="text-transparent bg-clip-text bg-[linear-gradient(120deg,#fffbeb_0%,#fef08a_28%,#f59e0b_52%,#d97706_76%,#b45309_100%)] animate-shimmer-slow">
              KANZ
            </span>
            <span className="mx-1.5 text-[color:rgb(var(--color-text-secondary)/0.64)]">/</span>
            <span className="text-[color:rgb(var(--color-text-secondary)/0.64)]">COINS</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default BrandMark;
