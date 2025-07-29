import * as React from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Target, TrendingUp, Calendar, BarChart3 } from 'lucide-react';

interface EfficiencyDotsProps {
  value: number; // Efficiency percentage
  showLabel?: boolean;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  compact?: boolean; // Voor zeer beperkte ruimte
  // Stats data voor lamp popup
  statsData?: {
    budgetHours?: number;
    actualHours?: number;
    timeRemaining?: number;
    progressPercentage?: number;
    estimatedCompletion?: string;
    trend?: 'improving' | 'declining' | 'stable';
  };
  entityName?: string; // Voor popup title (project naam, fase naam, etc.)
}

// Utility functions
const getEfficiencyZone = (value: number) => {
  if (value === 0) return { dots: 0, color: "gray", label: "Niet Gestart" };
  if (value <= 60) return { dots: 1, color: "green", label: "Zeer Efficiënt" };
  if (value <= 80) return { dots: 2, color: "green", label: "Zeer Efficiënt" };
  if (value <= 100) return { dots: 3, color: "blue", label: "Op Budget" };
  if (value <= 120) return { dots: 4, color: "orange", label: "Licht Over Budget" };
  return { dots: 4, color: "red", label: "Over Budget" };
};

const formatEfficiency = (efficiency: number): string => {
  if (efficiency === 0) return "0%";
  if (efficiency < 0.01) return "<0.01%";
  if (efficiency < 1) return efficiency.toFixed(2) + "%";
  return Math.round(efficiency) + "%";
};

const getColorClasses = (color: string, filled: boolean) => {
  if (!filled) return "bg-gray-200 border-gray-300";
  
  switch (color) {
    case "green":
      return "bg-green-500 border-green-600 shadow-green-200";
    case "blue":
      return "bg-blue-500 border-blue-600 shadow-blue-200";
    case "orange":
      return "bg-orange-500 border-orange-600 shadow-orange-200";
    case "red":
      return "bg-red-500 border-red-600 shadow-red-200";
    default:
      return "bg-gray-300 border-gray-400";
  }
};

const getTextColor = (color: string) => {
  switch (color) {
    case "green": return "text-green-700";
    case "blue": return "text-blue-700";
    case "orange": return "text-orange-700";
    case "red": return "text-red-700";
    default: return "text-gray-500";
  }
};

// Clean dashboard analytics icon
const AnalyticsIcon = ({ className }: { className?: string }) => (
  <BarChart3 
    className={cn("transition-all duration-200 hover:scale-110 text-blue-600", className)}
  />
);

export function EfficiencyDots({ 
  value, 
  showLabel = true, 
  showPercentage = true,
  size = "md",
  className,
  compact = false,
  statsData,
  entityName = "Item"
}: EfficiencyDotsProps) {
  const zone = getEfficiencyZone(value);
  
  const sizeClasses = {
    sm: compact ? "w-2 h-2" : "w-3 h-3",
    md: compact ? "w-2.5 h-2.5" : "w-4 h-4", 
    lg: compact ? "w-3 h-3" : "w-5 h-5"
  };
  
  const gapClasses = {
    sm: "gap-1",
    md: "gap-1.5",
    lg: "gap-2"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  const lampSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  const dots = (
    <div className={cn("flex items-center", gapClasses[size])}>
      {[...Array(4)].map((_, i) => {
        const filled = i < zone.dots;
        return (
          <div
            key={i}
            className={cn(
              "rounded-full border transition-all duration-300",
              sizeClasses[size],
              getColorClasses(zone.color, filled),
              filled && "shadow-sm"
            )}
          />
        );
      })}
    </div>
  );

  const content = (
    <div className={cn(
      "flex items-center gap-2",
      compact && "gap-1",
      className
    )}>
      {dots}
      
      {(showLabel || showPercentage) && (
        <div className={cn(
          "flex items-center gap-2",
          compact ? "gap-1" : "gap-2"
        )}>
          {showLabel && (
            <span className={cn(
              "font-medium",
              getTextColor(zone.color),
              textSizeClasses[size],
              compact && "text-xs"
            )}>
              {zone.label}
            </span>
          )}
          
          {showPercentage && (
            <span className={cn(
              "font-mono font-medium text-muted-foreground",
              compact ? "text-xs" : textSizeClasses[size]
            )}>
              ({formatEfficiency(value)})
            </span>
          )}
        </div>
      )}

      {/* Analytics icon for stats popup */}
      <Dialog>
        <DialogTrigger asChild>
          <button className={cn(
            "hover:bg-blue-50 rounded-full p-1 -m-1 transition-colors duration-200 ml-1"
          )}>
            <AnalyticsIcon className={lampSizeClasses[size]} />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AnalyticsIcon className="w-5 h-5" />
              {entityName} Stats
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Main Efficiency Display */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Efficiency Status</span>
                  <Badge variant={zone.color === 'green' ? 'default' : zone.color === 'blue' ? 'secondary' : 'destructive'}>
                    {zone.label}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3">
                  {dots}
                  <div className="text-2xl font-bold" style={{color: `rgb(${zone.color === 'green' ? '34 197 94' : zone.color === 'blue' ? '59 130 246' : zone.color === 'orange' ? '249 115 22' : '239 68 68'})`}}>
                    {formatEfficiency(value)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Stats */}
            {statsData && (
              <div className="grid grid-cols-2 gap-3">
                {statsData.budgetHours && (
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-muted-foreground">Budget</span>
                      </div>
                      <div className="text-lg font-semibold">{statsData.budgetHours}h</div>
                    </CardContent>
                  </Card>
                )}

                {statsData.actualHours && (
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-medium text-muted-foreground">Besteed</span>
                      </div>
                      <div className="text-lg font-semibold">{statsData.actualHours}h</div>
                    </CardContent>
                  </Card>
                )}

                {statsData.progressPercentage !== undefined && (
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-muted-foreground">Voortgang</span>
                      </div>
                      <div className="text-lg font-semibold">{Math.round(statsData.progressPercentage)}%</div>
                    </CardContent>
                  </Card>
                )}

                {statsData.timeRemaining && (
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 w-4 text-purple-600" />
                        <span className="text-xs font-medium text-muted-foreground">Resterend</span>
                      </div>
                      <div className="text-lg font-semibold">{statsData.timeRemaining}h</div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Efficiency Guide */}
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <div className="text-xs font-medium mb-2">Efficiency Guide</div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                    </div>
                    <span>Niet Gestart (0%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                    </div>
                    <span>Zeer Efficiënt (60-80%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                    </div>
                    <span>Op Budget (80-100%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    </div>
                    <span>Over Budget (100%+)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {statsData?.estimatedCompletion && (
              <div className="text-center text-sm text-muted-foreground">
                Verwachte voltooiing: {statsData.estimatedCompletion}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return content;
}

export default EfficiencyDots;