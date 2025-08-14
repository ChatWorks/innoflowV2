import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { TodoListCard } from '@/components/TodoListCard';
import { TodoCreationDialog } from '@/components/TodoCreationDialog';
import { Project } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import SEO from '@/components/SEO';

export default function TodoLists() {
  const [todoLists, setTodoLists] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setTodoLists([]);
      setLoading(false);
      return;
    }
    fetchTodoLists();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('todo-lists-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: 'is_todo_list=eq.true',
        },
        () => {
          fetchTodoLists();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchTodoLists = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, client, description, status, progress, budget, project_value, total_hours, hourly_rate, sort_order, is_highlighted, is_internal, start_date, end_date, created_at, updated_at, is_todo_list')
        .eq('user_id', user.id)
        .eq('is_todo_list', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTodoLists(((data || []) as unknown) as Project[]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch todo lists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTodoLists = todoLists.filter(todoList =>
    todoList.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (todoList.description && todoList.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="Todo Lijsten – Innoflow" description="Beheer je todo lijsten en taken efficiënt." />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Todo Hero Section */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-hover to-primary p-8 text-white">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    Todo Lijsten
                  </h1>
                  <p className="text-primary-foreground/80 text-lg mb-4">
                    Organiseer je taken en behaal je doelen
                  </p>
                </div>
                <div>
                  <Button 
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nieuwe Todo Lijst
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-lg p-6 border">
            <div className="text-3xl font-bold text-foreground">{todoLists.length}</div>
            <div className="text-sm text-muted-foreground">Totaal Todo Lijsten</div>
          </div>
          <div className="bg-card rounded-lg p-6 border">
            <div className="text-3xl font-bold text-yellow-600">
              {todoLists.filter(t => t.status === 'In Progress').length}
            </div>
            <div className="text-sm text-muted-foreground">Actieve Lijsten</div>
          </div>
          <div className="bg-card rounded-lg p-6 border">
            <div className="text-3xl font-bold text-green-600">
              {todoLists.filter(t => t.status === 'Voltooid').length}
            </div>
            <div className="text-sm text-muted-foreground">Voltooid</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Zoek todo lijsten..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Todo Lists Grid - 6 per row */}
        {filteredTodoLists.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Search className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Geen todo lijsten gevonden</p>
              <p className="text-sm">Maak je eerste todo lijst aan om te beginnen</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {filteredTodoLists.map((todoList) => (
              <TodoListCard
                key={todoList.id}
                todoList={todoList}
                onClick={() => navigate(`/todo/${todoList.id}`)}
                onUpdate={fetchTodoLists}
              />
            ))}
          </div>
        )}

        {/* Creation Dialog */}
        <TodoCreationDialog 
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={(newTodoList) => {
            setShowCreateDialog(false);
            navigate(`/todo/${newTodoList.id}`);
            fetchTodoLists();
          }}
        />
      </main>
    </Layout>
  );
}