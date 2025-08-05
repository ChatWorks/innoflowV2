import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Goal } from '@/types/goal';
import { TrendingUp, Target, Calendar, Zap } from 'lucide-react';

interface GoalAnalyticsProps {
  goals: Goal[];
}

export function GoalAnalytics({ goals }: GoalAnalyticsProps) {
  const [analytics, setAnalytics] = useState({
    completionRate: 0,
    averageProgress: 0,
    onTrackGoals: 0,
    atRiskGoals: 0,
    completedThisMonth: 0,
    totalValue: 0
  });

  useEffect(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const completedGoals = goals.filter(g => g.is_completed);
    const totalProgress = goals.reduce((sum, goal) => {
      if (goal.goal_type === 'boolean') return sum + (goal.is_completed ? 100 : 0);
      if (goal.goal_type === 'percentage') return sum + Math.min(goal.current_value, 100);
      if (goal.target_value && goal.target_value > 0) {
        return sum + Math.min((goal.current_value / goal.target_value) * 100, 100);
      }
      return sum;
    }, 0);

    const onTrack = goals.filter(goal => {
      if (goal.is_completed) return true;
      if (!goal.deadline) return true;
      
      const deadline = new Date(goal.deadline);
      const timeLeft = deadline.getTime() - now.getTime();
      const totalTime = deadline.getTime() - new Date(goal.created_at).getTime();
      const timeProgress = 1 - (timeLeft / totalTime);
      
      let actualProgress = 0;
      if (goal.goal_type === 'boolean') {
        actualProgress = goal.is_completed ? 1 : 0;
      } else if (goal.goal_type === 'percentage') {
        actualProgress = goal.current_value / 100;
      } else if (goal.target_value && goal.target_value > 0) {
        actualProgress = goal.current_value / goal.target_value;
      }
      
      return actualProgress >= timeProgress * 0.8; // On track if within 80% of expected progress
    });

    const completedThisMonth = completedGoals.filter(goal => 
      goal.completed_at && new Date(goal.completed_at) >= thisMonthStart
    ).length;

    const totalValue = goals
      .filter(g => g.category === 'financial' || g.category === 'sales')
      .reduce((sum, g) => sum + (g.current_value || 0), 0);

    setAnalytics({
      completionRate: goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0,
      averageProgress: goals.length > 0 ? totalProgress / goals.length : 0,
      onTrackGoals: onTrack.length,
      atRiskGoals: goals.length - onTrack.length - completedGoals.length,
      completedThisMonth,
      totalValue
    });
  }, [goals]);

  const progressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Completion Rate */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-blue-500" />
            Voltooiingspercentage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{Math.round(analytics.completionRate)}%</span>
              <Badge variant={analytics.completionRate >= 70 ? "default" : "secondary"}>
                {analytics.completionRate >= 70 ? "Excellent" : "Needs Focus"}
              </Badge>
            </div>
            <Progress value={analytics.completionRate} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Van je {goals.length} doelen
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Average Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Gemiddelde Voortgang
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{Math.round(analytics.averageProgress)}%</span>
              <div className={`w-3 h-3 rounded-full ${progressColor(analytics.averageProgress)}`} />
            </div>
            <Progress value={analytics.averageProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Across all active goals
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Goal Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-orange-500" />
            Goal Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-600">On Track</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                {analytics.onTrackGoals}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-red-600">At Risk</span>
              <Badge variant="outline" className="text-red-600 border-red-600">
                {analytics.atRiskGoals}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-600">Completed This Month</span>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                {analytics.completedThisMonth}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Goals Value */}
      {analytics.totalValue > 0 && (
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-purple-500" />
              Financial Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <span className="text-2xl font-bold">€{analytics.totalValue.toLocaleString()}</span>
              <p className="text-xs text-muted-foreground">
                Total value from sales & financial goals
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}