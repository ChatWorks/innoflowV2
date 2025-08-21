import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectAIChatSidebar } from '@/components/ai-chat/ProjectAIChatSidebar';
import { ProjectAIChatContent } from '@/components/ai-chat/ProjectAIChatContent';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot } from 'lucide-react';
import SEO from '@/components/SEO';
export function ProjectAIChat() {
  const {
    projectId,
    sessionId
  } = useParams<{
    projectId: string;
    sessionId?: string;
  }>();
  const navigate = useNavigate();

  // Fetch project data for context
  const {
    data: project,
    isLoading: projectLoading
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      const {
        data,
        error
      } = await supabase.from('projects').select('*').eq('id', projectId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId
  });

  // Fetch comprehensive project context for AI
  const {
    data: projectContext,
    isLoading: contextLoading
  } = useQuery({
    queryKey: ['project-context', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');

      // Fetch all related data in parallel
      const [projectRes, deliverables, phases, timeEntries, meetings, manualTimeEntries] = await Promise.all([supabase.from('projects').select('*').eq('id', projectId).single(), supabase.from('deliverables').select('*').eq('project_id', projectId), supabase.from('phases').select('*').eq('project_id', projectId), supabase.from('time_entries').select('*').eq('project_id', projectId), supabase.from('project_meetings').select('*').eq('project_id', projectId), supabase.from('manual_time_entries').select('*').eq('project_id', projectId)]);

      // Get tasks for all deliverables
      const tasksRes = deliverables.data?.length > 0 ? await supabase.from('tasks').select('*').in('deliverable_id', deliverables.data.map(d => d.id)) : {
        data: []
      };
      return {
        project: projectRes.data,
        deliverables: deliverables.data || [],
        tasks: tasksRes.data || [],
        phases: phases.data || [],
        timeEntries: timeEntries.data || [],
        meetings: meetings.data || [],
        manualTimeEntries: manualTimeEntries.data || []
      };
    },
    enabled: !!projectId
  });

  // Set document title
  useEffect(() => {
    if (project) {
      document.title = `AI Chat - ${project.name} | Innoflow`;
    } else {
      document.title = 'AI Chat | Innoflow';
    }
    return () => {
      document.title = 'Innoflow';
    };
  }, [project]);
  if (!projectId) {
    navigate('/projects');
    return null;
  }
  if (projectLoading || contextLoading) {
    return <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Bot className="h-8 w-8 mx-auto animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Laden van project gegevens...</p>
        </div>
      </div>;
  }
  return <>
      <SEO title={`AI Chat - ${project?.name || 'Project'}`} description={`AI-gestuurde projectassistent voor ${project?.name}. Krijg inzichten, analyses en aanbevelingen voor je projectbeheer.`} />
      
      <div className="h-screen flex flex-col bg-white">
        {/* Header */}
        <header className="border-b border-gray-200 px-6 py-4 flex items-center gap-4 bg-white">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/project/${projectId}`)} className="gap-2 text-gray-600 hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" />
            Terug naar project
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-gray-700" />
              <h1 className="text-xl font-bold text-gray-900">AI Projectassistent</h1>
              {project && <span className="text-base text-gray-500 font-medium">
                  · {project.name}
                </span>}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white">
            <ProjectAIChatSidebar projectId={projectId} currentSessionId={sessionId} />
          </div>
          
          {/* Chat Content */}
          <div className="flex-1 overflow-hidden bg-gray-50">
            <ProjectAIChatContent sessionId={sessionId} projectContext={projectContext} />
          </div>
        </div>
      </div>
    </>;
}