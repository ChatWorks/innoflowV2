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
  const isMonetaryGoal = goal.target_unit === '€' || goal.target_unit === 'euro' || goal.category === 'financial';

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

      <CardContent className="space-y-4">
        {goal.description && (
          <p className="text-sm text-muted-foreground">{goal.description}</p>
        )}

        {/* Monetary Goal Display */}
        {isMonetaryGoal && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <Euro className="h-5 w-5" />
                <span className="text-sm font-medium">Financieel Doel</span>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-green-800">
                  €{goal.current_value.toLocaleString()}
                </div>
                {goal.target_value && (
                  <div className="text-sm text-green-600">
                    van €{goal.target_value.toLocaleString()}
                  </div>
                )}
              </div>
              {!goal.is_completed && (
                <div className="flex gap-2 mt-3">
                  {!isQuickAdding ? (
                    <Button 
                      size="sm" 
                      onClick={() => setIsQuickAdding(true)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Bedrag Toevoegen
                    </Button>
                  ) : (
                    <div className="flex gap-2 w-full">
                      <Input
                        type="number"
                        placeholder="Bedrag"
                        value={quickAddValue}
                        onChange={(e) => setQuickAddValue(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        size="sm" 
                        onClick={handleQuickAdd}
                        disabled={isLoading || !quickAddValue}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        +
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setIsQuickAdding(false);
                          setQuickAddValue('');
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
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
          
          {goal.goal_type !== 'boolean' && !isMonetaryGoal && (
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
        {!isEditing && !goal.is_completed && goal.goal_type !== 'boolean' && !isMonetaryGoal && (
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