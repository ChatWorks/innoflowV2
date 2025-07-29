import { Task, Deliverable, Phase, Project, TimeEntry } from '@/types/project';

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

// Calculate task progress (deprecated - tasks no longer have estimated hours)
export const getTaskProgress = (task: Task, timeSpent: number): number => {
  // Tasks no longer have billable_hours, return 0 for backward compatibility
  return 0;
};

// Get efficiency color based on percentage
export const getEfficiencyColor = (efficiency: number): string => {
  if (efficiency <= 80) return 'text-green-600'; // Very efficient 🟢
  if (efficiency <= 100) return 'text-blue-600'; // On budget 🔵
  if (efficiency <= 120) return 'text-orange-600'; // Slightly over budget 🟠
  return 'text-red-600'; // Over budget 🔴
};

// Get efficiency color class for backgrounds
export const getEfficiencyColorClass = (efficiency: number): string => {
  if (efficiency <= 80) return 'text-green-600 bg-green-100'; // Very efficient 🟢
  if (efficiency <= 100) return 'text-blue-600 bg-blue-100'; // On budget 🔵
  if (efficiency <= 120) return 'text-orange-600 bg-orange-100'; // Slightly over budget 🟠
  return 'text-red-600 bg-red-100'; // Over budget 🔴
};

// Get efficiency label
export const getEfficiencyLabel = (efficiency: number): string => {
  if (efficiency <= 80) return 'Zeer Efficient';
  if (efficiency <= 100) return 'Op Budget'; 
  if (efficiency <= 120) return 'Licht Over Budget';
  return 'Over Budget';
};

// Calculate actual progress percentage (can exceed 100%)
export const getActualTaskProgress = (task: Task, timeSpent: number): number => {
  // Tasks no longer have estimated hours, return based on completion status
  return task.completed ? 100 : 0;
};

// NEW: Calculate deliverable efficiency based on timer time vs declarable hours
export const getDeliverableEfficiency = (
  deliverable: Deliverable, 
  tasks: Task[], 
  timeEntries: TimeEntry[]
): number => {
  const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverable.id);
  
  if (deliverableTasks.length === 0) return 0;
  
  // Calculate total timer time for all tasks in this deliverable
  const totalTimerSeconds = deliverableTasks.reduce((sum, task) => {
    const taskTimeEntries = timeEntries.filter(te => te.task_id === task.id);
    return sum + taskTimeEntries.reduce((taskSum, te) => taskSum + (te.duration_seconds || 0), 0);
  }, 0);
  
  // Get declarable hours (what client pays for)
  const declarableHours = deliverable.declarable_hours || 0;
  const declarableSeconds = declarableHours * 3600;
  
  // Calculate efficiency: timer time / declarable time * 100
  return declarableSeconds > 0 ? (totalTimerSeconds / declarableSeconds) * 100 : 0;
};

// Calculate deliverable progress based on weighted average of tasks
export const getDeliverableProgress = (
  deliverable: Deliverable, 
  tasks: Task[], 
  timeEntries: TimeEntry[]
): number => {
  // Use efficiency as progress indicator
  return Math.min(getDeliverableEfficiency(deliverable, tasks, timeEntries), 100);
};

// Calculate total time spent on deliverable
export const getTotalDeliverableTime = (
  deliverable: Deliverable, 
  tasks: Task[], 
  timeEntries: TimeEntry[]
): number => {
  const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverable.id);
  return deliverableTasks.reduce((sum, task) => {
    return sum + getTaskTimeSpent(task.id, timeEntries);
  }, 0);
};

// Calculate total declarable time for deliverable in hours
export const getTotalDeliverableDeclarable = (
  deliverable: Deliverable
): number => {
  return deliverable.declarable_hours || 0;
};

// Calculate total estimated time for deliverable in hours (deprecated)
export const getTotalDeliverableEstimate = (
  deliverable: Deliverable, 
  tasks: Task[]
): number => {
  // Tasks no longer have estimated hours, return declarable hours instead
  return deliverable.declarable_hours || 0;
};

