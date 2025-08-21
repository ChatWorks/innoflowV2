import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChatSession {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useProjectChatSessions(projectId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all chat sessions for a project
  const {
    data: sessions = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['project-chat-sessions', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_chat_sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as ChatSession[];
    }
  });

  // Create new chat session
  const createSessionMutation = useMutation({
    mutationFn: async (title: string = 'Nieuwe Chat') => {
      const { data, error } = await supabase
        .from('project_chat_sessions')
        .insert({
          project_id: projectId,
          title,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data as ChatSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-chat-sessions', projectId] });
      toast({
        title: "Nieuwe chat aangemaakt",
        description: "Je kunt nu je vraag stellen"
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij aanmaken chat",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update session title
  const updateSessionMutation = useMutation({
    mutationFn: async ({ sessionId, title }: { sessionId: string; title: string }) => {
      const { error } = await supabase
        .from('project_chat_sessions')
        .update({ title })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-chat-sessions', projectId] });
      toast({
        title: "Chat titel bijgewerkt"
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij bijwerken titel",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete session
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('project_chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-chat-sessions', projectId] });
      toast({
        title: "Chat verwijderd"
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen chat",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    sessions,
    isLoading,
    error,
    createSession: createSessionMutation.mutateAsync,
    updateSession: updateSessionMutation.mutateAsync,
    deleteSession: deleteSessionMutation.mutateAsync,
    isCreating: createSessionMutation.isPending,
    isUpdating: updateSessionMutation.isPending,
    isDeleting: deleteSessionMutation.isPending
  };
}