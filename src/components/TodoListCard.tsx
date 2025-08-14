import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MoreVertical, Trash2, CheckCircle2, Target, PlayCircle } from 'lucide-react';
import { Project, Task, Deliverable } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TodoListCardProps {
  todoList: Project;
  onClick: () => void;
  onUpdate?: () => void;
}

const getStatusColor = (status: Project['status']) => {
  switch (status) {
    case 'Nieuw': return 'bg-primary/10 text-primary hover:bg-primary/20';
    case 'In Progress': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'Review': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    case 'Voltooid': return 'bg-green-100 text-green-800 hover:bg-green-200';
    default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const getStatusDisplay = (status: Project['status'], progress: number) => {
  // Voor actieve lijsten (< 100% progress), toon "Actief" in plaats van "Nieuw"
  if (progress < 100 && status === 'Nieuw') {
    return 'Actief';
  }
  return status;
};

export function TodoListCard({ todoList, onClick, onUpdate }: TodoListCardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, [todoList.id]);

  const fetchTasks = async () => {
    try {
      // First get the deliverable for this todo list
      const { data: deliverableData } = await supabase
        .from('deliverables')
        .select('id')
        .eq('project_id', todoList.id)
        .single();

      if (deliverableData) {
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('id, title, completed')
          .eq('deliverable_id', deliverableData.id);

        setTasks((tasksData || []) as Task[]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetStatus = async (newStatus: Project['status']) => {
    try {
      if (newStatus === todoList.status) return;
      
      // Calculate and update progress based on task completion
      const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      await supabase.from('projects').update({ 
        status: newStatus,
        progress: newProgress
      } as any).eq('id', todoList.id);
      
      toast({ title: 'Status bijgewerkt', description: `${todoList.name} → ${newStatus}` });
      onUpdate?.();
    } catch (error) {
      console.error('Error setting status:', error);
      toast({ title: 'Fout', description: 'Kon status niet bijwerken', variant: 'destructive' });
    }
  };

  const handleDeleteTodoList = async () => {
    try {
      setDeleting(true);

      // Delete in order: time_entries → tasks → deliverables → project
      await supabase.from('time_entries').delete().eq('project_id', todoList.id);
      
      const { data: deliverableIds } = await supabase
        .from('deliverables')
        .select('id')
        .eq('project_id', todoList.id);
      
      if (deliverableIds && deliverableIds.length > 0) {
        await supabase
          .from('tasks')
          .delete()
          .in('deliverable_id', deliverableIds.map(d => d.id));
      }
      
      await supabase.from('deliverables').delete().eq('project_id', todoList.id);
      const { error } = await supabase.from('projects').delete().eq('id', todoList.id);
      
      if (error) throw error;

      toast({
        title: "Todo Lijst Verwijderd",
        description: `${todoList.name} is succesvol verwijderd`,
      });
      
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting todo list:', error);
      toast({
        title: "Error",
        description: "Kon todo lijst niet verwijderen",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Auto-update project progress when tasks change
  useEffect(() => {
    const updateProgress = async () => {
      if (!loading && totalTasks > 0) {
        const newProgress = Math.round((completedTasks / totalTasks) * 100);
        if (newProgress !== todoList.progress) {
          try {
            await supabase.from('projects').update({ 
              progress: newProgress 
            }).eq('id', todoList.id);
            onUpdate?.();
          } catch (error) {
            console.error('Error updating progress:', error);
          }
        }
      }
    };
    updateProgress();
  }, [completedTasks, totalTasks, loading, todoList.id, todoList.progress, onUpdate]);

  return (
    <Card 
      className={cn(
        "group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card/50 backdrop-blur-sm relative h-32 cursor-pointer",
        todoList.is_highlighted ? "ring-2 ring-primary" : "border"
      )}
    >
      {/* Dropdown Menu */}
      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
              Todo Lijst Openen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSetStatus('Nieuw'); }}>
              <Target className="h-4 w-4 mr-2" />
              Markeer als Nieuw
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSetStatus('In Progress'); }}>
              <PlayCircle className="h-4 w-4 mr-2" />
              Markeer als Actief
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSetStatus('Voltooid'); }}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Markeer als Voltooid
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Verwijderen
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Todo Lijst Verwijderen</AlertDialogTitle>
                  <AlertDialogDescription>
                    Weet je zeker dat je "{todoList.name}" wilt verwijderen? 
                    Deze actie kan niet ongedaan worden gemaakt. Alle taken worden permanent verwijderd.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteTodoList}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Verwijderen..." : "Definitief Verwijderen"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Card Content */}
      <div className="h-full cursor-pointer" onClick={onClick}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between pr-6">
            <CardTitle className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
              {todoList.name}
            </CardTitle>
            <Badge className={`text-xs ${getStatusColor(todoList.status)}`}>
              {getStatusDisplay(todoList.status, progressPercentage)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 pb-3">
          {loading ? (
            <div className="space-y-1">
              <div className="h-3 bg-muted animate-pulse rounded"></div>
              <div className="h-2 bg-muted animate-pulse rounded w-2/3"></div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                {totalTasks > 0 ? `${completedTasks}/${totalTasks} taken voltooid` : 'Geen taken'}
              </div>
              {totalTasks > 0 && (
                <div className="bg-secondary rounded-full h-1">
                  <div 
                    className="bg-primary h-1 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}