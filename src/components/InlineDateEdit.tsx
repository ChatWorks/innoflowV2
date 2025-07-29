import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface InlineDateEditProps {
  value?: string;
  onSave: (newDate: string | null) => Promise<void>;
  placeholder?: string;
  className?: string;
}

export default function InlineDateEdit({ 
  value, 
  onSave, 
  placeholder = "Selecteer datum",
  className = ""
}: InlineDateEditProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDateSelect = async (date: Date | undefined) => {
    setIsSaving(true);
    try {
      const dateString = date ? date.toISOString().split('T')[0] : null;
      await onSave(dateString);
      setIsOpen(false);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSaving(false);
    }
  };

  const displayValue = value ? format(new Date(value), "dd MMM yyyy", { locale: nl }) : placeholder;
  const selectedDate = value ? new Date(value) : undefined;

  return (
    <div className={`group inline-flex items-center gap-2 ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "h-auto p-0 font-normal justify-start hover:bg-transparent",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            className="pointer-events-auto"
            disabled={isSaving}
          />
        </PopoverContent>
      </Popover>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
}