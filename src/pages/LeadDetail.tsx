import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Lead, LeadActivity, LEAD_STATUSES, ACTIVITY_TYPES } from '@/types/lead';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Edit, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Euro, 
  Calendar, 
  TrendingUp,
  Plus,
  MessageSquare,
  PhoneCall,
  Video,
  StickyNote,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LeadEditDialog } from '@/components/LeadEditDialog';
import { LeadActivityDialog } from '@/components/LeadActivityDialog';
import { LeadToProjectDialog } from '@/components/LeadToProjectDialog';

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);

  const fetchLead = async () => {
    if (!id) return;

    try {
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (leadError) {
        console.error('Error fetching lead:', leadError);
        toast({
          title: "Lead niet gevonden",
          description: "De lead kon niet worden geladen.",
          variant: "destructive",
        });
        navigate('/leads');
        return;
      }

      setLead(leadData as Lead);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchActivities = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', id)
        .order('activity_date', { ascending: false });

      if (error) {
        console.error('Error fetching activities:', error);
        return;
      }

      setActivities((data || []) as LeadActivity[]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchLead(), fetchActivities()]);
      setLoading(false);
    };

    loadData();
  }, [id]);

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'Nieuw': return 'bg-blue-100 text-blue-800';
      case 'Gekwalificeerd': return 'bg-yellow-100 text-yellow-800';
      case 'Voorstel': return 'bg-purple-100 text-purple-800';
      case 'Onderhandeling': return 'bg-orange-100 text-orange-800';
      case 'Gewonnen': return 'bg-green-100 text-green-800';
      case 'Verloren': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: LeadActivity['activity_type']) => {
    switch (type) {
      case 'Telefoongesprek': return <PhoneCall className="h-4 w-4" />;
      case 'Email': return <Mail className="h-4 w-4" />;
      case 'Meeting': return <Video className="h-4 w-4" />;
      case 'Notitie': return <StickyNote className="h-4 w-4" />;
      case 'Status Update': return <RefreshCw className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!lead) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Lead niet gevonden</h1>
            <Button onClick={() => navigate('/leads')} className="mt-4">
              Terug naar Leads
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/leads')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{lead.company_name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getStatusColor(lead.status)}>
                  {lead.status}
                </Badge>
                {lead.probability && (
                  <span className="text-sm text-muted-foreground">
                    {lead.probability}% kans
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Bewerken
            </Button>
            <Button onClick={() => setIsActivityDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Activiteit
            </Button>
            {!lead.converted_to_project_id && lead.status !== 'Verloren' && (
              <Button variant="outline" onClick={() => setIsConvertDialogOpen(true)}>
                Converteer naar Project
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Information */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Informatie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bedrijf</p>
                    <p className="font-medium">{lead.company_name}</p>
                  </div>
                </div>
                
                {lead.contact_person && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Contactpersoon</p>
                      <p className="font-medium">{lead.contact_person}</p>
                    </div>
                  </div>
                )}

                {lead.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{lead.email}</p>
                    </div>
                  </div>
                )}

                {lead.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefoon</p>
                      <p className="font-medium">{lead.phone}</p>
                    </div>
                  </div>
                )}

                {lead.estimated_value && (
                  <div className="flex items-center space-x-2">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Geschatte Waarde</p>
                      <p className="font-medium">€{lead.estimated_value.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {lead.estimated_budget && (
                  <div className="flex items-center space-x-2">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="font-medium">€{lead.estimated_budget.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {lead.expected_close_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Verwachte Sluiting</p>
                      <p className="font-medium">
                        {new Date(lead.expected_close_date).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Kans op Sluiting</p>
                    <p className="font-medium">{lead.probability}%</p>
                  </div>
                </div>

                {lead.source && (
                  <div>
                    <p className="text-sm text-muted-foreground">Bron</p>
                    <p className="font-medium">{lead.source}</p>
                  </div>
                )}
              </div>

              {lead.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Notities</p>
                    <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                </>
              )}

              {lead.converted_to_project_id && (
                <>
                  <Separator />
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800 font-medium">
                      ✅ Deze lead is geconverteerd naar een project
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Activiteiten Timeline
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsActivityDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nog geen activiteiten</p>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setIsActivityDialogOpen(true)}
                  >
                    Eerste activiteit toevoegen
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          {getActivityIcon(activity.activity_type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.activity_date).toLocaleDateString('nl-NL', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs mb-1">
                          {activity.activity_type}
                        </Badge>
                        {activity.description && (
                          <p className="text-xs text-muted-foreground">
                            {activity.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <LeadEditDialog
          lead={lead}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onLeadUpdated={fetchLead}
        />

        <LeadActivityDialog
          leadId={lead.id}
          isOpen={isActivityDialogOpen}
          onClose={() => setIsActivityDialogOpen(false)}
          onActivityCreated={fetchActivities}
        />

        <LeadToProjectDialog
          lead={lead}
          isOpen={isConvertDialogOpen}
          onClose={() => setIsConvertDialogOpen(false)}
          onConversionComplete={fetchLead}
        />
      </div>
    </Layout>
  );
}