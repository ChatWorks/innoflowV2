import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Calendar, CheckCircle, Edit, MoreHorizontal, Target, TrendingUp, Bell, Trash2, Plus, Euro } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Goal } from '@/types/goal';
import { NotificationSettingsDialog } from '@/components/NotificationSettingsDialog';
import { GoalCreationDialog } from '@/components/GoalCreationDialog';
import { cn } from '@/lib/utils';

interface GoalCardProps {
  goal: Goal;
  onUpdate: () => void;
  onDelete?: () => void;
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

export function GoalCard({ goal, onUpdate, onDelete }: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentValue, setCurrentValue] = useState(goal.current_value.toString());
  const [quickAddValue, setQuickAddValue] = useState('');
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

  const handleQuickAdd = async () => {
    setIsLoading(true);
    try {
      const addValue = parseFloat(quickAddValue) || 0;
      const newValue = goal.current_value + addValue;
      const isCompleted = goal.target_value ? newValue >= goal.target_value : false;
      
      let newStatus = goal.status;
      if (isCompleted && goal.status !== 'completed') {
        newStatus = 'completed';
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
      }

      const { error } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', goal.id);

      if (error) throw error;

      toast({
        title: 'Bedrag toegevoegd',
        description: isCompleted ? '🎉 Gefeliciteerd! Je hebt je doel behaald!' : `€${addValue.toLocaleString()} toegevoegd aan je doel.`,
      });

      setIsQuickAdding(false);
      setQuickAddValue('');
      onUpdate();
    } catch (error) {
      console.error('Error adding to goal:', error);
      toast({
        title: 'Fout bij toevoegen',
        description: 'Er is een fout opgetreden bij het toevoegen van het bedrag.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goal.id);

      if (error) throw error;

      toast({
        title: 'Doel verwijderd',
        description: 'Het doel is succesvol verwijderd.',
      });

      onDelete?.();
      onUpdate();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: 'Fout bij verwijderen',
        description: 'Er is een fout opgetreden bij het verwijderen van het doel.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = getProgressPercentage();
  const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !goal.is_completed;
  const isMonetaryGoal = goal.target_unit === '€' || goal.target_unit === 'euro' || goal.target_unit === 'euros' || goal.category === 'financial';

  // Get motivational colors based on progress
  const getProgressColor = () => {
    if (goal.is_completed) return 'from-green-500 to-emerald-600';
    if (progressPercentage >= 75) return 'from-green-400 to-green-500';
    if (progressPercentage >= 50) return 'from-yellow-400 to-orange-500';
    if (progressPercentage >= 25) return 'from-orange-400 to-red-500';
    return 'from-gray-400 to-gray-500';
  };

  const getCategoryStyle = () => {
    const styles = {
      sales: { 
        gradient: 'from-green-500 to-emerald-600', 
        icon: TrendingUp,
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      financial: { 
        gradient: 'from-emerald-500 to-teal-600', 
        icon: Euro,
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200'
      },
      projects: { 
        gradient: 'from-blue-500 to-indigo-600', 
        icon: Target,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      team: { 
        gradient: 'from-purple-500 to-violet-600', 
        icon: CheckCircle,
        color: 'text-purple-700',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      },
      personal: { 
        gradient: 'from-indigo-500 to-purple-600', 
        icon: CheckCircle,
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200'
      }
    };
    return styles[goal.category] || styles.personal;
  };

  const categoryStyle = getCategoryStyle();
  const CategoryIcon = categoryStyle.icon;

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-xl hover:scale-[1.02] min-h-[300px]",
      goal.is_completed && "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-green-100",
      isOverdue && "bg-gradient-to-br from-red-50 to-pink-50 border-red-300 shadow-red-100",
      !goal.is_completed && !isOverdue && `${categoryStyle.bgColor} ${categoryStyle.borderColor}`
    )}>
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${categoryStyle.gradient} text-white shadow-lg`}>
              <CategoryIcon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold leading-tight mb-1">{goal.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={goal.is_completed ? "default" : "secondary"} 
                  className={cn(
                    "text-xs font-medium",
                    goal.is_completed && "bg-green-100 text-green-800 border-green-300"
                  )}
                >
                  {statusLabels[goal.status]}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize font-medium">
                  {goal.category}
                </Badge>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/70">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Voortgang bijwerken
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Doel bewerken
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
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Doel verwijderen
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Doel verwijderen</AlertDialogTitle>
                    <AlertDialogDescription>
                      Weet je zeker dat je dit doel wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuleren</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Verwijderen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {goal.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{goal.description}</p>
        )}

        {/* Large Metric Display */}
        <div className={cn(
          "relative overflow-hidden rounded-2xl p-6 text-center",
          `bg-gradient-to-br ${categoryStyle.gradient}`,
          "text-white shadow-xl"
        )}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white rounded-full"></div>
          </div>
          
          <div className="relative z-10 space-y-4">
            {/* Metric Icon */}
            <div className="flex justify-center">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CategoryIcon className="h-8 w-8" />
              </div>
            </div>

            {/* Main Value Display */}
            <div className="space-y-2">
              {isMonetaryGoal ? (
                <>
                  <div className="text-4xl font-black tracking-tight">
                    €{Math.round(goal.current_value).toLocaleString()}
                  </div>
                  {goal.target_value && (
                    <div className="text-lg font-medium opacity-90">
                      van €{Math.round(goal.target_value).toLocaleString()}
                    </div>
                  )}
                </>
              ) : goal.goal_type === 'percentage' ? (
                <>
                  <div className="text-4xl font-black tracking-tight">
                    {Math.round(goal.current_value)}%
                  </div>
                  <div className="text-lg font-medium opacity-90">
                    Voltooid
                  </div>
                </>
              ) : goal.goal_type === 'boolean' ? (
                <>
                  <div className="text-4xl font-black tracking-tight">
                    {goal.is_completed ? '✓' : '○'}
                  </div>
                  <div className="text-lg font-medium opacity-90">
                    {goal.is_completed ? 'Voltooid!' : 'Te doen'}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl font-black tracking-tight">
                    {Math.round(goal.current_value).toLocaleString()}
                    {goal.target_unit && <span className="text-2xl ml-1">{goal.target_unit}</span>}
                  </div>
                  {goal.target_value && (
                    <div className="text-lg font-medium opacity-90">
                      van {Math.round(goal.target_value).toLocaleString()} {goal.target_unit}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Progress Percentage */}
            <div className="text-2xl font-bold">
              {Math.round(progressPercentage)}% voltooid
            </div>

            {/* Quick Add for Monetary Goals */}
            {isMonetaryGoal && !goal.is_completed && (
              <div className="mt-4">
                {!isQuickAdding ? (
                  <Button 
                    size="lg" 
                    onClick={() => setIsQuickAdding(true)}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm text-lg px-8 py-3"
                    variant="outline"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Bedrag Toevoegen
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      placeholder="Bedrag"
                      value={quickAddValue}
                      onChange={(e) => setQuickAddValue(e.target.value)}
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/70 backdrop-blur-sm"
                    />
                    <Button 
                      size="lg" 
                      onClick={handleQuickAdd}
                      disabled={isLoading || !quickAddValue}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm px-6"
                      variant="outline"
                    >
                      +
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => {
                        setIsQuickAdding(false);
                        setQuickAddValue('');
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm px-6"
                    >
                      ×
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-medium">
            <span className={categoryStyle.color}>Voortgang</span>
            <span className={cn("font-bold", categoryStyle.color)}>
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="relative">
            <Progress value={progressPercentage} className="h-3 bg-gray-200" />
            <div 
              className={cn(
                "absolute top-0 left-0 h-3 rounded-full transition-all duration-500",
                `bg-gradient-to-r ${getProgressColor()}`
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Update Progress */}
        {isEditing && (
          <div className="space-y-4 p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white/50">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                {goal.goal_type === 'boolean' ? 'Voltooid?' : 'Huidige waarde'}
              </label>
              {goal.goal_type === 'boolean' ? (
                <select 
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white"
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
                  className="text-lg p-3"
                />
              )}
            </div>
            <div className="flex gap-3">
              <Button 
                size="lg" 
                onClick={handleUpdateProgress}
                disabled={isLoading}
                className="flex-1 text-lg py-3"
              >
                {isLoading ? 'Opslaan...' : 'Opslaan'}
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setCurrentValue(goal.current_value.toString());
                }}
                className="flex-1 text-lg py-3"
              >
                Annuleren
              </Button>
            </div>
          </div>
        )}

        {/* Deadline */}
        {goal.deadline && (
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg",
            isOverdue 
              ? "bg-red-100 text-red-700 border border-red-200" 
              : "bg-gray-100 text-gray-700 border border-gray-200"
          )}>
            <Calendar className="h-5 w-5" />
            <span className="font-medium">
              Deadline: {new Date(goal.deadline).toLocaleDateString('nl-NL')}
              {isOverdue && (
                <Badge variant="destructive" className="ml-3">
                  Verlopen
                </Badge>
              )}
            </span>
          </div>
        )}

        {/* Quick Progress Buttons */}
        {!isEditing && !goal.is_completed && goal.goal_type !== 'boolean' && !isMonetaryGoal && (
          <div className="grid grid-cols-4 gap-2">
            {[25, 50, 75, 100].map((percentage) => {
              const targetValue = goal.target_value || 100;
              const quickValue = Math.round((targetValue * percentage) / 100);
              
              return (
                <Button
                  key={percentage}
                  size="lg"
                  variant="outline"
                  className={cn(
                    "text-sm font-bold py-3 transition-all hover:scale-105",
                    `hover:bg-gradient-to-r ${categoryStyle.gradient} hover:text-white hover:border-transparent`
                  )}
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

      {/* Edit Goal Dialog */}
      <GoalCreationDialog
        goal={goal}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onGoalCreated={onUpdate}
      />
    </Card>
  );
}