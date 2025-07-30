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
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} bg-black rounded-lg flex items-center justify-center`}>
        <span className="text-white font-bold">I</span>
      </div>
      {showText && (
        <span className={`${textSizeClasses[size]} font-semibold text-foreground`}>
          Innoflow
        </span>
      )}
    </div>
  );
};