import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Clock, User, Target } from 'lucide-react';
import { Project, Deliverable, Task } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import SEO from '@/components/SEO';
import TaskTimer from '@/components/TaskTimer';
import InlineEditField from '@/components/InlineEditField';

export default function TodoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [todoList, setTodoList] = useState<Project | null>(null);
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  useEffect(() => {
    if (!user || !id) return;
    fetchTodoData();
  }, [user, id]);

  const fetchTodoData = async () => {
    if (!user || !id) return;
    
    try {
      setLoading(true);

      // Fetch todo list (project)
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('is_todo_list', true)
        .single();

      if (projectError) throw projectError;
      setTodoList(projectData as Project);

      // Fetch or create main deliverable for this todo list
      let { data: deliverableData, error: deliverableError } = await supabase
        .from('deliverables')
        .select('*')
        .eq('project_id', id)
        .single();

      if (deliverableError && deliverableError.code === 'PGRST116') {
        // No deliverable found, create one
        const { data: newDeliverable, error: createError } = await supabase
          .from('deliverables')
          .insert({
            project_id: id,
            title: 'Taken',
            description: 'Hoofdlijst voor taken',
            status: 'In Progress',
            user_id: user.id
          })
          .select()
          .single();

        if (createError) throw createError;
        deliverableData = newDeliverable;
      } else if (deliverableError) {
        throw deliverableError;
      }

      setDeliverable(deliverableData as Deliverable);

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('deliverable_id', deliverableData.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData as Task[]);

    } catch (error) {
      console.error('Error fetching todo data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch todo data",
        variant: "destructive",
      });
      navigate('/todo');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTodoTitle = async (newTitle: string) => {
    if (!todoList || !newTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ name: newTitle })
        .eq('id', todoList.id);

      if (error) throw error;

      setTodoList({ ...todoList, name: newTitle });
      toast({
        title: "Titel bijgewerkt",
        description: "Todo lijst titel is succesvol gewijzigd",
      });
    } catch (error) {
      console.error('Error updating title:', error);
      toast({
        title: "Error",
        description: "Kon titel niet bijwerken",
        variant: "destructive",
      });
    }
  };

  const handleAddTask = async () => {
    if (!deliverable || !newTaskTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          deliverable_id: deliverable.id,
          title: newTaskTitle,
          assigned_to: newTaskAssignee || null,
          user_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setTasks([data as Task, ...tasks]);
      setNewTaskTitle('');
      setNewTaskAssignee('');
      toast({
        title: "Taak toegevoegd",
        description: "Nieuwe taak is succesvol aangemaakt",
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "Kon taak niet toevoegen",
        variant: "destructive",
      });
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          completed: !task.completed,
          completed_at: !task.completed ? new Date().toISOString() : null
        })
        .eq('id', task.id);

      if (error) throw error;

      setTasks(tasks.map(t => 
        t.id === task.id 
          ? { ...t, completed: !t.completed, completed_at: !t.completed ? new Date().toISOString() : null }
          : t
      ));
    } catch (error) {
      console.error('Error toggling task:', error);
      toast({
        title: "Error",
        description: "Kon taak status niet wijzigen",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.filter(t => t.id !== taskId));
      toast({
        title: "Taak verwijderd",
        description: "Taak is succesvol verwijderd",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Kon taak niet verwijderen",
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

  if (!todoList) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Todo lijst niet gevonden</h2>
            <Button onClick={() => navigate('/todo')}>
              Terug naar Todo Lijsten
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Layout>
      <SEO title={`${todoList.name} – Todo Lijsten – Innoflow`} description={`Beheer taken voor ${todoList.name}`} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => navigate('/todo')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Todo Lijsten
          </Button>
          
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between mb-4">
              <InlineEditField
                value={todoList.name}
                onSave={handleUpdateTodoTitle}
                className="text-3xl font-bold"
                placeholder="Todo lijst titel"
              />
              <Badge variant="secondary">
                {completedTasks}/{totalTasks} voltooid
              </Badge>
            </div>
            
            {totalTasks > 0 && (
              <div className="bg-secondary rounded-full h-2 mb-4">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Add New Task */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nieuwe Taak Toevoegen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Taak titel..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                />
              </div>
              <div className="w-48">
                <Input
                  placeholder="Toegewezen aan..."
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                />
              </div>
              <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Toevoegen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Target className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg font-medium">Nog geen taken</p>
                <p className="text-sm">Voeg je eerste taak toe om te beginnen</p>
              </div>
            </div>
          ) : (
            tasks.map((task) => (
              <Card key={task.id} className={`transition-opacity ${task.completed ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task)}
                      className="h-5 w-5 rounded border-2 text-primary focus:ring-primary"
                    />
                    
                    {/* Task Details */}
                    <div className="flex-1">
                      <div className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </div>
                      {task.assigned_to && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <User className="h-3 w-3" />
                          {task.assigned_to}
                        </div>
                      )}
                    </div>

                    {/* Timer */}
                    {deliverable && (
                      <div className="flex items-center gap-2">
                        <TaskTimer
                          taskId={task.id}
                          taskTitle={task.title}
                          deliverableId={deliverable.id}
                          deliverableTitle={deliverable.title}
                          projectId={todoList.id}
                          projectName={todoList.name}
                        />
                      </div>
                    )}

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Verwijderen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </Layout>
  );
}