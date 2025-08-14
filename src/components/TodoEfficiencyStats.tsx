import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckSquare, Target, TrendingUp } from 'lucide-react';
import { Task, TimeEntry } from '@/types/project';
import { formatSecondsToTime, getTaskTotalTime } from '@/utils/manualTimeUtils';

interface TodoEfficiencyStatsProps {
  tasks: Task[];
  timeEntries: TimeEntry[];
}

export default function TodoEfficiencyStats({ tasks, timeEntries }: TodoEfficiencyStatsProps) {
  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  
  const totalEstimatedTime = tasks.reduce((sum, task) => {
    return sum + ((task as any).estimated_time_seconds || 0);
  }, 0);
  
  const totalActualTime = tasks.reduce((sum, task) => {
    return sum + getTaskTotalTime(task.id, timeEntries, (task as any).manual_time_seconds || 0);
  }, 0);
  
  // Calculate efficiency percentage
  const efficiencyPercentage = totalEstimatedTime > 0 
    ? Math.round((totalActualTime / totalEstimatedTime) * 100)
    : 0;
  
  // Determine efficiency color
  const getEfficiencyColor = (percentage: number) => {
    if (percentage === 0) return 'text-muted-foreground';
    if (percentage <= 100) return 'text-emerald-600';
    if (percentage <= 120) return 'text-amber-600';
    return 'text-red-600';
  };
  
  const getEfficiencyVariant = (percentage: number) => {
    if (percentage === 0) return 'secondary';
    if (percentage <= 100) return 'default';
    if (percentage <= 120) return 'secondary';
    return 'destructive';
  };

  if (totalTasks === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total Tasks */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <div className="text-sm text-muted-foreground">Taken</div>
            <div className="text-xs text-muted-foreground">
              {completedTasks} voltooid
            </div>
          </div>

          {/* Estimated Time */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {formatSecondsToTime(totalEstimatedTime)}
            </div>
            <div className="text-sm text-muted-foreground">Geschat</div>
          </div>

          {/* Actual Time */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {formatSecondsToTime(totalActualTime)}
            </div>
            <div className="text-sm text-muted-foreground">Werkelijk</div>
          </div>

          {/* Efficiency */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className={`text-2xl font-bold ${getEfficiencyColor(efficiencyPercentage)}`}>
              {totalEstimatedTime > 0 ? `${efficiencyPercentage}%` : 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">Efficiëntie</div>
            {totalEstimatedTime > 0 && (
              <Badge 
                variant={getEfficiencyVariant(efficiencyPercentage)}
                className="text-xs mt-1"
              >
                {efficiencyPercentage <= 100 ? 'Binnen tijd' : 
                 efficiencyPercentage <= 120 ? 'Licht over' : 'Veel over'}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}