import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MeetingCreationDialogProps {
  projectId: string;
  onCreated?: () => void;
}

export default function MeetingCreationDialog({ projectId, onCreated }: MeetingCreationDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setDate(new Date());
    setTime('');
    setSubject('');
    setDescription('');
  };

  const createMeeting = async () => {
    if (!date || !subject.trim()) {
      toast({ title: 'Vereist', description: 'Datum en onderwerp zijn verplicht', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        project_id: projectId,
        meeting_date: format(date, 'yyyy-MM-dd'),
        subject: subject.trim(),
        description: description.trim() || null,
      };
      if (time.trim()) payload.meeting_time = time + (time.length === 5 ? ':00' : '');

      const { error } = await supabase.from('project_meetings').insert(payload);
      if (error) throw error;

      toast({ title: 'Meeting toegevoegd', description: `${subject} is ingepland` });
      setOpen(false);
      resetForm();
      onCreated?.();
    } catch (err) {
      console.error('Error creating meeting', err);
      toast({ title: 'Fout', description: 'Kon meeting niet toevoegen', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Nieuwe Meeting
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuwe Meeting</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm text-muted-foreground">Datum</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Kies datum</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-muted-foreground">Tijd (optioneel)</label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-muted-foreground">Onderwerp</label>
            <Input
              placeholder="Bijv. Kick-off met klant"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-muted-foreground">Omschrijving (optioneel)</label>
            <Textarea
              placeholder="Korte omschrijving of agenda"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Annuleren
            </Button>
            <Button onClick={createMeeting} disabled={saving || !subject.trim() || !date}>
              {saving ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
