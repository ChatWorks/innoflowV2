import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Plus, Trash2, GripVertical, User, Clock, Bot, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

interface ProjectData {
  name: string;
  client: string;
  totalHours: number;
  projectValue: number;
  numberOfPhases: number;
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

  // Step 1 data
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    client: '',
    totalHours: 0,
    projectValue: 0,
    numberOfPhases: 1
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
           projectData.client.trim() !== '' && 
           projectData.totalHours > 0 && 
           projectData.projectValue > 0 && 
           projectData.numberOfPhases >= 1;
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
          client: projectData.client,
          total_hours: projectData.totalHours,
          project_value: projectData.projectValue,
          status: 'Nieuw'
        }])
        .select()
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
          .select()
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
            .select()
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

  // AI Proposal Analysis
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

      // Map the AI response to our state
      if (data.project_info) {
        console.log('Mapping project_info:', data.project_info);
        setProjectData({
          name: data.project_info.name || '',
          client: data.project_info.client || '',
          totalHours: data.project_info.totalHours || 0,
          projectValue: data.project_info.projectValue || 0,
          numberOfPhases: data.project_info.numberOfPhases || 1
        });
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

      toast({
        title: "Voorstel geanalyseerd! 🎉",
        description: "Het projectvoorstel is succesvol geanalyseerd en de formulieren zijn ingevuld."
      });

      // Clear the proposal text after successful analysis
      setProposalText('');

    } catch (error) {
      console.error('Error analyzing proposal:', error);
      toast({
        title: "Analyse mislukt",
        description: error instanceof Error ? error.message : "Er ging iets mis bij het analyseren van het voorstel. Probeer het opnieuw.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
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
          <div className="max-w-2xl mx-auto space-y-6">
            {/* AI Proposal Parser */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Genereer project van voorstel (AI) 🤖
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Plak de tekst van je projectvoorstel hieronder en laat AI automatisch alle projectdetails invullen.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Plak hier de volledige tekst van het projectvoorstel..."
                  value={proposalText}
                  onChange={(e) => setProposalText(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <Button 
                  onClick={handleAnalyzeProposal} 
                  disabled={isAnalyzing || !proposalText.trim()}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyseren...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4" />
                      Analyseer Voorstel
                    </>
                  )}
                </Button>
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

              <div className="space-y-2">
                <Label htmlFor="clientName">Klant Naam *</Label>
                <Input
                  id="clientName"
                  placeholder="Bijv. Acme Corp"
                  value={projectData.client}
                  onChange={(e) => setProjectData({ ...projectData, client: e.target.value })}
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

        {/* Step 2: Interactive Phases & Deliverables Builder */}
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
            <div className="space-y-6">
              {phases.map((phase) => (
                <Card key={phase.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <CardTitle className="text-xl flex-1">{phase.name}</CardTitle>
                      <div className="space-y-2">
                        <Label htmlFor={`phase-date-${phase.id}`} className="text-sm">Target Datum</Label>
                        <Input
                          id={`phase-date-${phase.id}`}
                          type="date"
                          value={phase.targetDate}
                          onChange={(e) => {
                            setPhases(phases.map(p => 
                              p.id === phase.id ? { ...p, targetDate: e.target.value } : p
                            ));
                          }}
                          className="w-40"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {phase.deliverables.map((deliverable) => (
                      <div key={deliverable.id} className="border rounded-lg p-4 bg-card">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex-1 space-y-2">
                            <Label>Deliverable Naam *</Label>
                            <Input
                              placeholder="Bijv. Homepage Design"
                              value={deliverable.name}
                              onChange={(e) => updateDeliverable(phase.id, deliverable.id, 'name', e.target.value)}
                            />
                          </div>
                          <div className="w-32 space-y-2">
                            <Label>Uren *</Label>
                            <Input
                              type="number"
                              placeholder="20"
                              value={deliverable.hours}
                              onChange={(e) => updateDeliverable(phase.id, deliverable.id, 'hours', e.target.value)}
                            />
                          </div>
                          <div className="w-40 space-y-2">
                            <Label>Target Datum</Label>
                            <Input
                              type="date"
                              value={deliverable.targetDate}
                              onChange={(e) => updateDeliverable(phase.id, deliverable.id, 'targetDate', e.target.value)}
                            />
                          </div>
                          {phase.deliverables.length > 1 && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => removeDeliverable(phase.id, deliverable.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Tasks */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Taken</Label>
                          {deliverable.tasks.map((task, taskIndex) => (
                            <div key={task.id} className="flex items-center gap-3 bg-background rounded-md p-3">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1 space-y-2">
                                <Input
                                  placeholder="Taak naam *"
                                  value={task.name}
                                  onChange={(e) => updateTask(phase.id, deliverable.id, task.id, 'name', e.target.value)}
                                />
                              </div>
                              <div className="w-32 space-y-2">
                                <Select
                                  value={task.assignedTo}
                                  onValueChange={(value) => updateTask(phase.id, deliverable.id, task.id, 'assignedTo', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Toegewezen aan *" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Tijn">Tijn</SelectItem>
                                    <SelectItem value="Twan">Twan</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {deliverable.tasks.length > 1 && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => removeTask(phase.id, deliverable.id, task.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            variant="outline"
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
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Deliverable Toevoegen
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-2">
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

        {/* Step 3: Project Overview & Confirmation */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Project Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Project Samenvatting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Project Naam</p>
                    <p className="font-medium">{projectData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Klant</p>
                    <p className="font-medium">{projectData.client}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Totaal Uren</p>
                    <p className="font-medium">{projectData.totalHours}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Project Waarde</p>
                    <p className="font-medium">€{projectData.projectValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Toegewezen Uren</p>
                    <p className="font-medium">{budgetStats.assignedHours.toFixed(1)}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aantal Fases</p>
                    <p className="font-medium">{projectData.numberOfPhases}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Totaal Taken</p>
                    <p className="font-medium">{getAllTasks().length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task List */}
            <Card>
              <CardHeader>
                <CardTitle>Chronologische Takenlijst</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {phases.map((phase) => (
                    <div key={phase.id}>
                      <h4 className="font-semibold text-lg mb-2">{phase.name}</h4>
                      {phase.deliverables.map((deliverable) => (
                        <div key={deliverable.id} className="ml-4 mb-3">
                          <h5 className="font-medium text-muted-foreground mb-2">📋 {deliverable.name} ({deliverable.hours}h)</h5>
                          {deliverable.tasks.map((task) => (
                            <div key={task.id} className="ml-4 flex items-center gap-3 py-1">
                              <span className="text-sm">✓</span>
                              <span className="flex-1">{task.name}</span>
                              <Badge variant="outline">{task.assignedTo}</Badge>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Vorige Stap
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={isCreating}
                className="gap-2"
                size="lg"
              >
                {isCreating ? "Project Aanmaken..." : "Project Aanmaken"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}