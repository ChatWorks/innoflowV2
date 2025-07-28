import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

import { Deliverable, Task } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DeliverableCreationDialog from './DeliverableCreationDialog';
import TaskCreationDialog from './TaskCreationDialog';
import DeliverableTimer from './DeliverableTimer';

interface SimpleTaskListProps {
  projectId: string;
  deliverables: Deliverable[];
  tasks: Task[];
  onRefresh: () => void;
}

export default function SimpleTaskList({ projectId, deliverables, tasks, onRefresh }: SimpleTaskListProps) {
  const { toast } = useToast();

  // Sort deliverables by due date (earliest first)
  const sortedDeliverables = [...deliverables].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

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
        description: `${task.title} door ${task.assigned_to}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Kon taak status niet bijwerken",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <DeliverableCreationDialog projectId={projectId} onDeliverableCreated={onRefresh} />
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {sortedDeliverables.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg mb-2">Nog geen deliverables</p>
              <p className="text-sm">Maak je eerste deliverable aan om te beginnen</p>
            </CardContent>
          </Card>
        ) : (
          sortedDeliverables.map((deliverable) => {
            const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverable.id);
            
            return (
              <Card key={deliverable.id}>
                <CardContent className="p-6">
                  {/* Deliverable Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{deliverable.title}</h3>
                      <Badge variant={deliverable.status === 'Completed' ? 'default' : 'secondary'}>
                        {deliverable.status}
                      </Badge>
                      {deliverable.due_date && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(deliverable.due_date), "dd MMM yyyy", { locale: nl })}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <TaskCreationDialog deliverableId={deliverable.id} onTaskCreated={onRefresh} />
                      <DeliverableTimer 
                        deliverableId={deliverable.id}
                        deliverableTitle={deliverable.title}
                        projectId={projectId}
                      />
                    </div>
                  </div>

                  {deliverable.description && (
                    <p className="text-muted-foreground mb-4">{deliverable.description}</p>
                  )}

                  {/* Tasks */}
                  {deliverableTasks.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded-lg">
                      <p className="text-sm">Nog geen taken - klik op "Nieuwe Taak" om te beginnen</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {deliverableTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleTaskCompletion(task)}
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {task.title}
                              </span>
                              {task.assigned_to && (
                                <Badge variant="outline" className="text-xs">
                                  <User className="h-3 w-3 mr-1" />
                                  {task.assigned_to}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {task.billable_hours}h
                              </Badge>
                            </div>
                            {task.description && (
                              <p className={`text-sm text-muted-foreground ${task.completed ? 'line-through' : ''}`}>
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}