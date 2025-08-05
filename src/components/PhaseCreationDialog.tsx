import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PhaseCreationDialogProps {
  projectId: string;
  onPhaseCreated: () => void;
}

export default function PhaseCreationDialog({ projectId, onPhaseCreated }: PhaseCreationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    declarableHours: ''
  });
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Verplichte velden",
        description: "Fase naam is verplicht",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // No need to manually set user_id - database trigger handles this automatically
      const { error } = await supabase
        .from('phases')
        .insert([{
          project_id: projectId,
          name: formData.name,
          target_date: targetDate?.toISOString().split('T')[0] || null,
          declarable_hours: formData.declarableHours ? parseFloat(formData.declarableHours) : 0
        }]);

      if (error) throw error;

      toast({
        title: "Fase aangemaakt",
        description: `${formData.name} is succesvol aangemaakt`,
      });

      setFormData({
        name: '',
        declarableHours: ''
      });
      setTargetDate(undefined);
      setIsOpen(false);
      onPhaseCreated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Kon fase niet aanmaken",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nieuwe Fase
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Nieuwe Fase</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Fase Naam *
              </Label>
              <Input
                id="name"
                placeholder="Bijv. Ontwerp Fase"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="declarableHours" className="text-sm font-medium">
                Declarabele Uren
              </Label>
              <Input
                id="declarableHours"
                type="number"
                step="0.5"
                min="0"
                placeholder="0"
                value={formData.declarableHours}
                onChange={(e) => setFormData({ ...formData, declarableHours: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                Target Datum
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11",
                      !targetDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetDate ? format(targetDate, "PPP", { locale: nl }) : "Selecteer datum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={targetDate}
                    onSelect={setTargetDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
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
              {isCreating ? "Aanmaken..." : "Fase Aanmaken"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}