import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, User, Clock, BarChart3, List, TrendingUp, Euro, Timer } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { nl } from 'date-fns/locale';

import { Deliverable, Task } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DeliverableCreationDialog from './DeliverableCreationDialog';
import TaskCreationDialog from './TaskCreationDialog';
import TaskTimer from './TaskTimer';

interface SimpleTaskListProps {
  projectId: string;
  projectName: string;
  deliverables: Deliverable[];
  tasks: Task[];
  onRefresh: () => void;
}

interface TaskRowProps {
  task: Task;
  isTopTask: boolean;
  onToggle: () => void;
  deliverableId: string;
  deliverableTitle: string;
  projectId: string;
  projectName: string;
}

function TaskRow({ task, isTopTask, onToggle, deliverableId, deliverableTitle, projectId, projectName }: TaskRowProps) {
  const [taskTimeSpent, setTaskTimeSpent] = useState<number>(0);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    fetchTaskTime();
  }, [task.id]);

  const fetchTaskTime = async () => {
    const { data: timeEntries } = await supabase
      .from('time_entries')
      .select('duration_seconds, duration_minutes')
      .eq('task_id', task.id)
      .not('duration_seconds', 'is', null);
    
    const totalSeconds = timeEntries?.reduce((sum, entry) => {
      const seconds = entry.duration_seconds || (entry.duration_minutes || 0) * 60;
      return sum + seconds;
    }, 0) || 0;
    
    setTaskTimeSpent(totalSeconds);
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

  return (
    <div className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
      isTopTask ? 'border-primary bg-primary/5 dark:bg-primary/10' : ''
    }`}>
      <Checkbox
        checked={task.completed}
        onCheckedChange={async (checked) => {
          if (isToggling) {
            console.log('Toggle already in progress, ignoring...');
            return;
          }
          setIsToggling(true);
          await onToggle();
          setIsToggling(false);
        }}
        disabled={isToggling}
      />
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </span>
          {isTopTask && (
            <Badge variant="default" className="text-xs bg-primary">
              Top Taak
            </Badge>
          )}
          {task.assigned_to && (
            <Badge variant="outline" className="text-xs">
              <User className="h-3 w-3 mr-1" />
              {task.assigned_to}
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formatTime(taskTimeSpent)}
          </Badge>
          {taskTimeSpent > 0 && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
              <Timer className="h-3 w-3 mr-1" />
              {formatTime(taskTimeSpent)}
            </Badge>
          )}
        </div>
        {task.description && (
          <p className={`text-sm text-muted-foreground ${task.completed ? 'line-through' : ''}`}>
            {task.description}
          </p>
        )}
      </div>
      
      <TaskTimer 
        taskId={task.id}
        taskTitle={task.title}
        deliverableId={deliverableId}
        deliverableTitle={deliverableTitle}
        projectId={projectId}
        projectName={projectName}
        onTimerChange={() => fetchTaskTime()}
      />
    </div>
  );
}

export default function SimpleTaskList({ projectId, projectName, deliverables, tasks, onRefresh }: SimpleTaskListProps) {
  const [statsMode, setStatsMode] = useState<Record<string, boolean>>({});
  const [deliverableStats, setDeliverableStats] = useState<Record<string, any>>({});
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [localDeliverables, setLocalDeliverables] = useState<Deliverable[]>(deliverables);
  const { toast } = useToast();

  // Update local state when props change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    setLocalDeliverables(deliverables);
  }, [deliverables]);

  // Sort deliverables by due date (earliest first)
  const sortedDeliverables = [...localDeliverables].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  useEffect(() => {
    fetchDeliverableStats();
  }, [localDeliverables, localTasks]);

  const fetchDeliverableStats = async () => {
    const stats: Record<string, any> = {};

    for (const deliverable of localDeliverables) {
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
      const deliverableTasks = localTasks.filter(t => t.deliverable_id === deliverable.id);
      const declarableHours = deliverable.declarable_hours || 0;
      const completedTasks = deliverableTasks.filter(t => t.completed).length;
      const completionRate = deliverableTasks.length > 0 ? (deliverableTasks.filter(t => t.completed).length / deliverableTasks.length) * 100 : 0;
      
      // Calculate days until deadline
      const daysUntilDeadline = deliverable.due_date ? differenceInDays(new Date(deliverable.due_date), new Date()) : null;

      stats[deliverable.id] = {
        totalTimeSeconds,
        totalTimeMinutes: Math.floor(totalTimeSeconds / 60), // Keep for compatibility
        declarableHours,
        completedTasks,
        completionRate,
        daysUntilDeadline
      };
    }

    setDeliverableStats(stats);
  };

  const toggleStatsMode = (deliverableId: string) => {
    setStatsMode(prev => ({
      ...prev,
      [deliverableId]: !prev[deliverableId]
    }));
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

  const getTaskTimeSpent = async (taskId: string) => {
    const { data: timeEntries } = await supabase
      .from('time_entries')
      .select('duration_seconds, duration_minutes')
      .eq('task_id', taskId)
      .not('duration_seconds', 'is', null);
    
    return timeEntries?.reduce((sum, entry) => {
      const seconds = entry.duration_seconds || (entry.duration_minutes || 0) * 60;
      return sum + seconds;
    }, 0) || 0;
  };

  const updateDeliverableStatus = async (deliverableId: string, updatedTasks: Task[]) => {
    const deliverableTasks = updatedTasks.filter(t => t.deliverable_id === deliverableId);
    const completedTasks = deliverableTasks.filter(t => t.completed);
    
    let newStatus = 'Pending';
    if (completedTasks.length > 0 && completedTasks.length < deliverableTasks.length) {
      newStatus = 'In Progress';
    } else if (completedTasks.length === deliverableTasks.length && deliverableTasks.length > 0) {
      newStatus = 'Completed';
    }
    
    // Update local state immediately
    setLocalDeliverables(prev => prev.map(d => 
      d.id === deliverableId ? { ...d, status: newStatus as any } : d
    ));
    
    // Update database
    await supabase
      .from('deliverables')
      .update({ status: newStatus })
      .eq('id', deliverableId);
  };

  const toggleTaskCompletion = async (task: Task) => {
    try {
      const completed = !task.completed;
      console.log('Toggle task completion:', { taskId: task.id, currentState: task.completed, newState: completed });
      
      // Optimistic update - update local state immediately
      const updatedTasks = localTasks.map(t => 
        t.id === task.id 
          ? { ...t, completed, completed_at: completed ? new Date().toISOString() : null }
          : t
      );
      setLocalTasks(updatedTasks);

      // Update database
      const { error } = await supabase
        .from('tasks')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', task.id);

      if (error) {
        console.error('Error updating task:', error);
        // Revert optimistic update on error
        setLocalTasks(localTasks);
        throw error;
      }
      
      console.log('Task updated successfully, now updating deliverable status...');
      
      // Update deliverable status with the updated tasks
      await updateDeliverableStatus(task.deliverable_id, updatedTasks);
      
      console.log('Deliverable status updated');

      toast({
        title: completed ? "Taak voltooid" : "Taak heropend",
        description: `${task.title} is ${completed ? 'afgerond' : 'heropend'}`,
      });

      // ✅ NO refresh cascade - let optimistic update stand
      
    } catch (error) {
      console.error('Complete error in toggleTaskCompletion:', error);
      toast({
        title: "Error",
        description: "Kon taak status niet bijwerken",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <DeliverableCreationDialog projectId={projectId} onDeliverableCreated={onRefresh} />
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {sortedDeliverables.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg mb-2">Nog geen deliverables</p>
              <p className="text-sm">Maak je eerste deliverable aan om te beginnen</p>
            </CardContent>
          </Card>
        ) : (
          sortedDeliverables.map((deliverable) => {
            const deliverableTasks = localTasks.filter(t => t.deliverable_id === deliverable.id);
            const stats = deliverableStats[deliverable.id];
            const isStatsMode = statsMode[deliverable.id];
            
            return (
              <Card key={deliverable.id}>
                <CardContent className="p-6">
                  {/* Deliverable Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{deliverable.title}</h3>
                      <Badge variant={deliverable.status === 'Completed' ? 'default' : 'secondary'}>
                        {deliverable.status}
                      </Badge>
                      {deliverable.due_date && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(deliverable.due_date), "dd MMM yyyy", { locale: nl })}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStatsMode(deliverable.id)}
                        className="gap-2"
                      >
                        {isStatsMode ? (
                          <>
                            <List className="h-4 w-4" />
                            Taken
                          </>
                        ) : (
                          <>
                            <BarChart3 className="h-4 w-4" />
                            Stats
                          </>
                        )}
                      </Button>
                      {!isStatsMode && (
                        <TaskCreationDialog deliverableId={deliverable.id} onTaskCreated={onRefresh} />
                      )}
                    </div>
                  </div>

                  {deliverable.description && !isStatsMode && (
                    <p className="text-muted-foreground mb-4">{deliverable.description}</p>
                  )}

                  {/* Statistics Mode */}
                  {isStatsMode && stats ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Tijd Gelogd */}
                      <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">Tijd Gelogd</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatTime(stats.totalTimeSeconds || 0)}
                        </div>
                        <div className="text-xs text-green-600/70 mt-1">
                          {(stats.totalTimeSeconds || 0) === 0 ? 'Nog niet gestart' : 'Actief gelogd'}
                        </div>
                      </div>

                      {/* Declarabele Uren */}
                      <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Euro className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-primary dark:text-primary">Declarabel</span>
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          € {(stats.declarableHours * 75).toLocaleString()}
                        </div>
                        <div className="text-xs text-primary/70 mt-1">
                          {stats.declarableHours}h declarabel voor klant
                        </div>
                      </div>

                      {/* Deadline */}
                      <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Timer className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Deadline</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-600">
                          {stats.daysUntilDeadline !== null ? (
                            stats.daysUntilDeadline > 0 ? `${stats.daysUntilDeadline}d` : 
                            stats.daysUntilDeadline === 0 ? 'Vandaag' : 'Verlopen'
                          ) : '∞'}
                        </div>
                        <div className="text-xs text-orange-600/70 mt-1">
                          {stats.daysUntilDeadline !== null ? (
                            stats.daysUntilDeadline > 0 ? 'dagen resterend' :
                            stats.daysUntilDeadline === 0 ? 'deadline vandaag' : 'te laat'
                          ) : 'geen deadline'}
                        </div>
                      </div>

                      {/* Voortgang */}
                      <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Voortgang</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round(stats.completionRate)}%
                        </div>
                        <div className="text-xs text-purple-600/70 mt-1">
                          {deliverableTasks.filter(t => t.completed).length} van {deliverableTasks.length} taken
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Tasks Mode */
                    deliverableTasks.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p className="text-sm">Nog geen taken - klik op "Nieuwe Taak" om te beginnen</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Sort tasks by created_at descending (newest first = top) */}
                        {[...deliverableTasks]
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .map((task, index) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            isTopTask={index === 0}
                            onToggle={() => toggleTaskCompletion(task)}
                            deliverableId={deliverable.id}
                            deliverableTitle={deliverable.title}
                            projectId={projectId}
                            projectName={projectName}
                          />
                        ))}
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}