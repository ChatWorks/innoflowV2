import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Project } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface TodoCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (todoList: Project) => void;
}

export function TodoCreationDialog({ open, onOpenChange, onSuccess }: TodoCreationDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          client: 'Todo',
          status: 'Nieuw',
          progress: 0,
          is_todo_list: true,
          is_internal: true,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Todo lijst aangemaakt',
        description: `${name} is succesvol aangemaakt`,
      });

      onSuccess(data as Project);
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Error creating todo list:', error);
      toast({
        title: 'Error',
        description: 'Kon todo lijst niet aanmaken',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nieuwe Todo Lijst Aanmaken</DialogTitle>
          <DialogDescription>
            Maak een nieuwe todo lijst aan om je taken te organiseren.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Naam *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. Daily Tasks, Project Voorbereiding..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving (optioneel)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschrijf waar deze todo lijst voor is..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Aanmaken...' : 'Todo Lijst Aanmaken'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}