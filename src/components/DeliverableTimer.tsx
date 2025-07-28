import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeliverableTimerProps {
  deliverableId: string;
  deliverableTitle: string;
  projectId: string;
}

export default function DeliverableTimer({ deliverableId, deliverableTitle, projectId }: DeliverableTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Check for active timer on mount
  useEffect(() => {
    checkActiveTimer();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [deliverableId]);

  const checkActiveTimer = async () => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('deliverable_id', deliverableId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setIsRunning(true);
        setCurrentSessionStart(new Date(data.start_time));
        const startTime = new Date(data.start_time).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - startTime) / 1000));
        startTimer();
      }
    } catch (error) {
      console.error('Error checking active timer:', error);
    }
  };

  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const handleStart = async () => {
    try {
      const startTime = new Date();
      
      const { error } = await supabase
        .from('time_entries')
        .insert([{
          project_id: projectId,
          deliverable_id: deliverableId,
          description: `Timer voor ${deliverableTitle}`,
          start_time: startTime.toISOString(),
          is_active: true
        }]);

      if (error) throw error;

      setIsRunning(true);
      setCurrentSessionStart(startTime);
      setElapsedTime(0);
      startTimer();

      toast({
        title: "Timer gestart",
        description: `Timer voor ${deliverableTitle} is gestart`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Kon timer niet starten",
        variant: "destructive",
      });
    }
  };

  const handlePause = async () => {
    try {
      const endTime = new Date();
      const durationMinutes = Math.floor(elapsedTime / 60);
      const durationSeconds = elapsedTime;

      // Get the first (top) task for this deliverable to assign time to
      const { data: topTask } = await supabase
        .from('tasks')
        .select('id')
        .eq('deliverable_id', deliverableId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      // Update time entry with precise duration
      const { error: timeError } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: durationMinutes,
          duration_seconds: durationSeconds,
          is_active: false,
          task_id: topTask?.id || null
        })
        .eq('deliverable_id', deliverableId)
        .eq('is_active', true);

      if (timeError) throw timeError;

      setIsRunning(false);
      setCurrentSessionStart(null);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const hours = Math.floor(elapsedTime / 3600);
      const minutes = Math.floor((elapsedTime % 3600) / 60);
      const seconds = elapsedTime % 60;
      
      let timeString = '';
      if (hours > 0) timeString += `${hours}h `;
      if (minutes > 0) timeString += `${minutes}m `;
      timeString += `${seconds}s`;

      toast({
        title: "Timer gestopt",
        description: `${timeString} opgeslagen${topTask ? ' en toegewezen aan bovenste taak' : ''}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Kon timer niet stoppen",
        variant: "destructive",
      });
    }
  };

  const handleStop = async () => {
    await handlePause();
    setElapsedTime(0);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3">
      <Badge variant={isRunning ? "default" : "secondary"} className="text-sm font-mono px-3 py-1">
        {formatTime(elapsedTime)}
      </Badge>
      
      <div className="flex items-center gap-1">
        {!isRunning ? (
          <Button size="sm" onClick={handleStart} className="gap-1">
            <Play className="h-3 w-3" />
            Start
          </Button>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={handlePause} className="gap-1">
              <Pause className="h-3 w-3" />
              Pauze
            </Button>
            <Button size="sm" variant="outline" onClick={handleStop} className="gap-1">
              <Square className="h-3 w-3" />
              Stop
            </Button>
          </>
        )}
      </div>
    </div>
  );
}