// NEW: Calculate phase efficiency based on weighted average of deliverables
export const getPhaseEfficiency = (
  phase: Phase, 
  deliverables: Deliverable[], 
  tasks: Task[], 
  timeEntries: TimeEntry[]
): number => {
  const phaseDeliverables = deliverables.filter(d => d.phase_id === phase.id);
  
  if (phaseDeliverables.length === 0) return 0;
  
  let totalTimerSeconds = 0;
  let totalDeclarableSeconds = 0;
  
  phaseDeliverables.forEach(deliverable => {
    const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverable.id);
    const deliverableTimerSeconds = deliverableTasks.reduce((sum, task) => {
      const taskTimeEntries = timeEntries.filter(te => te.task_id === task.id);
      return sum + taskTimeEntries.reduce((taskSum, te) => taskSum + (te.duration_seconds || 0), 0);
    }, 0);
    
    totalTimerSeconds += deliverableTimerSeconds;
    totalDeclarableSeconds += ((deliverable.declarable_hours || 0) * 3600);
  });
  
  return totalDeclarableSeconds > 0 ? (totalTimerSeconds / totalDeclarableSeconds) * 100 : 0;
};

// Calculate phase progress based on weighted average of deliverables
export const getPhaseProgress = (
  phase: Phase, 
  deliverables: Deliverable[], 
  tasks: Task[], 
  timeEntries: TimeEntry[]
): number => {
  // Use efficiency as progress indicator, capped at 100%
  return Math.min(getPhaseEfficiency(phase, deliverables, tasks, timeEntries), 100);
};

// Calculate total time spent on phase
export const getTotalPhaseTime = (
  phase: Phase, 
  deliverables: Deliverable[], 
  tasks: Task[], 
  timeEntries: TimeEntry[]
): number => {
  const phaseDeliverables = deliverables.filter(d => d.phase_id === phase.id);
  return phaseDeliverables.reduce((sum, deliverable) => {
    return sum + getTotalDeliverableTime(deliverable, tasks, timeEntries);
  }, 0);
};

// Calculate total declarable time for phase in hours
export const getTotalPhaseDeclarable = (
  phase: Phase, 
  deliverables: Deliverable[]
): number => {
  const phaseDeliverables = deliverables.filter(d => d.phase_id === phase.id);
  return phaseDeliverables.reduce((sum, deliverable) => {
    return sum + (deliverable.declarable_hours || 0);
  }, 0);
};

// Calculate total estimated time for phase in hours (deprecated)
export const getTotalPhaseEstimate = (
  phase: Phase, 
  deliverables: Deliverable[], 
  tasks: Task[]
): number => {
  // Use declarable hours instead of task estimates
  return getTotalPhaseDeclarable(phase, deliverables);
};

// NEW: Calculate project efficiency based on total timer vs total declarable
export const getProjectEfficiency = (
  deliverables: Deliverable[], 
  tasks: Task[], 
  timeEntries: TimeEntry[]
): number => {
  const totalTimerSeconds = timeEntries
    .filter(entry => entry.duration_seconds)
    .reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0);
  
  const totalDeclarableSeconds = deliverables.reduce((sum, d) => {
    return sum + ((d.declarable_hours || 0) * 3600);
  }, 0);
  
  return totalDeclarableSeconds > 0 ? (totalTimerSeconds / totalDeclarableSeconds) * 100 : 0;
};

// Calculate project progress based on weighted average of all time
export const getProjectProgress = (
  project: Project, 
  phases: Phase[], 
  deliverables: Deliverable[], 
  tasks: Task[], 
  timeEntries: TimeEntry[]
): number => {
  // Use efficiency as progress indicator, capped at 100%
  return Math.min(getProjectEfficiency(deliverables, tasks, timeEntries), 100);
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
export const getProjectContractValue = (
  deliverables: Deliverable[], 
  hourlyRate: number = 75
): number => {
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