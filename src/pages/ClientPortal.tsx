import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { InnoflowLogo } from '@/components/ui/InnoflowLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock } from 'lucide-react';
import type { PortalData, PortalProgress } from '@/types/clientPortal';
import type { Deliverable, Phase, Task } from '@/types/project';
import { 
  getProjectProgress, 
  getPhaseProgress, 
  getDeliverableProgress,
  getPhaseStatus 
} from '@/utils/progressCalculations';

export default function ClientPortal() {
  const { hash } = useParams<{ hash: string }>();
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [progress, setProgress] = useState<PortalProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Password verification state
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
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

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setPasswordError('Voer een wachtwoord in');
      return;
    }
    
    setIsVerifying(true);
    setPasswordError('');
    await fetchPortalData(password);
    setIsVerifying(false);
  };

  const fetchPortalData = async (providedPassword?: string) => {
    if (!hash) return;

    try {
      setLoading(true);
      setError(null);
      setPasswordError('');

      console.log('Fetching portal data for hash:', hash);

      // First check if portal exists and if it requires password
      const { data: portalCheck, error: checkError } = await supabase
        .from('client_portals')
        .select('password_hash, is_active, expires_at')
        .eq('portal_hash', hash)
        .maybeSingle();

      if (checkError) throw checkError;
      if (!portalCheck) {
        setError("Portal niet gevonden");
        return;
      }

      if (!portalCheck.is_active) {
        setError("Portal is gedeactiveerd");
        return;
      }

      if (portalCheck.expires_at && new Date(portalCheck.expires_at) < new Date()) {
        setError("Portal is verlopen");
        return;
      }

      // Check if password is required
      if (portalCheck.password_hash && !providedPassword) {
        setRequiresPassword(true);
        setLoading(false);
        return;
      }

      // Verify password if provided
      if (portalCheck.password_hash && providedPassword) {
        const hashedPassword = await hashPassword(providedPassword);
        if (hashedPassword !== portalCheck.password_hash) {
          setPasswordError('Onjuist wachtwoord');
          setIsVerifying(false);
          return;
        }
      }

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
      setRequiresPassword(false);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Portal laden...</p>
        </div>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto p-6">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800">Portal Beveiligd</CardTitle>
              <p className="text-slate-600">Voer het wachtwoord in om toegang te krijgen</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="portal-password">Wachtwoord</Label>
                  <div className="relative">
                    <Input
                      id="portal-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Voer wachtwoord in"
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
                  {passwordError && (
                    <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isVerifying}
                >
                  {isVerifying ? 'Verifiëren...' : 'Toegang Verkrijgen'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !portalData || !progress) {
    console.log('Rendering error state:', error);
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Portal Niet Gevonden</h1>
          <p className="text-slate-600 mb-2">Deze portal link is mogelijk verlopen of niet meer actief.</p>
          {error && <p className="text-slate-500 text-sm">Error: {error}</p>}
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
    <div className="min-h-screen bg-slate-50">
      {/* Clean Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <InnoflowLogo size="lg" showText={false} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                  Innoflow
                </h1>
                <p className="text-slate-600 text-sm">Project Dashboard</p>
              </div>
            </div>
            
            <div className="text-left md:text-right">
              <h2 className="text-lg md:text-xl font-semibold text-slate-800 mb-1">
                {portalData.portal.project_name}
              </h2>
              <div className="flex flex-col md:items-end gap-1">
                <p className="text-slate-600 text-sm">
                  📋 {portalData.portal.client}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live status
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Section - Progress Overview */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Overall Progress Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Project Voortgang</h3>
                <span className="text-2xl font-bold text-blue-600">{progress.overall_progress}%</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-slate-600 mb-2">
                  <span>Totale voortgang</span>
                  <span>{progress.overall_progress}% voltooid</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progress.overall_progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>🎯 {progress.phases.filter(p => p.status === 'Completed').length}/{progress.phases.length} fasen voltooid</span>
                  <span>📋 {progress.deliverables.filter(d => d.status === 'Completed').length}/{progress.deliverables.length} items afgerond</span>
                </div>
              </div>
            </div>

            {/* Phases Progress */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Fasen Overzicht</h3>
              <div className="space-y-4">
                {progress.phases.map((phase, index) => (
                  <div key={phase.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                    <div className="flex-shrink-0">
                      {phase.status === 'Completed' ? (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      ) : phase.status === 'In Progress' ? (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                          <span className="text-white text-sm">{index + 1}</span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                          <span className="text-slate-600 text-sm">{index + 1}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-slate-800">{phase.name}</h4>
                        <span className="text-sm font-medium text-slate-600">{phase.progress}%</span>
                      </div>
                      
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            phase.status === 'Completed' ? 'bg-green-500' :
                            phase.status === 'In Progress' ? 'bg-blue-500' :
                            'bg-slate-300'
                          }`}
                          style={{ width: `${phase.progress}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          phase.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          phase.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {phase.status === 'Completed' ? '✅ Voltooid' :
                           phase.status === 'In Progress' ? '🔄 Bezig' :
                           '⏳ Gepland'}
                        </span>
                        {phase.target_date && (
                          <span>📅 {format(new Date(phase.target_date), 'dd MMM yyyy')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Updates */}
            {progress.recent_updates.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Laatste Updates</h3>
                <div className="space-y-3">
                  {progress.recent_updates.slice(0, 3).map((update, index) => {
                    const updateAge = Math.floor((Date.now() - new Date(update.date).getTime()) / (1000 * 60 * 60 * 24));
                    const isRecent = updateAge < 3;
                    
                    return (
                      <div key={index} className="flex gap-3 p-3 rounded-lg bg-slate-50">
                        <div className="flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full mt-2 ${isRecent ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`}></div>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-slate-800 mb-1">{update.title}</h5>
                          <p className="text-sm text-slate-600 mb-2">{update.message}</p>
                          <span className="text-xs text-slate-500">
                            {isRecent ? `🆕 ${updateAge === 0 ? 'Vandaag' : `${updateAge} dag${updateAge > 1 ? 'en' : ''} geleden`}` : 
                             `📅 ${format(new Date(update.date), 'dd MMM yyyy')}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Section - Deliverables Checklist */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Deliverables Checklist</h3>
              
              <div className="space-y-3">
                {progress.deliverables.map((deliverable) => (
                  <div key={deliverable.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      {deliverable.status === 'Completed' ? (
                        <div className="w-5 h-5 bg-green-500 rounded border-2 border-green-500 flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      ) : deliverable.status === 'In Progress' ? (
                        <div className="w-5 h-5 bg-blue-100 border-2 border-blue-500 rounded flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        </div>
                      ) : (
                        <div className="w-5 h-5 bg-slate-100 border-2 border-slate-300 rounded"></div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h5 className={`font-medium text-sm mb-1 ${
                        deliverable.status === 'Completed' ? 'text-slate-600 line-through' : 'text-slate-800'
                      }`}>
                        {deliverable.title}
                      </h5>
                      
                      {deliverable.status !== 'Completed' && deliverable.progress > 0 && (
                        <div className="mb-2">
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${deliverable.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500 mt-1">{deliverable.progress}%</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          deliverable.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          deliverable.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {deliverable.status === 'Completed' ? 'Afgerond' :
                           deliverable.status === 'In Progress' ? 'Bezig' :
                           'Gepland'}
                        </span>
                        
                        {deliverable.due_date && (
                          <span className="text-xs text-slate-500">
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
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">💬 Vragen of Feedback?</h3>
              <p className="text-blue-700 text-sm mb-4">
                Heeft u vragen over de voortgang of wilt u feedback geven? 
                Neem direct contact op met uw projectteam.
              </p>
              <div className="flex flex-col gap-2 text-sm text-blue-600">
                <span>📞 Altijd bereikbaar</span>
                <span>⚡ Snelle response</span>
                <span>🤝 Persoonlijke service</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Footer */}
        <div className="text-center mt-12 pt-8 border-t border-slate-200">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>Live dashboard • Laatste sync: {format(new Date(), 'HH:mm')}</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500">
              <span>📊 {progress.phases.length} projectfasen</span>
              <span>📋 {progress.deliverables.length} deliverables</span>
              <span>🔄 {progress.recent_updates.length} updates</span>
            </div>
            
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <span>Powered by</span>
              <span className="font-semibold text-blue-600">INNOFLOW</span>
              <span>✨</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}