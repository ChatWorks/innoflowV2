import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ManualTimeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTimeAdded: () => void;
  targetType: 'task' | 'deliverable' | 'phase';
  targetId: string;
  targetName: string;
  projectId: string;
}

export default function ManualTimeDialog({
  isOpen,
  onClose,
  onTimeAdded,
  targetType,
  targetId,
  targetName,
  projectId
}: ManualTimeDialogProps) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes < 1) {
      toast({
        title: "Validatie Error",
        description: "Minimaal 1 minuut moet toegevoegd worden",
        variant: "destructive",
      });
      return;
    }

    if (hours > 23 || minutes > 59) {
      toast({
        title: "Validatie Error", 
        description: "Uren moeten tussen 0-23 zijn en minuten tussen 0-59",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const totalSeconds = totalMinutes * 60;

      // Create manual time entry record
      const entryData = {
        project_id: projectId,
        time_seconds: totalSeconds,
        description: description.trim() || null,
      };

      // Add the specific type ID field
      if (targetType === 'task') {
        (entryData as any).task_id = targetId;
      } else if (targetType === 'deliverable') {
        (entryData as any).deliverable_id = targetId;
      } else if (targetType === 'phase') {
        (entryData as any).phase_id = targetId;
      }

      const { error: entryError } = await supabase
        .from('manual_time_entries' as any)
        .insert(entryData);

      if (entryError) throw entryError;

      // Update the target entity's manual_time_seconds
      const tableName = targetType === 'task' ? 'tasks' : targetType === 'deliverable' ? 'deliverables' : 'phases';
      
      // First, get current manual time
      const { data: currentData } = await supabase
        .from(tableName as any)
        .select('manual_time_seconds')
        .eq('id', targetId)
        .single();

      const currentSeconds = (currentData as any)?.manual_time_seconds || 0;
      const newSeconds = currentSeconds + totalSeconds;

      // Update with new total
      const { error: updateError } = await supabase
        .from(tableName as any)
        .update({ manual_time_seconds: newSeconds } as any)
        .eq('id', targetId);

      if (updateError) throw updateError;

      // Format time for display
      const displayHours = Math.floor(totalMinutes / 60);
      const displayMinutes = totalMinutes % 60;
      const timeText = displayHours > 0 
        ? `${displayHours}h ${displayMinutes > 0 ? displayMinutes + 'm' : ''}`.trim()
        : `${displayMinutes}m`;

      toast({
        title: "Tijd Toegevoegd",
        description: `${timeText} toegevoegd aan "${targetName}"`,
      });

      // Reset form
      setHours(0);
      setMinutes(0);
      setDescription('');
      
      // Trigger refresh
      onTimeAdded();
      onClose();

    } catch (error) {
      console.error('Error adding manual time:', error);
      toast({
        title: "Error",
        description: "Er is een fout opgetreden bij het toevoegen van tijd",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setHours(0);
      setMinutes(0);
      setDescription('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      handleClose();
    }
  };

  const targetTypeLabel = {
    task: 'Taak',
    deliverable: 'Deliverable', 
    phase: 'Fase'
  }[targetType];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tijd Toevoegen
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Voor: <span className="font-medium text-foreground">{targetName}</span>
            <span className="text-xs ml-2 bg-muted px-2 py-1 rounded">{targetTypeLabel}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Uren</Label>
              <div className="relative">
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  max="23"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                  className="pr-12"
                  autoFocus
                  disabled={isLoading}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  uur
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minutes">Minuten</Label>
              <div className="relative">
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => {
                    const newMinutes = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                    setMinutes(newMinutes);
                    
                    // Auto-convert minutes > 59 to hours
                    if (e.target.value && parseInt(e.target.value) >= 60) {
                      const totalMinutes = parseInt(e.target.value);
                      const extraHours = Math.floor(totalMinutes / 60);
                      const remainingMinutes = totalMinutes % 60;
                      setHours(prev => Math.min(23, prev + extraHours));
                      setMinutes(remainingMinutes);
                    }
                  }}
                  className="pr-16"
                  disabled={isLoading}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  min
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving (optioneel)</Label>
            <Textarea
              id="description"
              placeholder="Bijv. Extra tijd voor testing en debugging..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={isLoading || (hours === 0 && minutes === 0)}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Bezig...
                </div>
              ) : (
                'Tijd Toevoegen'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}