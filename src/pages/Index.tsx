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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Project Management</h1>
            <p className="text-muted-foreground mt-1">Beheer je projecten en maximaliseer je productiviteit</p>
          </div>
          <ProjectCreationDialog onProjectCreated={fetchProjects} />
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
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/project/${project.id}`)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {project.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{project.client}</p>
                    </div>
                    <Badge variant={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                  
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Voortgang</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                  
                  {/* Stats */}
                  <div className="flex justify-between text-sm text-muted-foreground">
                    {project.budget && (
                      <div className="flex items-center gap-1">
                        <Euro className="h-4 w-4" />
                        €{project.budget.toLocaleString()}
                      </div>
                    )}
                    {project.total_hours && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {project.total_hours}h
                      </div>
                    )}
                  </div>
                  
                  {/* Date */}
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>
                      Aangemaakt: {format(new Date(project.created_at), "dd MMM yyyy", { locale: nl })}
                    </span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
};

export default Index;
