import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Euro, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

interface ProjectCreationDialogProps {
  onProjectCreated: () => void;
}

export default function ProjectCreationDialog({ onProjectCreated }: ProjectCreationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({
  name: '',
  client: '',
  description: '',
  budget: '',
  total_hours: '',
  is_internal: false,
});
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.client.trim()) {
      toast({
        title: "Verplichte velden",
        description: "Naam en klant zijn verplicht",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // No need to manually set user_id - database trigger handles this automatically
      const { error } = await supabase
        .from('projects')
        .insert([{
          name: formData.name,
          client: formData.client,
          description: formData.description || null,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          total_hours: formData.total_hours ? parseFloat(formData.total_hours) : 0,
          status: 'Nieuw',
          is_internal: formData.is_internal
        }]);

      if (error) throw error;

      toast({
        title: "Project aangemaakt",
        description: `${formData.name} is succesvol aangemaakt`,
      });

      setFormData({
        name: '',
        client: '',
        description: '',
        budget: '',
        total_hours: '',
        is_internal: false,
      });
      setIsOpen(false);
      onProjectCreated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Kon project niet aanmaken",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Nieuw Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Nieuw Project Aanmaken</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Project Naam *
              </Label>
              <Input
                id="name"
                placeholder="Bijv. Website Redesign"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client" className="text-sm font-medium">
                Klant *
              </Label>
              <Input
                id="client"
                placeholder="Bijv. Acme Corp"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="h-11"
              />
            </div>

<div className="space-y-2">
  <Label htmlFor="description" className="text-sm font-medium">
    Beschrijving
  </Label>
  <Textarea
    id="description"
    placeholder="Korte beschrijving van het project..."
    value={formData.description}
    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
    className="min-h-[80px]"
  />
</div>

<div className="flex items-center justify-between rounded-md border p-3">
  <div>
    <Label className="text-sm font-medium">Intern (Innoworks)</Label>
    <p className="text-xs text-muted-foreground">Markeer dit project als intern.</p>
  </div>
  <Switch
    checked={formData.is_internal}
    onCheckedChange={(v) => setFormData({ ...formData, is_internal: v })}
  />
</div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-sm font-medium flex items-center gap-1">
                  <Euro className="h-4 w-4" />
                  Budget
                </Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="5000"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="h-11"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_hours" className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Totaal Uren
                </Label>
                <Input
                  id="total_hours"
                  type="number"
                  placeholder="40"
                  value={formData.total_hours}
                  onChange={(e) => setFormData({ ...formData, total_hours: e.target.value })}
                  className="h-11"
                  step="0.5"
                  min="0"
                />
              </div>
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
              {isCreating ? "Aanmaken..." : "Project Aanmaken"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}