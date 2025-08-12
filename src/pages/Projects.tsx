import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Grid, List } from 'lucide-react';
import { ProjectCard } from '@/components/ProjectCard';
import { Project } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import SEO from '@/components/SEO';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const statusFilters = [
  { label: 'Alle', value: 'all' },
  { label: 'Nieuw', value: 'Nieuw' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Review', value: 'Review' },
  { label: 'Voltooid', value: 'Voltooid' },
];

// Draggable wrapper for each project card
function SortableProject({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'manipulation',
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function Index() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const persistSortOrder = async (original: Project[], ordered: Project[]) => {
    try {
      const updates = ordered
        .map((p, idx) => ({ id: p.id, sort_order: idx + 1 }))
        .filter(({ id, sort_order }) => {
          const prev = original.find(pr => pr.id === id);
          return prev?.sort_order !== sort_order;
        });
      if (updates.length === 0) return;
      await Promise.all(
        updates.map((u) =>
          supabase.from('projects').update({ sort_order: u.sort_order }).eq('id', u.id)
        )
      );
    } catch (e) {
      toast({
        title: 'Fout bij opslaan volgorde',
        description: 'Probeer het opnieuw.',
        variant: 'destructive',
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setProjects((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const newOrder = arrayMove(prev, oldIndex, newIndex);
      persistSortOrder(prev, newOrder);
      return newOrder;
    });
  };

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }
    fetchProjects();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, client, description, status, progress, budget, project_value, total_hours, hourly_rate, sort_order, is_highlighted, start_date, end_date, created_at, updated_at')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(((data || []) as unknown) as Project[]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = () => {
    return statusFilters.slice(1).map(filter => ({
      ...filter,
      count: projects.filter(p => p.status === filter.value).length
    }));
  };

  const totalProjectValue = projects.reduce((sum, project) => sum + (project.project_value || 0), 0);
  const completedProjects = projects.filter(p => p.status === 'Voltooid').length;
  const inProgressProjects = projects.filter(p => p.status === 'In Progress').length;

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
      <SEO title="Projecten – Innoflow" description="Beheer en volg al je projecten op één centrale plek." />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Hero Section */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-hover to-primary p-8 text-white">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    Project Management
                  </h1>
                  <p className="text-primary-foreground/80 text-lg mb-4">
                    Beheer je projecten en maximaliseer je productiviteit
                  </p>
                </div>
                <div>
                  <Button 
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                    onClick={() => navigate('/project/new')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nieuw Project
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-lg p-6 border">
            <div className="text-3xl font-bold text-foreground">{projects.length}</div>
            <div className="text-sm text-muted-foreground">Totaal Projecten</div>
          </div>
          <div className="bg-card rounded-lg p-6 border">
            <div className="text-3xl font-bold text-yellow-600">{inProgressProjects}</div>
            <div className="text-sm text-muted-foreground">Actieve Projecten</div>
          </div>
          <div className="bg-card rounded-lg p-6 border">
            <div className="text-3xl font-bold text-green-600">{completedProjects}</div>
            <div className="text-sm text-muted-foreground">Voltooid</div>
          </div>
          <div className="bg-card rounded-lg p-6 border">
            <div className="text-3xl font-bold text-foreground">
              {new Intl.NumberFormat('nl-NL', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
              }).format(totalProjectValue)}
            </div>
            <div className="text-sm text-muted-foreground">Portfolio Waarde</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Zoek projecten, klanten..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? "default" : "outline"}
                onClick={() => setStatusFilter(filter.value)}
                className="gap-2"
              >
                {filter.label}
                {filter.value !== 'all' && (
                  <Badge variant="secondary" className="ml-1">
                    {getStatusCounts().find(s => s.value === filter.value)?.count || 0}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Search className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Geen projecten gevonden</p>
              <p className="text-sm">Probeer een andere zoekterm of filter</p>
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => navigate(`/project/${project.id}`)}
                onUpdate={fetchProjects} // Refresh homepage na wijzigingen
              />
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
}