import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Euro, 
  Clock,
  CheckCircle,
  Circle,
  PlayCircle
} from 'lucide-react';
import { Project, Deliverable, TimeEntry, Task } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProjectTimer from '@/components/ProjectTimer';
import SimpleTaskList from '@/components/SimpleTaskList';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchProjectData();
    }
  }, [id]);

  const fetchProjectData = async () => {
    if (!id) return;

    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData as Project);

      // Fetch deliverables
      const { data: deliverablesData, error: deliverablesError } = await supabase
        .from('deliverables')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      if (deliverablesError) throw deliverablesError;
      setDeliverables((deliverablesData || []) as Deliverable[]);

      // Fetch time entries
      const { data: timeData, error: timeError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('project_id', id)
        .order('start_time', { ascending: false });

      if (timeError) throw timeError;
      setTimeEntries((timeData || []) as TimeEntry[]);

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          deliverables:deliverable_id (
            id,
            title
          )
        `)
        .in('deliverable_id', (deliverablesData || []).map(d => d.id))
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks((tasksData || []) as Task[]);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch project details",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const totalTimeLogged = timeEntries
    .filter(entry => entry.duration_minutes)
    .reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);

  const totalBillableHours = tasks.reduce((sum, task) => sum + task.billable_hours, 0);
  const earnedBillableHours = tasks
    .filter(task => task.completed)
    .reduce((sum, task) => sum + task.billable_hours, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nieuw': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Review': return 'bg-purple-100 text-purple-800';
      case 'Voltooid': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project niet gevonden</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">I</span>
                </div>
                <span className="text-xl font-semibold">Innoflow</span>
              </div>
              
              <nav className="flex items-center gap-6">
                <Button variant="ghost" onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Button>
                <span className="text-gray-400">Projecten</span>
                <span className="text-gray-400">Kosten</span>
                <span className="text-gray-400">Doelen</span>
                <span className="text-gray-400">AI Advies</span>
              </nav>
            </div>
            
            <Button variant="ghost" size="sm" className="text-gray-600">
              info
            </Button>
          </div>
        </div>
      </div>

      {/* Project Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-6 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              <p className="text-slate-300">Real-time overzicht van je project voortgang en taken</p>
              <div className="flex items-center gap-4 text-slate-300 mt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {project.client}
                </div>
                {project.start_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(project.start_date).toLocaleDateString('nl-NL')}
                  </div>
                )}
                {project.budget && (
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    {formatCurrency(project.budget)}
                  </div>
                )}
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {project.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Simple Task List - Main Focus */}
        <SimpleTaskList 
          projectId={project.id}
          deliverables={deliverables}
          tasks={tasks}
          onRefresh={fetchProjectData}
        />
      </div>
    </div>
  );
}
