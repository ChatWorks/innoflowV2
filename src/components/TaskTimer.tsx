import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TaskTimerProps {
  taskId: string;
  taskTitle: string;
  deliverableId: string;
  projectId: string;
  onTimerChange?: (isActive: boolean) => void;
}

export default function TaskTimer({ 
  taskId, 
  taskTitle, 
  deliverableId, 
  projectId, 
  onTimerChange 
}: TaskTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkActiveTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [taskId]);

  const checkActiveTimer = async () => {
    try {
      const { data: activeTimer, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('task_id', taskId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (activeTimer) {
        setIsRunning(true);
        setActiveTimerId(activeTimer.id);
        setCurrentSessionStart(new Date(activeTimer.start_time));
        startTimer();
      }
    } catch (error) {
      console.error('Error checking active timer:', error);
    }
  };

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      if (currentSessionStart) {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - currentSessionStart.getTime()) / 1000);
        setElapsedTime(elapsed);
      }
    }, 1000);
  };

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
      const now = new Date().toISOString();
      
      const { data: newTimer, error } = await supabase
        .from('time_entries')
        .insert([{
          project_id: projectId,
          deliverable_id: deliverableId,
          task_id: taskId,
          start_time: now,
          is_active: true,
          description: `Timer voor ${taskTitle}`
        }])
        .select()
        .single();

      if (error) throw error;

      setIsRunning(true);
      setActiveTimerId(newTimer.id);
      setCurrentSessionStart(new Date(now));
      setElapsedTime(0);
      startTimer();
      onTimerChange?.(true);

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

  const handlePause = async () => {
    if (!activeTimerId || !currentSessionStart) return;

    try {
      const endTime = new Date().toISOString();
      const durationSeconds = Math.floor(elapsedTime);

      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime,
          duration_seconds: durationSeconds,
          is_active: false
        })
        .eq('id', activeTimerId);

      if (error) throw error;

      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRunning(false);
      setActiveTimerId(null);
      setCurrentSessionStart(null);
      onTimerChange?.(false);

      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;

      toast({
        title: "Timer gepauzeerd",
        description: `${minutes}m ${seconds}s opgeslagen voor "${taskTitle}"`,
      });
    } catch (error) {
      console.error('Error pausing timer:', error);
      toast({
        title: "Error",
        description: "Kon timer niet pauzeren",
        variant: "destructive",
      });
    }
  };

  const handleStop = async () => {
    await handlePause();
    setElapsedTime(0);
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
      {isRunning && (
        <div className="text-sm font-mono font-medium text-green-600">
          {formatTime(elapsedTime)}
        </div>
      )}
      
      {!isRunning ? (
        <Button
          size="sm"
          variant="outline"
          onClick={handleStart}
          className="h-8 w-8 p-0"
        >
          <Play className="h-3 w-3" />
        </Button>
      ) : (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePause}
            className="h-8 w-8 p-0"
          >
            <Pause className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleStop}
            className="h-8 w-8 p-0"
          >
            <Square className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      {isRunning && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
}