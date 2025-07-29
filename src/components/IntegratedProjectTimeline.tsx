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

import { Project, Deliverable, Task, Phase, TimeEntry } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DeliverableCreationDialog from './DeliverableCreationDialog';
import TaskCreationDialog from './TaskCreationDialog';
import TaskTimer from './TaskTimer';
import InlineDateEdit from './InlineDateEdit';
import InlineEditField from './InlineEditField';
import PhaseCreationDialog from './PhaseCreationDialog';
import { 
  getTaskProgress, 
  getDeliverableProgress, 
  getPhaseProgress, 
  formatTime, 
  formatTimeToHours, 
  getTaskTimeSpent,
  getTotalDeliverableTime,
  getTotalDeliverableEstimate,
  getTotalPhaseTime,
  getTotalPhaseEstimate,
  getProgressColor,
  getActualTaskProgress,
  getPhaseStatus,
  getDeliverableEfficiency,
  getPhaseEfficiency,
  getPhaseStatusVariant,
  getDeliverableStatusVariant,
  getEfficiencyVariant,
  getPhaseDeclarableHours,
  getPhaseTimerTime,
  getDeliverableTimerTime,
  getProjectProgress,
  updateProjectStatusIfNeeded
} from '@/utils/progressCalculations';

interface IntegratedProjectTimelineProps {
  project: Project;
  phases: Phase[];
  deliverables: Deliverable[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  onRefresh: () => void;
  onPhaseUpdate: (phaseId: string, data: Partial<Phase>) => void;
  onDeliverableUpdate: (deliverableId: string, data: Partial<Deliverable>) => void;
}

export default function IntegratedProjectTimeline({ 
  project, 
  phases, 
  deliverables, 
  tasks, 
  timeEntries,
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

  // Calculate task time spent from timeEntries prop
  useEffect(() => {
    const times: Record<string, number> = {};
    
    localTasks.forEach(task => {
      times[task.id] = getTaskTimeSpent(task.id, timeEntries);
    });
    
    setTaskTimeSpent(times);
  }, [localTasks, timeEntries]);

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

  const getLocalPhaseStatus = (phaseDeliverables: Deliverable[]) => {
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

  // Real-time status cascading: Task → Deliverable → Phase
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

  const updatePhaseStatus = async (phaseId: string) => {
    const phaseDeliverables = localDeliverables.filter(d => d.phase_id === phaseId);
    const completedDeliverables = phaseDeliverables.filter(d => d.status === 'Completed');
    
    let newStatus = 'Pending';
    if (completedDeliverables.length === phaseDeliverables.length && phaseDeliverables.length > 0) {
      newStatus = 'Completed';
    } else if (phaseDeliverables.some(d => d.status === 'In Progress' || d.status === 'Completed')) {
      newStatus = 'In Progress';
    }
    
    // Update database - add status column to phases table
    await supabase
      .from('phases')
      .update({ status: newStatus })
      .eq('id', phaseId);
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
      
      // Update phase status cascade
      const deliverable = localDeliverables.find(d => d.id === task.deliverable_id);
      if (deliverable?.phase_id) {
        await updatePhaseStatus(deliverable.phase_id);
      }

      // Check automatische project status update
      const currentProjectProgress = getProjectProgress(phases, localDeliverables, updatedTasks);
      try {
        const statusResult = await updateProjectStatusIfNeeded(project.id, currentProjectProgress, project.status);
        if (statusResult.updated) {
          toast({
            title: "Project Status Automatisch Bijgewerkt",
            description: `Project is van '${statusResult.previousStatus}' naar '${statusResult.newStatus}' gegaan vanwege voortgang van ${currentProjectProgress}%`,
          });
        }
      } catch (error) {
        console.error('Error updating project status:', error);
      }

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

  const updateDeliverableHours = async (deliverableId: string, newHours: string) => {
    const hoursValue = parseFloat(newHours) || 0;
    const { error } = await supabase
      .from('deliverables')
      .update({ declarable_hours: hoursValue })
      .eq('id', deliverableId);
    
    if (error) throw error;
    
    onDeliverableUpdate(deliverableId, { declarable_hours: hoursValue });
    toast({
      title: "Deliverable uren bijgewerkt",
      description: `Nieuwe uren: ${hoursValue}h`,
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
              const phaseStatus = getPhaseStatus(phase, localDeliverables, localTasks);
              const phaseProgressPercentage = getPhaseProgress(phase, localDeliverables, localTasks);
              const totalPhaseTime = getTotalPhaseTime(phase, localDeliverables, localTasks, timeEntries);
              const totalPhaseEstimate = getTotalPhaseEstimate(phase, localDeliverables, localTasks);
              const isExpanded = expandedPhases.has(phase.id);

              return (
                <Collapsible 
                  key={phase.id} 
                  open={isExpanded}
                  onOpenChange={() => togglePhase(phase.id)}
                >
                  <Card className={`border-l-4 ${getPhaseStatusColor(getLocalPhaseStatus(phaseDeliverables))} transition-all duration-200`}>
                    <CollapsibleTrigger className="w-full p-4 text-left hover:bg-muted/50 transition-colors">
                      {/* Fase Header - GESCHEIDEN progress en efficiency */}
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
                          <Badge variant={getPhaseStatusVariant(phaseStatus)}>
                            {phaseStatus}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {/* VOORTGANG BAR - Completion based */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Voortgang:</span>
                            <Progress 
                              value={phaseProgressPercentage} 
                              className="h-3 w-24" 
                            />
                            <span className="text-sm font-medium">
                              {phaseProgressPercentage}%
                            </span>
                          </div>
                          
                          {/* EFFICIENCY BADGE - Tijd based */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Efficiency:</span>
                            <Badge variant={getEfficiencyVariant(getPhaseEfficiency(phase, localDeliverables, localTasks, timeEntries))}>
                              {Math.round(getPhaseEfficiency(phase, localDeliverables, localTasks, timeEntries))}%
                            </Badge>
                          </div>
                          
                          {/* UREN DISPLAY - Declarabel vs timer */}
                          <div className="text-sm text-muted-foreground">
                            {formatTime(getPhaseTimerTime(phase, localDeliverables, localTasks, timeEntries))} / {getPhaseDeclarableHours(phase, localDeliverables)}h
                          </div>
                          
                          <InlineDateEdit
                            value={phase.target_date || undefined}
                            onSave={(newDate) => updatePhaseDate(phase.id, newDate)}
                            placeholder="Geen datum"
                          />
                        </div>
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
                            const deliverableProgressPercentage = getDeliverableProgress(deliverable, localTasks);
                            const totalDeliverableTime = getTotalDeliverableTime(deliverable, localTasks, timeEntries);
                            const totalDeliverableEstimate = getTotalDeliverableEstimate(deliverable, localTasks);
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
                                    {/* Deliverable Header - GESCHEIDEN progress en efficiency */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        {isDeliverableExpanded ? (
                                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="font-medium">{deliverable.title}</span>
                                        <Badge variant={getDeliverableStatusVariant(deliverable.status)}>
                                          {deliverable.status}
                                        </Badge>
                                      </div>
                                      
                                      <div className="flex items-center gap-3">
                                        {/* VOORTGANG - Completion */}
                                        <div className="flex items-center gap-1">
                                          <Progress 
                                            value={deliverableProgressPercentage} 
                                            className="h-2 w-20" 
                                          />
                                          <span className="text-xs">
                                            {deliverableProgressPercentage}%
                                          </span>
                                        </div>
                                        
                                        {/* EFFICIENCY */}
                                        <Badge variant={getEfficiencyVariant(getDeliverableEfficiency(deliverable, localTasks, timeEntries))}>
                                          {Math.round(getDeliverableEfficiency(deliverable, localTasks, timeEntries))}% eff
                                        </Badge>
                                        
                                         {/* UREN */}
                                         <span className="text-sm text-muted-foreground">
                                           {formatTime(getDeliverableTimerTime(deliverable, localTasks, timeEntries))} / 
                                           <InlineEditField
                                             value={`${deliverable.declarable_hours || 0}h`}
                                             onSave={(newHours) => updateDeliverableHours(deliverable.id, newHours.replace('h', ''))}
                                             placeholder="0h"
                                             className="text-sm text-muted-foreground inline"
                                             type="text"
                                           />
                                         </span>
                                        
                                        <InlineDateEdit
                                          value={deliverable.target_date || undefined}
                                          onSave={(newDate) => updateDeliverableDate(deliverable.id, newDate)}
                                          placeholder="Geen datum"
                                        />
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
                                               {Math.round(deliverableProgressPercentage)}%
                                             </div>
                                             <div className="text-xs text-green-600/70 mt-1">
                                               {formatTime(totalDeliverableTime)} / {totalDeliverableEstimate}h
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
                                                          {formatTime(taskTimeSpent[task.id] || 0)}
                                                        </Badge>
                                                     </div>
                                                     {/* Task progress bar */}
                                                     <div className="flex items-center gap-2 mt-1">
                                                       <Progress 
                                                         value={getTaskProgress(task, taskTimeSpent[task.id] || 0)} 
                                                         className={`h-2 w-16 ${getProgressColor(getActualTaskProgress(task, taskTimeSpent[task.id] || 0))}`}
                                                       />
                                                        <span className="text-xs text-muted-foreground">
                                                          {formatTime(taskTimeSpent[task.id] || 0)} besteed
                                                        </span>
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
                                                     onTimerChange={onRefresh}
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