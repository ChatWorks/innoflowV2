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
  RefreshCw,
  AlertTriangle,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LeadEditDialog } from '@/components/LeadEditDialog';
import { LeadActivityDialog } from '@/components/LeadActivityDialog';
import { LeadToProjectDialog } from '@/components/LeadToProjectDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SEO from '@/components/SEO';

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
  const [isEditingFollowUp, setIsEditingFollowUp] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    next_follow_up_date: '',
    next_follow_up_description: '',
  });

  const fetchLead = async () => {
    if (!id) return;

    try {
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('id, company_name, status, probability, estimated_value, estimated_budget, expected_close_date, source, notes, is_stale, email, phone, contact_person, converted_to_project_id, created_at, updated_at, next_follow_up_date, next_follow_up_description')
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
      setFollowUpData({
        next_follow_up_date: leadData.next_follow_up_date || '',
        next_follow_up_description: leadData.next_follow_up_description || '',
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchActivities = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('id, lead_id, title, activity_type, description, activity_date, created_at')
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

  const handleSaveFollowUp = async () => {
    if (!lead) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          next_follow_up_date: followUpData.next_follow_up_date || null,
          next_follow_up_description: followUpData.next_follow_up_description || null,
        })
        .eq('id', lead.id);

      if (error) {
        console.error('Error updating follow-up:', error);
        toast({
          title: "Fout bij opslaan",
          description: "Er is een fout opgetreden bij het opslaan van de follow-up.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Follow-up opgeslagen",
        description: "De follow-up herinnering is succesvol bijgewerkt.",
      });

      setIsEditingFollowUp(false);
      fetchLead();
    } catch (error) {
      console.error('Error:', error);
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
      <SEO title={lead ? `Lead: ${lead.company_name} – Innoflow` : 'Lead – Innoflow'} description={lead ? `Status: ${lead.status}${lead.probability ? ` • Kans: ${lead.probability}%` : ''}` : 'Lead details en activiteiten.'} />
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
              {/* Smart Assistant Indicators */}
              {(lead.is_stale || lead.next_follow_up_date) && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                    <h4 className="text-sm font-medium text-blue-900">🤖 Smart Assistant</h4>
                    {lead.is_stale && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Deze lead is gemarkeerd als stilgevallen</span>
                      </div>
                    )}
                    {lead.next_follow_up_date && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Volgende follow-up: {new Date(lead.next_follow_up_date).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              )}
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

        {/* Follow-up Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              🎯 Volgende Actie Planning
              <Button 
                size="sm" 
                variant={isEditingFollowUp ? "outline" : "default"}
                onClick={() => setIsEditingFollowUp(!isEditingFollowUp)}
              >
                {isEditingFollowUp ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Annuleren
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Bewerken
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditingFollowUp ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="follow-up-date">Volgende follow-up datum</Label>
                  <Input
                    id="follow-up-date"
                    type="date"
                    value={followUpData.next_follow_up_date}
                    onChange={(e) => setFollowUpData(prev => ({ 
                      ...prev, 
                      next_follow_up_date: e.target.value 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="follow-up-description">Beschrijving van volgende actie</Label>
                  <Textarea
                    id="follow-up-description"
                    placeholder="Wat moet er gebeuren bij de volgende follow-up?"
                    value={followUpData.next_follow_up_description}
                    onChange={(e) => setFollowUpData(prev => ({ 
                      ...prev, 
                      next_follow_up_description: e.target.value 
                    }))}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveFollowUp}>
                    <Save className="h-4 w-4 mr-2" />
                    Opslaan
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditingFollowUp(false);
                      setFollowUpData({
                        next_follow_up_date: lead.next_follow_up_date || '',
                        next_follow_up_description: lead.next_follow_up_description || '',
                      });
                    }}
                  >
                    Annuleren
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {lead.next_follow_up_date ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">
                          Volgende follow-up: {new Date(lead.next_follow_up_date).toLocaleDateString('nl-NL')}
                        </p>
                        {lead.next_follow_up_description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {lead.next_follow_up_description}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Geen follow-up gepland</p>
                    <Button 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setIsEditingFollowUp(true)}
                    >
                      Plan volgende actie
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

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