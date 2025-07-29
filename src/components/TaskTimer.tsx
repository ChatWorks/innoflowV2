import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTimer } from '@/contexts/TimerContext';

interface TaskTimerProps {
  taskId: string;
  taskTitle: string;
  deliverableId: string;
  deliverableTitle: string;
  projectId: string;
  projectName: string;
  onTimerChange?: (isActive: boolean) => void;
}

export default function TaskTimer({ 
  taskId, 
  taskTitle, 
  deliverableId, 
  deliverableTitle,
  projectId, 
  projectName,
  onTimerChange 
}: TaskTimerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const { toast } = useToast();
  const { activeTimer, setActiveTimer, setFloatingVisible } = useTimer();

  // Check if this task has the active timer
  const isThisTaskActive = activeTimer?.taskId === taskId;
  const isPaused = activeTimer?.isPaused || false;

  // Live timer updates for this specific task
  useEffect(() => {
    if (isThisTaskActive && !isPaused && activeTimer) {
      const updateElapsedTime = () => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - activeTimer.startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      };

      updateElapsedTime();
      const interval = setInterval(updateElapsedTime, 1000);

      return () => clearInterval(interval);
    }
  }, [isThisTaskActive, isPaused, activeTimer]);

  // Reset elapsed time when this task is no longer active
  useEffect(() => {
    if (!isThisTaskActive) {
      setElapsedTime(0);
    }
  }, [isThisTaskActive]);

  const handleStart = async () => {
    try {
      // First, stop any existing active timer across all tasks
      const { data: activeTimers, error: fetchError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('is_active', true);

      if (fetchError) throw fetchError;

      // Stop each active timer with calculated duration
      for (const timer of activeTimers || []) {
        const startTime = new Date(timer.start_time);
        const endTime = new Date();
        const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

        await supabase
          .from('time_entries')
          .update({ 
            end_time: endTime.toISOString(),
            duration_seconds: durationSeconds,
            is_active: false 
          })
          .eq('id', timer.id);
      }

      // Start new timer for this task
      const now = new Date();
      
      const { data: newTimer, error } = await supabase
        .from('time_entries')
        .insert([{
          project_id: projectId,
          deliverable_id: deliverableId,
          task_id: taskId,
          start_time: now.toISOString(),
          is_active: true,
          description: `Timer voor ${taskTitle}`
        }])
        .select()
        .single();

      if (error) throw error;

      onTimerChange?.(true);

      // Update global timer context
      setActiveTimer({
        id: newTimer.id,
        taskId,
        taskTitle,
        deliverableId,
        deliverableTitle,
        projectId,
        projectName,
        startTime: now,
        isPaused: false
      });
      setFloatingVisible(true);

      toast({
        title: "Timer gestart",
        description: `Timer actief voor "${taskTitle}"`,
      });
    } catch (error) {
      console.error('Error starting timer:', error);
      toast({
        title: "Error",
        description: "Kon timer niet starten",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {isThisTaskActive && (
        <div className={`text-sm font-mono font-medium ${
          isPaused ? 'text-orange-600' : 'text-green-600'
        }`}>
          {formatTime(elapsedTime)}
        </div>
      )}
      
      {!isThisTaskActive ? (
        <Button
          size="sm"
          variant="outline"
          onClick={handleStart}
          className="h-8 w-8 p-0"
        >
          <Play className="h-3 w-3" />
        </Button>
      ) : (
        <div className="text-xs text-muted-foreground">
          Gebruik floating timer
        </div>
      )}
      
      {isThisTaskActive && (
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${
            isPaused 
              ? 'bg-orange-500' 
              : 'bg-green-600 animate-pulse'
          }`}></div>
        </div>
      )}
    </div>
  );
}