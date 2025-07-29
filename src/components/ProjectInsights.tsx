import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Target, Zap, CheckCircle } from 'lucide-react';
import { Task, TimeEntry, Deliverable } from '@/types/project';
import { formatTime, getProjectEfficiency, getTotalProjectDeclarable, formatCurrency } from '@/utils/progressCalculations';

interface ProjectInsightsProps {
  tasks: Task[];
  timeEntries: TimeEntry[];
  deliverables: Deliverable[];
  hourlyRate?: number;
}

export default function ProjectInsights({ tasks, timeEntries, deliverables, hourlyRate = 75 }: ProjectInsightsProps) {
  // Calculate total actual hours worked
  const actualHours = timeEntries
    .filter(entry => entry.duration_minutes)
    .reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) / 60;

  // Calculate total declarable hours from deliverables
  const totalDeclarableHours = getTotalProjectDeclarable(deliverables);

  // Calculate timer-based hours from time entries
  const totalTimerHours = timeEntries
    .filter(entry => entry.duration_seconds)
    .reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0) / 3600;

  // Calculate efficiency (timer hours / declarable hours * 100)
  const efficiency = getProjectEfficiency(deliverables, tasks, timeEntries);

  // Calculate completion percentage (completed tasks / total tasks)
  const completionPercentage = tasks.length > 0 ? 
    (tasks.filter(task => task.completed).length / tasks.length) * 100 : 0;

  // Calculate contract value
  const contractValue = totalDeclarableHours * hourlyRate;

  // Calculate actual cost based on timer time
  const actualCost = totalTimerHours * hourlyRate;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Declarabele Uren</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDeclarableHours}h</div>
          <p className="text-xs text-muted-foreground">
            Contract waarde: {formatCurrency(contractValue)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Werkelijke Tijd</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(totalTimerHours * 10) / 10}h</div>
          <p className="text-xs text-muted-foreground">
            Werkelijke kosten: {formatCurrency(actualCost)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${efficiency <= 100 ? 'text-green-600' : 'text-red-600'}`}>
            {Math.round(efficiency)}%
          </div>
          <Progress value={Math.min(efficiency, 100)} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {efficiency <= 80 ? 'Zeer efficient' : 
             efficiency <= 100 ? 'Op budget' : 
             efficiency <= 120 ? 'Licht over budget' : 'Over budget'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Voltooiing</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(completionPercentage)}%</div>
          <Progress value={completionPercentage} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {tasks.filter(t => t.completed).length} van {tasks.length} taken voltooid
          </p>
        </CardContent>
      </Card>
    </div>
  );
}