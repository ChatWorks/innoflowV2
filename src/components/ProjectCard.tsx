import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, Target } from 'lucide-react';
import { Project, Deliverable, Phase, Task, TimeEntry } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { 
  getProjectProgress, 
  getProjectEfficiency, 
  getEfficiencyVariant,
  formatTimeToHours,
  getTotalProjectTimeSpent,
  getTotalProjectDeclarable
} from '@/utils/progressCalculations';

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
  const [phases, setPhases] = useState<Phase[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectData();
  }, [project.id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);

      // Fetch all related data in parallel
      const [phasesResult, deliverablesResult, tasksResult, timeEntriesResult] = await Promise.all([
        supabase.from('phases').select('*').eq('project_id', project.id),
        supabase.from('deliverables').select('*').eq('project_id', project.id),
        supabase.from('tasks').select('*').in('deliverable_id', 
          (await supabase.from('deliverables').select('id').eq('project_id', project.id)).data?.map(d => d.id) || []
        ),
        supabase.from('time_entries').select('*').eq('project_id', project.id)
      ]);

      if (phasesResult.error) throw phasesResult.error;
      if (deliverablesResult.error) throw deliverablesResult.error;
      if (tasksResult.error) throw tasksResult.error;
      if (timeEntriesResult.error) throw timeEntriesResult.error;

      setPhases((phasesResult.data || []) as Phase[]);
      setDeliverables((deliverablesResult.data || []) as Deliverable[]);
      setTasks((tasksResult.data || []) as Task[]);
      setTimeEntries((timeEntriesResult.data || []) as TimeEntry[]);
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate both progress and efficiency
  const projectProgress = getProjectProgress(phases, deliverables, tasks);
  const projectEfficiency = getProjectEfficiency(deliverables, tasks, timeEntries);
  const totalTimeSpent = getTotalProjectTimeSpent(timeEntries);
  const totalDeclarable = getTotalProjectDeclarable(deliverables);

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
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded"></div>
            <div className="h-2 bg-muted animate-pulse rounded"></div>
          </div>
        ) : (
          <>
            {/* SYSTEEM 1: VOORTGANG (Completion-based) */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Voortgang</span>
                </div>
                <span className="font-medium">{projectProgress}%</span>
              </div>
              <Progress value={projectProgress} className="h-2" />
            </div>

            {/* SYSTEEM 2: EFFICIENCY (Time-based) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Efficiency</span>
              </div>
              <Badge variant={getEfficiencyVariant(projectEfficiency)} className="text-xs">
                {Math.round(projectEfficiency)}%
              </Badge>
            </div>

            {/* Tijd Statistics */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tijd</span>
              <span className="font-medium">
                {formatTimeToHours(totalTimeSpent)}h / {totalDeclarable}h
              </span>
            </div>
          </>
        )}

        {/* Project Value */}
        {project.project_value && (
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm text-muted-foreground">Waarde</span>
            <span className="font-semibold text-lg">{formatCurrency(project.project_value)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}