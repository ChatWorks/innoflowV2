import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProjectMessage } from '@/types/projectMessage';

export function useProjectMessages(projectId: string) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchUnreadCount();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel(`project-messages-${projectId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'project_messages',
            filter: `project_id=eq.${projectId}`
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [projectId]);

  const fetchUnreadCount = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_messages')
        .select('id')
        .eq('project_id', projectId)
        .eq('sender_type', 'client')
        .eq('is_read', false);

      if (error) throw error;
      setUnreadCount((data || []).length);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    unreadCount,
    loading,
    refreshUnreadCount: fetchUnreadCount
  };
}