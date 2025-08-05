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
  PlayCircle,
  RotateCcw,
  Globe,
  Plus
} from 'lucide-react';
import { Project, Deliverable, TimeEntry, Task, Phase } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTimer } from '@/contexts/TimerContext';

import Layout from '@/components/Layout';
import InlineEditField from '@/components/InlineEditField';
import InlineDateEdit from '@/components/InlineDateEdit';
import IntegratedProjectTimeline from '@/components/IntegratedProjectTimeline';
import { ClientPortalDialog } from '@/components/ClientPortalDialog';
import { ClientUpdateDialog } from '@/components/ClientUpdateDialog';
import {
  getProjectProgress,
  getTotalProjectTimeSpent,
  formatTimeToHours,
  getProjectEfficiency,
  getEfficiencyColor,
  getEfficiencyLabel,
  getTotalProjectDeclarable
} from '@/utils/progressCalculations';
import EfficiencyDots from '@/components/ui/EfficiencyDots';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPortalDialog, setShowPortalDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const { toast } = useToast();
  const { timeEntryRefreshTrigger } = useTimer();

  useEffect(() => {
    if (id) {
      fetchProjectData();
    }
  }, [id]);

  // Optimized timer refresh logic - only for specific timer data updates
  useEffect(() => {
    if (id && timeEntryRefreshTrigger > 0) {
      console.log('Timer refresh triggered for project:', id);
      // ✅ Only fetchTimeData - NO fetchProjectData cascade
      fetchTimeData();
    }
  }, [timeEntryRefreshTrigger, id]);

  // Real-time subscription for optimal performance
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`project-${id}-changes`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'time_entries', 
        filter: `project_id=eq.${id}` 
      }, () => {
        fetchTimeData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchProjectData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // First, get deliverable IDs for this project
      const { data: deliverablesData, error: deliverablesError } = await supabase
        .from('deliverables')
        .select('*')
        .eq('project_id', id)
        .order('target_date', { ascending: true });

      if (deliverablesError) throw deliverablesError;
      setDeliverables((deliverablesData || []) as Deliverable[]);

      // Now fetch remaining data in parallel using deliverable IDs
      const deliverableIds = (deliverablesData || []).map(d => d.id);
      
      const [
        { data: projectData, error: projectError },
        { data: phasesData, error: phasesError },
        { data: timeData, error: timeError },
        { data: tasksData, error: tasksError }
      ] = await Promise.all([
        supabase.from('projects').select('*').eq('id', id).single(),
        supabase.from('phases').select('*').eq('project_id', id).order('target_date', { ascending: true }),
        supabase.from('time_entries').select('*').eq('project_id', id).order('start_time', { ascending: false }),
        deliverableIds.length > 0 
          ? supabase.from('tasks').select('*').in('deliverable_id', deliverableIds).order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null })
      ]);

      if (projectError) throw projectError;
      if (phasesError) throw phasesError;
      if (timeError) throw timeError;
      if (tasksError) throw tasksError;

      // Set all data with proper typing
      setProject(projectData as Project);
      setPhases((phasesData || []) as Phase[]);
      setTimeEntries((timeData || []) as TimeEntry[]);
      setTasks((tasksData || []) as Task[]);

    } catch (error) {
      console.error('Error fetching project data:', error);
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

  const fetchTimeData = async () => {
    if (!id) return;

    console.log('Fetching time data for project:', id);
    try {
      // Fetch only time entries for refresh - prevent cascade
      const { data: timeData, error: timeError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('project_id', id)
        .order('start_time', { ascending: false });

      if (timeError) throw timeError;
      setTimeEntries((timeData || []) as TimeEntry[]);
      console.log('Time data updated:', timeData?.length || 0, 'entries');
    } catch (error) {
      console.error('Error fetching time data:', error);
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

  // Time-based calculations
  const totalProjectTimeSpent = getTotalProjectTimeSpent(timeEntries, tasks, deliverables, phases);
  const projectProgress = getProjectProgress(phases, deliverables, tasks);
  const projectEfficiency = getProjectEfficiency(deliverables, tasks, timeEntries, phases);
  const totalDeclarableHours = deliverables.reduce((sum, deliverable) => sum + (deliverable.declarable_hours || 0), 0);

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

  const updateProjectClient = async (newValue: string) => {
    const { error } = await supabase
      .from('projects')
      .update({ client: newValue })
      .eq('id', id);
    
    if (error) throw error;
    
    setProject(prev => prev ? { ...prev, client: newValue } : null);
    toast({
      title: "Client bijgewerkt",
      description: `Nieuwe client: ${newValue}`,
    });
  };

  const updateProjectTotalHours = async (newValue: string) => {
    console.log('Starting updateProjectTotalHours with value:', newValue);
    const numericValue = parseFloat(newValue) || 0;
    
    try {
      console.log('Updating project total hours in database...');
      // Update the project's total_hours field
      const { error } = await supabase
        .from('projects')
        .update({ total_hours: numericValue })
        .eq('id', id);
      
      if (error) throw error;
      console.log('Database update successful');
      
      setProject(prev => prev ? { ...prev, total_hours: numericValue } : null);
      console.log('Local state updated');
      
      // ❌ REMOVED: This fetchProjectData() call can cause refresh loops
      // await fetchProjectData();
      
      toast({
        title: "Totaal uren bijgewerkt",
        description: `Nieuwe waarde: ${numericValue}h`,
      });
      console.log('updateProjectTotalHours completed successfully');
    } catch (error) {
      console.error('Error in updateProjectTotalHours:', error);
      toast({
        title: "Error",
        description: "Failed to update total hours",
        variant: "destructive",
      });
    }
  };

  const resetAllTimeEntries = async () => {
    if (!id) return;
    
    try {
      console.log('Starting reset of all time entries for project:', id);
      
      // 1. Delete all time entries for this project
      const { error: timeEntriesError } = await supabase
        .from('time_entries')
        .delete()
        .eq('project_id', id);
      
      if (timeEntriesError) throw timeEntriesError;
      
      // 2. Skip manual time entries table as it doesn't exist in schema
      console.log('Skipping manual time entries table (not in schema)');
      
      // 3. Reset manual_time_seconds to 0 for all tasks in this project
      const taskIds = tasks.map(t => t.id);
      if (taskIds.length > 0) {
        const { error: tasksError } = await supabase
          .from('tasks')
          .update({ manual_time_seconds: 0 } as any)
          .in('id', taskIds);
        
        if (tasksError) throw tasksError;
      }
      
      // 4. Reset manual_time_seconds to 0 for all deliverables in this project
      const deliverableIds = deliverables.map(d => d.id);
      if (deliverableIds.length > 0) {
        const { error: deliverablesError } = await supabase
          .from('deliverables')
          .update({ manual_time_seconds: 0 } as any)
          .in('id', deliverableIds);
        
        if (deliverablesError) throw deliverablesError;
      }
      
      // 5. Reset manual_time_seconds to 0 for all phases in this project
      const phaseIds = phases.map(p => p.id);
      if (phaseIds.length > 0) {
        const { error: phasesError } = await supabase
          .from('phases')
          .update({ manual_time_seconds: 0 } as any)
          .in('id', phaseIds);
        
        if (phasesError) throw phasesError;
      }
      
      console.log('All time data reset successfully');
      
      // Refresh project data to show updated state
      await fetchProjectData();
      
      toast({
        title: "Alle tijd gereset",
        description: "Alle timer data en handmatige tijd is succesvol gereset naar 0",
      });
      
    } catch (error) {
      console.error('Error resetting time entries:', error);
      toast({
        title: "Error",
        description: "Kon tijdgegevens niet resetten",
        variant: "destructive",
      });
    }
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
                className="text-white hover:bg-white/10 mb-6"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Terug naar dashboard
              </Button>
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-5xl font-semibold mb-3">{project.name}</h1>
                  <p className="text-white/90 text-lg mb-6">
                    Real-time overzicht van je project voortgang en taken
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full" 
                         style={{ background: 'rgba(255, 255, 255, 0.15)' }}>
                      <span className="text-base">👤</span>
                      <InlineEditField
                        value={project.client}
                        onSave={updateProjectClient}
                        placeholder="Client naam"
                        className="text-white font-medium text-sm"
                        iconClassName="!text-white hover:!bg-white/20"
                        alwaysShowIcon={true}
                        type="text"
                      />
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full" 
                         style={{ background: 'rgba(255, 255, 255, 0.15)' }}>
                      <span className="text-base">💰</span>
                      <InlineEditField
                        value={project.project_value ? formatCurrency(project.project_value) : "€0"}
                        onSave={(newValue) => updateProjectValue(newValue.replace(/[€.,\s]/g, ''))}
                        placeholder="€0"
                        className="text-white font-medium text-sm"
                        iconClassName="!text-white hover:!bg-white/20"
                        alwaysShowIcon={true}
                        type="number"
                        prefix="€"
                      />
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full" 
                         style={{ background: 'rgba(255, 255, 255, 0.15)' }}>
                      <span className="text-base">⏰</span>
                      <InlineEditField
                        value={`${project.total_hours || 0}h`}
                        onSave={(newValue) => updateProjectTotalHours(newValue.replace(/[h\s]/g, ''))}
                        placeholder="0h"
                        className="text-white font-medium text-sm"
                        iconClassName="!text-white hover:!bg-white/20"
                        alwaysShowIcon={true}
                        type="number"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-end justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowPortalDialog(true)}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Client Portal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Statistics - GESCHEIDEN Voortgang en Efficiency */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-3">Project Voortgang</div>
              <div className="text-2xl font-bold">{projectProgress}%</div>
              <Progress value={projectProgress} className="mt-2" />
            </CardContent>
          </Card>
          
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-3">Project Efficiency</div>
                <div className="text-2xl font-bold mb-2">{projectEfficiency.toFixed(2)}%</div>
                <EfficiencyDots 
                  value={projectEfficiency} 
                  size="lg"
                  showLabel={false}
                  showPercentage={false}
                  className="justify-start"
                />
              </CardContent>
            </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-3">Totaal Declarabel</div>
              <div className="text-2xl font-bold mb-2">{getTotalProjectDeclarable(deliverables)}h</div>
              <div className="w-full bg-blue-100 dark:bg-blue-900/20 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: '100%' }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">Budget beschikbaar</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-muted-foreground">Werkelijk Besteed</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAllTimeEntries}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  title="Reset alle tijd naar 0"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-2xl font-bold mb-2">{formatTimeToHours(totalProjectTimeSpent)}h</div>
              <div className="w-full bg-orange-100 dark:bg-orange-900/20 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${Math.min(100, (formatTimeToHours(totalProjectTimeSpent) / Math.max(1, getTotalProjectDeclarable(deliverables))) * 100)}%` 
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {getTotalProjectDeclarable(deliverables) > 0 
                  ? `${Math.round((formatTimeToHours(totalProjectTimeSpent) / getTotalProjectDeclarable(deliverables)) * 100)}% van budget`
                  : 'Geen budget ingesteld'
                }
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
          timeEntries={timeEntries}
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

      {/* Client Portal Dialog */}
      <ClientPortalDialog
        isOpen={showPortalDialog}
        onClose={() => setShowPortalDialog(false)}
        projectId={id!}
        projectName={project.name}
        clientName={project.client}
      />

      {/* Client Update Dialog */}
      <ClientUpdateDialog
        isOpen={showUpdateDialog}
        onClose={() => setShowUpdateDialog(false)}
        projectId={id!}
        onUpdateCreated={() => {
          // Optionally refresh data when update is created
          console.log('Client update created');
        }}
      />
    </Layout>
  );
}
