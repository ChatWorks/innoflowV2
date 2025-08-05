import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Calendar, CheckCircle, Edit, MoreHorizontal, Target, TrendingUp, Bell } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Goal } from '@/types/goal';
import { NotificationSettingsDialog } from '@/components/NotificationSettingsDialog';
import { cn } from '@/lib/utils';

interface GoalCardProps {
  goal: Goal;
  onUpdate: () => void;
}

const categoryIcons = {
  sales: TrendingUp,
  projects: Target,
  personal: CheckCircle,
  team: CheckCircle,
  financial: TrendingUp
};

const statusColors = {
  not_started: 'bg-gray-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  overdue: 'bg-red-500',
  paused: 'bg-yellow-500'
};

const statusLabels = {
  not_started: 'Niet Gestart',
  in_progress: 'Bezig',
  completed: 'Voltooid',
  overdue: 'Verlopen',
  paused: 'Gepauzeerd'
};

export function GoalCard({ goal, onUpdate }: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [currentValue, setCurrentValue] = useState(goal.current_value.toString());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const IconComponent = categoryIcons[goal.category];
  
  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (goal.goal_type === 'boolean') {
      return goal.is_completed ? 100 : 0;
    }
    if (goal.goal_type === 'percentage') {
      return Math.min(goal.current_value, 100);
    }
    if (goal.target_value && goal.target_value > 0) {
      return Math.min((goal.current_value / goal.target_value) * 100, 100);
    }
    return 0;
  };

  const formatValue = (value: number) => {
    if (goal.goal_type === 'percentage') {
      return `${value}%`;
    }
    if (goal.target_unit) {
      return `${value.toLocaleString()} ${goal.target_unit}`;
    }
    return value.toLocaleString();
  };

  const handleUpdateProgress = async () => {
    setIsLoading(true);
    try {
      const newValue = parseFloat(currentValue) || 0;
      const isCompleted = goal.goal_type === 'boolean' ? newValue > 0 : 
                         goal.target_value ? newValue >= goal.target_value : false;
      
      let newStatus = goal.status;
      if (isCompleted && goal.status !== 'completed') {
        newStatus = 'completed';
      } else if (!isCompleted && goal.status === 'completed') {
        newStatus = 'in_progress';
      } else if (newValue > 0 && goal.status === 'not_started') {
        newStatus = 'in_progress';
      }

      const updateData: any = {
        current_value: newValue,
        status: newStatus,
        is_completed: isCompleted
      };

      if (isCompleted && !goal.completed_at) {
        updateData.completed_at = new Date().toISOString();
      } else if (!isCompleted && goal.completed_at) {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', goal.id);

      if (error) throw error;

      toast({
        title: 'Voortgang bijgewerkt',
        description: isCompleted ? '🎉 Gefeliciteerd! Je hebt je doel behaald!' : 'Je voortgang is opgeslagen.',
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: 'Fout bij bijwerken',
        description: 'Er is een fout opgetreden bij het bijwerken van je voortgang.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('goals')
        .update({
          status: 'completed',
          is_completed: true,
          completed_at: new Date().toISOString(),
          current_value: goal.target_value || goal.current_value
        })
        .eq('id', goal.id);

      if (error) throw error;

      toast({
        title: '🎉 Doel voltooid!',
        description: 'Gefeliciteerd met het behalen van je doel!',
      });

      onUpdate();
    } catch (error) {
      console.error('Error completing goal:', error);
      toast({
        title: 'Fout bij voltooien',
        description: 'Er is een fout opgetreden bij het voltooien van je doel.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = getProgressPercentage();
  const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !goal.is_completed;

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      goal.is_completed && "bg-green-50 border-green-200",
      isOverdue && "bg-red-50 border-red-200"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${statusColors[goal.status]} text-white`}>
              <IconComponent className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base leading-tight">{goal.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {statusLabels[goal.status]}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {goal.category}
                </Badge>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Voortgang bijwerken
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowNotificationSettings(true)}>
                <Bell className="h-4 w-4 mr-2" />
                Notificatie instellingen
              </DropdownMenuItem>
              {!goal.is_completed && (
                <DropdownMenuItem onClick={handleMarkComplete}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Markeer als voltooid
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {goal.description && (
          <p className="text-sm text-muted-foreground">{goal.description}</p>
        )}

        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Voortgang</span>
            <span className="font-medium">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          
          {goal.goal_type !== 'boolean' && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatValue(goal.current_value)}</span>
              {goal.target_value && (
                <span>van {formatValue(goal.target_value)}</span>
              )}
            </div>
          )}
        </div>

        {/* Update Progress */}
        {isEditing && (
          <div className="space-y-3 p-3 bg-muted rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {goal.goal_type === 'boolean' ? 'Voltooid?' : 'Huidige waarde'}
              </label>
              {goal.goal_type === 'boolean' ? (
                <select 
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="0">Nee</option>
                  <option value="1">Ja</option>
                </select>
              ) : (
                <Input
                  type="number"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  placeholder="Voer nieuwe waarde in"
                />
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleUpdateProgress}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Opslaan...' : 'Opslaan'}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setCurrentValue(goal.current_value.toString());
                }}
                className="flex-1"
              >
                Annuleren
              </Button>
            </div>
          </div>
        )}

        {/* Deadline */}
        {goal.deadline && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Deadline: {new Date(goal.deadline).toLocaleDateString('nl-NL')}
              {isOverdue && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  Verlopen
                </Badge>
              )}
            </span>
          </div>
        )}

        {/* Quick Progress Buttons */}
        {!isEditing && !goal.is_completed && goal.goal_type !== 'boolean' && (
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((percentage) => {
              const targetValue = goal.target_value || 100;
              const quickValue = Math.round((targetValue * percentage) / 100);
              
              return (
                <Button
                  key={percentage}
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => {
                    setCurrentValue(quickValue.toString());
                    setIsEditing(true);
                  }}
                >
                  {percentage}%
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Notification Settings Dialog */}
      <NotificationSettingsDialog
        goal={goal}
        open={showNotificationSettings}
        onOpenChange={setShowNotificationSettings}
        onUpdate={onUpdate}
      />
    </Card>
  );
}