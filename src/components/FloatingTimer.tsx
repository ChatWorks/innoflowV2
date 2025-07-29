import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pause, Square, Minimize2, Maximize2, X } from 'lucide-react';
import { useTimer } from '@/contexts/TimerContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function FloatingTimer() {
  const { activeTimer, setActiveTimer, setFloatingVisible, refreshTimeData } = useTimer();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [pausedTime, setPausedTime] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!activeTimer) return;

    if (activeTimer.isPaused) {
      setElapsedTime(pausedTime);
      return;
    }

    const updateElapsedTime = () => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - activeTimer.startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [activeTimer, pausedTime]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = () => {
    if (!activeTimer) return;

    if (activeTimer.isPaused) {
      // Resume timer - create new start time accounting for paused time
      const newStartTime = new Date(Date.now() - (pausedTime * 1000));
      setActiveTimer({
        ...activeTimer,
        isPaused: false,
        startTime: newStartTime
      });
      toast({
        title: "Timer hervat",
        description: `Timer hervat voor "${activeTimer.taskTitle}"`,
      });
    } else {
      // Pause timer - save current elapsed time
      setPausedTime(elapsedTime);
      setActiveTimer({
        ...activeTimer,
        isPaused: true
      });
      toast({
        title: "Timer gepauzeerd",
        description: `Timer gepauzeerd voor "${activeTimer.taskTitle}"`,
      });
    }
  };

  const handleStop = async () => {
    if (!activeTimer) return;

    try {
      const totalSeconds = pausedTime || elapsedTime;
      const endTime = new Date();

      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime.toISOString(),
          duration_seconds: totalSeconds,
          is_active: false
        })
        .eq('id', activeTimer.id);

      if (error) throw error;

      setActiveTimer(null);
      setFloatingVisible(false);
      setPausedTime(0);
      
      // Refresh time data across all components
      refreshTimeData();

      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      toast({
        title: "Timer gestopt",
        description: `${minutes}m ${seconds}s opgeslagen voor "${activeTimer.taskTitle}"`,
      });
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast({
        title: "Error",
        description: "Kon timer niet stoppen",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setFloatingVisible(false);
  };

  if (!activeTimer) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className="shadow-xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm">
        <CardContent className={`transition-all duration-300 ${isMinimized ? 'p-2' : 'p-4'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                activeTimer.isPaused 
                  ? 'bg-orange-500' 
                  : 'bg-green-500 animate-pulse'
              }`}></div>
              <span className={`text-xs font-medium ${
                activeTimer.isPaused 
                  ? 'text-orange-600' 
                  : 'text-green-600'
              }`}>
                {activeTimer.isPaused ? 'GEPAUZEERD' : 'ACTIEF'}
              </span>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0"
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="text-xs text-muted-foreground mb-1">
                {activeTimer.projectName} • {activeTimer.deliverableTitle}
              </div>
              
              <div className="text-sm font-semibold mb-3 text-foreground">
                {activeTimer.taskTitle}
              </div>
            </>
          )}

          <div className={`font-mono font-bold text-primary transition-all duration-300 ${
            isMinimized ? 'text-lg' : 'text-2xl mb-3'
          }`}>
            {formatTime(elapsedTime)}
          </div>

          {!isMinimized && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePause}
                className="flex-1"
              >
                <Pause className="h-3 w-3 mr-1" />
                {activeTimer.isPaused ? 'Hervatten' : 'Pauzeren'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleStop}
                className="flex-1"
              >
                <Square className="h-3 w-3 mr-1" />
                Stoppen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}