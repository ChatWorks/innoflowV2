import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Plus, Trash2, GripVertical, User, Clock, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';

interface ProjectData {
  name: string;
  client: string;
  totalHours: number;
  projectValue: number;
  numberOfPhases: number;
  isInternal: boolean;
}

interface Task {
  id: string;
  name: string;
  assignedTo: string;
}

interface Deliverable {
  id: string;
  name: string;
  hours: string;
  targetDate: string;
  tasks: Task[];
}

interface Phase {
  id: string;
  name: string;
  targetDate: string;
  deliverables: Deliverable[];
}

export default function ProjectSetupWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // AI proposal parser state
  const [proposalText, setProposalText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState('');

  // Step 1 data
const [projectData, setProjectData] = useState<ProjectData>({
  name: '',
  client: '',
  totalHours: 0,
  projectValue: 0,
  numberOfPhases: 1,
  isInternal: false
});

  // Step 2 data
  const [phases, setPhases] = useState<Phase[]>([]);

  // Initialize phases when moving to step 2
  const initializePhases = () => {
    const newPhases: Phase[] = [];
    for (let i = 1; i <= projectData.numberOfPhases; i++) {
      newPhases.push({
        id: `phase-${i}`,
        name: `Fase ${i}`,
        targetDate: '',
        deliverables: [{
          id: `deliverable-${i}-1`,
          name: '',
          hours: '',
          targetDate: '',
          tasks: [{
            id: `task-${i}-1-1`,
            name: '',
            assignedTo: ''
          }]
        }]
      });
    }
    setPhases(newPhases);
  };

  // Step 1 validation
  const isStep1Valid = () => {
    return projectData.name.trim() !== '' &&
           projectData.totalHours > 0 &&
           projectData.numberOfPhases >= 1 &&
           (!projectData.isInternal
             ? projectData.client.trim() !== '' && projectData.projectValue > 0
             : true);
  };

  // Step 2 validation
  const isStep2Valid = () => {
    return phases.every(phase =>
      phase.deliverables.every(deliverable =>
        deliverable.name.trim() !== '' &&
        deliverable.hours.trim() !== '' &&
        deliverable.tasks.every(task =>
          task.name.trim() !== '' &&
          task.assignedTo.trim() !== ''
        )
      )
    );
  };

  // Calculate budget stats
  const calculateBudgetStats = () => {
    const totalHours = projectData.totalHours;
    const assignedHours = phases.reduce((total, phase) =>
      total + phase.deliverables.reduce((phaseTotal, deliverable) =>
        phaseTotal + (parseFloat(deliverable.hours) || 0), 0), 0);
    const remainingHours = totalHours - assignedHours;
    const percentage = totalHours > 0 ? (assignedHours / totalHours) * 100 : 0;
    
    return { totalHours, assignedHours, remainingHours, percentage };
  };

  // Add deliverable to phase
  const addDeliverable = (phaseId: string) => {
    setPhases(phases.map(phase => {
      if (phase.id === phaseId) {
        const newDeliverable: Deliverable = {
          id: `deliverable-${Date.now()}`,
          name: '',
          hours: '',
          targetDate: '',
          tasks: [{
            id: `task-${Date.now()}`,
            name: '',
            assignedTo: ''
          }]
        };
        return { ...phase, deliverables: [...phase.deliverables, newDeliverable] };
      }
      return phase;
    }));
  };

  // Remove deliverable from phase
  const removeDeliverable = (phaseId: string, deliverableId: string) => {
    setPhases(phases.map(phase => {
      if (phase.id === phaseId && phase.deliverables.length > 1) {
        return {
          ...phase,
          deliverables: phase.deliverables.filter(d => d.id !== deliverableId)
        };
      }
      return phase;
    }));
  };

  // Add task to deliverable
  const addTask = (phaseId: string, deliverableId: string) => {
    setPhases(phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          deliverables: phase.deliverables.map(deliverable => {
            if (deliverable.id === deliverableId) {
              const newTask: Task = {
                id: `task-${Date.now()}`,
                name: '',
                assignedTo: ''
              };
              return { ...deliverable, tasks: [...deliverable.tasks, newTask] };
            }
            return deliverable;
          })
        };
      }
      return phase;
    }));
  };

  // Remove task from deliverable
  const removeTask = (phaseId: string, deliverableId: string, taskId: string) => {
    setPhases(phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          deliverables: phase.deliverables.map(deliverable => {
            if (deliverable.id === deliverableId && deliverable.tasks.length > 1) {
              return {
                ...deliverable,
                tasks: deliverable.tasks.filter(t => t.id !== taskId)
              };
            }
            return deliverable;
          })
        };
      }
      return phase;
    }));
  };

  // Update deliverable
  const updateDeliverable = (phaseId: string, deliverableId: string, field: keyof Deliverable, value: string) => {
    setPhases(phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          deliverables: phase.deliverables.map(deliverable => {
            if (deliverable.id === deliverableId) {
              return { ...deliverable, [field]: value };
            }
            return deliverable;
          })
        };
      }
      return phase;
    }));
  };

  // Update task
  const updateTask = (phaseId: string, deliverableId: string, taskId: string, field: keyof Task, value: string) => {
    setPhases(phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          deliverables: phase.deliverables.map(deliverable => {
            if (deliverable.id === deliverableId) {
              return {
                ...deliverable,
                tasks: deliverable.tasks.map(task => {
                  if (task.id === taskId) {
                    return { ...task, [field]: value };
                  }
                  return task;
                })
              };
            }
            return deliverable;
          })
        };
      }
      return phase;
    }));
  };

  // Handle create project
  const handleCreateProject = async () => {
    setIsCreating(true);
    try {
      // 1. Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([{
          user_id: user?.id,
          name: projectData.name,
          client: projectData.isInternal ? 'Innoworks' : projectData.client,
          total_hours: projectData.totalHours,
          project_value: projectData.isInternal ? null : projectData.projectValue,
          status: 'Nieuw',
          is_internal: projectData.isInternal
        }])
        .select('id, name')
        .single();
      
      if (projectError) throw projectError;
      
      // 2. Create phases and deliverables
      for (const phase of phases) {
        // Create phase first
        const { data: phaseData, error: phaseError } = await supabase
          .from('phases')
          .insert([{
            user_id: user?.id,
            project_id: project.id,
            name: phase.name,
            target_date: phase.targetDate || null
          }])
          .select('id')
          .single();
        
        if (phaseError) throw phaseError;
        
        // Create deliverables for this phase
        for (const deliverable of phase.deliverables) {
          const { data: deliverableData, error: deliverableError } = await supabase
            .from('deliverables')
            .insert([{
              user_id: user?.id,
              project_id: project.id,
              phase_id: phaseData.id,
              title: deliverable.name,
              target_date: deliverable.targetDate || null,
              declarable_hours: parseFloat(deliverable.hours) || 0,
              status: 'Pending'
            }])
            .select('id')
            .single();
          
          if (deliverableError) throw deliverableError;
          
          // 3. Create tasks
          for (const task of deliverable.tasks) {
            const { error: taskError } = await supabase
              .from('tasks')
              .insert([{
                user_id: user?.id,
                deliverable_id: deliverableData.id,
                title: task.name,
                assigned_to: task.assignedTo
              }]);
            
            if (taskError) throw taskError;
          }
        }
      }
      
      toast({
        title: "Project aangemaakt",
        description: `${project.name} is succesvol aangemaakt`
      });
      navigate(`/project/${project.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Kon project niet aanmaken",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Fake progress animation steps - spread over 35 seconds
  const progressSteps = [
    { step: 1, message: "Tekstanalyse starten...", delay: 1000 },
    { step: 2, message: "AI model wordt opgestart...", delay: 3000 },
    { step: 3, message: "Projectscope wordt gedetecteerd...", delay: 6000 },
    { step: 4, message: "Documenten worden geïndexeerd...", delay: 9000 },
    { step: 5, message: "Fases en deliverables identificeren...", delay: 13000 },
    { step: 6, message: "Taken en toewijzingen genereren...", delay: 17000 },
    { step: 7, message: "Budget en tijdschattingen berekenen...", delay: 22000 },
    { step: 8, message: "Projectstructuur optimaliseren...", delay: 26000 },
    { step: 9, message: "Kwaliteitscontrole uitvoeren...", delay: 30000 },
    { step: 10, message: "Resultaat wordt voorbereid...", delay: 33000 }
  ];

  // AI Proposal Analysis with cool animation
  const handleAnalyzeProposal = async () => {
    console.log('handleAnalyzeProposal called with:', proposalText.trim());
    
    if (!proposalText.trim()) {
      console.log('No proposal text entered');
      toast({
        title: "Geen tekst ingevoerd",
        description: "Voer eerst een projectvoorstel in om te analyseren.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(0);
    setAnalysisMessage('');

    // Start fake progress animation
    const startFakeProgress = () => {
      progressSteps.forEach((stepData, index) => {
        setTimeout(() => {
          setAnalysisStep(stepData.step);
          setAnalysisMessage(stepData.message);
        }, stepData.delay);
      });
    };

    startFakeProgress();

    try {
      console.log('Analyzing proposal:', proposalText);
      
      console.log('Calling supabase.functions.invoke...');
      
      const { data, error } = await supabase.functions.invoke('analyze-proposal', {
        body: { proposalText }
      });

      console.log('Supabase function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to analyze proposal');
      }

      if (!data) {
        throw new Error('No data received from analysis');
      }

      console.log('Analysis result:', data);

      // Wait for animation to complete before showing results
      setTimeout(() => {
        setAnalysisStep(11);
        setAnalysisMessage('Klaar! Formulieren worden ingevuld...');

        // Map the AI response to our state
        if (data.project_info) {
          console.log('Mapping project_info:', data.project_info);
          setProjectData(prev => ({
            ...prev,
            name: data.project_info.name || '',
            client: data.project_info.client || '',
            totalHours: data.project_info.totalHours || 0,
            projectValue: data.project_info.projectValue || 0,
            numberOfPhases: data.project_info.numberOfPhases || 1,
          }));
        }

        if (data.phases && Array.isArray(data.phases)) {
          console.log('Mapping phases:', data.phases);
          const mappedPhases = data.phases.map((phase: any, phaseIndex: number) => {
            console.log(`Mapping phase ${phaseIndex + 1}:`, phase);
            return {
              id: `phase-${phaseIndex + 1}`,
              name: phase.name || `Fase ${phaseIndex + 1}`,
              targetDate: phase.targetDate || '',
              deliverables: phase.deliverables?.map((deliverable: any, deliverableIndex: number) => {
                console.log(`Mapping deliverable ${deliverableIndex + 1}:`, deliverable);
                return {
                  id: `deliverable-${phaseIndex + 1}-${deliverableIndex + 1}`,
                  name: deliverable.name || '',
                  hours: deliverable.hours || '',
                  targetDate: deliverable.targetDate || '',
                  tasks: deliverable.tasks?.map((task: any, taskIndex: number) => {
                    console.log(`Mapping task ${taskIndex + 1}:`, task);
                    return {
                      id: `task-${phaseIndex + 1}-${deliverableIndex + 1}-${taskIndex + 1}`,
                      name: task.name || '',
                      assignedTo: task.assignedTo || ''
                    };
                  }) || []
                };
              }) || []
            };
          });

          console.log('Final mapped phases:', mappedPhases);
          setPhases(mappedPhases);
        }

        setTimeout(() => {
          toast({
            title: "Voorstel geanalyseerd! 🎉",
            description: "Het projectvoorstel is succesvol geanalyseerd en de formulieren zijn ingevuld."
          });

          // Clear the proposal text after successful analysis
          setProposalText('');
          setIsAnalyzing(false);
          setAnalysisStep(0);
          setAnalysisMessage('');
        }, 800);

      }, Math.max(0, 35000 - Date.now() + performance.now())); // Ensure animation completes

    } catch (error) {
      console.error('Error analyzing proposal:', error);
      toast({
        title: "Analyse mislukt",
        description: error instanceof Error ? error.message : "Er ging iets mis bij het analyseren van het voorstel. Probeer het opnieuw.",
        variant: "destructive"
      });
      setIsAnalyzing(false);
      setAnalysisStep(0);
      setAnalysisMessage('');
    }
  };

  // Get all tasks for step 3 overview
  const getAllTasks = () => {
    const allTasks: Array<{ phase: string; deliverable: string; task: Task }> = [];
    phases.forEach(phase => {
      phase.deliverables.forEach(deliverable => {
        deliverable.tasks.forEach(task => {
          allTasks.push({ phase: phase.name, deliverable: deliverable.name, task });
        });
      });
    });
    return allTasks;
  };

  const progress = currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100;
  const budgetStats = calculateBudgetStats();

  return (
    <Layout>
      <SEO title="Nieuw project – Innoflow" description="Maak een nieuw project aan met fases, deliverables en taken." />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-hover to-primary p-8 text-white">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">Nieuw Project Aanmaken</h1>
                  <p className="text-primary-foreground/80 text-lg">
                    Stap {currentStep} van 3 - {currentStep === 1 ? 'Project Informatie' : currentStep === 2 ? 'Fases & Deliverables' : 'Overzicht & Bevestiging'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                  onClick={() => navigate('/')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Terug naar Dashboard
                </Button>
              </div>
              <Progress value={progress} className="mt-4 bg-white/20" />
            </div>
          </div>
        </div>

        {/* Step 1: Project Basic Info */}
        {currentStep === 1 && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* AI Proposal Parser */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10 h-fit">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold">
                      AI Project Generator
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Automatisch projectdetails invullen vanuit voorstel
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Plak hier de volledige tekst van het projectvoorstel..."
                  value={proposalText}
                  onChange={(e) => setProposalText(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                {isAnalyzing ? (
                  <div className="space-y-4">
                    {/* Cool Loading Animation */}
                    <div className="relative">
                      <div className="flex items-center justify-center gap-3 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">AI Analyse Bezig</h3>
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full animate-pulse">
                              Stap {analysisStep}/10
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground animate-fade-in">
                            {analysisMessage || "Voorbereiden..."}
                          </p>
                          <div className="mt-3">
                            <Progress 
                              value={(analysisStep / 10) * 100} 
                              className="h-2 animate-pulse"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Analysis Steps Indicator */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {progressSteps.map((step, index) => (
                        <div 
                          key={step.step}
                          className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-300 ${
                            analysisStep >= step.step 
                              ? 'bg-primary/10 text-primary animate-scale-in' 
                              : 'text-muted-foreground'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            analysisStep >= step.step 
                              ? 'bg-primary animate-pulse' 
                              : 'bg-muted-foreground/30'
                          }`} />
                          <span className="truncate">{step.message.replace('...', '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={handleAnalyzeProposal} 
                    disabled={!proposalText.trim()}
                    className="w-full gap-2 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                    size="lg"
                  >
                    <Sparkles className="h-5 w-5" />
                    <span className="font-medium">Analyseer Voorstel</span>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Project Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Project Basis Informatie</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Vul handmatig de projectdetails in of gebruik de AI-analyse hierboven.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Naam *</Label>
                <Input
                  id="projectName"
                  placeholder="Bijv. Website Redesign"
                  value={projectData.name}
                  onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                />
              </div>

{!projectData.isInternal && (
  <div className="space-y-2">
    <Label htmlFor="clientName">Klant Naam *</Label>
    <Input
      id="clientName"
      placeholder="Bijv. Acme Corp"
      value={projectData.client}
      onChange={(e) => setProjectData({ ...projectData, client: e.target.value })}
    />
  </div>
)}

<div className="flex items-center justify-between rounded-md border p-3">
  <div>
    <Label className="text-sm font-medium">Intern (Innoworks)</Label>
    <p className="text-xs text-muted-foreground">Markeer dit project als intern.</p>
  </div>
  <Switch
    checked={projectData.isInternal}
    onCheckedChange={(v) => setProjectData({ ...projectData, isInternal: v })}
  />
</div>

              <div className="space-y-2">
                <Label htmlFor="totalHours">Totaal Declarabele Uren *</Label>
                <Input
                  id="totalHours"
                  type="number"
                  placeholder="40"
                  min="1"
                  value={projectData.totalHours || ''}
                  onChange={(e) => setProjectData({ ...projectData, totalHours: parseInt(e.target.value) || 0 })}
                />
              </div>

              {!projectData.isInternal && (
                <div className="space-y-2">
                  <Label htmlFor="projectValue">Project Waarde (EUR) *</Label>
                  <Input
                    id="projectValue"
                    type="number"
                    placeholder="5000"
                    min="1"
                    value={projectData.projectValue || ''}
                    onChange={(e) => setProjectData({ ...projectData, projectValue: parseInt(e.target.value) || 0 })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="numberOfPhases">Aantal Fases *</Label>
                <Select 
                  value={projectData.numberOfPhases.toString()} 
                  onValueChange={(value) => setProjectData({ ...projectData, numberOfPhases: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(10)].map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1} fase{i > 0 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => {
                    // Only initialize phases if they haven't been set by AI analysis
                    // Check if phases are truly empty (no deliverables with content)
                    const hasAIGeneratedContent = phases.some(phase => 
                      phase.deliverables.some(deliverable => 
                        deliverable.name.trim() !== '' || deliverable.hours !== ''
                      )
                    );
                    
                    if (phases.length === 0 || !hasAIGeneratedContent) {
                      initializePhases();
                    }
                    setCurrentStep(2);
                  }}
                  disabled={!isStep1Valid()}
                  className="gap-2"
                >
                  Volgende Stap
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Step 2: Phases and Deliverables */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Budget Tracking */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4 mb-4">
                  <Badge variant="outline" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Totaal: {budgetStats.totalHours}h
                  </Badge>
                  <Badge variant="outline" className="gap-2">
                    <User className="h-4 w-4" />
                    Toegewezen: {budgetStats.assignedHours.toFixed(1)}h
                  </Badge>
                  <Badge 
                    variant={budgetStats.remainingHours < 0 ? "destructive" : "outline"} 
                    className="gap-2"
                  >
                    Resterend: {budgetStats.remainingHours.toFixed(1)}h
                  </Badge>
                </div>
                <Progress value={Math.min(budgetStats.percentage, 100)} />
                <p className="text-sm text-muted-foreground mt-2">
                  {budgetStats.percentage.toFixed(1)}% van budget toegewezen
                </p>
              </CardContent>
            </Card>

            {/* Phases */}
            <div className="space-y-4">
              {phases.map((phase, phaseIndex) => (
                <Card key={phase.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary/20">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <Input
                          value={phase.name}
                          onChange={(e) => {
                            const newPhases = [...phases];
                            newPhases[phaseIndex].name = e.target.value;
                            setPhases(newPhases);
                          }}
                          className="text-lg font-semibold border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                          placeholder="Fase naam"
                        />
                      </div>
                      <Input
                        type="date"
                        value={phase.targetDate}
                        onChange={(e) => {
                          const newPhases = [...phases];
                          newPhases[phaseIndex].targetDate = e.target.value;
                          setPhases(newPhases);
                        }}
                        className="w-40"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (phases.length > 1) {
                            setPhases(phases.filter((_, i) => i !== phaseIndex));
                          }
                        }}
                        disabled={phases.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Deliverables */}
                    {phase.deliverables.map((deliverable, deliverableIndex) => (
                      <div key={deliverable.id} className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1">
                            <Input
                              value={deliverable.name}
                              onChange={(e) => updateDeliverable(phase.id, deliverable.id, 'name', e.target.value)}
                              placeholder="Deliverable naam"
                              className="font-medium"
                            />
                          </div>
                          <Input
                            type="number"
                            value={deliverable.hours}
                            onChange={(e) => updateDeliverable(phase.id, deliverable.id, 'hours', e.target.value)}
                            placeholder="Uren"
                            className="w-20"
                          />
                          <Input
                            type="date"
                            value={deliverable.targetDate}
                            onChange={(e) => updateDeliverable(phase.id, deliverable.id, 'targetDate', e.target.value)}
                            className="w-40"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDeliverable(phase.id, deliverable.id)}
                            disabled={phase.deliverables.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Tasks */}
                        <div className="space-y-2 ml-4">
                          {deliverable.tasks.map((task, taskIndex) => (
                            <div key={task.id} className="flex items-center gap-2">
                              <Input
                                value={task.name}
                                onChange={(e) => updateTask(phase.id, deliverable.id, task.id, 'name', e.target.value)}
                                placeholder="Taak beschrijving"
                                className="flex-1"
                              />
                              <Select
                                value={task.assignedTo}
                                onValueChange={(value) => updateTask(phase.id, deliverable.id, task.id, 'assignedTo', value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Wie?" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Tijn">Tijn</SelectItem>
                                  <SelectItem value="Twan">Twan</SelectItem>
                                  <SelectItem value="Team">Team</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTask(phase.id, deliverable.id, task.id)}
                                disabled={deliverable.tasks.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addTask(phase.id, deliverable.id)}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Taak Toevoegen
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      variant="outline"
                      onClick={() => addDeliverable(phase.id)}
                      className="gap-2 w-full"
                    >
                      <Plus className="h-4 w-4" />
                      Deliverable Toevoegen
                    </Button>
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={() => {
                  const newPhase: Phase = {
                    id: `phase-${phases.length + 1}`,
                    name: `Fase ${phases.length + 1}`,
                    targetDate: '',
                    deliverables: [{
                      id: `deliverable-${Date.now()}`,
                      name: '',
                      hours: '',
                      targetDate: '',
                      tasks: [{
                        id: `task-${Date.now()}`,
                        name: '',
                        assignedTo: ''
                      }]
                    }]
                  };
                  setPhases([...phases, newPhase]);
                }}
                className="gap-2 w-full"
              >
                <Plus className="h-4 w-4" />
                Fase Toevoegen
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Vorige Stap
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={!isStep2Valid()}
                className="gap-2"
              >
                Volgende Stap
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Overview */}
        {currentStep === 3 && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Project Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Project Overzicht</CardTitle>
                <p className="text-muted-foreground">
                  Controleer alle details voordat je het project aanmaakt
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Project Naam</Label>
                    <p className="text-lg font-semibold">{projectData.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Klant</Label>
                    <p className="text-lg font-semibold">{projectData.client}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Totaal Uren</Label>
                    <p className="text-lg font-semibold">{projectData.totalHours}h</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Project Waarde</Label>
                    <p className="text-lg font-semibold">€{projectData.projectValue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasks Chronological List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Chronologische Takenlijst</CardTitle>
                <p className="text-muted-foreground">
                  Alle taken in volgorde van uitvoering
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getAllTasks().map((item, index) => (
                    <div key={`${item.task.id}-${index}`} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                      <Badge variant="outline" className="shrink-0">
                        {index + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.task.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.phase} • {item.deliverable}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {item.task.assignedTo}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Vorige Stap
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={isCreating}
                className="gap-2"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Project Aanmaken...
                  </>
                ) : (
                  'Project Aanmaken'
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
