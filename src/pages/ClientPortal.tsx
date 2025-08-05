import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { PortalData, PortalProgress } from '@/types/clientPortal';
import type { Deliverable, Phase, Task } from '@/types/project';
import { 
  getProjectProgress, 
  getPhaseProgress, 
  getDeliverableProgress,
  getPhaseStatus 
} from '@/utils/progressCalculations';
import MagicBento from '@/components/MagicBento';

export default function ClientPortal() {
  const { hash } = useParams<{ hash: string }>();
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [progress, setProgress] = useState<PortalProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Simple mobile detection - MUST be before any conditional returns
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debug logging
  console.log('ClientPortal rendered with hash:', hash);
  console.log('Loading state:', loading);
  console.log('Error state:', error);
  console.log('PortalData:', portalData);
  console.log('Progress:', progress);
  console.log('IsMobile:', isMobile);

  useEffect(() => {
    if (hash) {
      fetchPortalData();
    }
  }, [hash]);

  const fetchPortalData = async () => {
    if (!hash) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching portal data for hash:', hash);

      // Get all portal data using the enhanced function
      const { data: portalResult, error: portalError } = await supabase
        .rpc('get_portal_data', { portal_hash_param: hash });

      console.log('Portal result:', portalResult);
      console.log('Portal error:', portalError);

      if (portalError) throw portalError;
      if (!portalResult) {
        setError("Portal niet gevonden of verlopen");
        return;
      }

      const parsedPortalData = typeof portalResult === 'string' ? JSON.parse(portalResult) : portalResult;
      
      // Set portal data
      setPortalData({ portal: parsedPortalData.portal } as PortalData);

      // Track access separately (don't wait for this)
      try {
        await supabase.rpc('update_portal_access', { portal_hash_param: hash });
      } catch (err) {
        console.error('Failed to update portal access:', err);
      }

      // Extract data from the function result
      const phasesData = parsedPortalData.phases || [];
      const deliverablesData = parsedPortalData.deliverables || [];
      const tasksData = parsedPortalData.tasks || [];
      const updatesData = parsedPortalData.updates || [];

      console.log('Extracted data:', { phasesData, deliverablesData, tasksData, updatesData });

      // Calculate progress
      const overallProgress = getProjectProgress(phasesData as Phase[], deliverablesData as Deliverable[], tasksData as Task[]);

      const phaseProgress = phasesData.map((phase: any) => ({
        id: phase.id,
        name: phase.name,
        progress: getPhaseProgress(phase as Phase, deliverablesData as Deliverable[], tasksData as Task[]),
        status: getPhaseStatus(phase as Phase, deliverablesData as Deliverable[], tasksData as Task[]) as 'Completed' | 'In Progress' | 'Pending',
        target_date: phase.target_date
      }));

      const deliverableProgress = deliverablesData.map((deliverable: any) => ({
        id: deliverable.id,
        title: deliverable.title,
        status: deliverable.status as 'Pending' | 'In Progress' | 'Completed',
        progress: getDeliverableProgress(deliverable as Deliverable, tasksData as Task[]),
        due_date: deliverable.due_date
      }));

      const recentUpdates = updatesData.map((update: any) => ({
        title: update.title,
        message: update.message,
        date: update.created_at
      }));

      setProgress({
        overall_progress: overallProgress,
        phases: phaseProgress,
        deliverables: deliverableProgress,
        recent_updates: recentUpdates
      });

    } catch (error: any) {
      console.error('Error fetching portal data:', error);
      setError('Fout bij het laden van portal data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-border border-t-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Portal laden...</p>
        </div>
      </div>
    );
  }

  if (error || !portalData || !progress) {
    console.log('Rendering error state:', error);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-card-foreground mb-4">Portal Niet Gevonden</h1>
          <p className="text-muted-foreground mb-2">Deze portal link is mogelijk verlopen of niet meer actief.</p>
          {error && <p className="text-muted-foreground text-sm">Error: {error}</p>}
        </div>
      </div>
    );
  }

  // Transform data into advanced interactive card format
  const createPortalCardData = () => {
    if (!portalData || !progress) return [];

    const cards = [];
    const activePhase = progress.phases.find(p => p.status === 'In Progress');
    const nextPhase = progress.phases.find(p => p.status === 'Pending');
    const completedPhases = progress.phases.filter(p => p.status === 'Completed');
    const inProgressDeliverables = progress.deliverables.filter(d => d.status === 'In Progress');
    const upcomingDeliverables = progress.deliverables.filter(d => d.status === 'Pending');

    // 1. HERO CARD - Overall Progress (Most Prominent)
    const progressColor = progress.overall_progress >= 75 ? "hsl(var(--success))" : 
                         progress.overall_progress >= 50 ? "hsl(var(--primary))" : 
                         progress.overall_progress >= 25 ? "hsl(var(--warning))" : "hsl(var(--destructive))";
    
    const progressEmoji = progress.overall_progress >= 75 ? "🎉" : 
                         progress.overall_progress >= 50 ? "🚀" : 
                         progress.overall_progress >= 25 ? "⚡" : "🌱";

    cards.push({
      color: progressColor,
      title: `${progress.overall_progress}%`,
      description: `${progressEmoji} ${progress.overall_progress >= 75 ? 'Bijna klaar!' : 
                     progress.overall_progress >= 50 ? 'Geweldige voortgang!' : 
                     progress.overall_progress >= 25 ? 'Goed bezig!' : 'Net gestart!'} • ${completedPhases.length}/${progress.phases.length} fasen voltooid`,
      label: "🎯 PROJECT VOORTGANG"
    });

    // 2. CURRENT ACTIVITY - What's happening now (Second most important)
    if (activePhase) {
      const phaseEmoji = activePhase.progress >= 75 ? "🏁" : 
                        activePhase.progress >= 50 ? "🔥" : 
                        activePhase.progress >= 25 ? "⚡" : "🚀";
      
      cards.push({
        color: "hsl(var(--primary))",
        title: `🔄 ${activePhase.name}`,
        description: `${phaseEmoji} ${activePhase.progress}% voltooid • Actief in ontwikkeling${inProgressDeliverables.length > 0 ? ` • ${inProgressDeliverables.length} items in bewerking` : ''}`,
        label: "⚡ HUIDIGE ACTIVITEIT"
      });
    }

    // 3. TIMELINE CARD - Next milestone/deadline
    if (nextPhase) {
      const daysUntil = nextPhase.target_date ? Math.ceil((new Date(nextPhase.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
      const timelineText = daysUntil ? 
        (daysUntil > 0 ? `Over ${daysUntil} dag${daysUntil > 1 ? 'en' : ''}` : 'Start binnenkort') :
        'Planning wordt afgestemd';

      cards.push({
        color: "hsl(var(--accent))",
        title: `📅 ${nextPhase.name}`,
        description: `🚀 Volgende fase • ${timelineText}${upcomingDeliverables.length > 0 ? ` • ${upcomingDeliverables.length} onderdelen gepland` : ''}`,
        label: "🗓️ VOLGENDE MIJLPAAL"
      });
    }

    // 4. RECENT UPDATE with pulse effect indicator
    if (progress.recent_updates.length > 0) {
      const latestUpdate = progress.recent_updates[0];
      const updateAge = Math.floor((Date.now() - new Date(latestUpdate.date).getTime()) / (1000 * 60 * 60 * 24));
      const isRecent = updateAge < 3;
      
      cards.push({
        color: isRecent ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
        title: `${isRecent ? '🆕 ' : '📋 '}${latestUpdate.title}`,
        description: `${latestUpdate.message.length > 70 ? latestUpdate.message.substring(0, 70) + "..." : latestUpdate.message}${isRecent ? ' • NET GEÜPDATET' : ` • ${updateAge} dag${updateAge > 1 ? 'en' : ''} geleden`}`,
        label: isRecent ? "🔥 LAATSTE NIEUWS" : "📈 RECENTE UPDATE"
      });
    }

    // 5. ACHIEVEMENTS - Completed work
    if (completedPhases.length > 0) {
      const completedDeliverables = progress.deliverables.filter(d => d.status === 'Completed');
      
      cards.push({
        color: "hsl(var(--success))",
        title: `✅ ${completedPhases.length} Fase${completedPhases.length > 1 ? 's' : ''} Afgerond`,
        description: `🎉 Geweldig werk! • ${completedDeliverables.length} deliverables opgeleverd • Alles volgens planning`,
        label: "🏆 BEHAALDE RESULTATEN"
      });
    }

    // 6. SUPPORT & CONTACT
    cards.push({
      color: "hsl(var(--success))",
      title: "💬 Vragen of Feedback?",
      description: "📞 Rechtstreeks contact met je projectteam • Altijd beschikbaar voor ondersteuning",
      label: "🤝 PERSOONLIJK CONTACT"
    });

    return cards;
  };

  const portalCards = createPortalCardData();
  console.log('Portal cards generated:', portalCards);

  console.log('Rendering main portal interface');
  return (
    <div className="min-h-screen bg-background">
      {/* Clean Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-md">
                  <span className="text-xl text-primary-foreground">🚀</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-card-foreground">
                  INNOFLOW
                </h1>
                <p className="text-muted-foreground text-sm">Project Dashboard</p>
              </div>
            </div>
            
            <div className="text-left md:text-right">
              <h2 className="text-lg md:text-xl font-semibold text-card-foreground mb-1">
                {portalData.portal.project_name}
              </h2>
              <div className="flex flex-col md:items-end gap-1">
                <p className="text-muted-foreground text-sm">
                  📋 {portalData.portal.client}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                  Live status
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Magic Bento Dashboard */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <MagicBento
          cardData={portalCards}
        />
        
        {/* Right Section - Deliverables Checklist */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2"></div>
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Deliverables Checklist</h3>
              
              <div className="space-y-3">
                {progress.deliverables.map((deliverable) => (
                  <div key={deliverable.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      {deliverable.status === 'Completed' ? (
                        <div className="w-5 h-5 bg-success rounded border-2 border-success flex items-center justify-center">
                          <span className="text-success-foreground text-xs">✓</span>
                        </div>
                      ) : deliverable.status === 'In Progress' ? (
                        <div className="w-5 h-5 bg-primary/10 border-2 border-primary rounded flex items-center justify-center">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        </div>
                      ) : (
                        <div className="w-5 h-5 bg-muted border-2 border-border rounded"></div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h5 className={`font-medium text-sm mb-1 ${
                        deliverable.status === 'Completed' ? 'text-muted-foreground line-through' : 'text-card-foreground'
                      }`}>
                        {deliverable.title}
                      </h5>
                      
                      {deliverable.status !== 'Completed' && deliverable.progress > 0 && (
                        <div className="mb-2">
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div 
                              className="bg-primary h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${deliverable.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-muted-foreground mt-1">{deliverable.progress}%</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          deliverable.status === 'Completed' ? 'bg-success/10 text-success' :
                          deliverable.status === 'In Progress' ? 'bg-primary/10 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {deliverable.status === 'Completed' ? 'Afgerond' :
                           deliverable.status === 'In Progress' ? 'Bezig' :
                           'Gepland'}
                        </span>
                        
                        {deliverable.due_date && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(deliverable.due_date), 'dd/MM')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 p-6">
              <h3 className="text-lg font-semibold text-primary mb-3">💬 Vragen of Feedback?</h3>
              <p className="text-primary/80 text-sm mb-4">
                Heeft u vragen over de voortgang of wilt u feedback geven? 
                Neem direct contact op met uw projectteam.
              </p>
              <div className="flex flex-col gap-2 text-sm text-primary/70">
                <span>📞 Altijd bereikbaar</span>
                <span>⚡ Snelle response</span>
                <span>🤝 Persoonlijke service</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Footer */}
        <div className="text-center mt-12 pt-8 border-t border-border">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              <span>Live dashboard • Laatste sync: {format(new Date(), 'HH:mm')}</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
              <span>📊 {progress.phases.length} projectfasen</span>
              <span>📋 {progress.deliverables.length} deliverables</span>
              <span>🔄 {progress.recent_updates.length} updates</span>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span>Powered by</span>
              <span className="font-semibold text-primary">INNOFLOW</span>
              <span>✨</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}