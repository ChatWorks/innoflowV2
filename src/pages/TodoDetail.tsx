import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Clock, User, Target, Settings, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { Project, Deliverable, Task, TimeEntry } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import SEO from '@/components/SEO';
import TaskTimer from '@/components/TaskTimer';
import InlineEditField from '@/components/InlineEditField';
import ManualTimeDialog from '@/components/ManualTimeDialog';
import TodoEfficiencyStats from '@/components/TodoEfficiencyStats';
import { useTimer } from '@/contexts/TimerContext';
import { formatSecondsToTime, getTaskTotalTime, getMainTaskTotalTime } from '@/utils/manualTimeUtils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import SubtaskCreationDialog from '@/components/SubtaskCreationDialog';

export default function TodoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { timeEntryRefreshTrigger, lastRefreshProjectId, lastRefreshTaskId } = useTimer();
  
  const [todoList, setTodoList] = useState<Project | null>(null);
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [manualTimeDialog, setManualTimeDialog] = useState<{
    isOpen: boolean;
    taskId?: string;
    taskName?: string;
  }>({ isOpen: false });
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !id) return;
    fetchTodoData();
  }, [user, id]);

  // Listen for timer updates
  useEffect(() => {
    if (timeEntryRefreshTrigger > 0 && lastRefreshProjectId === id) {
      console.log('Timer update detected, refreshing data...');
      fetchTodoData();
    }
  }, [timeEntryRefreshTrigger, lastRefreshProjectId, id]);

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

      // Fetch all tasks with hierarchical structure
      const { data: allTasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('deliverable_id', deliverableData.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Organize tasks into hierarchical structure
      const allTasks = allTasksData as Task[];
      const mainTasks = allTasks.filter(task => !task.is_subtask);
      const subtasks = allTasks.filter(task => task.is_subtask);

      // Attach subtasks to their parent tasks
      const tasksWithSubtasks = mainTasks.map(mainTask => ({
        ...mainTask,
        subtasks: subtasks.filter(subtask => subtask.parent_task_id === mainTask.id)
      }));

      setTasks(tasksWithSubtasks);

      // Fetch time entries
      const { data: timeEntriesData, error: timeEntriesError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('project_id', id);

      if (timeEntriesError) throw timeEntriesError;
      setTimeEntries(timeEntriesData as TimeEntry[]);

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

  const refreshData = async () => {
    await fetchTodoData();
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

    const estimatedHoursNum = parseInt(estimatedHours) || 0;
    const estimatedMinutesNum = parseInt(estimatedMinutes) || 0;
    const totalEstimatedSeconds = (estimatedHoursNum * 60 + estimatedMinutesNum) * 60;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          deliverable_id: deliverable.id,
          title: newTaskTitle,
          assigned_to: newTaskAssignee || null,
          estimated_time_seconds: totalEstimatedSeconds,
          user_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setTasks([data as Task, ...tasks]);
      setNewTaskTitle('');
      setNewTaskAssignee('');
      setEstimatedHours('');
      setEstimatedMinutes('');
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

  const handleToggleTask = async (task: Task, isSubtask = false, parentTaskId?: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          completed: !task.completed,
          completed_at: !task.completed ? new Date().toISOString() : null
        })
        .eq('id', task.id);

      if (error) throw error;

      if (isSubtask && parentTaskId) {
        // Update subtask in parent task
        setTasks(tasks.map(t => 
          t.id === parentTaskId 
            ? { 
                ...t, 
                subtasks: t.subtasks?.map(st => 
                  st.id === task.id 
                    ? { ...st, completed: !st.completed, completed_at: !st.completed ? new Date().toISOString() : null }
                    : st
                ) || []
              }
            : t
        ));
      } else {
        // Update main task
        setTasks(tasks.map(t => 
          t.id === task.id 
            ? { ...t, completed: !t.completed, completed_at: !t.completed ? new Date().toISOString() : null }
            : t
        ));
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      toast({
        title: "Error",
        description: "Kon taak status niet wijzigen",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string, isSubtask = false, parentTaskId?: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      if (isSubtask && parentTaskId) {
        // Remove subtask from parent task
        setTasks(tasks.map(t => 
          t.id === parentTaskId 
            ? { ...t, subtasks: t.subtasks?.filter(st => st.id !== taskId) || [] }
            : t
        ));
      } else {
        // Remove main task (and all its subtasks will be deleted via cascade)
        setTasks(tasks.filter(t => t.id !== taskId));
      }
      
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

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
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

  // Calculate progress including subtasks
  const calculateProgress = () => {
    let completedCount = 0;
    let totalCount = 0;

    tasks.forEach(task => {
      if (task.subtasks && task.subtasks.length > 0) {
        // For tasks with subtasks, count individual subtasks
        totalCount += task.subtasks.length;
        completedCount += task.subtasks.filter(st => st.completed).length;
      } else {
        // For tasks without subtasks, count the main task
        totalCount += 1;
        if (task.completed) completedCount += 1;
      }
    });

    return {
      completedTasks: completedCount,
      totalTasks: totalCount,
      progressPercentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    };
  };

  const { completedTasks, totalTasks, progressPercentage } = calculateProgress();


  return (
    <Layout>
      <SEO title={`${todoList.name} – Todo Lijsten – Innoflow`} description={`Beheer taken voor ${todoList.name}`} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button - Moved to top with dark blue styling */}
        <Button 
          variant="default"
          className="mb-6 bg-slate-800 hover:bg-slate-700 text-white border-slate-800 hover:border-slate-700"
          onClick={() => navigate('/todo')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug naar Todo Lijsten
        </Button>

        {/* Efficiency Statistics */}
        <TodoEfficiencyStats tasks={tasks} timeEntries={timeEntries} />

        {/* Header */}
        <div className="mb-8">
          
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
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="task-title">Taak titel</Label>
                  <Input
                    id="task-title"
                    placeholder="Taak titel..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                  />
                </div>
                <div className="w-48">
                  <Label htmlFor="assignee">Toegewezen aan</Label>
                  <Input
                    id="assignee"
                    placeholder="Toegewezen aan..."
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                  />
                </div>
              </div>
              
              <div className="flex gap-4 items-end">
                <div className="flex gap-2">
                  <div className="w-20">
                    <Label htmlFor="est-hours">Uren</Label>
                    <Input
                      id="est-hours"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                    />
                  </div>
                  <div className="w-20">
                    <Label htmlFor="est-minutes">Min</Label>
                    <Input
                      id="est-minutes"
                      type="number"
                      min="0"
                      max="59"
                      placeholder="0"
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    Geschatte tijd
                  </div>
                </div>
                
                <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()} className="ml-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Toevoegen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List with Subtasks */}
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
            tasks.map((task) => {
              const isExpanded = expandedTasks.has(task.id);
              const hasSubtasks = task.subtasks && task.subtasks.length > 0;
              const mainTaskTime = getMainTaskTotalTime(task, timeEntries, (task as any).manual_time_seconds || 0);
              
              return (
                <Card key={task.id} className="transition-opacity">
                  <CardContent className="p-4">
                    {/* Main Task */}
                    <div className="flex items-center gap-4">
                      {/* Expand/Collapse Button */}
                      {hasSubtasks ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTaskExpansion(task.id)}
                          className="p-1 h-auto"
                        >
                          {isExpanded ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </Button>
                      ) : (
                        <div className="w-8" />
                      )}
                      
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={hasSubtasks ? task.subtasks!.every(st => st.completed) : task.completed}
                        onChange={() => {
                          if (hasSubtasks) {
                            // Toggle all subtasks
                            const allCompleted = task.subtasks!.every(st => st.completed);
                            task.subtasks!.forEach(subtask => {
                              if (subtask.completed === allCompleted) {
                                handleToggleTask(subtask, true, task.id);
                              }
                            });
                          } else {
                            handleToggleTask(task);
                          }
                        }}
                        className="h-5 w-5 rounded border-2 text-primary focus:ring-primary"
                      />
                      
                      {/* Task Details */}
                      <div className="flex-1">
                        <div className={`font-medium ${hasSubtasks ? '' : task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                          {hasSubtasks && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {task.subtasks!.filter(st => st.completed).length}/{task.subtasks!.length}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          {task.assigned_to && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.assigned_to}
                            </div>
                          )}
                          
                          {/* Estimated vs Actual Time */}
                          <div className="flex items-center gap-2">
                            {(task as any).estimated_time_seconds > 0 && (
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                <span>Geschat: {formatSecondsToTime((task as any).estimated_time_seconds)}</span>
                              </div>
                            )}
                            
                            {mainTaskTime > 0 && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Totaal: {formatSecondsToTime(mainTaskTime)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {deliverable && !hasSubtasks && (
                          <TaskTimer
                            taskId={task.id}
                            taskTitle={task.title}
                            deliverableId={deliverable.id}
                            deliverableTitle={deliverable.title}
                            projectId={todoList.id}
                            projectName={todoList.name}
                          />
                        )}
                        
                        {deliverable && !hasSubtasks && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setManualTimeDialog({
                              isOpen: true,
                              taskId: task.id,
                              taskName: task.title
                            })}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Handmatig
                          </Button>
                        )}

                        {deliverable && !hasSubtasks && (
                          <SubtaskCreationDialog
                            parentTaskId={task.id}
                            deliverableId={deliverable.id}
                            onSubtaskCreated={refreshData}
                          />
                        )}
                        
                        {deliverable && hasSubtasks && (
                          <SubtaskCreationDialog
                            parentTaskId={task.id}
                            deliverableId={deliverable.id}
                            onSubtaskCreated={refreshData}
                          />
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Subtasks */}
                    {hasSubtasks && (
                      <Collapsible open={isExpanded}>
                        <CollapsibleContent className="mt-4">
                          <div className="pl-12 space-y-3 border-l-2 border-border ml-4">
                            {task.subtasks!.map((subtask) => {
                              const subtaskTime = getTaskTotalTime(subtask.id, timeEntries, (subtask as any).manual_time_seconds || 0);
                              
                              return (
                                <div key={subtask.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                                  {/* Subtask Checkbox */}
                                  <input
                                    type="checkbox"
                                    checked={subtask.completed}
                                    onChange={() => handleToggleTask(subtask, true, task.id)}
                                    className="h-4 w-4 rounded border-2 text-primary focus:ring-primary"
                                  />
                                  
                                  {/* Subtask Details */}
                                  <div className="flex-1">
                                    <div className={`text-sm font-medium ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                                      {subtask.title}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                      {subtask.assigned_to && (
                                        <div className="flex items-center gap-1">
                                          <User className="h-3 w-3" />
                                          {subtask.assigned_to}
                                        </div>
                                      )}
                                      
                                      {(subtask as any).estimated_time_seconds > 0 && (
                                        <div className="flex items-center gap-1">
                                          <Target className="h-3 w-3" />
                                          <span>Geschat: {formatSecondsToTime((subtask as any).estimated_time_seconds)}</span>
                                        </div>
                                      )}
                                      
                                      {subtaskTime > 0 && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          <span>Werkelijk: {formatSecondsToTime(subtaskTime)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Subtask Actions */}
                                  {deliverable && (
                                    <div className="flex items-center gap-2">
                                      <TaskTimer
                                        taskId={subtask.id}
                                        taskTitle={subtask.title}
                                        deliverableId={deliverable.id}
                                        deliverableTitle={`${task.title} - ${subtask.title}`}
                                        projectId={todoList.id}
                                        projectName={todoList.name}
                                      />
                                      
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setManualTimeDialog({
                                          isOpen: true,
                                          taskId: subtask.id,
                                          taskName: `${task.title} - ${subtask.title}`
                                        })}
                                      >
                                        <Settings className="h-3 w-3" />
                                      </Button>

                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteTask(subtask.id, true, task.id)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Manual Time Dialog */}
        {manualTimeDialog.isOpen && manualTimeDialog.taskId && manualTimeDialog.taskName && todoList && (
          <ManualTimeDialog
            isOpen={manualTimeDialog.isOpen}
            onClose={() => setManualTimeDialog({ isOpen: false })}
            onTimeAdded={refreshData}
            targetType="task"
            targetId={manualTimeDialog.taskId}
            targetName={manualTimeDialog.taskName}
            projectId={todoList.id}
          />
        )}
      </main>
    </Layout>
  );
}