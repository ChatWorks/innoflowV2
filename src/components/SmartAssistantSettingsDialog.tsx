import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LeadSettings, LeadSettingsUpdate } from '@/types/leadSettings';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SmartAssistantSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SmartAssistantSettingsDialog({ isOpen, onClose }: SmartAssistantSettingsDialogProps) {
  const [settings, setSettings] = useState<LeadSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    enable_stale_detector: true,
    stale_lead_days: 14,
    enable_follow_up_reminders: true,
    notify_in_app: true,
    notify_by_email: false,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_settings')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
        toast({
          title: "Fout bij ophalen instellingen",
          description: "Er is een fout opgetreden bij het ophalen van de instellingen.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setSettings(data);
        setFormData({
          enable_stale_detector: data.enable_stale_detector,
          stale_lead_days: data.stale_lead_days,
          enable_follow_up_reminders: data.enable_follow_up_reminders,
          notify_in_app: data.notify_in_app,
          notify_by_email: data.notify_by_email,
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updateData: LeadSettingsUpdate = {
        enable_stale_detector: formData.enable_stale_detector,
        stale_lead_days: formData.stale_lead_days,
        enable_follow_up_reminders: formData.enable_follow_up_reminders,
        notify_in_app: formData.notify_in_app,
        notify_by_email: formData.notify_by_email,
      };

      let error;
      
      if (settings) {
        // Update existing settings
        const result = await supabase
          .from('lead_settings')
          .update(updateData)
          .eq('id', settings.id);
        error = result.error;
      } else {
        // Create new settings - user_id will be set by the trigger
        const result = await supabase
          .from('lead_settings')
          .insert({ ...updateData, user_id: '' }); // Will be overridden by trigger
        error = result.error;
      }

      if (error) {
        console.error('Error saving settings:', error);
        toast({
          title: "Fout bij opslaan",
          description: "Er is een fout opgetreden bij het opslaan van de instellingen.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Instellingen opgeslagen",
        description: "De Slimme Assistent instellingen zijn succesvol bijgewerkt.",
      });

      onClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Slimme Assistent Instellingen</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stilgevallen Leads Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Stilgevallen Leads</h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="stale-detector" className="text-sm">
                  Activeer 'Stilgevallen Lead' Detector
                </Label>
                <Switch
                  id="stale-detector"
                  checked={formData.enable_stale_detector}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, enable_stale_detector: checked }))
                  }
                />
              </div>
              
              {formData.enable_stale_detector && (
                <div className="space-y-2">
                  <Label htmlFor="stale-days" className="text-sm">
                    Markeer een lead als stilgevallen na
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="stale-days"
                      type="number"
                      min="1"
                      max="365"
                      value={formData.stale_lead_days}
                      onChange={(e) =>
                        setFormData(prev => ({ 
                          ...prev, 
                          stale_lead_days: parseInt(e.target.value) || 14 
                        }))
                      }
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">dagen inactiviteit</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Herinneringen Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Herinneringen</h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="follow-up-reminders" className="text-sm">
                  Activeer 'Volgende Actie' Herinneringen
                </Label>
                <Switch
                  id="follow-up-reminders"
                  checked={formData.enable_follow_up_reminders}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, enable_follow_up_reminders: checked }))
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Notificatiekanalen Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Notificatiekanalen</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-in-app" className="text-sm">
                    Verstuur notificaties via In-App (bel-icoon)
                  </Label>
                  <Switch
                    id="notify-in-app"
                    checked={formData.notify_in_app}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, notify_in_app: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-email" className="text-sm">
                    Verstuur notificaties via E-mail
                  </Label>
                  <Switch
                    id="notify-email"
                    checked={formData.notify_by_email}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, notify_by_email: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Annuleren
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Opslaan
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}