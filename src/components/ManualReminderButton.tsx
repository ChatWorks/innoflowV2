import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Goal } from '@/types/goal';
import { Mail, Send, Loader2 } from 'lucide-react';

interface ManualReminderProps {
  goal: Goal;
  userEmail: string;
}

export function ManualReminderButton({ goal, userEmail }: ManualReminderProps) {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const sendManualReminder = async () => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-goal-reminder', {
        body: {
          goalId: goal.id,
          userEmail: userEmail,
          type: 'manual'
        }
      });

      if (error) throw error;

      toast({
        title: '📧 Reminder verzonden',
        description: `Een email reminder is verzonden naar ${userEmail}`,
      });

    } catch (error) {
      console.error('Error sending manual reminder:', error);
      toast({
        title: 'Fout bij verzenden',
        description: 'Er is een fout opgetreden bij het verzenden van de reminder.',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      onClick={sendManualReminder}
      disabled={isSending}
      size="sm"
      variant="outline"
      className="gap-2"
    >
      {isSending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mail className="h-4 w-4" />
      )}
      {isSending ? 'Verzenden...' : 'Test Reminder'}
    </Button>
  );
}