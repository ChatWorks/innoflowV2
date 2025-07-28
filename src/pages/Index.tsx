import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Euro, Clock, User, ArrowRight, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

import { Project } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProjectCreationDialog from '@/components/ProjectCreationDialog';
import Layout from '@/components/Layout';

const Index = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data as Project[] || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Kon projecten niet laden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nieuw': return 'default';
      case 'In Progress': return 'secondary';
      case 'Review': return 'outline';
      case 'Voltooid': return 'default';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Projecten laden...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
            <p className="text-gray-600 mt-1">Beheer je projecten en maximaliseer je productiviteit</p>
          </div>
          <ProjectCreationDialog onProjectCreated={fetchProjects} />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 text-white">
            <div className="text-3xl font-bold mb-2">{projects.length}</div>
            <div className="text-gray-300">Totaal Projecten</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-white">
            <div className="text-3xl font-bold mb-2">
              {projects.filter(p => p.status === 'In Progress').length}
            </div>
            <div className="text-gray-300">Actieve Projecten</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-white">
            <div className="text-3xl font-bold mb-2">
              {projects.filter(p => p.status === 'Voltooid').length}
            </div>
            <div className="text-gray-300">Voltooid</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-white">
            <div className="text-3xl font-bold mb-2">
              € {projects.reduce((sum, p) => sum + (p.budget || 0), 0).toLocaleString()}
            </div>
            <div className="text-gray-300">Totaal Budget</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Zoek projecten, klanten..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">🔍</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm">Alle</Button>
            <Button variant="outline" size="sm">
              Nieuw <Badge variant="secondary" className="ml-1">
                {projects.filter(p => p.status === 'Nieuw').length}
              </Badge>
            </Button>
            <Button variant="outline" size="sm">
              In Progress <Badge variant="secondary" className="ml-1">
                {projects.filter(p => p.status === 'In Progress').length}
              </Badge>
            </Button>
            <Button variant="outline" size="sm">
              Review <Badge variant="secondary" className="ml-1">
                {projects.filter(p => p.status === 'Review').length}
              </Badge>
            </Button>
            <Button variant="outline" size="sm">
              Voltooid <Badge variant="secondary" className="ml-1">
                {projects.filter(p => p.status === 'Voltooid').length}
              </Badge>
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Nog geen projecten</h3>
              <p className="text-muted-foreground mb-6">Maak je eerste project aan om te beginnen</p>
              <ProjectCreationDialog onProjectCreated={fetchProjects} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'Nieuw': return 'bg-blue-100 text-blue-800';
                  case 'In Progress': return 'bg-yellow-100 text-yellow-800';
                  case 'Review': return 'bg-purple-100 text-purple-800';
                  case 'Voltooid': return 'bg-green-100 text-green-800';
                  default: return 'bg-gray-100 text-gray-800';
                }
              };

              return (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 
                          className="text-xl font-semibold mb-1 cursor-pointer hover:text-blue-600"
                          onClick={() => navigate(`/project/${project.id}`)}
                        >
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-500 mb-3">
                          <User className="h-4 w-4" />
                          <span className="text-sm">{project.client}</span>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(project.status)} text-xs px-2 py-1`}>
                        {project.status}
                      </Badge>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Voortgang</span>
                        <span className="text-sm font-medium">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    {/* Budget */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Budget</span>
                        <span className="text-lg font-bold">
                          € {project.budget?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>

                    {/* Timer and Start Button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">00:00:00</span>
                      </div>
                      <Button size="sm" className="gap-2">
                        ▶ Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </Layout>
  );
};

export default Index;
