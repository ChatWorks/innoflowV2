import { TimeEntry, Task, Deliverable, Phase } from '@/types/project';

export interface ManualTimeEntry {
  id: string;
  project_id: string;
  task_id?: string;
  deliverable_id?: string;
  phase_id?: string;
  time_seconds: number;
  description?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Format seconds to display string (e.g., "2h 30m" or "45m")
export const formatSecondsToTime = (seconds: number): string => {
  if (seconds <= 0) return '0m';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
};

// Get total time spent on a task (timer + manual)
export const getTaskTotalTime = (
  taskId: string,
  timeEntries: TimeEntry[],
  manualTimeSeconds: number = 0
): number => {
  const taskTimerSeconds = timeEntries
    .filter(entry => entry.task_id === taskId && entry.duration_seconds)
    .reduce((total, entry) => total + (entry.duration_seconds || 0), 0);
  
  return taskTimerSeconds + manualTimeSeconds;
};

// Get total time spent on a deliverable (all tasks + manual)
export const getDeliverableTotalTime = (
  deliverable: Deliverable,
  tasks: Task[],
  timeEntries: TimeEntry[],
  deliverableManualTime: number = 0
): number => {
  const deliverableTasks = tasks.filter(task => task.deliverable_id === deliverable.id);
  
  const tasksTime = deliverableTasks.reduce((total, task) => {
    const taskTime = getTaskTotalTime(task.id, timeEntries, (task as any).manual_time_seconds || 0);
    return total + taskTime;
  }, 0);
  
  return tasksTime + deliverableManualTime;
};

// Get total time spent on a phase (all deliverables + manual)
export const getPhaseTotalTime = (
  phase: Phase,
  deliverables: Deliverable[],
  tasks: Task[],
  timeEntries: TimeEntry[],
  phaseManualTime: number = 0
): number => {
  const phaseDeliverables = deliverables.filter(deliverable => deliverable.phase_id === phase.id);
  
  const deliverablesTime = phaseDeliverables.reduce((total, deliverable) => {
    const deliverableTime = getDeliverableTotalTime(
      deliverable,
      tasks,
      timeEntries,
      (deliverable as any).manual_time_seconds || 0
    );
    return total + deliverableTime;
  }, 0);
  
  return deliverablesTime + phaseManualTime;
};

// Split time display into timer and manual components
export const getTimeBreakdown = (
  totalSeconds: number,
  manualSeconds: number
): {
  timerSeconds: number;
  manualSeconds: number;
  totalDisplay: string;
  hasManualTime: boolean;
} => {
  const timerSeconds = totalSeconds - manualSeconds;
  
  return {
    timerSeconds,
    manualSeconds,
    totalDisplay: formatSecondsToTime(totalSeconds),
    hasManualTime: manualSeconds > 0
  };
};

// Format time display with manual time indication (e.g., "2h 30m +45m")
export const formatTimeWithManual = (
  totalSeconds: number,
  manualSeconds: number
): string => {
  const breakdown = getTimeBreakdown(totalSeconds, manualSeconds);
  
  if (!breakdown.hasManualTime) {
    return breakdown.totalDisplay;
  }
  
  const timerDisplay = formatSecondsToTime(breakdown.timerSeconds);
  const manualDisplay = formatSecondsToTime(breakdown.manualSeconds);
  
  return `${timerDisplay} +${manualDisplay}`;
};