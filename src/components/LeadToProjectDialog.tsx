import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types/lead';
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
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';

interface LeadToProjectDialogProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onConversionComplete: () => void;
}

export function LeadToProjectDialog({ lead, isOpen, onClose, onConversionComplete }: LeadToProjectDialogProps) {
  const [isConverting, setIsConverting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: `${lead.company_name} Project`,
    client: lead.company_name,
    description: lead.notes || '',
    budget: lead.estimated_budget?.toString() || '',
    project_value: lead.estimated_value?.toString() || '',
    total_hours: '',
    hourly_rate: '75',
    start_date: '',
    end_date: lead.expected_close_date || '',
    is_internal: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || (!formData.is_internal && !formData.client.trim())) {
      toast({
        title: "Vereiste velden",
        description: "Voer een projectnaam en client in.",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);

    try {
      // Create the project
      const projectData = {
        user_id: user?.id,
        name: formData.name.trim(),
        client: formData.is_internal ? 'Innoworks' : formData.client.trim(),
        description: formData.description.trim() || null,
        status: 'Nieuw' as const,
        progress: 0,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        project_value: formData.is_internal ? null : (formData.project_value ? parseFloat(formData.project_value) : null),
        total_hours: formData.total_hours ? parseFloat(formData.total_hours) : 0,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : 75,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_internal: formData.is_internal,
      } as const;

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([projectData])
        .select('id, name')
        .single();

      if (projectError) {
        console.error('Error creating project:', projectError);
        toast({
          title: "Fout bij projectcreatie",
          description: "Er is een fout opgetreden bij het aanmaken van het project.",
          variant: "destructive",
        });
        return;
      }

      // Update the lead to mark as converted
      const { error: leadError } = await supabase
        .from('leads')
        .update({ 
          status: 'Gewonnen',
          converted_to_project_id: project.id 
        })
        .eq('id', lead.id);

      if (leadError) {
        console.error('Error updating lead:', leadError);
        toast({
          title: "Waarschuwing",
          description: "Project is aangemaakt, maar lead kon niet worden bijgewerkt.",
          variant: "destructive",
        });
      }

      // Create a lead activity for the conversion (user_id will be set by trigger)
      await supabase
        .from('lead_activities')
        .insert([{
          lead_id: lead.id,
          activity_type: 'Status Update' as const,
          title: 'Lead geconverteerd naar project',
          description: `Lead succesvol geconverteerd naar project: ${project.name}`,
          activity_date: new Date().toISOString(),
        } as any]);

      toast({
        title: "Conversie succesvol",
        description: "De lead is succesvol geconverteerd naar een project.",
      });

      onConversionComplete();
      onClose();
      
      // Navigate to the new project
      navigate(`/project/${project.id}`);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Onverwachte fout",
        description: "Er is een onverwachte fout opgetreden.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Converteer Lead naar Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div>
            <Label htmlFor="name">Projectnaam *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

{/* Client */}
{!formData.is_internal && (
  <div>
    <Label htmlFor="client">Client *</Label>
    <Input
      id="client"
      value={formData.client}
      onChange={(e) => handleInputChange('client', e.target.value)}
      required
    />
  </div>
)}

{/* Internal toggle */}
<div className="flex items-center justify-between rounded-md border p-3">
  <div>
    <Label className="text-sm font-medium">Intern (Innoworks)</Label>
    <p className="text-xs text-muted-foreground">Markeer dit project als intern.</p>
  </div>
  <Switch
    checked={formData.is_internal}
    onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_internal: v }))}
  />
</div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Budget */}
          <div>
            <Label htmlFor="budget">Budget (€)</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', e.target.value)}
            />
          </div>

          {/* Project Value */}
          {!formData.is_internal && (
            <div>
              <Label htmlFor="project_value">Projectwaarde (€)</Label>
              <Input
                id="project_value"
                type="number"
                step="0.01"
                value={formData.project_value}
                onChange={(e) => handleInputChange('project_value', e.target.value)}
              />
            </div>
          )}

          {/* Total Hours */}
          <div>
            <Label htmlFor="total_hours">Totaal Uren</Label>
            <Input
              id="total_hours"
              type="number"
              step="0.1"
              value={formData.total_hours}
              onChange={(e) => handleInputChange('total_hours', e.target.value)}
            />
          </div>

          {/* Hourly Rate */}
          <div>
            <Label htmlFor="hourly_rate">Uurtarief (€)</Label>
            <Input
              id="hourly_rate"
              type="number"
              step="0.01"
              value={formData.hourly_rate}
              onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="start_date">Startdatum</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end_date">Einddatum</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuleren
            </Button>
            <Button type="submit" disabled={isConverting} className="flex-1">
              {isConverting ? 'Converteren...' : 'Converteer naar Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}