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
import SimpleTaskManagement from '@/components/SimpleTaskManagement';
import ProjectInsights from '@/components/ProjectInsights';

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
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-6 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar dashboard
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              <div className="flex items-center gap-4 text-gray-300">
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
            <Badge className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
          </div>

          {project.description && (
            <p className="mt-4 text-gray-300 max-w-3xl">{project.description}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Project Timer */}
        <ProjectTimer projectId={project.id} projectName={project.name} />

        {/* Project Insights */}
        <ProjectInsights timeEntries={timeEntries} tasks={tasks} />

        {/* Progress & Time Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Voortgang</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Voltooid</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-3" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tijd Gelogd</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{formatDuration(totalTimeLogged)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {timeEntries.length} sessies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Declarabele Uren</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold">
                  {earnedBillableHours}h / {totalBillableHours}h
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {((earnedBillableHours / totalBillableHours) * 100 || 0).toFixed(0)}% verdiend
              </p>
              <Progress 
                value={(earnedBillableHours / totalBillableHours) * 100 || 0} 
                className="h-2 mt-2" 
              />
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tasks">Taken & Deliverables</TabsTrigger>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
            <TabsTrigger value="time">Tijd Tracking</TabsTrigger>
            <TabsTrigger value="overview">Overzicht</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <SimpleTaskManagement 
              projectId={project.id}
              deliverables={deliverables}
              tasks={tasks}
              onRefresh={fetchProjectData}
            />
          </TabsContent>

          <TabsContent value="deliverables" className="space-y-4">
            {deliverables.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Circle className="h-12 w-12 mx-auto mb-4" />
                  <p>Nog geen deliverables toegevoegd</p>
                </CardContent>
              </Card>
            ) : (
              deliverables.map((deliverable) => (
                <Card key={deliverable.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {deliverable.status === 'Completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <h3 className="font-semibold">{deliverable.title}</h3>
                          <Badge className={getStatusColor(deliverable.status)}>
                            {deliverable.status}
                          </Badge>
                        </div>
                        {deliverable.description && (
                          <p className="text-muted-foreground ml-8">{deliverable.description}</p>
                        )}
                        {deliverable.due_date && (
                          <p className="text-sm text-muted-foreground ml-8 mt-1">
                            Deadline: {new Date(deliverable.due_date).toLocaleDateString('nl-NL')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="time" className="space-y-4">
            {timeEntries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4" />
                  <p>Nog geen tijd gelogd</p>
                </CardContent>
              </Card>
            ) : (
              timeEntries.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {entry.end_time ? (
                          <Clock className="h-5 w-5 text-green-600" />
                        ) : (
                          <PlayCircle className="h-5 w-5 text-blue-600" />
                        )}
                        <div>
                          <p className="font-medium">
                            {new Date(entry.start_time).toLocaleDateString('nl-NL')} - {' '}
                            {new Date(entry.start_time).toLocaleTimeString('nl-NL', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                            {entry.end_time && (
                              <span>
                                {' '} tot {new Date(entry.end_time).toLocaleTimeString('nl-NL', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            )}
                          </p>
                          {entry.description && (
                            <p className="text-sm text-muted-foreground">{entry.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {entry.end_time 
                            ? formatDuration(entry.duration_minutes)
                            : 'Actief'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Project Naam</label>
                    <p className="font-semibold">{project.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Klant</label>
                    <p className="font-semibold">{project.client}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Voortgang</label>
                    <p className="font-semibold">{project.progress}%</p>
                  </div>
                  {project.budget && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Budget</label>
                      <p className="font-semibold">{formatCurrency(project.budget)}</p>
                    </div>
                  )}
                  {project.start_date && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Start Datum</label>
                      <p className="font-semibold">{new Date(project.start_date).toLocaleDateString('nl-NL')}</p>
                    </div>
                  )}
                </div>
                {project.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Beschrijving</label>
                    <p className="mt-1">{project.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}