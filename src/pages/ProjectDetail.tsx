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
import { Project, Deliverable, TimeEntry, Task, Phase } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import Layout from '@/components/Layout';
import InlineEditField from '@/components/InlineEditField';
import InlineDateEdit from '@/components/InlineDateEdit';
import IntegratedProjectTimeline from '@/components/IntegratedProjectTimeline';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
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

      // Fetch phases
      const { data: phasesData, error: phasesError } = await supabase
        .from('phases')
        .select('*')
        .eq('project_id', id)
        .order('target_date', { ascending: true });

      if (phasesError) throw phasesError;
      setPhases((phasesData || []) as Phase[]);

      // Fetch deliverables
      const { data: deliverablesData, error: deliverablesError } = await supabase
        .from('deliverables')
        .select('*')
        .eq('project_id', id)
        .order('target_date', { ascending: true });

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

  // Inline editing functions
  const updateProjectValue = async (newValue: string) => {
    const numericValue = parseFloat(newValue) || 0;
    const { error } = await supabase
      .from('projects')
      .update({ project_value: numericValue })
      .eq('id', id);
    
    if (error) throw error;
    
    setProject(prev => prev ? { ...prev, project_value: numericValue } : null);
    toast({
      title: "Project waarde bijgewerkt",
      description: `Nieuwe waarde: €${numericValue.toLocaleString()}`,
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Project niet gevonden</h1>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Hero Section */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-hover to-primary p-8 text-white">
            <div className="relative z-10">
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
                  <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
                  <p className="text-primary-foreground/80 text-lg mb-4">
                    Real-time overzicht van je project voortgang en taken
                  </p>
                   <div className="flex items-center gap-6 text-primary-foreground/80">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{project.client}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4" />
                      <InlineEditField
                        value={project.project_value ? formatCurrency(project.project_value) : "€0"}
                        onSave={(newValue) => updateProjectValue(newValue.replace(/[€.,\s]/g, ''))}
                        placeholder="€0"
                        className="text-primary-foreground/80"
                        type="number"
                        prefix="€"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{project.total_hours}h</span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                  {project.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Project Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Totaal Uren</p>
                  <p className="text-2xl font-bold">{project.total_hours}h</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Project Waarde</p>
                  <p className="text-2xl font-bold">
                    {project.project_value ? formatCurrency(project.project_value) : '€0'}
                  </p>
                </div>
                <Euro className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Verdiende Uren</p>
                  <p className="text-2xl font-bold">{earnedBillableHours}h</p>
                </div>
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Voortgang</p>
                  <p className="text-2xl font-bold">
                    {totalBillableHours > 0 ? Math.round((earnedBillableHours / totalBillableHours) * 100) : 0}%
                  </p>
                </div>
                <PlayCircle className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integrated Project Timeline */}
        <IntegratedProjectTimeline
          project={project}
          phases={phases}
          deliverables={deliverables}
          tasks={tasks}
          onRefresh={fetchProjectData}
          onPhaseUpdate={(phaseId, data) => {
            setPhases(prev => prev.map(phase => 
              phase.id === phaseId ? { ...phase, ...data } : phase
            ));
          }}
          onDeliverableUpdate={(deliverableId, data) => {
            setDeliverables(prev => prev.map(deliverable => 
              deliverable.id === deliverableId ? { ...deliverable, ...data } : deliverable
            ));
          }}
        />
      </main>
    </Layout>
  );
}
