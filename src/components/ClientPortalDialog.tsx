import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Copy, Mail, QrCode, Eye, EyeOff, Settings, FileText, Clock, BarChart3, Edit, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { ClientPortal, ClientUpdate } from '@/types/clientPortal';

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
  
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date | undefined>();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  
  // Content management state
  const [clientUpdates, setClientUpdates] = useState<ClientUpdate[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [editingUpdate, setEditingUpdate] = useState<ClientUpdate | null>(null);
  const [newUpdateTitle, setNewUpdateTitle] = useState('');
  const [newUpdateMessage, setNewUpdateMessage] = useState('');
  
  const { toast } = useToast();

  const portalUrl = portal ? `${window.location.origin}/portal/${portal.portal_hash}` : '';

  useEffect(() => {
    if (isOpen) {
      fetchExistingPortal();
      fetchClientUpdates();
      fetchProjectData();
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

  const fetchClientUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from('client_updates')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientUpdates(data || []);
    } catch (error: any) {
      console.error('Error fetching client updates:', error);
    }
  };

  const fetchProjectData = async () => {
    try {
      // Fetch deliverables
      const { data: deliverablesData, error: deliverablesError } = await supabase
        .from('deliverables')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (deliverablesError) throw deliverablesError;
      setDeliverables(deliverablesData || []);

      // Fetch phases
      const { data: phasesData, error: phasesError } = await supabase
        .from('phases')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (phasesError) throw phasesError;
      setPhases(phasesData || []);

      // Fetch access logs if portal exists
      if (portal) {
        const { data: logsData, error: logsError } = await supabase
          .from('portal_access_logs')
          .select('*')
          .eq('portal_id', portal.id)
          .order('accessed_at', { ascending: false })
          .limit(50);

        if (logsError) throw logsError;
        setAccessLogs(logsData || []);
      }
    } catch (error: any) {
      console.error('Error fetching project data:', error);
    }
  };

  const generatePortal = async () => {
    // Validatie voor wachtwoord
    if (passwordProtected && !password) {
      toast({
        title: "Fout",
        description: "Voer een wachtwoord in voor beveiliging",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      // Generate portal hash
      const { data: hashData, error: hashError } = await supabase
        .rpc('generate_portal_hash');

      if (hashError) throw hashError;

      console.log('Generated hash:', hashData);

      let passwordHash = null;
      if (passwordProtected && password) {
        passwordHash = await hashPassword(password);
        console.log('Password hashed for new portal:', passwordHash ? 'Success' : 'Failed');
      }

      const portalData = {
        project_id: projectId,
        portal_hash: hashData,
        show_team_names: false,
        password_hash: passwordHash,
        expires_at: expiryDate ? expiryDate.toISOString() : null,
      };

      console.log('Creating portal with:', portalData);

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
        description: passwordProtected ? "Portal beveiligd met wachtwoord" : "Client portal is succesvol gegenereerd",
      });
    } catch (error: any) {
      console.error('Portal creation error:', error);
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
    
    // Validatie voor wachtwoord
    if (passwordProtected && !password && !portal.password_hash) {
      toast({
        title: "Fout",
        description: "Voer een wachtwoord in voor beveiliging",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      let passwordHash = null;
      
      if (passwordProtected) {
        if (password) {
          // Nieuw wachtwoord hashen
          passwordHash = await hashPassword(password);
          console.log('New password hashed:', passwordHash ? 'Success' : 'Failed');
        } else {
          // Bestaand wachtwoord behouden
          passwordHash = portal.password_hash;
          console.log('Keeping existing password hash');
        }
      }

      const updateData = {
        show_team_names: false,
        password_hash: passwordHash,
        expires_at: expiryDate ? expiryDate.toISOString() : null,
      };

      console.log('Updating portal with:', updateData);

      const { error } = await supabase
        .from('client_portals')
        .update(updateData)
        .eq('id', portal.id);

      if (error) throw error;

      setPortal({ ...portal, ...updateData });
      setPassword(''); // Clear password from state
      
      toast({
        title: "Portal Bijgewerkt!",
        description: passwordProtected ? "Portal beveiligd met wachtwoord" : "Portal instellingen bijgewerkt",
      });
    } catch (error: any) {
      console.error('Portal update error:', error);
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
      `Beste ${clientName},\n\nJe kunt nu de voortgang van jouw project "${projectName}" volgen via onze beveiligde client portal:\n\n${portalUrl}\n\nMet vriendelijke groet,\nJouw Project Team`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleCreateUpdate = async () => {
    if (!newUpdateTitle.trim() || !newUpdateMessage.trim()) {
      toast({
        title: "Fout",
        description: "Titel en bericht zijn verplicht",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('client_updates')
        .insert({
          project_id: projectId,
          title: newUpdateTitle,
          message: newUpdateMessage,
          is_visible_to_client: true
        })
        .select()
        .single();

      if (error) throw error;

      setClientUpdates([data, ...clientUpdates]);
      setNewUpdateTitle('');
      setNewUpdateMessage('');
      
      toast({
        title: "Update aangemaakt",
        description: "Client update is succesvol aangemaakt",
      });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: "Kon update niet aanmaken",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUpdate = async (updateId: string) => {
    try {
      const { error } = await supabase
        .from('client_updates')
        .delete()
        .eq('id', updateId);

      if (error) throw error;

      setClientUpdates(clientUpdates.filter(update => update.id !== updateId));
      
      toast({
        title: "Update verwijderd",
        description: "Client update is verwijderd",
      });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: "Kon update niet verwijderen",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDeliverableStatus = async (deliverableId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('deliverables')
        .update({ status: newStatus })
        .eq('id', deliverableId);

      if (error) throw error;

      setDeliverables(deliverables.map(d => 
        d.id === deliverableId ? { ...d, status: newStatus } : d
      ));
      
      toast({
        title: "Status bijgewerkt",
        description: "Deliverable status is bijgewerkt",
      });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: "Kon status niet bijwerken",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePhaseStatus = async (phaseId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('phases')
        .update({ status: newStatus })
        .eq('id', phaseId);

      if (error) throw error;

      setPhases(phases.map(p => 
        p.id === phaseId ? { ...p, status: newStatus } : p
      ));
      
      toast({
        title: "Fase status bijgewerkt",
        description: "Fase status is bijgewerkt",
      });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: "Kon fase status niet bijwerken",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-semibold text-foreground">
            Client portal voor {projectName}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            Configureer en beheer de toegang voor {clientName}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Instellingen
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Content Beheer
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline Admin
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Portal Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-8 mt-6">
            {/* Portal Settings */}
            <div className="space-y-6">
              <div className="border-b pb-3">
                <h3 className="text-lg font-medium text-foreground">Portal Configuratie</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Pas de portal aan voor jouw client
                </p>
              </div>
            
              <div className="grid gap-6">
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Wachtwoordbeveiliging</Label>
                    <div className="text-sm text-muted-foreground">
                      Extra beveiliging met wachtwoord voor toegang
                    </div>
                  </div>
                  <Switch
                    checked={passwordProtected}
                    onCheckedChange={setPasswordProtected}
                  />
                </div>

                {passwordProtected && (
                  <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                    <Label htmlFor="password" className="text-base font-medium">
                      {portal?.password_hash ? 'Nieuw wachtwoord instellen (optioneel)' : 'Wachtwoord instellen'}
                    </Label>
                    {portal?.password_hash && (
                      <div className="text-sm text-muted-foreground">
                        Er is al een wachtwoord ingesteld. Laat leeg om het huidige wachtwoord te behouden.
                      </div>
                    )}
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={portal?.password_hash ? "Nieuw wachtwoord (optioneel)" : "Kies een sterk wachtwoord"}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="p-4 border rounded-lg space-y-3">
                  <Label className="text-base font-medium">Vervaldatum</Label>
                  <div className="text-sm text-muted-foreground mb-3">
                    Optioneel: stel een vervaldatum in voor de portal
                  </div>
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
                        {expiryDate ? format(expiryDate, "d MMMM yyyy") : "Geen vervaldatum"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={expiryDate}
                        onSelect={setExpiryDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                      {expiryDate && (
                        <div className="p-3 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpiryDate(undefined)}
                            className="w-full"
                          >
                            Vervaldatum verwijderen
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Portal URL Section */}
            {portal && (
              <div className="space-y-6">
                <div className="border-b pb-3">
                  <h3 className="text-lg font-medium text-foreground">Portal toegang</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Deel deze link met jouw client
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <Label className="text-base font-medium">Portal link</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={portalUrl} 
                        readOnly 
                        className="font-mono text-sm bg-background"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(portalUrl)}
                        className="shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={sendEmailToClient}
                      className="h-12"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      E-mail versturen
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(portalUrl, '_blank')}
                      className="h-12"
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      Portal bekijken
                    </Button>
                  </div>

                  {portal.access_count > 0 && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        Portal is {portal.access_count} keer bezocht
                        {portal.last_accessed && ` • Laatst bezocht: ${format(new Date(portal.last_accessed), 'd MMM yyyy, HH:mm')}`}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-8 mt-6">
            {/* Client Updates Management */}
            <div className="space-y-6">
              <div className="border-b pb-3">
                <h3 className="text-lg font-medium text-foreground">Client Updates</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Beheer updates die zichtbaar zijn voor de client
                </p>
              </div>

              {/* Create New Update */}
              <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-medium">Nieuwe update aanmaken</h4>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="updateTitle">Titel</Label>
                    <Input
                      id="updateTitle"
                      value={newUpdateTitle}
                      onChange={(e) => setNewUpdateTitle(e.target.value)}
                      placeholder="Update titel..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="updateMessage">Bericht</Label>
                    <Textarea
                      id="updateMessage"
                      value={newUpdateMessage}
                      onChange={(e) => setNewUpdateMessage(e.target.value)}
                      placeholder="Update bericht..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleCreateUpdate} className="w-fit">
                    <Plus className="h-4 w-4 mr-2" />
                    Update aanmaken
                  </Button>
                </div>
              </div>

              {/* Updates List */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titel</TableHead>
                      <TableHead>Bericht</TableHead>
                      <TableHead>Aangemaakt</TableHead>
                      <TableHead>Zichtbaar</TableHead>
                      <TableHead className="w-[100px]">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientUpdates.map((update) => (
                      <TableRow key={update.id}>
                        <TableCell className="font-medium">{update.title}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{update.message}</TableCell>
                        <TableCell>{format(new Date(update.created_at), 'd MMM yyyy')}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full",
                            update.is_visible_to_client 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          )}>
                            {update.is_visible_to_client ? 'Zichtbaar' : 'Verborgen'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteUpdate(update.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Deliverable Management */}
            <div className="space-y-6">
              <div className="border-b pb-3">
                <h3 className="text-lg font-medium text-foreground">Deliverable Namen</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Client-vriendelijke namen voor deliverables
                </p>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deliverable</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Voortgang</TableHead>
                      <TableHead>Target Datum</TableHead>
                      <TableHead className="w-[150px]">Quick Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliverables.map((deliverable) => (
                      <TableRow key={deliverable.id}>
                        <TableCell className="font-medium">{deliverable.title}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full",
                            deliverable.status === 'Completed' ? "bg-green-100 text-green-800" :
                            deliverable.status === 'In Progress' ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-800"
                          )}>
                            {deliverable.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${deliverable.progress || 0}%` }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {deliverable.target_date ? format(new Date(deliverable.target_date), 'd MMM yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={deliverable.status}
                            onValueChange={(value) => handleUpdateDeliverableStatus(deliverable.id, value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-8 mt-6">
            {/* Phase Status Management */}
            <div className="space-y-6">
              <div className="border-b pb-3">
                <h3 className="text-lg font-medium text-foreground">Fase Beheer</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Snelle wijzigingen van fase statussen en deadlines
                </p>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fase</TableHead>
                      <TableHead>Huidige Status</TableHead>
                      <TableHead>Target Datum</TableHead>
                      <TableHead className="w-[150px]">Status Wijzigen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {phases.map((phase) => (
                      <TableRow key={phase.id}>
                        <TableCell className="font-medium">{phase.name}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full",
                            phase.status === 'Completed' ? "bg-green-100 text-green-800" :
                            phase.status === 'In Progress' ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-800"
                          )}>
                            {phase.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {phase.target_date ? format(new Date(phase.target_date), 'd MMM yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={phase.status}
                            onValueChange={(value) => handleUpdatePhaseStatus(phase.id, value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Gepland</SelectItem>
                              <SelectItem value="In Progress">In Uitvoering</SelectItem>
                              <SelectItem value="Completed">Afgerond</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Milestone Planning */}
            <div className="space-y-6">
              <div className="border-b pb-3">
                <h3 className="text-lg font-medium text-foreground">Milestone Planning</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Overzicht van belangrijke mijlpalen en deadlines
                </p>
              </div>

              <div className="grid gap-4">
                {deliverables.filter(d => d.target_date).map((deliverable) => (
                  <div key={deliverable.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{deliverable.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Target: {format(new Date(deliverable.target_date), 'd MMMM yyyy')}
                        </p>
                      </div>
                      <span className={cn(
                        "px-2 py-1 text-xs rounded-full",
                        deliverable.status === 'Completed' ? "bg-green-100 text-green-800" :
                        deliverable.status === 'In Progress' ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      )}>
                        {deliverable.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-8 mt-6">
            {/* Access Logs */}
            <div className="space-y-6">
              <div className="border-b pb-3">
                <h3 className="text-lg font-medium text-foreground">Portal Analytics</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Inzichten in portal gebruik en client engagement
                </p>
              </div>

              {portal && (
                <>
                  {/* Portal Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{portal.access_count}</div>
                      <div className="text-sm text-muted-foreground">Totaal bezoeken</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-foreground">
                        {portal.last_accessed ? format(new Date(portal.last_accessed), 'd MMM') : 'Nooit'}
                      </div>
                      <div className="text-sm text-muted-foreground">Laatste bezoek</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{clientUpdates.length}</div>
                      <div className="text-sm text-muted-foreground">Client updates</div>
                    </div>
                  </div>

                  {/* Access Logs Table */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Toegangslogboek</h4>
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Toegang Datum</TableHead>
                            <TableHead>IP Adres</TableHead>
                            <TableHead>User Agent</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accessLogs.length > 0 ? (
                            accessLogs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell>{format(new Date(log.accessed_at), 'd MMM yyyy, HH:mm')}</TableCell>
                                <TableCell className="font-mono text-sm">{log.ip_address || '-'}</TableCell>
                                <TableCell className="max-w-[300px] truncate text-xs">
                                  {log.user_agent || '-'}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground">
                                Nog geen toegangslogboek beschikbaar
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div>
              {portal && (
                <Button
                  variant="destructive"
                  onClick={deactivatePortal}
                  disabled={loading}
                  className="h-10"
                >
                  Portal deactiveren
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="h-10 px-6">
                Sluiten
              </Button>
              
              {portal ? (
                <Button onClick={updatePortal} disabled={loading} className="h-10 px-6">
                  {loading ? 'Bijwerken...' : 'Portal bijwerken'}
                </Button>
              ) : (
                <Button onClick={generatePortal} disabled={loading} className="h-10 px-6">
                  {loading ? 'Genereren...' : 'Portal genereren'}
                </Button>
              )}
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};