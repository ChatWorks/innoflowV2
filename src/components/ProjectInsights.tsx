import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Euro, TrendingUp, Target } from 'lucide-react';
import { TimeEntry, Task } from '@/types/project';

interface ProjectInsightsProps {
  timeEntries: TimeEntry[];
  tasks: Task[];
}

export default function ProjectInsights({ timeEntries, tasks }: ProjectInsightsProps) {
  // Calculate actual time worked (in hours)
  const actualHours = timeEntries
    .filter(entry => entry.duration_minutes)
    .reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) / 60;

  // Calculate billable hours earned (completed tasks)
  const earnedBillableHours = tasks
    .filter(task => task.completed)
    .reduce((sum, task) => sum + task.billable_hours, 0);

  // Calculate total billable hours possible
  const totalBillableHours = tasks
    .reduce((sum, task) => sum + task.billable_hours, 0);

  // Calculate efficiency (billable hours earned / actual hours worked)
  const efficiency = actualHours > 0 ? (earnedBillableHours / actualHours) * 100 : 0;

  // Calculate completion percentage
  const completionPercentage = totalBillableHours > 0 
    ? (earnedBillableHours / totalBillableHours) * 100 
    : 0;

  // Efficiency status
  const getEfficiencyStatus = (efficiency: number) => {
    if (efficiency >= 100) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (efficiency >= 80) return { label: 'Goed', color: 'bg-primary/10 text-primary' };
    if (efficiency >= 60) return { label: 'Gemiddeld', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Onder verwachting', color: 'bg-red-100 text-red-800' };
  };

  const efficiencyStatus = getEfficiencyStatus(efficiency);

  // Calculate estimated value (assuming €75/hour rate)
  const hourlyRate = 75;
  const earnedValue = earnedBillableHours * hourlyRate;
  const potentialValue = totalBillableHours * hourlyRate;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Actual Time Worked */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Werkelijke Tijd
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{actualHours.toFixed(1)}h</div>
          <p className="text-xs text-muted-foreground mt-1">
            {timeEntries.length} sessies
          </p>
        </CardContent>
      </Card>

      {/* Billable Hours Earned */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Declarabel Verdiend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{earnedBillableHours}h</div>
          <p className="text-xs text-muted-foreground mt-1">
            van {totalBillableHours}h totaal
          </p>
          <Progress value={completionPercentage} className="h-2 mt-2" />
        </CardContent>
      </Card>

      {/* Efficiency */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Efficiency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{efficiency.toFixed(0)}%</div>
          <Badge className={`text-xs mt-2 ${efficiencyStatus.color}`}>
            {efficiencyStatus.label}
          </Badge>
        </CardContent>
      </Card>

      {/* Financial Value */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Euro className="h-4 w-4" />
            Waarde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            €{earnedValue.toLocaleString('nl-NL', { minimumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            van €{potentialValue.toLocaleString('nl-NL', { minimumFractionDigits: 0 })} potentieel
          </p>
          <Progress value={(earnedValue / potentialValue) * 100 || 0} className="h-2 mt-2" />
        </CardContent>
      </Card>
    </div>
  );
}