import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EfficiencyIndicatorProps {
  value: number; // Efficiency percentage
  variant: "full" | "bar" | "dots" | "ring" | "accent";
  className?: string;
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode; // Only for accent variant
}

// Utility functions
const getZoneColor = (val: number) => {
  if (val <= 80) return "green";
  if (val <= 100) return "blue"; 
  if (val <= 120) return "orange";
  return "red";
};

const getZoneLabel = (val: number) => {
  if (val === 0) return "Niet Gestart";
  if (val <= 80) return "Zeer Efficiënt";
  if (val <= 100) return "Op Budget";
  if (val <= 120) return "Licht Over Budget"; 
  return "Over Budget";
};

const formatEfficiency = (efficiency: number): string => {
  if (efficiency === 0) return "0%";
  if (efficiency < 0.01) return "<0.01%";
  if (efficiency < 1) return efficiency.toFixed(2) + "%";
  return Math.round(efficiency) + "%";
};

// Full Efficiency Bar (Project Level)
const FullEfficiencyBar = ({ value, className }: { value: number, className?: string }) => {
  const normalizedValue = Math.min(value, 150);
  const position = (normalizedValue / 150) * 100;
  const zone = getZoneColor(value);
  
  return (
    <div className={cn("w-full", className)}>
      <div className="relative w-full h-4 rounded-full overflow-hidden bg-gray-200">
        {/* Zone Background Colors */}
        <div className="absolute inset-0 flex">
          <div className="bg-green-100 flex-1" style={{ flexBasis: "53.3%" }} />
          <div className="bg-blue-100 flex-1" style={{ flexBasis: "13.3%" }} />
          <div className="bg-orange-100 flex-1" style={{ flexBasis: "13.3%" }} />
          <div className="bg-red-100 flex-1" style={{ flexBasis: "20%" }} />
        </div>
        
        {/* Current Position Indicator */}
        {value > 0 && (
          <div 
            className={cn(
              "absolute top-0 h-full w-1 transition-all duration-300 rounded-full",
              zone === "green" ? "bg-green-600" :
              zone === "blue" ? "bg-blue-600" :
              zone === "orange" ? "bg-orange-600" : "bg-red-600"
            )}
            style={{ left: `${Math.max(0, Math.min(100, position))}%` }}
          />
        )}
      </div>
      
      {/* Labels */}
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span className="text-green-600">Efficiënt</span>
        <span className="text-blue-600">Budget</span>
        <span className="text-orange-600">Over</span>
        <span className="text-red-600">Veel Over</span>
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <span className={cn(
          "text-sm font-medium",
          zone === "green" ? "text-green-600" :
          zone === "blue" ? "text-blue-600" :
          zone === "orange" ? "text-orange-600" : "text-red-600"
        )}>
          {getZoneLabel(value)}
        </span>
        <span className="text-sm font-mono">
          {formatEfficiency(value)}
        </span>
      </div>
    </div>
  );
};

// Medium Bar (Fase Level)
const MediumEfficiencyBar = ({ value, className }: { value: number, className?: string }) => {
  const normalizedValue = Math.min(value, 150);
  const position = (normalizedValue / 150) * 100;
  const zone = getZoneColor(value);
  
  return (
    <div className={cn("w-16", className)}>
      <div className="relative w-full h-2 rounded-full overflow-hidden bg-gray-200">
        <div className="absolute inset-0 flex">
          <div className="bg-green-100 flex-1" style={{ flexBasis: "53.3%" }} />
          <div className="bg-blue-100 flex-1" style={{ flexBasis: "13.3%" }} />
          <div className="bg-orange-100 flex-1" style={{ flexBasis: "13.3%" }} />
          <div className="bg-red-100 flex-1" style={{ flexBasis: "20%" }} />
        </div>
        
        {value > 0 && (
          <div 
            className={cn(
              "absolute top-0 h-full w-0.5 transition-all duration-300 rounded-full",
              zone === "green" ? "bg-green-600" :
              zone === "blue" ? "bg-blue-600" :
              zone === "orange" ? "bg-orange-600" : "bg-red-600"
            )}
            style={{ left: `${Math.max(0, Math.min(100, position))}%` }}
          />
        )}
      </div>
    </div>
  );
};

