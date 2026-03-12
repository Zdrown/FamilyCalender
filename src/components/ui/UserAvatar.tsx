'use client';

import { motion } from 'framer-motion';

interface UserAvatarProps {
  name: string;
  color: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  selected?: boolean;
  onClick?: () => void;
}

const sizeMap = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

export function UserAvatar({ name, color, size = 'md', selected, onClick }: UserAvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const className = `
    ${sizeMap[size]}
    rounded-full flex items-center justify-center font-display font-semibold
    text-white shadow-sm transition-all duration-200 shrink-0 aspect-square
    ${selected ? 'ring-3 ring-offset-2 ring-offset-bg-primary' : ''}
    ${onClick ? 'cursor-pointer' : ''}
  `;
  const style = {
    backgroundColor: color,
    ...(selected ? { '--tw-ring-color': color } as React.CSSProperties : {}),
  };

  if (onClick) {
    return (
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onClick}
        className={className}
        style={style}
        aria-label={name}
      >
        {initial}
      </motion.button>
    );
  }

  return (
    <div className={className} style={style} aria-label={name}>
      {initial}
    </div>
  );
}
