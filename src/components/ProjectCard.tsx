import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users } from 'lucide-react';
import { Project } from '@/types/project';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

const getStatusColor = (status: Project['status']) => {
  switch (status) {
    case 'Nieuw': return 'bg-primary/10 text-primary hover:bg-primary/20';
    case 'In Progress': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'Review': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    case 'Voltooid': return 'bg-green-100 text-green-800 hover:bg-green-200';
    default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-0 bg-card/50 backdrop-blur-sm"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors">
              {project.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{project.client}</span>
            </div>
          </div>
          <Badge className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Voortgang</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        {project.budget && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Budget</span>
            <span className="font-semibold text-lg">{formatCurrency(project.budget)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}