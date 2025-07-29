import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LEAD_STATUSES } from '@/types/lead';
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

interface LeadCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: () => void;
}

export function LeadCreationDialog({ isOpen, onClose, onLeadCreated }: LeadCreationDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    status: 'Nieuw' as const,
    estimated_budget: '',
    estimated_value: '',
    probability: '50',
    expected_close_date: '',
    source: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name.trim()) {
      toast({
        title: "Bedrijfsnaam vereist",
        description: "Voer een bedrijfsnaam in.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const leadData = {
        company_name: formData.company_name.trim(),
        contact_person: formData.contact_person.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        status: formData.status,
        estimated_budget: formData.estimated_budget ? parseFloat(formData.estimated_budget) : null,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
        probability: parseInt(formData.probability),
        expected_close_date: formData.expected_close_date || null,
        source: formData.source.trim() || null,
        notes: formData.notes.trim() || null,
      };

      // The user_id will be automatically set by the trigger
      const { error } = await supabase
        .from('leads')
        .insert([leadData as any]);

      if (error) {
        console.error('Error creating lead:', error);
        toast({
          title: "Fout bij aanmaken",
          description: "Er is een fout opgetreden bij het aanmaken van de lead.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Lead aangemaakt",
        description: "De lead is succesvol aangemaakt.",
      });

      // Reset form
      setFormData({
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        status: 'Nieuw',
        estimated_budget: '',
        estimated_value: '',
        probability: '50',
        expected_close_date: '',
        source: '',
        notes: '',
      });

      onLeadCreated();
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nieuwe Lead Aanmaken</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name */}
          <div>
            <Label htmlFor="company_name">Bedrijfsnaam *</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              required
            />
          </div>

          {/* Contact Person */}
          <div>
            <Label htmlFor="contact_person">Contactpersoon</Label>
            <Input
              id="contact_person"
              value={formData.contact_person}
              onChange={(e) => handleInputChange('contact_person', e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Telefoon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer status" />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estimated Budget */}
          <div>
            <Label htmlFor="estimated_budget">Geschat Budget (€)</Label>
            <Input
              id="estimated_budget"
              type="number"
              step="0.01"
              value={formData.estimated_budget}
              onChange={(e) => handleInputChange('estimated_budget', e.target.value)}
            />
          </div>

          {/* Estimated Value */}
          <div>
            <Label htmlFor="estimated_value">Geschatte Waarde (€)</Label>
            <Input
              id="estimated_value"
              type="number"
              step="0.01"
              value={formData.estimated_value}
              onChange={(e) => handleInputChange('estimated_value', e.target.value)}
            />
          </div>

          {/* Probability */}
          <div>
            <Label htmlFor="probability">Kans op Sluiting (%)</Label>
            <Input
              id="probability"
              type="number"
              min="0"
              max="100"
              value={formData.probability}
              onChange={(e) => handleInputChange('probability', e.target.value)}
            />
          </div>

          {/* Expected Close Date */}
          <div>
            <Label htmlFor="expected_close_date">Verwachte Sluitingsdatum</Label>
            <Input
              id="expected_close_date"
              type="date"
              value={formData.expected_close_date}
              onChange={(e) => handleInputChange('expected_close_date', e.target.value)}
            />
          </div>

          {/* Source */}
          <div>
            <Label htmlFor="source">Bron</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => handleInputChange('source', e.target.value)}
              placeholder="Website, referral, etc."
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notities</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuleren
            </Button>
            <Button type="submit" disabled={isCreating} className="flex-1">
              {isCreating ? 'Aanmaken...' : 'Lead Aanmaken'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}