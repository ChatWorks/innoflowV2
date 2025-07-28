import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Play, Pause, Users } from 'lucide-react';
import { Project, TimeEntry } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

const getStatusColor = (status: Project['status']) => {
  switch (status) {
    case 'Nieuw': return 'bg-primary/10 text-primary hover:bg-primary/20';
    case 'In Progress': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'Review': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    case 'Voltooid': return 'bg-green-100 text-green-800 hover:bg-green-200';
    default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    checkRunningTimer();
  }, [project.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && currentEntry) {
      interval = setInterval(() => {
        const startTime = new Date(currentEntry.start_time).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, currentEntry]);

  const checkRunningTimer = async () => {
    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .eq('project_id', project.id)
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setCurrentEntry(data[0]);
      setIsTimerRunning(true);
      const startTime = new Date(data[0].start_time).getTime();
      const now = Date.now();
      setElapsedTime(Math.floor((now - startTime) / 1000));
    }
  };

  const startTimer = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        project_id: project.id,
        start_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to start timer",
        variant: "destructive",
      });
      return;
    }

    setCurrentEntry(data);
    setIsTimerRunning(true);
    setElapsedTime(0);
    toast({
      title: "Timer Started",
      description: `Timer started for ${project.name}`,
    });
  };

  const stopTimer = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentEntry) return;

    const endTime = new Date();
    const startTime = new Date(currentEntry.start_time);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    const { error } = await supabase
      .from('time_entries')
      .update({
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
      })
      .eq('id', currentEntry.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to stop timer",
        variant: "destructive",
      });
      return;
    }

    setIsTimerRunning(false);
    setCurrentEntry(null);
    setElapsedTime(0);
    toast({
      title: "Timer Stopped",
      description: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m logged for ${project.name}`,
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-0 bg-card/50 backdrop-blur-sm"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors">
              {project.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{project.client}</span>
            </div>
          </div>
          <Badge className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Voortgang</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        {project.budget && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Budget</span>
            <span className="font-semibold text-lg">{formatCurrency(project.budget)}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-mono">
              {isTimerRunning ? formatTime(elapsedTime) : '00:00:00'}
            </span>
          </div>
          
          <Button
            size="sm"
            variant={isTimerRunning ? "destructive" : "default"}
            onClick={isTimerRunning ? stopTimer : startTimer}
            className="gap-2"
          >
            {isTimerRunning ? (
              <>
                <Pause className="h-4 w-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}