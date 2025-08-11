import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  const [isProcessing, setIsProcessing] = useState(false); // Prevent race conditions
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeTimer, setActiveTimer, setFloatingVisible, refreshTimerData } = useTimer();

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
    if (isProcessing) {
      console.log('Timer operation already in progress, ignoring...');
      return; // Prevent race conditions
    }
    
    setIsProcessing(true);
    
    try {
      // Atomic timer operation - stop all active timers
      const { data: activeTimers, error: fetchError } = await supabase
        .from('time_entries')
        .select('id, start_time, is_active')
        .eq('is_active', true);

      if (fetchError) throw fetchError;

      // Stop each active timer with calculated duration (queue operations)
      for (const timer of activeTimers || []) {
        const startTime = new Date(timer.start_time);
        const endTime = new Date();
        const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

        await supabase
          .from('time_entries')
          .update({ 
            end_time: endTime.toISOString(),
            duration_seconds: durationSeconds,
            duration_minutes: Math.floor(durationSeconds / 60),
            is_active: false 
          })
          .eq('id', timer.id);
      }

      // Start new timer for this task
      const now = new Date();
      
      const { data: newTimer, error } = await supabase
        .from('time_entries')
        .insert([{
          user_id: user?.id,
          project_id: projectId,
          deliverable_id: deliverableId,
          task_id: taskId,
          start_time: now.toISOString(),
          is_active: true,
          description: `Timer voor ${taskTitle}`
        }])
        .select('id')
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

      // Trigger timer-only data refresh (no project cascade)
      refreshTimerData();

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
    } finally {
      setIsProcessing(false);
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
      {!isThisTaskActive ? (
        <Button
          size="default"
          variant="outline"
          onClick={handleStart}
          disabled={isProcessing}
          className="h-10 px-4 gap-2 border-green-200 hover:bg-green-50 hover:border-green-300 dark:border-green-800 dark:hover:bg-green-950"
        >
          <Play className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">Start</span>
        </Button>
      ) : (
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
          <div className={`w-3 h-3 rounded-full ${
            isPaused 
              ? 'bg-orange-500 animate-none' 
              : 'bg-green-600 animate-pulse'
          }`}></div>
          <div className={`text-sm font-mono font-bold ${
            isPaused ? 'text-orange-600' : 'text-green-600'
          }`}>
            {formatTime(elapsedTime)}
          </div>
          <span className="text-xs text-muted-foreground">
            Actief
          </span>
        </div>
      )}
    </div>
  );
}