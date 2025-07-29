import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Calendar as CalendarIcon, User, Clock, Euro, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

import { Deliverable, Task } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import DeliverableCreationDialog from './DeliverableCreationDialog';
import TaskCreationDialog from './TaskCreationDialog';

interface SimpleTaskManagementProps {
  projectId: string;
  deliverables: Deliverable[];
  tasks: Task[];
  onRefresh: () => void;
}

export default function SimpleTaskManagement({ projectId, deliverables, tasks, onRefresh }: SimpleTaskManagementProps) {
  const [expandedDeliverables, setExpandedDeliverables] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Expand all deliverables by default
  useEffect(() => {
    setExpandedDeliverables(new Set(deliverables.map(d => d.id)));
  }, [deliverables]);

  const toggleExpanded = (deliverableId: string) => {
    const newExpanded = new Set(expandedDeliverables);
    if (newExpanded.has(deliverableId)) {
      newExpanded.delete(deliverableId);
    } else {
      newExpanded.add(deliverableId);
    }
    setExpandedDeliverables(newExpanded);
  };

  const toggleTaskCompletion = async (task: Task) => {
    try {
      const completed = !task.completed;
      const { error } = await supabase
        .from('tasks')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', task.id);

      if (error) throw error;
      onRefresh();

      toast({
        title: completed ? "Taak voltooid" : "Taak heropend",
        description: completed 
          ? `Taak voltooid door ${task.assigned_to}`
          : `Taak heropend voor ${task.assigned_to}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Kon taak status niet bijwerken",
        variant: "destructive",
      });
    }
  };

  const completeDeliverable = async (deliverable: Deliverable) => {
    try {
      const { error } = await supabase
        .from('deliverables')
        .update({ status: 'Completed' })
        .eq('id', deliverable.id);

      if (error) throw error;
      onRefresh();

      toast({
        title: "Deliverable voltooid",
        description: `${deliverable.title} is gemarkeerd als voltooid`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Kon deliverable niet voltooien",
        variant: "destructive",
      });
    }
  };

  const getDeliverableProgress = (deliverableId: string) => {
    const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverableId);
    if (deliverableTasks.length === 0) return 0;
    const completedTasks = deliverableTasks.filter(t => t.completed);
    return Math.round((completedTasks.length / deliverableTasks.length) * 100);
  };

  const getTotalDeclarableHours = (deliverableId: string) => {
    const deliverable = deliverables.find(d => d.id === deliverableId);
    return deliverable?.declarable_hours || 0;
  };

  const getCompletedTasksCount = (deliverableId: string) => {
    return tasks
      .filter(t => t.deliverable_id === deliverableId && t.completed)
      .length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Deliverables & Taken</h2>
          <p className="text-muted-foreground">Beheer je project deliverables en taken</p>
        </div>
        <DeliverableCreationDialog projectId={projectId} onDeliverableCreated={onRefresh} />
      </div>

      {/* Deliverables */}
      <div className="space-y-4">
        {deliverables.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Circle className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg mb-2">Nog geen deliverables</p>
              <p className="text-sm">Maak je eerste deliverable aan om te beginnen</p>
            </CardContent>
          </Card>
        ) : (
          deliverables.map((deliverable) => {
            const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverable.id);
            const progress = getDeliverableProgress(deliverable.id);
            const totalDeclarable = getTotalDeclarableHours(deliverable.id);
            const completedTasks = getCompletedTasksCount(deliverable.id);
            const isExpanded = expandedDeliverables.has(deliverable.id);

            return (
              <Card key={deliverable.id} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(deliverable.id)}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CardTitle className="text-xl">{deliverable.title}</CardTitle>
                          <Badge variant={deliverable.status === 'Completed' ? 'default' : 'secondary'}>
                            {deliverable.status}
                          </Badge>
                        </div>
                        
                        {deliverable.description && (
                          <p className="text-muted-foreground mb-3">{deliverable.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          {deliverable.due_date && (
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              {format(new Date(deliverable.due_date), "dd MMM yyyy", { locale: nl })}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Circle className="h-4 w-4" />
                            {deliverableTasks.filter(t => t.completed).length}/{deliverableTasks.length} taken
                          </div>
                           <div className="flex items-center gap-1">
                             <Euro className="h-4 w-4" />
                             {totalDeclarable}h declarabel
                           </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Voortgang</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3 ml-4">
                        {deliverable.status !== 'Completed' && progress === 100 && (
                          <Button size="sm" onClick={() => completeDeliverable(deliverable)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Voltooien
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Taken</h4>
                        <TaskCreationDialog deliverableId={deliverable.id} onTaskCreated={onRefresh} />
                      </div>
                      
                      {deliverableTasks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Circle className="h-8 w-8 mx-auto mb-2" />
                          <p>Nog geen taken toegevoegd</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {deliverableTasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={() => toggleTaskCompletion(task)}
                              />
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {task.title}
                                  </h5>
                                  {task.assigned_to && (
                                    <Badge variant="outline" className="text-xs">
                                      <User className="h-3 w-3 mr-1" />
                                      {task.assigned_to}
                                    </Badge>
                                  )}
                                  <Badge variant="secondary" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Timer
                                  </Badge>
                                </div>
                                {task.description && (
                                  <p className={`text-sm text-muted-foreground ${task.completed ? 'line-through' : ''}`}>
                                    {task.description}
                                  </p>
                                )}
                              </div>
                              
                              {task.completed && (
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}