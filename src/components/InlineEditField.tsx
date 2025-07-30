import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Check, X } from 'lucide-react';

interface InlineEditFieldProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  className?: string;
  type?: 'text' | 'number';
  prefix?: string;
  iconClassName?: string;
  alwaysShowIcon?: boolean;
}

export default function InlineEditField({ 
  value, 
  onSave, 
  placeholder = "", 
  className = "",
  type = "text",
  prefix = "",
  iconClassName = "",
  alwaysShowIcon = false
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setEditValue(value);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      setEditValue(value); // Reset on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-8 text-sm text-foreground placeholder:text-muted-foreground"
          autoFocus
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isSaving}
          className="h-8 w-8 p-0 text-white hover:bg-white/20"
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isSaving}
          className="h-8 w-8 p-0 text-white hover:bg-white/20"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`group inline-flex items-center gap-2 ${className}`}>
      <span>{value}</span>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          handleEdit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            handleEdit();
          }
        }}
        className={`h-6 w-6 p-0 ${alwaysShowIcon ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity cursor-pointer rounded hover:bg-muted flex items-center justify-center ${iconClassName}`}
      >
        <Pencil className="h-3 w-3" />
      </span>
    </div>
  );
}