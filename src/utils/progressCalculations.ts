import { Task, Deliverable, Phase, Project, TimeEntry } from '@/types/project';

// ============= UTILITY FUNCTIONS =============

// Format time in seconds to human readable format
export const formatTime = (seconds: number): string => {
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

// Convert seconds to hours with decimal
export const formatTimeToHours = (seconds: number): number => {
  return Math.round((seconds / 3600) * 100) / 100;
};

// Get total time spent on a task
export const getTaskTimeSpent = (taskId: string, timeEntries: TimeEntry[]): number => {
  return timeEntries
    .filter(entry => entry.task_id === taskId && entry.duration_seconds)
    .reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0);
};

// ============= SYSTEEM 1: VOORTGANG (Completion-Based) =============

// Taak Voortgang = Checkbox status (af/niet af)
export const getTaskCompletion = (task: Task): number => {
  return task.completed ? 100 : 0;
};

// Deliverable Voortgang = % taken afgevinkt
export const getDeliverableProgress = (deliverable: Deliverable, tasks: Task[]): number => {
  const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverable.id);
  if (deliverableTasks.length === 0) return 0;
  
  const completedTasks = deliverableTasks.filter(t => t.completed);
  return Math.round((completedTasks.length / deliverableTasks.length) * 100);
};

// Fase Voortgang = % deliverables compleet
export const getPhaseProgress = (phase: Phase, deliverables: Deliverable[], tasks: Task[]): number => {
  const phaseDeliverables = deliverables.filter(d => d.phase_id === phase.id);
  if (phaseDeliverables.length === 0) return 0;
  
  const completedDeliverables = phaseDeliverables.filter(deliverable => {
    const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverable.id);
    return deliverableTasks.length > 0 && deliverableTasks.every(t => t.completed);
  });
  
  return Math.round((completedDeliverables.length / phaseDeliverables.length) * 100);
};

// Project Voortgang = % fases compleet
export const getProjectProgress = (phases: Phase[], deliverables: Deliverable[], tasks: Task[]): number => {
  if (phases.length === 0) return 0;
  
  const completedPhases = phases.filter(phase => getPhaseProgress(phase, deliverables, tasks) === 100);
  return Math.round((completedPhases.length / phases.length) * 100);
};

// ============= SYSTEEM 2: EFFICIENCY (Tijd-Based) =============

// Deliverable Efficiency = Timer tijd vs declarabele uren
export const getDeliverableEfficiency = (deliverable: Deliverable, tasks: Task[], timeEntries: TimeEntry[]): number => {
  const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverable.id);
  const totalTimerSeconds = deliverableTasks.reduce((sum, task) => {
    const taskTimeEntries = timeEntries.filter(te => te.task_id === task.id);
    return sum + taskTimeEntries.reduce((taskSum, te) => taskSum + (te.duration_seconds || 0), 0);
  }, 0);
  
  const declarableSeconds = (deliverable.declarable_hours || 0) * 3600;
  return declarableSeconds > 0 ? (totalTimerSeconds / declarableSeconds) * 100 : 0;
};

// Fase Efficiency = Gewogen gemiddelde van deliverable efficiency
export const getPhaseEfficiency = (phase: Phase, deliverables: Deliverable[], tasks: Task[], timeEntries: TimeEntry[]): number => {
  const phaseDeliverables = deliverables.filter(d => d.phase_id === phase.id);
  
  let totalTimerSeconds = 0;
  let totalDeclarableSeconds = 0;
  
  phaseDeliverables.forEach(deliverable => {
    const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverable.id);
    const deliverableTimerSeconds = deliverableTasks.reduce((sum, task) => {
      const taskTimeEntries = timeEntries.filter(te => te.task_id === task.id);
      return sum + taskTimeEntries.reduce((taskSum, te) => taskSum + (te.duration_seconds || 0), 0);
    }, 0);
    
    totalTimerSeconds += deliverableTimerSeconds;
    totalDeclarableSeconds += (deliverable.declarable_hours || 0) * 3600;
  });
  
  return totalDeclarableSeconds > 0 ? (totalTimerSeconds / totalDeclarableSeconds) * 100 : 0;
};

