import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Lead, LEAD_STATUSES } from '@/types/lead';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Euro, TrendingUp, Users, Target, Settings, AlertTriangle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LeadCreationDialog } from '@/components/LeadCreationDialog';
import { SmartAssistantSettingsDialog } from '@/components/SmartAssistantSettingsDialog';
import { AILeadAnalyst } from '@/components/AILeadAnalyst';

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreationDialogOpen, setIsCreationDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        toast({
          title: "Fout bij ophalen leads",
          description: "Er is een fout opgetreden bij het ophalen van de leads.",
          variant: "destructive",
        });
        return;
      }

      setLeads((data || []) as Lead[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusUpdate = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) {
        toast({
          title: "Fout bij status update",
          description: "Er is een fout opgetreden bij het bijwerken van de status.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));

      toast({
        title: "Status bijgewerkt",
        description: "De lead status is succesvol bijgewerkt.",
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: Lead['status']) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    handleStatusUpdate(leadId, status);
  };

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'Nieuw': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Gekwalificeerd': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Voorstel': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Onderhandeling': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Gewonnen': return 'bg-green-100 text-green-800 border-green-200';
      case 'Verloren': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Calculate statistics
  const stats = {
    totalValue: leads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0),
    activeLeads: leads.filter(lead => !['Gewonnen', 'Verloren'].includes(lead.status)).length,
    wonLeads: leads.filter(lead => lead.status === 'Gewonnen').length,
    winRate: leads.length > 0 ? Math.round((leads.filter(lead => lead.status === 'Gewonnen').length / leads.length) * 100) : 0
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Lead Management</h1>
              <p className="text-muted-foreground">Beheer je sales pipeline en converteer leads naar projecten</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsDialogOpen(true)}
              className="h-8 w-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setIsCreationDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe Lead
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Euro className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pipeline Waarde</p>
                  <p className="text-xl font-bold">€{stats.totalValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Actieve Leads</p>
                  <p className="text-xl font-bold">{stats.activeLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Gewonnen</p>
                  <p className="text-xl font-bold">{stats.wonLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-xl font-bold">{stats.winRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          {LEAD_STATUSES.map((status) => {
            const statusLeads = leads.filter(lead => lead.status === status);
            return (
              <Card 
                key={status}
                className="min-h-[500px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>{status}</span>
                    <Badge variant="outline" className="text-xs">
                      {statusLeads.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {statusLeads.map((lead) => (
                    <Card 
                      key={lead.id}
                      className={`cursor-pointer hover:shadow-md transition-all border-l-4 ${getStatusColor(lead.status)} ${
                        lead.is_stale ? 'ring-2 ring-red-500 ring-opacity-50' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-sm leading-tight">{lead.company_name}</h3>
                          {lead.is_stale && (
                            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                        
                        {lead.contact_person && (
                          <p className="text-xs text-muted-foreground">{lead.contact_person}</p>
                        )}
                        
                        {lead.estimated_value && (
                          <p className="text-xs font-medium text-green-600">
                            €{lead.estimated_value.toLocaleString()}
                          </p>
                        )}
                        
                        {lead.next_follow_up_date && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Follow-up: {new Date(lead.next_follow_up_date).toLocaleDateString('nl-NL')}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                          >
                            {lead.probability}%
                          </Badge>
                          {lead.expected_close_date && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(lead.expected_close_date).toLocaleDateString('nl-NL')}
                            </span>
                          )}
                        </div>
                        
                        {lead.is_stale && (
                          <div className="text-xs text-red-600 font-medium">
                            Stilgevallen lead
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <AILeadAnalyst leads={leads} />

        <LeadCreationDialog 
          isOpen={isCreationDialogOpen}
          onClose={() => setIsCreationDialogOpen(false)}
          onLeadCreated={fetchLeads}
        />

        <SmartAssistantSettingsDialog
          isOpen={isSettingsDialogOpen}
          onClose={() => setIsSettingsDialogOpen(false)}
        />
      </div>
    </Layout>
  );
}