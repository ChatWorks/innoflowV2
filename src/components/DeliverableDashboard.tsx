import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Euro, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

import { Deliverable, Task } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import DeliverableCreationDialog from './DeliverableCreationDialog';
import DeliverableTimer from './DeliverableTimer';

interface DeliverableDashboardProps {
  projectId: string;
  deliverables: Deliverable[];
  tasks: Task[];
  onRefresh: () => void;
}

interface DeliverableStats {
  totalTimeMinutes: number;
  billableHours: number;
  earnedHours: number;
  completionRate: number;
}

export default function DeliverableDashboard({ projectId, deliverables, tasks, onRefresh }: DeliverableDashboardProps) {
  const [deliverableStats, setDeliverableStats] = useState<Record<string, DeliverableStats>>({});

  useEffect(() => {
    fetchDeliverableStats();
  }, [deliverables, tasks]);

  const fetchDeliverableStats = async () => {
    const stats: Record<string, DeliverableStats> = {};

    for (const deliverable of deliverables) {
      // Get time entries for this deliverable
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('duration_minutes')
        .eq('deliverable_id', deliverable.id)
        .not('duration_minutes', 'is', null);

      const totalTimeMinutes = timeEntries?.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) || 0;
      
      // Get tasks for this deliverable
      const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverable.id);
      const billableHours = deliverableTasks.reduce((sum, task) => sum + task.billable_hours, 0);
      const earnedHours = deliverableTasks.filter(t => t.completed).reduce((sum, task) => sum + task.billable_hours, 0);
      const completionRate = deliverableTasks.length > 0 ? (deliverableTasks.filter(t => t.completed).length / deliverableTasks.length) * 100 : 0;

      stats[deliverable.id] = {
        totalTimeMinutes,
        billableHours,
        earnedHours,
        completionRate
      };
    }

    setDeliverableStats(stats);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Deliverables Dashboard</h2>
            <p className="text-slate-300">Real-time overzicht van je deliverables en tijd tracking</p>
          </div>
          <DeliverableCreationDialog projectId={projectId} onDeliverableCreated={onRefresh} />
        </div>
      </div>

      {/* Deliverables Grid */}
      {deliverables.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nog geen deliverables</h3>
            <p className="text-muted-foreground mb-6">Maak je eerste deliverable aan om te beginnen</p>
            <DeliverableCreationDialog projectId={projectId} onDeliverableCreated={onRefresh} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deliverables.map((deliverable) => {
            const stats = deliverableStats[deliverable.id] || { totalTimeMinutes: 0, billableHours: 0, earnedHours: 0, completionRate: 0 };
            
            return (
              <Card key={deliverable.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-2">{deliverable.title}</CardTitle>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant={deliverable.status === 'Completed' ? 'default' : 'secondary'}>
                          {deliverable.status}
                        </Badge>
                        {deliverable.due_date && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(deliverable.due_date), "dd MMM", { locale: nl })}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <DeliverableTimer 
                    deliverableId={deliverable.id}
                    deliverableTitle={deliverable.title}
                    projectId={projectId}
                  />
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Tijd Gelogd */}
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Tijd Gelogd</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          {formatTime(stats.totalTimeMinutes)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Declarabele Uren */}
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Euro className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Declarabel</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-600">
                          {stats.earnedHours}h / {stats.billableHours}h
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {stats.billableHours > 0 ? Math.round((stats.earnedHours / stats.billableHours) * 100) : 0}% verdiend
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Voortgang */}
                  <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Voortgang</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-purple-600">
                          {Math.round(stats.completionRate)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tasks.filter(t => t.deliverable_id === deliverable.id && t.completed).length} / {tasks.filter(t => t.deliverable_id === deliverable.id).length} taken
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}