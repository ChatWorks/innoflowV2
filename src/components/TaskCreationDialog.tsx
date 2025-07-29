import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, User, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface TaskCreationDialogProps {
  deliverableId: string;
  onTaskCreated: () => void;
}

export default function TaskCreationDialog({ deliverableId, onTaskCreated }: TaskCreationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.assigned_to) {
      toast({
        title: "Verplichte velden",
        description: "Titel en toegewezen persoon zijn verplicht",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // No need to manually set user_id - database trigger handles this automatically
      const { error } = await supabase
        .from('tasks')
        .insert([{
          deliverable_id: deliverableId,
          title: formData.title,
          description: formData.description || null,
          assigned_to: formData.assigned_to,
          completed: false
        }]);

      if (error) throw error;

      toast({
        title: "Taak aangemaakt",
        description: `${formData.title} is toegewezen aan ${formData.assigned_to}`,
      });

      setFormData({
        title: '',
        description: '',
        assigned_to: ''
      });
      setIsOpen(false);
      onTaskCreated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Kon taak niet aanmaken",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nieuwe Taak
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Nieuwe Taak</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Taak Titel *
              </Label>
              <Input
                id="title"
                placeholder="Bijv. Header ontwerp maken"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Beschrijving
              </Label>
              <Textarea
                id="description"
                placeholder="Detailbeschrijving van de taak..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <User className="h-4 w-4" />
                Toegewezen aan *
              </Label>
              <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Kies persoon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tijn">Tijn</SelectItem>
                  <SelectItem value="Twan">Twan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Annuleren
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? "Aanmaken..." : "Taak Aanmaken"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}