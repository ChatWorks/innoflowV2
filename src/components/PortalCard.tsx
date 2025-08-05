import { useEffect, useRef, ReactNode } from 'react';
import { gsap } from 'gsap';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface PortalCardData {
  id: string;
  color: string;
  title: string;
  description: string;
  label: string;
  icon: string;
  size: 'large' | 'medium' | 'small';
  status: 'completed' | 'active' | 'pending' | 'highlight' | 'support';
  progressBar?: boolean;
  progressValue?: number;
  targetDate?: string;
  onClick?: () => void;
}

interface PortalCardProps {
  card: PortalCardData;
  index: number;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
}

const getGlowColorByStatus = (status: string) => {
  const glowColors = {
    completed: "16, 185, 129",    // Green
    active: "59, 130, 246",       // Blue  
    pending: "107, 114, 128",     // Gray
    highlight: "124, 58, 237",    // Purple
    support: "5, 150, 105"        // Contact green
  };
  return glowColors[status as keyof typeof glowColors] || "59, 130, 246";
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return '✅';
    case 'active':
      return '🔄';
    case 'pending':
      return '⏳';
    case 'highlight':
      return '⭐';
    case 'support':
      return '💬';
    default:
      return '📋';
  }
};

export function PortalCard({ 
  card, 
  index, 
  enableTilt = true, 
  enableMagnetism = true, 
  clickEffect = true 
}: PortalCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement) return;

    // Entrance animation
    gsap.fromTo(cardElement, 
      { 
        opacity: 0, 
        y: 50, 
        scale: 0.9 
      },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        duration: 0.6, 
        delay: index * 0.1,
        ease: "power2.out" 
      }
    );

    // Continuous glow animation for active cards
    if (card.status === 'active') {
      gsap.to(cardElement, {
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        boxShadow: `0 0 30px rgba(${getGlowColorByStatus(card.status)}, 0.6)`
      });
    }

    // Particle animation for active cards
    if (card.status === 'active' && particlesRef.current) {
      const particles = particlesRef.current.children;
      Array.from(particles).forEach((particle, i) => {
        gsap.to(particle, {
          duration: 3 + Math.random() * 2,
          repeat: -1,
          yoyo: true,
          y: -20 - Math.random() * 20,
          x: (-10 + Math.random() * 20),
          opacity: 0.8,
          delay: i * 0.3,
          ease: "power1.inOut"
        });
      });
    }

  }, [card.status, index]);

  const handleMouseEnter = () => {
    const cardElement = cardRef.current;
    if (!cardElement) return;

    gsap.to(cardElement, {
      duration: 0.3,
      scale: 1.05,
      y: -5,
      boxShadow: `0 10px 40px rgba(${getGlowColorByStatus(card.status)}, 0.4)`,
      ease: "power2.out"
    });
  };

  const handleMouseLeave = () => {
    const cardElement = cardRef.current;
    if (!cardElement) return;

    gsap.to(cardElement, {
      duration: 0.3,
      scale: 1,
      y: 0,
      boxShadow: `0 4px 20px rgba(${getGlowColorByStatus(card.status)}, 0.2)`,
      ease: "power2.out"
    });
  };

  const handleClick = () => {
    if (card.onClick) {
      card.onClick();
    }

    if (clickEffect) {
      const cardElement = cardRef.current;
      if (!cardElement) return;

      gsap.to(cardElement, {
        duration: 0.1,
        scale: 0.95,
        yoyo: true,
        repeat: 1,
        ease: "power2.out"
      });
    }
  };

  const baseClassName = cn(
    "portal-card group relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300",
    "backdrop-blur-sm overflow-hidden",
    `portal-card--${card.size}`,
    `portal-card--${card.status}`,
    {
      "col-span-2 row-span-2": card.size === 'large',
      "col-span-2 row-span-1": card.size === 'medium',
      "col-span-1 row-span-1": card.size === 'small',
    }
  );

  return (
    <div
      ref={cardRef}
      className={baseClassName}
      style={{
        backgroundColor: card.color,
        borderColor: `rgba(${getGlowColorByStatus(card.status)}, 0.5)`,
        boxShadow: `0 4px 20px rgba(${getGlowColorByStatus(card.status)}, 0.2)`
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Background particles for active cards */}
      {card.status === 'active' && (
        <div ref={particlesRef} className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full opacity-60"
              style={{
                backgroundColor: `rgba(${getGlowColorByStatus(card.status)}, 0.8)`,
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
            />
          ))}
        </div>
      )}

      {/* Status glow overlay */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(${getGlowColorByStatus(card.status)}, 0.3) 0%, transparent 70%)`
        }}
      />

      {/* Card content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{card.icon}</span>
            <Badge 
              variant="outline" 
              className="text-xs border-white/20 text-white/80 bg-white/10"
            >
              {getStatusIcon(card.status)} {card.label}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white mb-2 group-hover:text-white/90 transition-colors">
            {card.title}
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            {card.description}
          </p>

          {card.targetDate && (
            <p className="text-white/60 text-xs mt-2">
              Target: {card.targetDate}
            </p>
          )}
        </div>

        {/* Progress bar */}
        {card.progressBar && card.progressValue !== undefined && (
          <div className="mt-4">
            <div className="flex justify-between text-white/80 text-sm mb-2">
              <span>Progress</span>
              <span>{card.progressValue}%</span>
            </div>
            <div className="relative">
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${card.progressValue}%`,
                    background: `linear-gradient(90deg, 
                      rgba(${getGlowColorByStatus(card.status)}, 0.8) 0%, 
                      rgba(${getGlowColorByStatus(card.status)}, 1) 100%)`
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}