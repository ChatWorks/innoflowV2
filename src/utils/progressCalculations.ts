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

// Calculate task progress based on time spent vs estimated time
export const getTaskProgress = (task: Task, timeSpent: number): number => {
  if (!task.billable_hours || task.billable_hours === 0) return 0;
  const estimatedSeconds = task.billable_hours * 3600; // Convert hours to seconds
  return Math.min((timeSpent / estimatedSeconds) * 100, 100); // Cap at 100% for display
};

// Get progress color based on percentage
export const getProgressColor = (progress: number): string => {
  if (progress <= 100) return 'progress-normal'; // Green
  if (progress <= 120) return 'progress-warning'; // Orange  
  return 'progress-danger'; // Red
};

// Calculate actual progress percentage (can exceed 100%)
export const getActualTaskProgress = (task: Task, timeSpent: number): number => {
  if (!task.billable_hours || task.billable_hours === 0) return 0;
  const estimatedSeconds = task.billable_hours * 3600;
  return (timeSpent / estimatedSeconds) * 100;
};

// Calculate deliverable progress based on weighted average of tasks
export const getDeliverableProgress = (
  deliverable: Deliverable, 
  tasks: Task[], 
  timeEntries: TimeEntry[]
): number => {
  const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverable.id);
  
  if (deliverableTasks.length === 0) return 0;
  
  let totalEstimatedTime = 0;
  let totalSpentTime = 0;
  
  deliverableTasks.forEach(task => {
    const taskSpentTime = getTaskTimeSpent(task.id, timeEntries);
    const taskEstimatedTime = (task.billable_hours || 0) * 3600;
    
    totalEstimatedTime += taskEstimatedTime;
    totalSpentTime += taskSpentTime;
  });
  
  return totalEstimatedTime > 0 ? Math.min((totalSpentTime / totalEstimatedTime) * 100, 100) : 0;
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

// Calculate total estimated time for deliverable in hours
export const getTotalDeliverableEstimate = (
  deliverable: Deliverable, 
  tasks: Task[]
): number => {
  const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverable.id);
  return deliverableTasks.reduce((sum, task) => sum + (task.billable_hours || 0), 0);
};

// Calculate phase progress based on weighted average of deliverables
export const getPhaseProgress = (
  phase: Phase, 
  deliverables: Deliverable[], 
  tasks: Task[], 
  timeEntries: TimeEntry[]
): number => {
  const phaseDeliverables = deliverables.filter(d => d.phase_id === phase.id);
  
  if (phaseDeliverables.length === 0) return 0;
  
  let totalEstimatedTime = 0;
  let totalSpentTime = 0;
  
  phaseDeliverables.forEach(deliverable => {
    const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverable.id);
    deliverableTasks.forEach(task => {
      const taskSpentTime = getTaskTimeSpent(task.id, timeEntries);
      const taskEstimatedTime = (task.billable_hours || 0) * 3600;
      
      totalEstimatedTime += taskEstimatedTime;
      totalSpentTime += taskSpentTime;
    });
  });
  
  return totalEstimatedTime > 0 ? Math.min((totalSpentTime / totalEstimatedTime) * 100, 100) : 0;
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

// Calculate total estimated time for phase in hours
export const getTotalPhaseEstimate = (
  phase: Phase, 
  deliverables: Deliverable[], 
  tasks: Task[]
): number => {
  const phaseDeliverables = deliverables.filter(d => d.phase_id === phase.id);
  return phaseDeliverables.reduce((sum, deliverable) => {
    return sum + getTotalDeliverableEstimate(deliverable, tasks);
  }, 0);
};

// Calculate project progress based on weighted average of all time
export const getProjectProgress = (
  project: Project, 
  phases: Phase[], 
  deliverables: Deliverable[], 
  tasks: Task[], 
  timeEntries: TimeEntry[]
): number => {
  if (tasks.length === 0) return 0;
  
  let totalEstimatedTime = 0;
  let totalSpentTime = 0;
  
  // Sum all estimated and spent time from all tasks
  tasks.forEach(task => {
    const taskSpentTime = getTaskTimeSpent(task.id, timeEntries);
    const taskEstimatedTime = (task.billable_hours || 0) * 3600;
    
    totalEstimatedTime += taskEstimatedTime;
    totalSpentTime += taskSpentTime;
  });
  
  return totalEstimatedTime > 0 ? Math.min((totalSpentTime / totalEstimatedTime) * 100, 100) : 0;
};

// Calculate total time spent on project
export const getTotalProjectTimeSpent = (timeEntries: TimeEntry[]): number => {
  return timeEntries
    .filter(entry => entry.duration_seconds)
    .reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0);
};

// Calculate project efficiency (can exceed 100%)
export const getProjectEfficiency = (
  tasks: Task[], 
  timeEntries: TimeEntry[]
): number => {
  let totalEstimatedTime = 0;
  let totalSpentTime = 0;
  
  tasks.forEach(task => {
    const taskSpentTime = getTaskTimeSpent(task.id, timeEntries);
    const taskEstimatedTime = (task.billable_hours || 0) * 3600;
    
    totalEstimatedTime += taskEstimatedTime;
    totalSpentTime += taskSpentTime;
  });
  
  if (totalSpentTime === 0) return 100;
  return totalEstimatedTime > 0 ? (totalEstimatedTime / totalSpentTime) * 100 : 0;
};

// Get efficiency color
export const getEfficiencyColor = (efficiency: number): string => {
  if (efficiency >= 90) return 'text-green-600';
  if (efficiency >= 70) return 'text-yellow-600';
  return 'text-red-600';
};