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
  PlusCircle,
  BarChart3,
  List 
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

import { Project, Deliverable, Task, Phase, TimeEntry } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTimer } from '@/contexts/TimerContext';
import DeliverableCreationDialog from './DeliverableCreationDialog';
import TaskCreationDialog from './TaskCreationDialog';
import TaskTimer from './TaskTimer';
import InlineDateEdit from './InlineDateEdit';
import InlineEditField from './InlineEditField';
import PhaseCreationDialog from './PhaseCreationDialog';
import ManualTimeDialog from './ManualTimeDialog';
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
import EfficiencyDots from '@/components/ui/EfficiencyDots';

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
  const [manualTimeDialog, setManualTimeDialog] = useState<{
    isOpen: boolean;
    targetType: 'task' | 'deliverable' | 'phase';
    targetId: string;
    targetName: string;
  }>({
    isOpen: false,
    targetType: 'task',
    targetId: '',
    targetName: ''
  });
  const { toast } = useToast();
  const { refreshTrigger, timeEntryRefreshTrigger, lastRefreshProjectId, lastRefreshTaskId } = useTimer();

  // Smart defaults: Only expand "In Progress" phases and remember user preferences
  useEffect(() => {
    const inProgressPhases = phases.filter(phase => {
      const phaseDeliverables = localDeliverables.filter(d => d.phase_id === phase.id);
      const status = getLocalPhaseStatus(phaseDeliverables);
      return status === 'in-progress';
    });
    
    // Start with only in-progress phases expanded
    const defaultExpanded = new Set(inProgressPhases.map(p => p.id));
    
    // TODO: Load user preferences from localStorage
    const savedExpanded = localStorage.getItem(`expanded-phases-${project.id}`);
    if (savedExpanded) {
      try {
        const parsed = JSON.parse(savedExpanded);
        setExpandedPhases(new Set(parsed));
      } catch {
        setExpandedPhases(defaultExpanded);
      }
    } else {
      setExpandedPhases(defaultExpanded);
    }
  }, [phases, localDeliverables, project.id]);

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
      const timerTime = getTaskTimeSpent(task.id, timeEntries);
      const manualTime = (task as any).manual_time_seconds || 0;
      times[task.id] = timerTime + manualTime; // Include manual time in total
    });
    
    setTaskTimeSpent(times);
  }, [localTasks, timeEntries]);

  // Listen for timer refresh events to update time data (optimized - timer data only)
  useEffect(() => {
    if (timeEntryRefreshTrigger > 0 && lastRefreshProjectId && lastRefreshTaskId && 
        deliverables.some(d => d.project_id === lastRefreshProjectId)) {
      // Only refresh if the task belongs to one of our deliverables
      const affectedDeliverable = deliverables.find(d => 
        localTasks.some(t => t.deliverable_id === d.id && t.id === lastRefreshTaskId)
      );
      if (affectedDeliverable) {
        // ✅ Minimized refresh - only time data through props update
        console.log('Timer refresh triggered for deliverable:', affectedDeliverable.title);
        // Component will automatically update through props change
      }
    }
  }, [timeEntryRefreshTrigger, lastRefreshProjectId, lastRefreshTaskId, deliverables, localTasks]);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId);
      } else {
        newSet.add(phaseId);
      }
      
      // Save user preferences
      localStorage.setItem(`expanded-phases-${project.id}`, JSON.stringify([...newSet]));
      
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
      
      // Save user preferences
      localStorage.setItem(`expanded-deliverables-${project.id}`, JSON.stringify([...newSet]));
      
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
      case 'completed': return 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20';
      case 'in-progress': return 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
      case 'pending': return 'border-l-4 border-l-gray-300 bg-gray-50/50 dark:bg-gray-900/50';
      default: return 'border-l-4 border-l-gray-300 bg-gray-50/50 dark:bg-gray-900/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '🔄';
      case 'pending': return '⏳';
      default: return '⏳';
    }
  };

  const getCompactStatusBadge = (status: string, progressPercentage: number) => {
    const icon = getStatusIcon(status);
    return `${icon} ${progressPercentage}%`;
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

  // Manual time dialog handlers
  const openManualTimeDialog = (targetType: 'task' | 'deliverable' | 'phase', targetId: string, targetName: string) => {
    setManualTimeDialog({
      isOpen: true,
      targetType,
      targetId,
      targetName
    });
  };

  const closeManualTimeDialog = () => {
    setManualTimeDialog({
      isOpen: false,
      targetType: 'task',
      targetId: '',
      targetName: ''
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
            phases
              .sort((a, b) => {
                // Ensure "Fase 1" always appears first
                if (a.name.toLowerCase().includes('fase 1')) return -1;
                if (b.name.toLowerCase().includes('fase 1')) return 1;
                
                // For other phases, sort by name naturally
                return a.name.localeCompare(b.name, 'nl', { numeric: true });
              })
              .map((phase) => {
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
                  <Card className={`${getPhaseStatusColor(getLocalPhaseStatus(phaseDeliverables))} transition-all duration-200`}>
                    <CollapsibleTrigger className="w-full text-left hover:bg-muted/20 transition-colors">
                      {/* Fase Header - Improved Visual Hierarchy */}
                      <div className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-4">
                          {isExpanded ? (
                            <ChevronDown className="h-6 w-6 text-foreground transition-transform" />
                          ) : (
                            <ChevronRight className="h-6 w-6 text-foreground transition-transform" />
                          )}
                          <div className="flex items-center gap-3">
                            <InlineEditField
                              value={phase.name}
                              onSave={(newName) => updatePhaseName(phase.id, newName)}
                              placeholder="Fase naam"
                              className="text-[22px] font-bold text-foreground"
                            />
                            <span className="text-lg font-medium text-muted-foreground">
                              {getCompactStatusBadge(getLocalPhaseStatus(phaseDeliverables), phaseProgressPercentage)}
                            </span>
                          </div>
                        </div>
                        
                         <div className="flex items-center gap-6">
                           {/* Compact Progress & Efficiency */}
                           <div className="flex items-center gap-3">
                             <EfficiencyDots 
                               value={getPhaseEfficiency(phase, localDeliverables, localTasks, timeEntries)}
                               size="lg"
                               showLabel={false}
                               showPercentage={false}
                               entityName={`Fase: ${phase.name}`}
                               statsData={{
                                 budgetHours: getPhaseDeclarableHours(phase, localDeliverables),
                                 actualHours: formatTimeToHours(getPhaseTimerTime(phase, localDeliverables, localTasks, timeEntries)),
                                 progressPercentage: phaseProgressPercentage,
                                 timeRemaining: Math.max(0, getPhaseDeclarableHours(phase, localDeliverables) - formatTimeToHours(getPhaseTimerTime(phase, localDeliverables, localTasks, timeEntries)))
                               }}
                             />
                             
                             {/* Manual time add button for phase */}
                             <Button
                               variant="ghost"
                               size="sm"
                               className="h-8 w-8 p-0 hover:bg-primary/10"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 openManualTimeDialog('phase', phase.id, phase.name);
                               }}
                               title="Handmatige tijd toevoegen aan fase"
                             >
                               <PlusCircle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                             </Button>
                             
                             <span className="text-base font-medium text-foreground min-w-[80px]">
                               <div className="flex flex-col items-end">
                                 <span>
                                   {formatTime(getPhaseTimerTime(phase, localDeliverables, localTasks, timeEntries))}/{getPhaseDeclarableHours(phase, localDeliverables)}h
                                 </span>
                                 {(phase as any).manual_time_seconds > 0 && (
                                   <span className="text-xs text-blue-600 dark:text-blue-400">
                                     +{formatTime((phase as any).manual_time_seconds || 0)}
                                   </span>
                                 )}
                               </div>
                             </span>
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
                      <div className="px-6 pb-6 pt-4 space-y-4">
                        {/* Deliverables within this phase */}
                        {phaseDeliverables.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg ml-4">
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
                                <Card className="border-l-2 border-primary/20 ml-4 bg-background/60">
                                  <CollapsibleTrigger className="w-full text-left hover:bg-muted/20 transition-colors">
                                    {/* Deliverable Header - Compact Design */}
                                    <div className="flex items-center justify-between p-4">
                                      <div className="flex items-center gap-3">
                                        {isDeliverableExpanded ? (
                                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                        ) : (
                                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        )}
                                        <span className="text-base font-bold text-foreground">{deliverable.title}</span>
                                        <span className="text-base text-muted-foreground">
                                          {getCompactStatusBadge(deliverable.status.toLowerCase(), deliverableProgressPercentage)}
                                        </span>
                                      </div>
                                       
                                       <div className="flex items-center gap-4">
                                         <EfficiencyDots 
                                           value={getDeliverableEfficiency(deliverable, localTasks, timeEntries)}
                                           size="md"
                                           showLabel={false}
                                           showPercentage={false}
                                           compact={true}
                                           entityName={deliverable.title}
                                           statsData={{
                                             budgetHours: deliverable.declarable_hours || 0,
                                             actualHours: formatTimeToHours(getDeliverableTimerTime(deliverable, localTasks, timeEntries)),
                                             progressPercentage: Math.round(getDeliverableProgress(deliverable, localTasks))
                                           }}
                                         />
                                         
                                         {/* Manual time add button for deliverable */}
                                         <Button
                                           variant="ghost"
                                           size="sm"
                                           className="h-8 w-8 p-0 hover:bg-primary/10"
                                           onClick={(e) => {
                                             e.stopPropagation();
                                             openManualTimeDialog('deliverable', deliverable.id, deliverable.title);
                                           }}
                                           title="Handmatige tijd toevoegen aan deliverable"
                                         >
                                           <PlusCircle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                         </Button>
                                         
                                         <span className="text-sm font-medium text-foreground min-w-[60px]">
                                           <div className="flex flex-col items-end">
                                             <span>
                                               {formatTime(getDeliverableTimerTime(deliverable, localTasks, timeEntries))}/
                                               <InlineEditField
                                                 value={`${deliverable.declarable_hours || 0}h`}
                                                 onSave={(newHours) => updateDeliverableHours(deliverable.id, newHours.replace('h', ''))}
                                                 placeholder="0h"
                                                 className="text-sm font-medium inline ml-0"
                                                 type="text"
                                               />
                                             </span>
                                             {(deliverable as any).manual_time_seconds > 0 && (
                                               <span className="text-xs text-blue-600 dark:text-blue-400">
                                                 +{formatTime((deliverable as any).manual_time_seconds || 0)}
                                               </span>
                                             )}
                                           </div>
                                         </span>
                                       </div>
                                    </div>
                                  </CollapsibleTrigger>

                                  <CollapsibleContent className="border-t animate-accordion-down">
                                    <div className="p-4 space-y-3">
                                      {/* Action buttons - Better design */}
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
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
                                          <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                                            <p className="text-sm">Nog geen taken - klik op "Nieuwe Taak" om te beginnen</p>
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            {[...deliverableTasks]
                                              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                               .map((task, index) => (
                                                <div key={task.id} className={`flex items-center gap-4 py-3 px-4 border rounded-lg hover:border-primary/50 hover:shadow-sm hover:shadow-primary/10 transition-all duration-200 ${
                                                  index === 0 ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-border'
                                                }`}>
                                                   <Checkbox
                                                     checked={task.completed}
                                                     onCheckedChange={() => toggleTaskCompletion(task)}
                                                     className="mt-1"
                                                   />
                                                   
                                                   <div className="flex-1 min-w-0">
                                                      <div className="flex items-center gap-2">
                                                        <span className={`text-[16px] font-normal ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'} truncate`}>
                                                          {task.title}
                                                        </span>
                                                        {task.assigned_to && (
                                                          <Badge variant="outline" className="text-xs shrink-0">
                                                            <User className="h-3 w-3 mr-1" />
                                                            {task.assigned_to}
                                                          </Badge>
                                                        )}
                                                      </div>
                                                     {task.description && (
                                                       <p className={`text-sm text-muted-foreground mt-1 ${task.completed ? 'line-through' : ''} line-clamp-2`}>
                                                         {task.description}
                                                       </p>
                                                     )}
                                                   </div>
                                                   
                                                   {/* Compact status */}
                                                   <div className="text-sm text-muted-foreground shrink-0">
                                                     {task.completed ? '✅' : '⏳'}
                                                   </div>
                                                   
                                                   {/* GROTE timer button - Most used action */}
                                                   <div className="shrink-0">
                                                     <TaskTimer 
                                                       taskId={task.id}
                                                       taskTitle={task.title}
                                                       deliverableId={deliverable.id}
                                                       deliverableTitle={deliverable.title}
                                                       projectId={project.id}
                                                       projectName={project.name}
                                                       onTimerChange={onRefresh}
                                                     />
                                                    </div>
                                                    
                                                    {/* Manual time add button */}
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-8 w-8 p-0 hover:bg-primary/10"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        openManualTimeDialog('task', task.id, task.title);
                                                      }}
                                                      title="Handmatige tijd toevoegen"
                                                    >
                                                      <PlusCircle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                    </Button>
                                                    
                                                    {/* Time display with manual time indication */}
                                                    <div className="text-sm font-medium text-foreground min-w-[80px] text-right shrink-0">
                                                      <div className="flex flex-col items-end">
                                                        <span>{formatTime(taskTimeSpent[task.id] || 0)}</span>
                                                        {(task as any).manual_time_seconds > 0 && (
                                                          <span className="text-xs text-blue-600 dark:text-blue-400">
                                                            +{formatTime((task as any).manual_time_seconds || 0)}
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>
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
                        
                        {/* Add Deliverable Button - Better positioned */}
                        <div className="pt-4 ml-4">
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
      
      {/* Manual Time Dialog */}
      <ManualTimeDialog
        isOpen={manualTimeDialog.isOpen}
        onClose={closeManualTimeDialog}
        onTimeAdded={onRefresh}
        targetType={manualTimeDialog.targetType}
        targetId={manualTimeDialog.targetId}
        targetName={manualTimeDialog.targetName}
        projectId={project.id}
      />
    </Card>
  );
}