import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  message_type: 'user' | 'ai';
  content: string;
  created_at: string;
}

export function useProjectChatMessages(sessionId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all messages for a session
  const {
    data: messages = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['project-chat-messages', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('project_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!sessionId
  });

  // Add message to session
  const addMessageMutation = useMutation({
    mutationFn: async ({ content, type }: { content: string; type: 'user' | 'ai' }) => {
      if (!sessionId) throw new Error('Geen sessie geselecteerd');
      
      const { data, error } = await supabase
        .from('project_chat_messages')
        .insert({
          session_id: sessionId,
          message_type: type,
          content,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data as ChatMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-chat-messages', sessionId] });
    },
    onError: (error) => {
      toast({
        title: "Fout bij versturen bericht",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Send AI message (calls edge function)
  const sendAIMessageMutation = useMutation({
    mutationFn: async ({ message, projectContext }: { message: string; projectContext: any }) => {
      if (!sessionId) throw new Error('Geen sessie geselecteerd');

      // First add user message
      await addMessageMutation.mutateAsync({ content: message, type: 'user' });

      // Call AI edge function
      const { data, error } = await supabase.functions.invoke('project-ai-chat', {
        body: {
          message,
          projectContext,
          chatHistory: messages.slice(-10) // Last 10 messages for context
        }
      });

      if (error) throw error;

      // Add AI response
      await addMessageMutation.mutateAsync({ content: data.response, type: 'ai' });

      return data.response;
    },
    onError: (error) => {
      toast({
        title: "Fout bij AI antwoord",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    messages,
    isLoading,
    error,
    addMessage: addMessageMutation.mutateAsync,
    sendAIMessage: sendAIMessageMutation.mutateAsync,
    isAddingMessage: addMessageMutation.isPending,
    isSendingAI: sendAIMessageMutation.isPending
  };
}