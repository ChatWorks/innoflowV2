import { useEffect, useRef, ReactNode } from 'react';
import { gsap } from 'gsap';
import { cn } from '@/lib/utils';

interface MagicBentoProps {
  children: ReactNode;
  className?: string;
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  glowColor?: string;
}

export function MagicBento({
  children,
  className,
  textAutoHide = false,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  enableTilt = true,
  enableMagnetism = true,
  clickEffect = true,
  spotlightRadius = 400,
  particleCount = 8,
  glowColor = "59, 130, 246"
}: MagicBentoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let tiltAnimation: gsap.core.Tween | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Tilt effect
      if (enableTilt) {
        const tiltX = (y - centerY) / centerY;
        const tiltY = (centerX - x) / centerX;
        
        tiltAnimation?.kill();
        tiltAnimation = gsap.to(container, {
          duration: 0.3,
          rotationX: tiltX * 5,
          rotationY: tiltY * 5,
          transformPerspective: 1000,
          ease: "power2.out"
        });
      }

      // Spotlight effect
      if (enableSpotlight && spotlightRef.current) {
        gsap.set(spotlightRef.current, {
          x: x - spotlightRadius / 2,
          y: y - spotlightRadius / 2,
          opacity: 1
        });
      }

      // Magnetism effect
      if (enableMagnetism) {
        const cards = container.querySelectorAll('.portal-card');
        cards.forEach((card) => {
          const cardRect = card.getBoundingClientRect();
          const cardCenterX = cardRect.left + cardRect.width / 2 - rect.left;
          const cardCenterY = cardRect.top + cardRect.height / 2 - rect.top;
          const distance = Math.sqrt(Math.pow(x - cardCenterX, 2) + Math.pow(y - cardCenterY, 2));
          
          if (distance < 100) {
            const force = (100 - distance) / 100;
            const deltaX = (x - cardCenterX) * force * 0.1;
            const deltaY = (y - cardCenterY) * force * 0.1;
            
            gsap.to(card, {
              duration: 0.3,
              x: deltaX,
              y: deltaY,
              ease: "power2.out"
            });
          }
        });
      }
    };

    const handleMouseLeave = () => {
      // Reset tilt
      if (enableTilt) {
        tiltAnimation?.kill();
        tiltAnimation = gsap.to(container, {
          duration: 0.5,
          rotationX: 0,
          rotationY: 0,
          ease: "power2.out"
        });
      }

      // Hide spotlight
      if (enableSpotlight && spotlightRef.current) {
        gsap.to(spotlightRef.current, {
          duration: 0.3,
          opacity: 0
        });
      }

      // Reset magnetism
      if (enableMagnetism) {
        const cards = container.querySelectorAll('.portal-card');
        cards.forEach((card) => {
          gsap.to(card, {
            duration: 0.5,
            x: 0,
            y: 0,
            ease: "power2.out"
          });
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!clickEffect) return;
      
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Create ripple effect
      const ripple = document.createElement('div');
      ripple.className = 'click-ripple';
      ripple.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.6) 0%, rgba(${glowColor}, 0) 70%);
        pointer-events: none;
        z-index: 1000;
        transform: translate(-50%, -50%);
      `;
      
      container.appendChild(ripple);

      gsap.to(ripple, {
        duration: 0.6,
        width: 200,
        height: 200,
        opacity: 0,
        ease: "power2.out",
        onComplete: () => {
          ripple.remove();
        }
      });
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('click', handleClick);
      tiltAnimation?.kill();
    };
  }, [enableTilt, enableSpotlight, enableMagnetism, clickEffect, spotlightRadius, glowColor]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      style={{
        transformStyle: 'preserve-3d'
      }}
    >
      {enableSpotlight && (
        <div
          ref={spotlightRef}
          className="absolute pointer-events-none opacity-0 z-10"
          style={{
            width: spotlightRadius,
            height: spotlightRadius,
            background: `radial-gradient(circle, rgba(${glowColor}, 0.15) 0%, transparent 70%)`,
            borderRadius: '50%'
          }}
        />
      )}
      
      {enableStars && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: particleCount }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}
      
      {children}
    </div>
  );
}