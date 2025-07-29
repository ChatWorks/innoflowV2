import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  User, 
  Clock, 
  Timer, 
  CheckCircle, 
  Circle, 
  Plus,
  BarChart3,
  List 
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

import { Project, Deliverable, Task, Phase } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DeliverableCreationDialog from './DeliverableCreationDialog';
import TaskCreationDialog from './TaskCreationDialog';
import TaskTimer from './TaskTimer';
import InlineDateEdit from './InlineDateEdit';
import InlineEditField from './InlineEditField';
import PhaseCreationDialog from './PhaseCreationDialog';

interface IntegratedProjectTimelineProps {
  project: Project;
  phases: Phase[];
  deliverables: Deliverable[];
  tasks: Task[];
  onRefresh: () => void;
  onPhaseUpdate: (phaseId: string, data: Partial<Phase>) => void;
  onDeliverableUpdate: (deliverableId: string, data: Partial<Deliverable>) => void;
}

export default function IntegratedProjectTimeline({ 
  project, 
  phases, 
  deliverables, 
  tasks, 
  onRefresh,
  onPhaseUpdate,
  onDeliverableUpdate
}: IntegratedProjectTimelineProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [expandedDeliverables, setExpandedDeliverables] = useState<Set<string>>(new Set());
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [localDeliverables, setLocalDeliverables] = useState<Deliverable[]>(deliverables);
  const [taskTimeSpent, setTaskTimeSpent] = useState<Record<string, number>>({});
  const [statsMode, setStatsMode] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Initialize expanded phases (all open by default)
  useEffect(() => {
    setExpandedPhases(new Set(phases.map(p => p.id)));
  }, [phases]);

  // Update local state when props change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    setLocalDeliverables(deliverables);
  }, [deliverables]);

  // Fetch task time spent
  useEffect(() => {
    fetchAllTaskTimes();
  }, [localTasks]);

  const fetchAllTaskTimes = async () => {
    const times: Record<string, number> = {};
    
    for (const task of localTasks) {
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('duration_seconds, duration_minutes')
        .eq('task_id', task.id)
        .not('duration_seconds', 'is', null);
      
      const totalSeconds = timeEntries?.reduce((sum, entry) => {
        const seconds = entry.duration_seconds || (entry.duration_minutes || 0) * 60;
        return sum + seconds;
      }, 0) || 0;
      
      times[task.id] = totalSeconds;
    }
    
    setTaskTimeSpent(times);
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId);
      } else {
        newSet.add(phaseId);
      }
      return newSet;
    });
  };

  const toggleDeliverable = (deliverableId: string) => {
    setExpandedDeliverables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deliverableId)) {
        newSet.delete(deliverableId);
      } else {
        newSet.add(deliverableId);
      }
      return newSet;
    });
  };

  const toggleStatsMode = (deliverableId: string) => {
    setStatsMode(prev => ({
      ...prev,
      [deliverableId]: !prev[deliverableId]
    }));
  };

  const getPhaseStatus = (phaseDeliverables: Deliverable[]) => {
    if (phaseDeliverables.length === 0) return 'pending';
    
    const completedCount = phaseDeliverables.filter(d => d.status === 'Completed').length;
    const inProgressCount = phaseDeliverables.filter(d => d.status === 'In Progress').length;
    
    if (completedCount === phaseDeliverables.length) {
      return 'completed';
    } else if (inProgressCount > 0 || completedCount > 0) {
      return 'in-progress';
    } else {
      return 'pending';
    }
  };

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-l-green-500 bg-green-50 dark:bg-green-950';
      case 'in-progress': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      case 'pending': return 'border-l-gray-300 bg-gray-50 dark:bg-gray-900';
      default: return 'border-l-gray-300 bg-gray-50 dark:bg-gray-900';
    }
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
        // Revert optimistic update on error
        setLocalTasks(localTasks);
        throw error;
      }
      
      // Update deliverable status with the updated tasks
      await updateDeliverableStatus(task.deliverable_id, updatedTasks);

      toast({
        title: completed ? "Taak voltooid" : "Taak heropend",
        description: `${task.title} is ${completed ? 'afgerond' : 'heropend'}`,
      });

      // Refresh data in background
      setTimeout(() => onRefresh(), 100);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Kon taak status niet bijwerken",
        variant: "destructive",
      });
    }
  };

  const updatePhaseDate = async (phaseId: string, newDate: string | null) => {
    const { error } = await supabase
      .from('phases')
      .update({ target_date: newDate })
      .eq('id', phaseId);
    
    if (error) throw error;
    
    onPhaseUpdate(phaseId, { target_date: newDate });
    toast({
      title: "Fase datum bijgewerkt",
      description: newDate ? `Nieuwe datum: ${new Date(newDate).toLocaleDateString('nl-NL')}` : "Datum verwijderd",
    });
  };

  const updateDeliverableDate = async (deliverableId: string, newDate: string | null) => {
    const { error } = await supabase
      .from('deliverables')
      .update({ target_date: newDate })
      .eq('id', deliverableId);
    
    if (error) throw error;
    
    onDeliverableUpdate(deliverableId, { target_date: newDate });
    toast({
      title: "Deliverable datum bijgewerkt", 
      description: newDate ? `Nieuwe datum: ${new Date(newDate).toLocaleDateString('nl-NL')}` : "Datum verwijderd",
    });
  };

  const updatePhaseName = async (phaseId: string, newName: string) => {
    const { error } = await supabase
      .from('phases')
      .update({ name: newName })
      .eq('id', phaseId);
    
    if (error) throw error;
    
    onPhaseUpdate(phaseId, { name: newName });
    toast({
      title: "Fase naam bijgewerkt",
      description: `Nieuwe naam: ${newName}`,
    });
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

  const calculateDeliverableStats = (deliverable: Deliverable) => {
    const deliverableTasks = localTasks.filter(t => t.deliverable_id === deliverable.id);
    const completedTasks = deliverableTasks.filter(t => t.completed);
    const progressPercentage = deliverableTasks.length > 0 ? 
      (completedTasks.length / deliverableTasks.length) * 100 : 0;
    
    return {
      totalTasks: deliverableTasks.length,
      completedTasks: completedTasks.length,
      progressPercentage: Math.round(progressPercentage)
    };
  };

  // Auto-expand deliverable if it has active timers
  const shouldAutoExpandDeliverable = (deliverable: Deliverable) => {
    const deliverableTasks = localTasks.filter(t => t.deliverable_id === deliverable.id);
    // This would need integration with timer state - for now just check if recently worked on
    return false; // TODO: Implement timer state check
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Project Timeline</h2>
          <PhaseCreationDialog 
            projectId={project.id} 
            onPhaseCreated={onRefresh} 
          />
        </div>

        <div className="space-y-4">
          {phases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg mb-2">Nog geen phases</p>
              <p className="text-sm">Maak je eerste fase aan om te beginnen</p>
            </div>
          ) : (
            phases.map((phase) => {
              const phaseDeliverables = localDeliverables.filter(d => d.phase_id === phase.id);
              const phaseStatus = getPhaseStatus(phaseDeliverables);
              const completedDeliverables = phaseDeliverables.filter(d => d.status === 'Completed').length;
              const phaseProgressPercentage = phaseDeliverables.length > 0 ? 
                (completedDeliverables / phaseDeliverables.length) * 100 : 0;
              const isExpanded = expandedPhases.has(phase.id);

              return (
                <Collapsible 
                  key={phase.id} 
                  open={isExpanded}
                  onOpenChange={() => togglePhase(phase.id)}
                >
                  <Card className={`border-l-4 ${getPhaseStatusColor(phaseStatus)} transition-all duration-200`}>
                    <CollapsibleTrigger className="w-full p-4 text-left hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform" />
                          )}
                          <InlineEditField
                            value={phase.name}
                            onSave={(newName) => updatePhaseName(phase.id, newName)}
                            placeholder="Fase naam"
                            className="text-lg font-semibold"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <InlineDateEdit
                            value={phase.target_date || undefined}
                            onSave={(newDate) => updatePhaseDate(phase.id, newDate)}
                            placeholder="Geen datum"
                          />
                        </div>
                      </div>
                      
                      {/* Phase Progress */}
                      <div className="mt-3 ml-8">
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                          <span>{completedDeliverables} van {phaseDeliverables.length} deliverables voltooid</span>
                          <span>{Math.round(phaseProgressPercentage)}%</span>
                        </div>
                        <Progress value={phaseProgressPercentage} className="h-2" />
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="border-t animate-accordion-down">
                      <div className="p-4 pl-12 space-y-3">
                        {/* Deliverables within this phase */}
                        {phaseDeliverables.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                            <p className="text-sm">Nog geen deliverables in deze fase</p>
                          </div>
                        ) : (
                          phaseDeliverables.map((deliverable) => {
                            const deliverableTasks = localTasks.filter(t => t.deliverable_id === deliverable.id);
                            const stats = calculateDeliverableStats(deliverable);
                            const isDeliverableExpanded = expandedDeliverables.has(deliverable.id);
                            const isStatsMode = statsMode[deliverable.id];

                            return (
                              <Collapsible
                                key={deliverable.id}
                                open={isDeliverableExpanded}
                                onOpenChange={() => toggleDeliverable(deliverable.id)}
                              >
                                <Card className="border-l-2 border-primary/30 ml-4">
                                  <CollapsibleTrigger className="w-full p-3 text-left hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        {isDeliverableExpanded ? (
                                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="font-medium">{deliverable.title}</span>
                                        <Badge variant={deliverable.status === 'Completed' ? 'default' : 
                                          deliverable.status === 'In Progress' ? 'secondary' : 'outline'} 
                                          className={deliverable.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                            deliverable.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                                            'bg-gray-100 text-gray-600'}>
                                          {deliverable.status === 'Completed' ? <CheckCircle className="h-3 w-3 mr-1" /> :
                                           deliverable.status === 'In Progress' ? <Clock className="h-3 w-3 mr-1" /> :
                                           <Circle className="h-3 w-3 mr-1" />}
                                          {deliverable.status}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <InlineDateEdit
                                          value={deliverable.target_date || undefined}
                                          onSave={(newDate) => updateDeliverableDate(deliverable.id, newDate)}
                                          placeholder="Geen datum"
                                        />
                                        <span className="text-sm text-muted-foreground">
                                          {stats.progressPercentage}% ({stats.completedTasks}/{stats.totalTasks})
                                        </span>
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>

                                  <CollapsibleContent className="border-t animate-accordion-down">
                                    <div className="p-3 pl-8 space-y-2">
                                      {/* Action buttons */}
                                      <div className="flex items-center gap-2 mb-4">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleStatsMode(deliverable.id);
                                          }}
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
                                          <TaskCreationDialog 
                                            deliverableId={deliverable.id} 
                                            onTaskCreated={onRefresh} 
                                          />
                                        )}
                                      </div>

                                      {/* Tasks within this deliverable */}
                                      {isStatsMode ? (
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                          {/* Statistics cards similar to SimpleTaskList */}
                                          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                              <Clock className="h-4 w-4 text-green-600" />
                                              <span className="text-sm font-medium text-green-700 dark:text-green-300">Voortgang</span>
                                            </div>
                                            <div className="text-xl font-bold text-green-600">
                                              {stats.progressPercentage}%
                                            </div>
                                            <div className="text-xs text-green-600/70 mt-1">
                                              {stats.completedTasks} van {stats.totalTasks} taken
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        deliverableTasks.length === 0 ? (
                                          <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded-lg">
                                            <p className="text-sm">Nog geen taken - klik op "Nieuwe Taak" om te beginnen</p>
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            {[...deliverableTasks]
                                              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                              .map((task, index) => (
                                              <div key={task.id} className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                                                index === 0 ? 'border-primary bg-primary/5 dark:bg-primary/10' : ''
                                              }`}>
                                                <Checkbox
                                                  checked={task.completed}
                                                  onCheckedChange={() => toggleTaskCompletion(task)}
                                                />
                                                
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <span className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                                      {task.title}
                                                    </span>
                                                    {index === 0 && (
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
                                                      {task.billable_hours}h
                                                    </Badge>
                                                    {taskTimeSpent[task.id] > 0 && (
                                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                                                        <Timer className="h-3 w-3 mr-1" />
                                                        {formatTime(taskTimeSpent[task.id])}
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
                                                  deliverableId={deliverable.id}
                                                  projectId={project.id}
                                                  onTimerChange={() => fetchAllTaskTimes()}
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </Card>
                              </Collapsible>
                            );
                          })
                        )}
                        
                        {/* Add Deliverable Button */}
                        <div className="pt-2">
                          <DeliverableCreationDialog 
                            projectId={project.id} 
                            onDeliverableCreated={onRefresh} 
                          />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}