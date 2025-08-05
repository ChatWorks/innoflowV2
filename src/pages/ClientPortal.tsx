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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-slate-900/20"></div>
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-white/60 text-lg">Loading portal...</p>
        </div>
      </div>
    );
  }

  if (error || !portalData || !progress) {
    console.log('Rendering error state:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-slate-900/20"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Portal Niet Gevonden</h1>
          <p className="text-white/60">Deze portal link is mogelijk verlopen of niet meer actief.</p>
          <p className="text-white/40 text-sm mt-2">Error: {error}</p>
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
    const progressColor = progress.overall_progress >= 75 ? "#10B981" : 
                         progress.overall_progress >= 50 ? "#3B82F6" : 
                         progress.overall_progress >= 25 ? "#F59E0B" : "#EF4444";
    
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
        color: "#3B82F6",
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
        color: "#8B5CF6",
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
        color: isRecent ? "#06B6D4" : "#64748B",
        title: `${isRecent ? '🆕 ' : '📋 '}${latestUpdate.title}`,
        description: `${latestUpdate.message.length > 70 ? latestUpdate.message.substring(0, 70) + "..." : latestUpdate.message}${isRecent ? ' • NET GEÜPDATET' : ` • ${updateAge} dag${updateAge > 1 ? 'en' : ''} geleden`}`,
        label: isRecent ? "🔥 LAATSTE NIEUWS" : "📈 RECENTE UPDATE"
      });
    }

    // 5. ACHIEVEMENTS - Completed work
    if (completedPhases.length > 0) {
      const completedDeliverables = progress.deliverables.filter(d => d.status === 'Completed');
      
      cards.push({
        color: "#10B981",
        title: `✅ ${completedPhases.length} Fase${completedPhases.length > 1 ? 's' : ''} Afgerond`,
        description: `🎉 Geweldig werk! • ${completedDeliverables.length} deliverables opgeleverd • Alles volgens planning`,
        label: "🏆 BEHAALDE RESULTATEN"
      });
    }

    // 6. SUPPORT & CONTACT
    cards.push({
      color: "#059669",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-slate-900/20"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Enhanced Header */}
      <div className="relative z-10 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-xl">🚀</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  INNOFLOW
                </h1>
                <p className="text-white/70 text-sm">Live Project Dashboard</p>
              </div>
            </div>
            
            <div className="text-left md:text-right">
              <h2 className="text-lg md:text-xl font-semibold text-white mb-1">
                {portalData.portal.project_name}
              </h2>
              <div className="flex flex-col md:items-end gap-1">
                <p className="text-white/70 text-sm">
                  👤 {portalData.portal.client}
                </p>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Live status
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Status Bar */}
          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              <span className="text-white/80">{progress.overall_progress}% Voltooid</span>
            </div>
            {progress.phases.find(p => p.status === 'In Progress') && (
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                <span className="text-white/80">Actief bezig</span>
              </div>
            )}
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span className="text-white/80">{progress.phases.filter(p => p.status === 'Completed').length} fasen afgerond</span>
            </div>
          </div>
        </div>
      </div>

      {/* Magic Bento Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <MagicBento
          textAutoHide={true}
          enableStars={!isMobile}
          enableSpotlight={!isMobile}
          enableBorderGlow={true}
          enableTilt={!isMobile}
          enableMagnetism={!isMobile}
          clickEffect={true}
          spotlightRadius={400}
          particleCount={isMobile ? 4 : 8}
          glowColor="59, 130, 246"
          cardData={portalCards}
        />

        {/* Enhanced Footer with Real-time Indicators */}
        <div className="text-center mt-12 py-8 border-t border-white/10">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>Live dashboard • Laatste sync: {format(new Date(), 'HH:mm')}</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 text-xs text-white/40">
              <span>📊 {progress.phases.length} projectfasen</span>
              <span>📋 {progress.deliverables.length} deliverables</span>
              <span>🔄 {progress.recent_updates.length} updates</span>
            </div>
            
            <p className="text-xs text-white/40 mt-2 flex items-center gap-1">
              <span>Powered by</span>
              <span className="font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                INNOFLOW
              </span>
              <span>✨</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}