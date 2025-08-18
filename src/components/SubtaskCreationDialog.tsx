import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SubtaskCreationDialogProps {
  parentTaskId: string;
  deliverableId: string;
  onSubtaskCreated: () => void;
}

export default function SubtaskCreationDialog({
  parentTaskId,
  deliverableId,
  onSubtaskCreated
}: SubtaskCreationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    assignedTo: '',
    estimatedHours: '',
    estimatedMinutes: ''
  });

  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Titel vereist",
        description: "Voer een titel in voor de subtaak",
        variant: "destructive"
      });
      return;
    }

    const estimatedHoursNum = parseInt(formData.estimatedHours) || 0;
    const estimatedMinutesNum = parseInt(formData.estimatedMinutes) || 0;
    const totalEstimatedSeconds = (estimatedHoursNum * 60 + estimatedMinutesNum) * 60;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          deliverable_id: deliverableId,
          parent_task_id: parentTaskId,
          is_subtask: true,
          title: formData.title,
          assigned_to: formData.assignedTo || null,
          estimated_time_seconds: totalEstimatedSeconds,
          user_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Subtaak aangemaakt",
        description: `${formData.title} is succesvol toegevoegd`,
      });

      setFormData({
        title: '',
        assignedTo: '',
        estimatedHours: '',
        estimatedMinutes: ''
      });
      setIsOpen(false);
      onSubtaskCreated();

    } catch (error) {
      console.error('Error creating subtask:', error);
      toast({
        title: "Fout bij aanmaken",
        description: "Er is een fout opgetreden bij het aanmaken van de subtaak",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Subtaak
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Subtaak Toevoegen</DialogTitle>
          <DialogDescription>
            Voeg een nieuwe subtaak toe aan deze hoofdtaak.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="subtask-title">Titel *</Label>
            <Input
              id="subtask-title"
              placeholder="Subtaak titel..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="subtask-assignee">Toegewezen aan</Label>
            <Input
              id="subtask-assignee"
              placeholder="Naam van de verantwoordelijke..."
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Geschatte tijd
            </Label>
            <div className="flex gap-2 mt-1">
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  placeholder="Uren"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                />
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="Minuten"
                  value={formData.estimatedMinutes}
                  onChange={(e) => setFormData({ ...formData, estimatedMinutes: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isCreating}
          >
            Annuleren
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isCreating || !formData.title.trim()}
          >
            {isCreating ? 'Bezig...' : 'Subtaak Aanmaken'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}