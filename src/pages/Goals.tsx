import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Goal, GoalCategory, GoalStatus } from '@/types/goal';
import { GoalCreationDialog } from '@/components/GoalCreationDialog';
import { GoalCard } from '@/components/GoalCard';
import { GoalAnalytics } from '@/components/GoalAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Target, TrendingUp, CheckCircle, AlertTriangle, Search, Filter } from 'lucide-react';
import Layout from '@/components/Layout';

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<GoalStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<GoalCategory | 'all'>('all');
  const { toast } = useToast();

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('goals')
        .select('id, user_id, title, description, goal_type, category, status, target_value, current_value, target_unit, deadline, is_completed, completed_at, notification_settings, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type assertion to handle the Json type from database
      const goalsData = (data || []).map(goal => ({
        ...goal,
        notification_settings: typeof goal.notification_settings === 'string' 
          ? JSON.parse(goal.notification_settings) 
          : goal.notification_settings || { enabled: true, frequency: 'daily', time: '09:00' }
      })) as Goal[];

      setGoals(goalsData);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: 'Fout bij laden',
        description: 'Er is een fout opgetreden bij het laden van je doelen.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  useEffect(() => {
    let filtered = goals;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(goal =>
        goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        goal.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(goal => goal.status === statusFilter);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(goal => goal.category === categoryFilter);
    }

    setFilteredGoals(filtered);
  }, [goals, searchTerm, statusFilter, categoryFilter]);

  // Calculate stats
  const completedGoals = goals.filter(goal => goal.is_completed);
  const inProgressGoals = goals.filter(goal => goal.status === 'in_progress');
  const overdueGoals = goals.filter(goal => {
    if (!goal.deadline || goal.is_completed) return false;
    return new Date(goal.deadline) < new Date();
  });

  const completionRate = goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Doelen laden...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doelen Dashboard</h1>
          <p className="text-muted-foreground">
            Track je vooruitgang en bereik je doelen met focus en discipline.
          </p>
        </div>
        <GoalCreationDialog onGoalCreated={fetchGoals} />
      </div>

      {/* Stats Cards */}
      <GoalAnalytics goals={goals} />

      {/* Advanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Doelen</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Active goals tracking
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voltooid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedGoals.length}</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {completionRate}% completion rate
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Uitvoering</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressGoals.length}</div>
            <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Active progress
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{overdueGoals.length}</div>
            <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              Needs attention
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Zoeken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek doelen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value: GoalStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter op status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="not_started">Niet gestart</SelectItem>
                <SelectItem value="in_progress">Bezig</SelectItem>
                <SelectItem value="completed">Voltooid</SelectItem>
                <SelectItem value="overdue">Verlopen</SelectItem>
                <SelectItem value="paused">Gepauzeerd</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={(value: GoalCategory | 'all') => setCategoryFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter op categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle categorieën</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="projects">Projecten</SelectItem>
                <SelectItem value="personal">Persoonlijk</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="financial">Financieel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {goals.length === 0 ? 'Nog geen doelen' : 'Geen doelen gevonden'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {goals.length === 0 
                ? 'Begin met het aanmaken van je eerste doel om je voortgang te tracken.'
                : 'Probeer andere filters of zoektermen.'
              }
            </p>
            {goals.length === 0 && (
              <GoalCreationDialog 
                onGoalCreated={fetchGoals}
                trigger={
                  <Button className="gap-2">
                    <Target className="h-4 w-4" />
                    Eerste Doel Aanmaken
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onUpdate={fetchGoals}
            />
          ))}
        </div>
      )}

      {/* Overdue Goals Warning */}
      {overdueGoals.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Verlopen Doelen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-3">
              Je hebt {overdueGoals.length} doel{overdueGoals.length > 1 ? 'en' : ''} die de deadline hebben overschreden.
            </p>
            <div className="flex flex-wrap gap-2">
              {overdueGoals.map((goal) => (
                <Badge key={goal.id} variant="destructive">
                  {goal.title}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </Layout>
  );
}