import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, Clock, Target, Trash2, MoreVertical } from 'lucide-react';
import { Project, Deliverable, Phase, Task, TimeEntry } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  getProjectProgress, 
  getProjectEfficiency, 
  getEfficiencyVariant,
  formatTimeToHours,
  getTotalProjectTimeSpent,
  getTotalProjectDeclarable,
  updateProjectStatusIfNeeded
} from '@/utils/progressCalculations';
import EfficiencyDots from '@/components/ui/EfficiencyDots';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onUpdate?: () => void; // Callback voor homepage refresh
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

export function ProjectCard({ project, onClick, onUpdate }: ProjectCardProps) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjectData();
  }, [project.id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);

      // Fetch all related data in parallel
      const [phasesResult, deliverablesResult, timeEntriesResult] = await Promise.all([
        supabase.from('phases').select('*').eq('project_id', project.id),
        supabase.from('deliverables').select('*').eq('project_id', project.id),
        supabase.from('time_entries').select('*').eq('project_id', project.id)
      ]);

      if (phasesResult.error) throw phasesResult.error;
      if (deliverablesResult.error) throw deliverablesResult.error;
      if (timeEntriesResult.error) throw timeEntriesResult.error;

      setPhases((phasesResult.data || []) as Phase[]);
      setDeliverables((deliverablesResult.data || []) as Deliverable[]);
      setTimeEntries((timeEntriesResult.data || []) as TimeEntry[]);

      // Fetch tasks separately after getting deliverables
      let tasksData = [];
      if (deliverablesResult.data && deliverablesResult.data.length > 0) {
        const tasksResult = await supabase
          .from('tasks')
          .select('*')
          .in('deliverable_id', deliverablesResult.data.map(d => d.id));
        
        if (tasksResult.error) throw tasksResult.error;
        tasksData = tasksResult.data || [];
      }
      setTasks(tasksData as Task[]);

      // Check voor automatische status updates
      await checkAndUpdateProjectStatus();
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Automatische status update check
  const checkAndUpdateProjectStatus = async () => {
    try {
      const currentProgress = getProjectProgress(phases, deliverables, tasks);
      const result = await updateProjectStatusIfNeeded(project.id, currentProgress, project.status);
      
      if (result.updated) {
        toast({
          title: "Project Status Bijgewerkt",
          description: `${project.name} is automatisch van '${result.previousStatus}' naar '${result.newStatus}' gegaan`,
        });
        onUpdate?.(); // Refresh homepage
      }
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  // Project verwijderen
  const handleDeleteProject = async () => {
    try {
      setDeleting(true);

      // Verwijder in volgorde: time_entries → tasks → deliverables → phases → project
      await supabase.from('time_entries').delete().eq('project_id', project.id);
      
      const { data: deliverableIds } = await supabase
        .from('deliverables')
        .select('id')
        .eq('project_id', project.id);
      
      if (deliverableIds && deliverableIds.length > 0) {
        await supabase
          .from('tasks')
          .delete()
          .in('deliverable_id', deliverableIds.map(d => d.id));
      }
      
      await supabase.from('deliverables').delete().eq('project_id', project.id);
      await supabase.from('phases').delete().eq('project_id', project.id);
      
      const { error } = await supabase.from('projects').delete().eq('id', project.id);
      
      if (error) throw error;

      toast({
        title: "Project Verwijderd",
        description: `${project.name} is succesvol verwijderd`,
      });
      
      onUpdate?.(); // Refresh homepage
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Kon project niet verwijderen",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Calculate both progress and efficiency
  const projectProgress = getProjectProgress(phases, deliverables, tasks);
  const projectEfficiency = getProjectEfficiency(deliverables, tasks, timeEntries, phases);
  const totalTimeSpent = getTotalProjectTimeSpent(timeEntries);
  const totalDeclarable = getTotalProjectDeclarable(deliverables);

  return (
    <Card 
      className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-0 bg-card/50 backdrop-blur-sm relative"
    >
      {/* Dropdown Menu voor acties */}
      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
              Project Bekijken
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Verwijderen
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Project Verwijderen</AlertDialogTitle>
                  <AlertDialogDescription>
                    Weet je zeker dat je "{project.name}" wilt verwijderen? 
                    Deze actie kan niet ongedaan worden gemaakt. Alle phases, 
                    deliverables, taken en tijd registraties worden permanent verwijderd.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteProject}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Verwijderen..." : "Definitief Verwijderen"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Card Content - klikbaar voor navigatie */}
      <div className="cursor-pointer" onClick={onClick}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between pr-8">
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

              {/* SYSTEEM 2: EFFICIENCY (Dots indicator) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Efficiency</span>
                </div>
                <EfficiencyDots 
                  value={projectEfficiency} 
                  size="sm"
                  showLabel={false}
                  showPercentage={true}
                  compact={true}
                  entityName={project.name}
                  statsData={{
                    budgetHours: totalDeclarable,
                    actualHours: formatTimeToHours(totalTimeSpent),
                    progressPercentage: projectProgress
                  }}
                />
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
      </div>
    </Card>
  );
}