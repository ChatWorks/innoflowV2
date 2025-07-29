import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ACTIVITY_TYPES } from '@/types/lead';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface LeadActivityDialogProps {
  leadId: string;
  isOpen: boolean;
  onClose: () => void;
  onActivityCreated: () => void;
}

export function LeadActivityDialog({ leadId, isOpen, onClose, onActivityCreated }: LeadActivityDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    activity_type: 'Notitie' as const,
    title: '',
    description: '',
    activity_date: new Date().toISOString().split('T')[0],
    activity_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Titel vereist",
        description: "Voer een titel in voor de activiteit.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const activityDateTime = `${formData.activity_date}T${formData.activity_time}:00.000Z`;
      
      const activityData = {
        lead_id: leadId,
        activity_type: formData.activity_type,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        activity_date: activityDateTime,
      };

      // The user_id will be automatically set by the trigger
      const { error } = await supabase
        .from('lead_activities')
        .insert([activityData as any]);

      if (error) {
        console.error('Error creating activity:', error);
        toast({
          title: "Fout bij aanmaken",
          description: "Er is een fout opgetreden bij het aanmaken van de activiteit.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Activiteit toegevoegd",
        description: "De activiteit is succesvol toegevoegd.",
      });

      // Reset form
      setFormData({
        activity_type: 'Notitie',
        title: '',
        description: '',
        activity_date: new Date().toISOString().split('T')[0],
        activity_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      });

      onActivityCreated();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Onverwachte fout",
        description: "Er is een onverwachte fout opgetreden.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nieuwe Activiteit</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity Type */}
          <div>
            <Label htmlFor="activity_type">Type Activiteit</Label>
            <Select value={formData.activity_type} onValueChange={(value) => handleInputChange('activity_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer type" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Korte beschrijving van de activiteit"
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="activity_date">Datum</Label>
              <Input
                id="activity_date"
                type="date"
                value={formData.activity_date}
                onChange={(e) => handleInputChange('activity_date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="activity_time">Tijd</Label>
              <Input
                id="activity_time"
                type="time"
                value={formData.activity_time}
                onChange={(e) => handleInputChange('activity_time', e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              placeholder="Uitgebreide beschrijving van de activiteit..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuleren
            </Button>
            <Button type="submit" disabled={isCreating} className="flex-1">
              {isCreating ? 'Toevoegen...' : 'Activiteit Toevoegen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}