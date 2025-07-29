import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lead, LEAD_STATUSES } from '@/types/lead';
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

interface LeadEditDialogProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: () => void;
}

export function LeadEditDialog({ lead, isOpen, onClose, onLeadUpdated }: LeadEditDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    company_name: lead.company_name,
    contact_person: lead.contact_person || '',
    email: lead.email || '',
    phone: lead.phone || '',
    status: lead.status,
    estimated_budget: lead.estimated_budget?.toString() || '',
    estimated_value: lead.estimated_value?.toString() || '',
    probability: lead.probability?.toString() || '50',
    expected_close_date: lead.expected_close_date || '',
    source: lead.source || '',
    notes: lead.notes || '',
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

    setIsUpdating(true);

    try {
      const updateData = {
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

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', lead.id);

      if (error) {
        console.error('Error updating lead:', error);
        toast({
          title: "Fout bij bijwerken",
          description: "Er is een fout opgetreden bij het bijwerken van de lead.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Lead bijgewerkt",
        description: "De lead is succesvol bijgewerkt.",
      });

      onLeadUpdated();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Onverwachte fout",
        description: "Er is een onverwachte fout opgetreden.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lead Bewerken</DialogTitle>
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
            <Button type="submit" disabled={isUpdating} className="flex-1">
              {isUpdating ? 'Bijwerken...' : 'Bijwerken'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}