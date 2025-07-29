import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Lead, LEAD_STATUSES } from '@/types/lead';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Euro, TrendingUp, Users, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LeadCreationDialog } from '@/components/LeadCreationDialog';

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreationDialogOpen, setIsCreationDialogOpen] = useState(false);
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
      case 'Nieuw': return 'text-blue-600';
      case 'Gekwalificeerd': return 'text-yellow-600';
      case 'Voorstel': return 'text-purple-600';
      case 'Onderhandeling': return 'text-orange-600';
      case 'Gewonnen': return 'text-green-600';
      case 'Verloren': return 'text-red-600';
      default: return 'text-gray-600';
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
          <div>
            <h1 className="text-3xl font-bold text-foreground">Lead Management</h1>
            <p className="text-muted-foreground">Beheer je sales pipeline en converteer leads naar projecten</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {LEAD_STATUSES.map((status) => {
            const statusLeads = leads.filter(lead => lead.status === status);
            return (
              <div 
                key={status}
                className="min-h-[500px] bg-gray-50 rounded-lg p-4"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-700">{status}</h3>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                    {statusLeads.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {statusLeads.map((lead) => (
                    <div 
                      key={lead.id}
                      className="bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:shadow-sm transition-shadow"
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      <h4 className="font-medium text-sm text-gray-900">{lead.company_name}</h4>
                      {lead.contact_person && (
                        <p className="text-xs text-gray-500">{lead.contact_person}</p>
                      )}
                      {lead.estimated_value && (
                        <p className="text-xs font-medium text-gray-700">
                          €{lead.estimated_value.toLocaleString()}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-2">
                        <span className={`text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {lead.probability}%
                        </span>
                        {lead.expected_close_date && (
                          <span className="text-xs text-gray-400">
                            {new Date(lead.expected_close_date).toLocaleDateString('nl-NL')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <LeadCreationDialog 
          isOpen={isCreationDialogOpen}
          onClose={() => setIsCreationDialogOpen(false)}
          onLeadCreated={fetchLeads}
        />
      </div>
    </Layout>
  );
}