// Project Efficiency = Timer tijd vs declarabele uren voor heel project
export const getProjectEfficiency = (deliverables: Deliverable[], tasks: Task[], timeEntries: TimeEntry[]): number => {
  const totalTimerSeconds = timeEntries
    .filter(entry => entry.duration_seconds)
    .reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0);
  
  const totalDeclarableSeconds = deliverables.reduce((sum, d) => {
    return sum + ((d.declarable_hours || 0) * 3600);
  }, 0);
  
  return totalDeclarableSeconds > 0 ? (totalTimerSeconds / totalDeclarableSeconds) * 100 : 0;
};

// ============= HELPER FUNCTIONS FOR TIME & HOURS =============

// Get declarable hours voor deliverable
export const getDeliverableDeclarableHours = (deliverable: Deliverable): number => {
  return deliverable.declarable_hours || 0;
};

// Get declarable hours voor phase
export const getPhaseDeclarableHours = (phase: Phase, deliverables: Deliverable[]): number => {
  const phaseDeliverables = deliverables.filter(d => d.phase_id === phase.id);
  return phaseDeliverables.reduce((sum, d) => sum + (d.declarable_hours || 0), 0);
};

// Get timer time voor deliverable
export const getDeliverableTimerTime = (deliverable: Deliverable, tasks: Task[], timeEntries: TimeEntry[]): number => {
  const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverable.id);
  return deliverableTasks.reduce((sum, task) => {
    const taskTimeEntries = timeEntries.filter(te => te.task_id === task.id);
    return sum + taskTimeEntries.reduce((taskSum, te) => taskSum + (te.duration_seconds || 0), 0);
  }, 0);
};

// Get timer time voor phase
export const getPhaseTimerTime = (phase: Phase, deliverables: Deliverable[], tasks: Task[], timeEntries: TimeEntry[]): number => {
  const phaseDeliverables = deliverables.filter(d => d.phase_id === phase.id);
  let totalSeconds = 0;
  
  phaseDeliverables.forEach(deliverable => {
    const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverable.id);
    deliverableTasks.forEach(task => {
      const taskTimeEntries = timeEntries.filter(te => te.task_id === task.id);
      totalSeconds += taskTimeEntries.reduce((sum, te) => sum + (te.duration_seconds || 0), 0);
    });
  });
  
  return totalSeconds;
};

// ============= STATUS HELPERS =============

// Get phase status based on deliverable completion
export const getPhaseStatus = (phase: Phase, deliverables: Deliverable[], tasks: Task[]): string => {
  const phaseDeliverables = deliverables.filter(d => d.phase_id === phase.id);
  const completedDeliverables = phaseDeliverables.filter(deliverable => {
    const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverable.id);
    return deliverableTasks.length > 0 && deliverableTasks.every(t => t.completed);
  });
  
  if (completedDeliverables.length === phaseDeliverables.length && phaseDeliverables.length > 0) {
    return 'Completed';
  } else if (completedDeliverables.length > 0) {
    return 'In Progress';
  }
  return 'Pending';
};

// ============= STYLING & DISPLAY HELPERS =============

// Get efficiency color based on percentage
export const getEfficiencyColor = (efficiency: number): string => {
  if (efficiency <= 80) return 'text-green-600'; // Very efficient 🟢
  if (efficiency <= 100) return 'text-blue-600'; // On budget 🔵
  if (efficiency <= 120) return 'text-orange-600'; // Slightly over budget 🟠
  return 'text-red-600'; // Over budget 🔴
};

// Get efficiency label
export const getEfficiencyLabel = (efficiency: number): string => {
  if (efficiency <= 80) return 'Zeer Efficient';
  if (efficiency <= 100) return 'Op Budget'; 
  if (efficiency <= 120) return 'Licht Over Budget';
  return 'Over Budget';
};

// Status variant functions
export const getPhaseStatusVariant = (status: string) => {
  switch (status) {
    case 'Completed': return 'default'; // Groen
    case 'In Progress': return 'secondary'; // Blauw  
    case 'Pending': return 'outline'; // Grijs
    default: return 'outline';
  }
};

export const getDeliverableStatusVariant = (status: string) => {
  switch (status) {
    case 'Completed': return 'default'; // Groen
    case 'In Progress': return 'secondary'; // Blauw  
    case 'Pending': return 'outline'; // Grijs
    default: return 'outline';
  }
};

export const getEfficiencyVariant = (efficiency: number) => {
  if (efficiency <= 80) return 'default'; // Groen - zeer efficient
  if (efficiency <= 100) return 'secondary'; // Blauw - op budget
  if (efficiency <= 120) return 'outline'; // Grijs - licht over
  return 'destructive'; // Rood - over budget
};

