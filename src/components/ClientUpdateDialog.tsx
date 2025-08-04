import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClientUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onUpdateCreated: () => void;
}

export const ClientUpdateDialog = ({
  isOpen,
  onClose,
  projectId,
  onUpdateCreated
}: ClientUpdateDialogProps) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('client_updates')
        .insert({
          project_id: projectId,
          title: title.trim(),
          message: message.trim(),
          is_visible_to_client: isVisible,
        });

      if (error) throw error;

      toast({
        title: "Update Created!",
        description: "Client update has been posted successfully",
      });

      // Reset form
      setTitle('');
      setMessage('');
      setIsVisible(true);
      
      onUpdateCreated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create update",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setMessage('');
      setIsVisible(true);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Client Update</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Update Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Phase 1 Complete"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the progress update for your client..."
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Visible to Client</Label>
              <div className="text-sm text-muted-foreground">
                Show this update in the client portal
              </div>
            </div>
            <Switch
              checked={isVisible}
              onCheckedChange={setIsVisible}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Update'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};