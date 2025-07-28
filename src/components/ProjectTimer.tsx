import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProjectTimerProps {
  projectId: string;
  projectName: string;
}

export default function ProjectTimer({ projectId, projectName }: ProjectTimerProps) {
  const [isActive, setIsActive] = useState(false);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkActiveTimer();
  }, [projectId]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, startTime]);

  const checkActiveTimer = async () => {
    try {
      const { data: activeTimer, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (activeTimer) {
        setIsActive(true);
        setActiveTimerId(activeTimer.id);
        setStartTime(new Date(activeTimer.start_time));
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - new Date(activeTimer.start_time).getTime()) / 1000);
        setElapsedTime(elapsed);
      }
    } catch (error) {
      console.error('Error checking active timer:', error);
    }
  };

  const startTimer = async () => {
    try {
      const now = new Date().toISOString();
      
      const { data: newTimer, error } = await supabase
        .from('time_entries')
        .insert([{
          project_id: projectId,
          start_time: now,
          is_active: true,
          description: `Timer gestart voor ${projectName}`
        }])
        .select()
        .single();

      if (error) throw error;

      setIsActive(true);
      setActiveTimerId(newTimer.id);
      setStartTime(new Date(now));
      setElapsedTime(0);

      toast({
        title: "Timer gestart",
        description: `Timer is actief voor ${projectName}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Kon timer niet starten",
        variant: "destructive",
      });
    }
  };

  const stopTimer = async () => {
    if (!activeTimerId || !startTime) return;

    try {
      const endTime = new Date().toISOString();
      const durationMinutes = Math.floor(elapsedTime / 60);

      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime,
          duration_minutes: durationMinutes,
          is_active: false
        })
        .eq('id', activeTimerId);

      if (error) throw error;

      setIsActive(false);
      setActiveTimerId(null);
      setStartTime(null);
      setElapsedTime(0);

      toast({
        title: "Timer gestopt",
        description: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m gelogd`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Kon timer niet stoppen",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Project Timer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-3xl font-mono font-bold">
              {formatTime(elapsedTime)}
            </div>
            {isActive && (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Actief</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {!isActive ? (
              <Button onClick={startTimer} className="bg-green-600 hover:bg-green-700 text-white">
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            ) : (
              <Button onClick={stopTimer} variant="destructive">
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}