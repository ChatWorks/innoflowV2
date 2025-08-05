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
import { MagicBento } from '@/components/MagicBento';
import { PortalCard } from '@/components/PortalCard';
import { useIsMobile } from '@/hooks/use-mobile';
import '@/styles/portal-bento.css';

export default function ClientPortal() {
  const { hash } = useParams<{ hash: string }>();
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [progress, setProgress] = useState<PortalProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-slate-900/20"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Portal Niet Gevonden</h1>
          <p className="text-white/60">Deze portal link is mogelijk verlopen of niet meer actief.</p>
        </div>
      </div>
    );
  }

  const isMobile = useIsMobile();

  // Transform data into Magic Bento card format
  const createPortalCardData = () => {
    if (!portalData || !progress) return [];

    const cards = [];

    // Overall Progress Card (Large)
    cards.push({
      id: "overall-progress",
      color: "#0F172A",
      title: `${progress.overall_progress}% Complete`,
      description: "Geweldige vooruitgang! Op schema voor oplevering",
      label: "Overall Progress",
      icon: "🎯",
      size: "large" as const,
      status: progress.overall_progress > 80 ? "completed" : progress.overall_progress > 40 ? "active" : "pending" as const,
      progressBar: true,
      progressValue: progress.overall_progress
    });

    // Current Active Phase (Medium)
    const activePhase = progress.phases.find(p => p.status === 'In Progress');
    if (activePhase) {
      cards.push({
        id: "current-phase",
        color: "#1E293B",
        title: activePhase.name,
        description: `${activePhase.progress}% voltooid`,
        label: "Huidige Fase",
        icon: "⚡",
        size: "medium" as const,
        status: "active" as const,
        progressBar: true,
        progressValue: activePhase.progress,
        targetDate: activePhase.target_date ? format(new Date(activePhase.target_date), 'dd MMM yyyy') : undefined
      });
    }

    // Next Milestone (Medium)
    const nextPhase = progress.phases.find(p => p.status === 'Pending');
    if (nextPhase) {
      cards.push({
        id: "next-milestone",
        color: "#334155",
        title: nextPhase.name,
        description: nextPhase.target_date ? `Verwacht: ${format(new Date(nextPhase.target_date), 'dd MMM yyyy')}` : "Binnenkort van start",
        label: "Volgende Mijlpaal",
        icon: "🚀",
        size: "medium" as const,
        status: "pending" as const
      });
    }

    // Completed Phases (Small cards)
    const completedPhases = progress.phases.filter(p => p.status === 'Completed');
    completedPhases.slice(0, 2).forEach((phase, index) => {
      cards.push({
        id: `milestone-completed-${phase.id}`,
        color: "#10B981",
        title: phase.name,
        description: phase.target_date ? `Afgerond ${format(new Date(phase.target_date), 'dd MMM')}` : "Voltooid",
        label: "✅ Afgerond",
        icon: "🎉",
        size: "small" as const,
        status: "completed" as const
      });
    });

    // Latest Update (Medium)
    if (progress.recent_updates.length > 0) {
      const latestUpdate = progress.recent_updates[0];
      cards.push({
        id: "latest-update",
        color: "#7C3AED",
        title: latestUpdate.title,
        description: latestUpdate.message.length > 80 ? latestUpdate.message.substring(0, 80) + "..." : latestUpdate.message,
        label: "Laatste Update",
        icon: "📈",
        size: "medium" as const,
        status: "highlight" as const
      });
    }

    // Contact Info (Small)
    cards.push({
      id: "contact-info",
      color: "#059669",
      title: "Hulp Nodig?",
      description: "Neem contact op met je projectteam",
      label: "Support",
      icon: "💬",
      size: "small" as const,
      status: "support" as const,
      onClick: () => {
        window.location.href = "mailto:support@innoflow.nl?subject=Project Support - " + portalData.portal.project_name;
      }
    });

    // Add any pending deliverables as small cards
    const pendingDeliverables = progress.deliverables.filter(d => d.status !== 'Completed');
    pendingDeliverables.slice(0, 2).forEach((deliverable) => {
      cards.push({
        id: `deliverable-${deliverable.id}`,
        color: "#3B82F6",
        title: deliverable.title,
        description: `${deliverable.progress}% voltooid`,
        label: "Deliverable",
        icon: "📦",
        size: "small" as const,
        status: deliverable.status === 'In Progress' ? "active" : "pending" as const,
        progressBar: deliverable.status === 'In Progress',
        progressValue: deliverable.progress
      });
    });

    return cards;
  };

  const portalCards = createPortalCardData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-slate-900/20"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                🚀 INNOFLOW
              </h1>
              <p className="text-white/70 mt-1">Interactive Project Portal</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-semibold text-white">{portalData.portal.project_name}</h2>
              <p className="text-white/70">{portalData.portal.client}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Magic Bento Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <MagicBento
          className="portal-grid"
          enableStars={!isMobile}
          enableSpotlight={!isMobile}
          enableBorderGlow={true}
          enableTilt={!isMobile}
          enableMagnetism={!isMobile}
          clickEffect={true}
          spotlightRadius={400}
          particleCount={isMobile ? 4 : 8}
          glowColor="59, 130, 246"
        >
          <div className="portal-bento-grid">
            {portalCards.map((card, index) => (
              <PortalCard
                key={card.id}
                card={card}
                index={index}
                enableTilt={!isMobile}
                enableMagnetism={!isMobile}
                clickEffect={true}
              />
            ))}
          </div>
        </MagicBento>

        {/* Footer */}
        <div className="text-center mt-12 py-8 border-t border-white/10">
          <p className="text-sm text-white/60">
            Laatste update: {format(new Date(), 'dd MMMM yyyy, HH:mm')}
          </p>
          <p className="text-xs text-white/40 mt-1">
            Powered by INNOFLOW Project Management ✨
          </p>
        </div>
      </div>
    </div>
  );
}