// Dots Indicator (Deliverable Level)
const DotsIndicator = ({ value, className }: { value: number, className?: string }) => {
  const zone = getZoneColor(value);
  
  // Bereken hoeveel dots gevuld moeten worden (max 4 dots)
  const filledDots = Math.min(4, Math.ceil((value / 150) * 4));
  
  return (
    <div className={cn("flex gap-1", className)}>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full transition-all duration-300",
            i < filledDots ? (
              zone === "green" ? "bg-green-500" :
              zone === "blue" ? "bg-blue-500" :
              zone === "orange" ? "bg-orange-500" : "bg-red-500"
            ) : "bg-gray-200"
          )}
        />
      ))}
    </div>
  );
};

// Ring Indicator (Alternative voor Deliverable)
const RingIndicator = ({ value, className }: { value: number, className?: string }) => {
  const zone = getZoneColor(value);
  const normalizedValue = Math.min(value, 150);
  const circumference = 2 * Math.PI * 8; // radius = 8
  const strokeDasharray = `${(normalizedValue / 150) * circumference} ${circumference}`;
  
  return (
    <div className={cn("relative w-6 h-6", className)}>
      <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 20 20">
        {/* Background circle */}
        <circle
          cx="10"
          cy="10"
          r="8"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle */}
        {value > 0 && (
          <circle
            cx="10"
            cy="10"
            r="8"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-300",
              zone === "green" ? "text-green-500" :
              zone === "blue" ? "text-blue-500" :
              zone === "orange" ? "text-orange-500" : "text-red-500"
            )}
          />
        )}
      </svg>
    </div>
  );
};

// Accent Border (Taak Level) - HOC component
const AccentBorder = ({ value, children, className }: { value: number, children: React.ReactNode, className?: string }) => {
  const zone = getZoneColor(value);
  
  return (
    <div className={cn(
      "border-l-4 transition-all duration-300",
      zone === "green" ? "border-l-green-500" :
      zone === "blue" ? "border-l-blue-500" :
      zone === "orange" ? "border-l-orange-500" : 
      zone === "red" ? "border-l-red-500" : "border-l-gray-300",
      className
    )}>
      {children}
    </div>
  );
};

// Main Component
export function EfficiencyIndicator({ 
  value, 
  variant, 
  className, 
  showTooltip = true,
  size = "md",
  children
}: EfficiencyIndicatorProps) {
  const renderIndicator = () => {
    switch (variant) {
      case "full":
        return <FullEfficiencyBar value={value} className={className} />;
      case "bar":
        return <MediumEfficiencyBar value={value} className={className} />;
      case "dots":
        return <DotsIndicator value={value} className={className} />;
      case "ring":
        return <RingIndicator value={value} className={className} />;
      case "accent":
        return null; // This is handled differently
      default:
        return <DotsIndicator value={value} className={className} />;
    }
  };

  const tooltipContent = (
    <div className="space-y-1">
      <p className="font-medium">{getZoneLabel(value)}</p>
      <p className="text-xs">{formatEfficiency(value)} efficiency</p>
      <div className="text-xs text-muted-foreground">
        <p>🟢 0-80%: Zeer Efficiënt</p>
        <p>🔵 80-100%: Op Budget</p>
        <p>🟠 100-120%: Licht Over</p>
        <p>🔴 120%+: Over Budget</p>
      </div>
    </div>
  );

  if (variant === "accent") {
    return <AccentBorder value={value} className={className}>{children}</AccentBorder>;
  }

  if (!showTooltip) {
    return renderIndicator();
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">
            {renderIndicator()}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default EfficiencyIndicator;