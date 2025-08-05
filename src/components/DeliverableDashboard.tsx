import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Clock, Euro, TrendingUp, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

import { Deliverable, Task } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DeliverableCreationDialog from './DeliverableCreationDialog';

interface DeliverableDashboardProps {
  projectId: string;
  deliverables: Deliverable[];
  tasks: Task[];
  onRefresh: () => void;
}

interface DeliverableStats {
  totalTimeSeconds: number;
  totalTimeMinutes: number;
  declarableHours: number;
  completedTasks: number;
  completionRate: number;
}

export default function DeliverableDashboard({ projectId, deliverables, tasks, onRefresh }: DeliverableDashboardProps) {
  const [deliverableStats, setDeliverableStats] = useState<Record<string, DeliverableStats>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchDeliverableStats();
    
    // Set up real-time subscription for time entries
    const timeEntriesChannel = supabase
      .channel('time-entries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries',
        },
        () => {
          fetchDeliverableStats();
        }
      )
      .subscribe();

    // Set up real-time subscription for tasks
    const tasksChannel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        () => {
          fetchDeliverableStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(timeEntriesChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [deliverables, tasks]);

  const fetchDeliverableStats = async () => {
    const stats: Record<string, DeliverableStats> = {};

    for (const deliverable of deliverables) {
      // Get time entries for this deliverable using duration_seconds for precision
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('duration_seconds, duration_minutes')
        .eq('deliverable_id', deliverable.id)
        .not('duration_seconds', 'is', null);

      // Use duration_seconds if available, fallback to duration_minutes * 60
      const totalTimeSeconds = timeEntries?.reduce((sum, entry) => {
        const seconds = entry.duration_seconds || (entry.duration_minutes || 0) * 60;
        return sum + seconds;
      }, 0) || 0;
      
      // Get tasks for this deliverable
      const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverable.id);
      const declarableHours = deliverable.declarable_hours || 0;
      const completedTasks = deliverableTasks.filter(t => t.completed).length;
      const completionRate = deliverableTasks.length > 0 ? (deliverableTasks.filter(t => t.completed).length / deliverableTasks.length) * 100 : 0;

      stats[deliverable.id] = {
        totalTimeSeconds,
        totalTimeMinutes: Math.floor(totalTimeSeconds / 60), // Keep for compatibility
        declarableHours,
        completedTasks,
        completionRate
      };
    }

    setDeliverableStats(stats);
  };

  const formatTime = (seconds: number) => {
    if (seconds === 0) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (secs > 0 || result === '') result += `${secs}s`;
    
    return result.trim();
  };

  const getDeadlineStatus = (dueDate: string | null) => {
    if (!dueDate) return { text: 'Geen deadline', variant: 'outline' as const };
    
    const today = new Date();
    const deadline = new Date(dueDate);
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: 'Verlopen', variant: 'destructive' as const };
    } else if (diffDays === 0) {
      return { text: 'Vandaag', variant: 'default' as const };
    } else if (diffDays <= 3) {
      return { text: `${diffDays} dagen`, variant: 'destructive' as const };
    } else {
      return { text: `${diffDays} dagen`, variant: 'outline' as const };
    }
  };

  const formatCurrency = (hours: number, hourlyRate: number = 75) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(hours * hourlyRate);
  };

  const deleteDeliverable = async (deliverableId: string, deliverableTitle: string) => {
    try {
      // Get all tasks for this deliverable
      const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverableId);
      
      // Delete related time entries for all tasks
      for (const task of deliverableTasks) {
        await supabase
          .from('time_entries')
          .delete()
          .eq('task_id', task.id);

        await supabase
          .from('manual_time_entries')
          .delete()
          .eq('task_id', task.id);
      }

      // Delete deliverable's own time entries
      await supabase
        .from('time_entries')
        .delete()
        .eq('deliverable_id', deliverableId);

      await supabase
        .from('manual_time_entries')
        .delete()
        .eq('deliverable_id', deliverableId);

      // Delete all tasks
      await supabase
        .from('tasks')
        .delete()
        .eq('deliverable_id', deliverableId);

      // Delete the deliverable
      const { error } = await supabase
        .from('deliverables')
        .delete()
        .eq('id', deliverableId);

      if (error) throw error;

      toast({
        title: "Deliverable verwijderd",
        description: `${deliverableTitle} en alle gerelateerde taken zijn succesvol verwijderd`,
      });

      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Kon deliverable niet verwijderen",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Deliverables Dashboard</h2>
            <p className="text-slate-300">Real-time overzicht van je deliverables en tijd tracking</p>
          </div>
          <DeliverableCreationDialog projectId={projectId} onDeliverableCreated={onRefresh} />
        </div>
      </div>

      {/* Deliverables Grid */}
      {deliverables.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nog geen deliverables</h3>
            <p className="text-muted-foreground mb-6">Maak je eerste deliverable aan om te beginnen</p>
            <DeliverableCreationDialog projectId={projectId} onDeliverableCreated={onRefresh} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deliverables.map((deliverable) => {
            const stats = deliverableStats[deliverable.id] || { totalTimeSeconds: 0, totalTimeMinutes: 0, declarableHours: 0, completedTasks: 0, completionRate: 0 };
            
            return (
              <Card key={deliverable.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-2">{deliverable.title}</CardTitle>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant={deliverable.status === 'Completed' ? 'default' : 'secondary'}>
                          {deliverable.status}
                        </Badge>
                        {deliverable.due_date && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(deliverable.due_date), "dd MMM", { locale: nl })}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-destructive/10"
                          title="Deliverable verwijderen"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deze actie kan niet ongedaan worden gemaakt. Dit zal het deliverable "{deliverable.title}" permanent verwijderen, inclusief alle taken die erbij horen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuleren</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteDeliverable(deliverable.id, deliverable.title)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Verwijderen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Tijd Gelogd */}
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Tijd Gelogd</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          {formatTime(stats.totalTimeSeconds || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(stats.totalTimeSeconds || 0) === 0 ? 'Nog niet gestart' : 'Actief bezig'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Declarabele Uren */}
                  <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Euro className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Declarabel</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          {formatCurrency(stats.declarableHours)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {stats.declarableHours}h declarabel voor klant
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium">Deadline</span>
                      </div>
                      <div className="text-right">
                        <Badge variant={getDeadlineStatus(deliverable.due_date).variant} className="mb-1">
                          {getDeadlineStatus(deliverable.due_date).text}
                        </Badge>
                        {deliverable.due_date && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(deliverable.due_date), "dd MMM yyyy", { locale: nl })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Voortgang */}
                  <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Voortgang</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-purple-600">
                          {Math.round(stats.completionRate)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tasks.filter(t => t.deliverable_id === deliverable.id && t.completed).length} van {tasks.filter(t => t.deliverable_id === deliverable.id).length} taken
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}