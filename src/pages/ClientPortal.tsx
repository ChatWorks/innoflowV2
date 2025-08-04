import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Calendar, ArrowRight } from 'lucide-react';
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

      // First get portal data using the function
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
      setPortalData(parsedPortalData as PortalData);

      // Now fetch progress data
      const projectId = parsedPortalData.portal.project_id;
      
      const [
        { data: phases },
        { data: deliverables }, 
        { data: tasks },
        { data: clientUpdates }
      ] = await Promise.all([
        supabase.from('phases').select('*').eq('project_id', projectId).order('target_date'),
        supabase.from('deliverables').select('*').eq('project_id', projectId).order('target_date'),
        supabase.from('tasks').select('*').in('deliverable_id', 
          await supabase.from('deliverables').select('id').eq('project_id', projectId)
            .then(res => res.data?.map(d => d.id) || [])
        ),
        supabase.from('client_updates').select('*')
          .eq('project_id', projectId)
          .eq('is_visible_to_client', true)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      // Calculate progress
      const phasesData = phases || [];
      const deliverablesData = deliverables || [];
      const tasksData = tasks || [];
      const updatesData = clientUpdates || [];

      const overallProgress = getProjectProgress(phasesData as Phase[], deliverablesData as Deliverable[], tasksData as Task[]);

      const phaseProgress = phasesData.map(phase => ({
        id: phase.id,
        name: phase.name,
        progress: getPhaseProgress(phase as Phase, deliverablesData as Deliverable[], tasksData as Task[]),
        status: getPhaseStatus(phase as Phase, deliverablesData as Deliverable[], tasksData as Task[]) as 'Completed' | 'In Progress' | 'Pending',
        target_date: phase.target_date
      }));

      const deliverableProgress = deliverablesData.map(deliverable => ({
        id: deliverable.id,
        title: deliverable.title,
        status: deliverable.status as 'Pending' | 'In Progress' | 'Completed',
        progress: getDeliverableProgress(deliverable as Deliverable, tasksData as Task[]),
        due_date: deliverable.due_date
      }));

      const recentUpdates = updatesData.map(update => ({
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
      setError('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !portalData || !progress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Portal Niet Gevonden</h1>
          <p className="text-gray-600">Deze portal link is mogelijk verlopen of niet meer actief.</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'In Progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🏢 INNOFLOW</h1>
              <p className="text-gray-600 mt-1">Project Dashboard</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-semibold text-gray-900">{portalData.portal.project_name}</h2>
              <p className="text-gray-600">{portalData.portal.client}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Overall Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 OVERALL PROGRESS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{progress.overall_progress}% Complete</span>
                  <Badge className={getStatusColor(portalData.portal.status)}>
                    {portalData.portal.status}
                  </Badge>
                </div>
                <Progress value={progress.overall_progress} className="h-3" />
              </div>
              
              {portalData.portal.end_date && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Verwachte oplevering: {format(new Date(portalData.portal.end_date), 'dd MMMM yyyy')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Milestones (Phases) */}
          <Card>
            <CardHeader>
              <CardTitle>📋 MILESTONES</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {progress.phases.map((phase) => (
                <div key={phase.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-shrink-0">
                    {getStatusIcon(phase.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{phase.name}</h4>
                      <Badge variant="outline" className={getStatusColor(phase.status)}>
                        {phase.status}
                      </Badge>
                    </div>
                    
                    {phase.status !== 'Completed' && (
                      <div className="space-y-1">
                        <Progress value={phase.progress} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{phase.progress}%</span>
                          {phase.target_date && (
                            <span>Target: {format(new Date(phase.target_date), 'dd MMM')}</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {phase.status === 'Completed' && phase.target_date && (
                      <div className="text-xs text-green-600">
                        Afgerond op {format(new Date(phase.target_date), 'dd MMMM')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Updates */}
          <Card>
            <CardHeader>
              <CardTitle>📅 RECENT UPDATES</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {progress.recent_updates.length > 0 ? (
                progress.recent_updates.map((update, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900">{update.title}</h4>
                      <span className="text-xs text-gray-500">
                        {format(new Date(update.date), 'dd MMM')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{update.message}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No updates yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Deliverables */}
        {progress.deliverables.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>📦 DELIVERABLES</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {progress.deliverables.map((deliverable) => (
                  <div key={deliverable.id} className="p-4 border rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{deliverable.title}</h4>
                      {getStatusIcon(deliverable.status)}
                    </div>
                    
                    <Badge variant="outline" className={`${getStatusColor(deliverable.status)} text-xs mb-2`}>
                      {deliverable.status}
                    </Badge>
                    
                    {deliverable.status !== 'Completed' && (
                      <div className="space-y-1">
                        <Progress value={deliverable.progress} className="h-2" />
                        <div className="text-xs text-gray-500">{deliverable.progress}% complete</div>
                      </div>
                    )}
                    
                    {deliverable.due_date && (
                      <div className="text-xs text-gray-500 mt-2">
                        Due: {format(new Date(deliverable.due_date), 'dd MMM yyyy')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-12 py-8 border-t">
          <p className="text-sm text-gray-500">
            Laatste update: {format(new Date(), 'dd MMMM yyyy, HH:mm')}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Powered by INNOFLOW Project Management
          </p>
        </div>
      </div>
    </div>
  );
}