import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, User, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProjectMessage } from '@/types/projectMessage';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface ProjectMessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

export function ProjectMessagesDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  projectName 
}: ProjectMessagesDialogProps) {
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && projectId) {
      fetchMessages();
    }
  }, [open, projectId]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_messages')
        .select('id, project_id, sender_type, sender_name, sender_email, subject, message, is_read, created_at, updated_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages((data || []) as ProjectMessage[]);

      // Mark team messages as read
      const unreadTeamMessages = (data || []).filter(
        m => m.sender_type === 'team' && !m.is_read
      );

      if (unreadTeamMessages.length > 0) {
        await supabase
          .from('project_messages')
          .update({ is_read: true })
          .in('id', unreadTeamMessages.map(m => m.id));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Kon berichten niet ophalen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTeamMessage = async () => {
    if (!newMessage.trim() || !newSubject.trim()) {
      toast({
        title: "Incomplete",
        description: "Vul zowel onderwerp als bericht in",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('project_messages')
        .insert({
          project_id: projectId,
          sender_type: 'team',
          subject: newSubject.trim(),
          message: newMessage.trim(),
          is_read: false
        });

      if (error) throw error;

      setNewMessage('');
      setNewSubject('');
      await fetchMessages();

      toast({
        title: "Bericht verzonden",
        description: "Je bericht is toegevoegd aan het project",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Kon bericht niet verzenden",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const getSenderBadgeColor = (senderType: string) => {
    return senderType === 'client' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Project Meldingen - {projectName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nog geen berichten voor dit project</p>
              </div>
            ) : (
              messages.map((message) => (
                <Card key={message.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={getSenderBadgeColor(message.sender_type)}
                        >
                          {message.sender_type === 'client' ? 'Client' : 'Team'}
                        </Badge>
                        {message.sender_name && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {message.sender_name}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(message.created_at), 'dd MMM yyyy, HH:mm', { locale: nl })}
                      </span>
                    </div>
                    <h4 className="font-medium mb-2">{message.subject}</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {message.message}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Send Message Form */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-medium">Nieuw bericht versturen</h3>
            <div className="space-y-3">
              <Input
                placeholder="Onderwerp"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
              <Textarea
                placeholder="Typ je bericht hier..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={sendTeamMessage} 
                disabled={sendingMessage || !newMessage.trim() || !newSubject.trim()}
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" />
                {sendingMessage ? 'Verzenden...' : 'Bericht verzenden'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}