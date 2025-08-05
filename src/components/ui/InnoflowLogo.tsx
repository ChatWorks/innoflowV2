import React from 'react';

interface InnoflowLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const InnoflowLogo: React.FC<InnoflowLogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs min-w-[24px] min-h-[24px]',
    md: 'w-8 h-8 text-sm min-w-[32px] min-h-[32px]',
    lg: 'w-12 h-12 text-lg min-w-[48px] min-h-[48px]'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0 aspect-square`}>
        <div className="w-1/2 h-1/2 bg-white rounded-lg"></div>
      </div>
      {showText && (
        <span className={`${textSizeClasses[size]} font-semibold text-foreground`}>
          Innoflow
        </span>
      )}
    </div>
  );
};