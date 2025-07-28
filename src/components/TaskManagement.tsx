import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, CheckCircle, Circle, Edit, Trash2, Euro } from 'lucide-react';
import { Deliverable, Task } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TaskManagementProps {
  projectId: string;
  deliverables: Deliverable[];
  tasks: Task[];
  onRefresh: () => void;
}

export default function TaskManagement({ projectId, deliverables, tasks, onRefresh }: TaskManagementProps) {
  const [newDeliverable, setNewDeliverable] = useState({ title: '', description: '' });
  const [newTask, setNewTask] = useState({ deliverable_id: '', title: '', description: '', billable_hours: 0 });
  const [showDeliverableDialog, setShowDeliverableDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const { toast } = useToast();

  const createDeliverable = async () => {
    if (!newDeliverable.title.trim()) return;

    try {
      const { error } = await supabase
        .from('deliverables')
        .insert([{
          project_id: projectId,
          title: newDeliverable.title,
          description: newDeliverable.description || null,
          status: 'Pending'
        }]);

      if (error) throw error;

      setNewDeliverable({ title: '', description: '' });
      setShowDeliverableDialog(false);
      onRefresh();

      toast({
        title: "Deliverable aangemaakt",
        description: `${newDeliverable.title} is toegevoegd`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Kon deliverable niet aanmaken",
        variant: "destructive",
      });
    }
  };

  const createTask = async () => {
    if (!newTask.title.trim() || !newTask.deliverable_id) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          deliverable_id: newTask.deliverable_id,
          title: newTask.title,
          description: newTask.description || null,
          billable_hours: newTask.billable_hours
        }]);

      if (error) throw error;

      setNewTask({ deliverable_id: '', title: '', description: '', billable_hours: 0 });
      setShowTaskDialog(false);
      onRefresh();

      toast({
        title: "Taak aangemaakt",
        description: `${newTask.title} is toegevoegd`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Kon taak niet aanmaken",
        variant: "destructive",
      });
    }
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
          ? `${task.billable_hours} declarabele uren verdiend`
          : `${task.billable_hours} declarabele uren teruggedraaid`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Kon taak status niet bijwerken",
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

  const getTotalBillableHours = (deliverableId: string) => {
    return tasks
      .filter(t => t.deliverable_id === deliverableId)
      .reduce((sum, task) => sum + task.billable_hours, 0);
  };

  const getEarnedBillableHours = (deliverableId: string) => {
    return tasks
      .filter(t => t.deliverable_id === deliverableId && t.completed)
      .reduce((sum, task) => sum + task.billable_hours, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex gap-2">
        <Dialog open={showDeliverableDialog} onOpenChange={setShowDeliverableDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Deliverable
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe Deliverable</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Deliverable titel"
                value={newDeliverable.title}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, title: e.target.value })}
              />
              <Textarea
                placeholder="Beschrijving (optioneel)"
                value={newDeliverable.description}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })}
              />
              <Button onClick={createDeliverable} className="w-full">
                Aanmaken
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Taak
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe Taak</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <select
                className="w-full p-2 border rounded-md"
                value={newTask.deliverable_id}
                onChange={(e) => setNewTask({ ...newTask, deliverable_id: e.target.value })}
              >
                <option value="">Selecteer deliverable</option>
                {deliverables.map(deliverable => (
                  <option key={deliverable.id} value={deliverable.id}>
                    {deliverable.title}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Taak titel"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
              <Textarea
                placeholder="Beschrijving (optioneel)"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Declarabele uren"
                value={newTask.billable_hours}
                onChange={(e) => setNewTask({ ...newTask, billable_hours: parseFloat(e.target.value) || 0 })}
                step="0.5"
                min="0"
              />
              <Button onClick={createTask} className="w-full">
                Aanmaken
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Deliverables and Tasks */}
      <div className="space-y-4">
        {deliverables.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Circle className="h-12 w-12 mx-auto mb-4" />
              <p>Nog geen deliverables aangemaakt</p>
            </CardContent>
          </Card>
        ) : (
          deliverables.map((deliverable) => {
            const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverable.id);
            const progress = getDeliverableProgress(deliverable.id);
            const totalBillable = getTotalBillableHours(deliverable.id);
            const earnedBillable = getEarnedBillableHours(deliverable.id);

            return (
              <Card key={deliverable.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{deliverable.title}</CardTitle>
                      {deliverable.description && (
                        <p className="text-muted-foreground mt-1">{deliverable.description}</p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {deliverableTasks.filter(t => t.completed).length}/{deliverableTasks.length} taken
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Voortgang</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Declarabel: {earnedBillable}h / {totalBillable}h</span>
                      <span className="flex items-center gap-1">
                        <Euro className="h-3 w-3" />
                        {((earnedBillable / totalBillable) * 100 || 0).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {deliverableTasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nog geen taken toegevoegd aan deze deliverable
                    </p>
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
                            <div className="flex items-center gap-2">
                              <h4 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {task.title}
                              </h4>
                              <Badge variant="secondary" className="text-xs">
                                {task.billable_hours}h
                              </Badge>
                            </div>
                            {task.description && (
                              <p className={`text-sm text-muted-foreground mt-1 ${task.completed ? 'line-through' : ''}`}>
                                {task.description}
                              </p>
                            )}
                          </div>
                          
                          {task.completed && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
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