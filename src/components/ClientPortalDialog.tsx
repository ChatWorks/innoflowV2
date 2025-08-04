import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Copy, Mail, QrCode, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { ClientPortal } from '@/types/clientPortal';

interface ClientPortalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  clientName: string;
}

export const ClientPortalDialog = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  clientName
}: ClientPortalDialogProps) => {
  const [portal, setPortal] = useState<ClientPortal | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTeamNames, setShowTeamNames] = useState(false);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date | undefined>();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const portalUrl = portal ? `${window.location.origin}/portal/${portal.portal_hash}` : '';

  useEffect(() => {
    if (isOpen) {
      fetchExistingPortal();
    }
  }, [isOpen, projectId]);

  const fetchExistingPortal = async () => {
    try {
      const { data, error } = await supabase
        .from('client_portals')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setPortal(data);
        setShowTeamNames(data.show_team_names);
        setPasswordProtected(!!data.password_hash);
        setExpiryDate(data.expires_at ? new Date(data.expires_at) : undefined);
      }
    } catch (error: any) {
      toast({
        title: "Fout",
        description: "Kon bestaande portal niet ophalen",
        variant: "destructive",
      });
    }
  };

  const generatePortal = async () => {
    setLoading(true);
    try {
      // Generate portal hash
      const { data: hashData, error: hashError } = await supabase
        .rpc('generate_portal_hash');

      if (hashError) throw hashError;

      console.log('Generated hash:', hashData);

      const portalData = {
        project_id: projectId,
        portal_hash: hashData,
        show_team_names: showTeamNames,
        password_hash: passwordProtected && password ? await hashPassword(password) : null,
        expires_at: expiryDate ? expiryDate.toISOString() : null,
      };

      const { data, error } = await supabase
        .from('client_portals')
        .insert(portalData)
        .select()
        .single();

      if (error) throw error;

      setPortal(data);
      setPassword(''); // Clear password from state
      
      toast({
        title: "Portal Aangemaakt!",
        description: "Client portal is succesvol gegenereerd",
      });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Kon portal niet aanmaken",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePortal = async () => {
    if (!portal) return;
    
    setLoading(true);
    try {
      const updateData = {
        show_team_names: showTeamNames,
        password_hash: passwordProtected && password ? await hashPassword(password) : 
                      passwordProtected ? portal.password_hash : null,
        expires_at: expiryDate ? expiryDate.toISOString() : null,
      };

      const { error } = await supabase
        .from('client_portals')
        .update(updateData)
        .eq('id', portal.id);

      if (error) throw error;

      setPortal({ ...portal, ...updateData });
      setPassword(''); // Clear password from state
      
      toast({
        title: "Portal Bijgewerkt!",
        description: "Portal instellingen zijn bijgewerkt",
      });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Kon portal niet bijwerken",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deactivatePortal = async () => {
    if (!portal) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('client_portals')
        .update({ is_active: false })
        .eq('id', portal.id);

      if (error) throw error;

      setPortal(null);
      
      toast({
        title: "Portal Gedeactiveerd",
        description: "Client portal is gedeactiveerd",
      });
    } catch (error: any) {
      toast({
        title: "Fout", 
        description: error.message || "Kon portal niet deactiveren",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Gekopieerd!",
        description: "Portal URL gekopieerd naar klembord",
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon niet kopiëren naar klembord",
        variant: "destructive",
      });
    }
  };

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const sendEmailToClient = () => {
    const subject = encodeURIComponent(`Project Portal - ${projectName}`);
    const body = encodeURIComponent(
      `Hi ${clientName},\n\nYou can now track the progress of your project "${projectName}" through our secure client portal:\n\n${portalUrl}\n\nBest regards,\nYour Project Team`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Client Portal - {projectName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Portal Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Portal Instellingen</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Toon Teamnamen</Label>
                <div className="text-sm text-muted-foreground">
                  Toon teamnamen in de portal
                </div>
              </div>
              <Switch
                checked={showTeamNames}
                onCheckedChange={setShowTeamNames}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Wachtwoordbeveiliging</Label>
                <div className="text-sm text-muted-foreground">
                  Wachtwoord vereist voor toegang tot portal
                </div>
              </div>
              <Switch
                checked={passwordProtected}
                onCheckedChange={setPasswordProtected}
              />
            </div>

            {passwordProtected && (
              <div className="space-y-2">
                <Label htmlFor="password">Portal Wachtwoord</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Voer portal wachtwoord in"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Vervaldatum (Optioneel)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, "PPP") : "No expiry"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                  {expiryDate && (
                    <div className="p-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpiryDate(undefined)}
                      >
                        Clear date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Portal URL Section */}
          {portal && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Portal Access</h3>
              
              <div className="space-y-2">
                <Label>Portal URL</Label>
                <div className="flex gap-2">
                  <Input 
                    value={portalUrl} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(portalUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={sendEmailToClient}
                  className="flex-1"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email Client
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(portalUrl, '_blank')}
                  className="flex-1"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Preview Portal
                </Button>
              </div>

              {portal.access_count > 0 && (
                <div className="text-sm text-muted-foreground">
                  Portal accessed {portal.access_count} times
                  {portal.last_accessed && ` • Last accessed: ${format(new Date(portal.last_accessed), 'MMM d, yyyy HH:mm')}`}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div>
              {portal && (
                <Button
                  variant="destructive"
                  onClick={deactivatePortal}
                  disabled={loading}
                >
                  Deactivate Portal
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              
              {portal ? (
                <Button onClick={updatePortal} disabled={loading}>
                  Update Portal
                </Button>
              ) : (
                <Button onClick={generatePortal} disabled={loading}>
                  {loading ? 'Generating...' : 'Generate Portal'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};