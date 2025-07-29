import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Phase } from '@/types/project';

interface DeliverableCreationDialogProps {
  projectId: string;
  onDeliverableCreated: () => void;
}

export default function DeliverableCreationDialog({ projectId, onDeliverableCreated }: DeliverableCreationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    billable_hours: '',
    phase_id: ''
  });
  const [phases, setPhases] = useState<Phase[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPhases();
  }, [projectId]);

  const fetchPhases = async () => {
    const { data, error } = await supabase
      .from('phases')
      .select('*')
      .eq('project_id', projectId)
      .order('target_date', { ascending: true });
    
    if (!error && data) {
      setPhases(data as Phase[]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.phase_id) {
      toast({
        title: "Verplichte velden",
        description: "Titel en fase zijn verplicht",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    try {
      const { error } = await supabase
        .from('deliverables')
        .insert([{
          project_id: projectId,
          phase_id: formData.phase_id,
          title: formData.title,
          description: formData.description || null,
          target_date: dueDate?.toISOString().split('T')[0] || null,
          status: 'Pending'
        }]);

      if (error) throw error;

      toast({
        title: "Deliverable aangemaakt",
        description: `${formData.title} is succesvol aangemaakt`,
      });

      setFormData({
        title: '',
        description: '',
        billable_hours: '',
        phase_id: ''
      });
      setDueDate(undefined);
      setIsOpen(false);
      onDeliverableCreated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Kon deliverable niet aanmaken",
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
          Nieuwe Deliverable
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Nieuwe Deliverable</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phase" className="text-sm font-medium">
                Koppel aan Fase *
              </Label>
              <Select value={formData.phase_id} onValueChange={(value) => setFormData({...formData, phase_id: value})}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecteer fase" />
                </SelectTrigger>
                <SelectContent>
                  {phases.map(phase => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.name} {phase.target_date ? `(${format(new Date(phase.target_date), 'dd MMM', { locale: nl })})` : '(Geen datum)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Deliverable Titel *
              </Label>
              <Input
                id="title"
                placeholder="Bijv. Homepage Design"
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
                placeholder="Beschrijving van de deliverable..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[80px]"
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
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP", { locale: nl }) : "Selecteer datum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
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
              {isCreating ? "Aanmaken..." : "Deliverable Aanmaken"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}