// ============= LEGACY FUNCTIONS (for backward compatibility) =============

// Calculate total time spent on deliverable
export const getTotalDeliverableTime = (deliverable: Deliverable, tasks: Task[], timeEntries: TimeEntry[]): number => {
  return getDeliverableTimerTime(deliverable, tasks, timeEntries);
};

// Calculate total declarable time for deliverable in hours
export const getTotalDeliverableDeclarable = (deliverable: Deliverable): number => {
  return getDeliverableDeclarableHours(deliverable);
};

// Calculate total time spent on phase
export const getTotalPhaseTime = (phase: Phase, deliverables: Deliverable[], tasks: Task[], timeEntries: TimeEntry[]): number => {
  return getPhaseTimerTime(phase, deliverables, tasks, timeEntries);
};

// Calculate total declarable time for phase in hours
export const getTotalPhaseDeclarable = (phase: Phase, deliverables: Deliverable[]): number => {
  return getPhaseDeclarableHours(phase, deliverables);
};

// Calculate total time spent on project
export const getTotalProjectTimeSpent = (timeEntries: TimeEntry[]): number => {
  return timeEntries
    .filter(entry => entry.duration_seconds)
    .reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0);
};

// Calculate total declarable hours for project
export const getTotalProjectDeclarable = (deliverables: Deliverable[]): number => {
  return deliverables.reduce((sum, d) => sum + (d.declarable_hours || 0), 0);
};

// Calculate project contract value
export const getProjectContractValue = (deliverables: Deliverable[], hourlyRate: number = 75): number => {
  const totalDeclarableHours = getTotalProjectDeclarable(deliverables);
  return totalDeclarableHours * hourlyRate;
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

// Deprecated - kept for backward compatibility
export const getProgressColor = (progress: number): string => {
  return getEfficiencyColor(progress);
};

// Legacy task progress functions (deprecated but kept for compatibility)
export const getTaskProgress = (task: Task, timeSpent: number): number => {
  return getTaskCompletion(task);
};

export const getActualTaskProgress = (task: Task, timeSpent: number): number => {
  return getTaskCompletion(task);
};

// Missing legacy functions for backward compatibility
export const getTotalDeliverableEstimate = (deliverable: Deliverable, tasks: Task[]): number => {
  return deliverable.declarable_hours || 0;
};

export const getTotalPhaseEstimate = (phase: Phase, deliverables: Deliverable[], tasks: Task[]): number => {
  return getPhaseDeclarableHours(phase, deliverables);
};

// Taak efficiency (geschat op basis van tijd vs gemiddelde)
export const getTaskEfficiency = (task: Task, timeEntries: TimeEntry[]): number => {
  const taskTimeSpent = getTaskTimeSpent(task.id, timeEntries);
  
  // Schatting: gemiddelde taak = 2 uur
  const estimatedTaskHours = 2;
  const actualTaskHours = taskTimeSpent / 3600;
  
  if (actualTaskHours === 0) return 0;
  return (actualTaskHours / estimatedTaskHours) * 100;
};

// ============= AUTOMATISCHE STATUS UPDATES =============

// Bepaal project status gebaseerd op voortgang
export const getAutomaticProjectStatus = (projectProgress: number, currentStatus: string): string => {
  if (projectProgress === 100) {
    return 'Voltooid';
  } else if (projectProgress > 0 && currentStatus === 'Nieuw') {
    return 'In Progress';
  } else if (projectProgress > 75 && currentStatus !== 'Voltooid') {
    return 'Review';
  }
  return currentStatus; // Behoud huidige status als geen automatische update nodig
};

// Update project status in database gebaseerd op voortgang
export const updateProjectStatusIfNeeded = async (
  projectId: string, 
  currentProgress: number, 
  currentStatus: string
) => {
  const newStatus = getAutomaticProjectStatus(currentProgress, currentStatus);
  
  if (newStatus !== currentStatus) {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase
      .from('projects')
      .update({ 
        status: newStatus,
        progress: currentProgress 
      })
      .eq('id', projectId);
    
    if (!error) {
      return { updated: true, newStatus, previousStatus: currentStatus };
    }
    throw error;
  }
  
  return { updated: false, newStatus: currentStatus, previousStatus: currentStatus };
};