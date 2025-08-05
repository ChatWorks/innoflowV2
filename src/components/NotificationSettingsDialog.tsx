import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, Mail, Smartphone, Clock, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Goal, NotificationSettings } from '@/types/goal';
import { ManualReminderButton } from '@/components/ManualReminderButton';
import { requestNotificationPermission, getNotificationPermission } from '@/utils/notifications';

interface NotificationSettingsDialogProps {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function NotificationSettingsDialog({ goal, open, onOpenChange, onUpdate }: NotificationSettingsDialogProps) {
  const [settings, setSettings] = useState<NotificationSettings>(goal.notification_settings);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    setBrowserPermission(getNotificationPermission());
    
    // Fetch user email for manual reminders
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    
    fetchUserEmail();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('goals')
        .update({
          notification_settings: settings
        })
        .eq('id', goal.id);

      if (error) throw error;

      toast({
        title: 'Instellingen opgeslagen',
        description: 'Je notificatie instellingen zijn bijgewerkt.',
      });

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        title: 'Fout bij opslaan',
        description: 'Er is een fout opgetreden bij het opslaan van je instellingen.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setBrowserPermission(granted ? 'granted' : 'denied');
    
    if (granted) {
      toast({
        title: 'Notificaties ingeschakeld',
        description: 'Je zult nu browser notificaties ontvangen voor je doelen.',
      });
    } else {
      toast({
        title: 'Notificaties geweigerd',
        description: 'Je kunt notificaties handmatig inschakelen in je browser instellingen.',
        variant: 'destructive'
      });
    }
  };

  const handleTestNotification = () => {
    setTestingNotification(true);
    
    if (browserPermission === 'granted') {
      new Notification(`🎯 Test Reminder: ${goal.title}`, {
        body: 'Dit is een test notificatie voor je doel. Als je dit ziet, werken de notificaties!',
        icon: '/favicon.ico',
        tag: 'test-notification'
      });
      
      toast({
        title: 'Test notificatie verzonden',
        description: 'Check je browser voor de test notificatie.',
      });
    } else {
      toast({
        title: 'Geen toestemming',
        description: 'Schakel eerst browser notificaties in om te testen.',
        variant: 'destructive'
      });
    }
    
    setTimeout(() => setTestingNotification(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificatie Instellingen - {goal.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Browser Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Smartphone className="h-4 w-4" />
                Browser Notificaties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Browser notificaties inschakelen</p>
                  <p className="text-xs text-muted-foreground">
                    Ontvang realtime notificaties in je browser
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {browserPermission === 'denied' && (
                    <span className="text-xs text-red-600">Geweigerd</span>
                  )}
                  {browserPermission === 'granted' && (
                    <span className="text-xs text-green-600">Ingeschakeld</span>
                  )}
                  {browserPermission === 'default' && (
                    <Button onClick={handleRequestPermission} size="sm">
                      Toestemming vragen
                    </Button>
                  )}
                </div>
              </div>

              {browserPermission === 'granted' && (
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleTestNotification} 
                    disabled={testingNotification}
                    size="sm" 
                    variant="outline"
                  >
                    {testingNotification ? 'Test verzonden...' : 'Test Notificatie'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4" />
                Email Herinneringen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Email herinneringen</p>
                  <p className="text-xs text-muted-foreground">
                    Ontvang email reminders voor je doelen
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(enabled) => setSettings({ ...settings, enabled })}
                />
              </div>

              {settings.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Frequentie</Label>
                      <Select 
                        value={settings.frequency} 
                        onValueChange={(frequency: any) => setSettings({ ...settings, frequency })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Dagelijks</SelectItem>
                          <SelectItem value="weekly">Wekelijks</SelectItem>
                          <SelectItem value="monthly">Maandelijks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tijd</Label>
                      <Input
                        type="time"
                        value={settings.time}
                        onChange={(e) => setSettings({ ...settings, time: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Custom Message */}
                  <div className="space-y-2">
                    <Label>Aangepast bericht (optioneel)</Label>
                    <Input
                      placeholder="bijv. Vergeet niet om je dagelijkse voortgang bij te werken!"
                      value={settings.customMessage || ''}
                      onChange={(e) => setSettings({ ...settings, customMessage: e.target.value })}
                    />
                  </div>

                  {/* Test Email Reminder */}
                  {userEmail && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Test email reminder</p>
                        <p className="text-xs text-muted-foreground">
                          Verstuur een test email naar {userEmail}
                        </p>
                      </div>
                      <ManualReminderButton goal={goal} userEmail={userEmail} />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Smart Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Slimme Herinneringen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Deadline waarschuwingen</p>
                    <p className="text-xs text-muted-foreground">
                      Ontvang waarschuwingen wanneer deadlines naderen
                    </p>
                  </div>
                  <Switch
                    checked={settings.deadlineWarnings !== false}
                    onCheckedChange={(enabled) => setSettings({ ...settings, deadlineWarnings: enabled })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Voortgang reminders</p>
                    <p className="text-xs text-muted-foreground">
                      Herinnering als je een tijd geen voortgang hebt geboekt
                    </p>
                  </div>
                  <Switch
                    checked={settings.progressReminders !== false}
                    onCheckedChange={(enabled) => setSettings({ ...settings, progressReminders: enabled })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Motivational boosts</p>
                    <p className="text-xs text-muted-foreground">
                      Ontvang motiverende berichten bij mijlpalen
                    </p>
                  </div>
                  <Switch
                    checked={settings.motivationalBoosts !== false}
                    onCheckedChange={(enabled) => setSettings({ ...settings, motivationalBoosts: enabled })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuleren
            </Button>
            <Button onClick={handleSave} disabled={isLoading} className="flex-1">
              {isLoading ? 'Opslaan...' : 'Instellingen Opslaan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}