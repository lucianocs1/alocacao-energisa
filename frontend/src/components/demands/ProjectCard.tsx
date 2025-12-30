import { Project } from '@/types/planner';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const percentage = Math.round((project.allocatedHours / project.budgetHours) * 100);
  const isOverBudget = project.allocatedHours > project.budgetHours;
  const remaining = project.budgetHours - project.allocatedHours;

  const priorityColors = {
    high: 'bg-destructive/10 text-destructive border-destructive/20',
    medium: 'bg-warning/10 text-warning border-warning/20',
    low: 'bg-success/10 text-success border-success/20',
  };

  const priorityLabels = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa',
  };

  return (
    <Card 
      className={cn(
        "card-glow transition-all duration-300 hover:shadow-lg",
        isOverBudget && "pulse-alert border-destructive"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <CardTitle className="text-base font-semibold">{project.name}</CardTitle>
          </div>
          <Badge variant="outline" className={cn("text-xs", priorityColors[project.priority])}>
            {priorityLabels[project.priority]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{project.code}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Orçamento</span>
            <span className="font-medium">{project.budgetHours}h</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                isOverBudget ? "bg-destructive" : "bg-primary"
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Alocado</p>
            <p className="text-lg font-semibold">{project.allocatedHours}h</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {isOverBudget ? 'Excedido' : 'Disponível'}
            </p>
            <p className={cn(
              "text-lg font-semibold",
              isOverBudget ? "text-destructive" : "text-success"
            )}>
              {Math.abs(remaining)}h
            </p>
          </div>
        </div>

        {/* Status */}
        <div className={cn(
          "flex items-center gap-2 p-2 rounded-lg text-sm",
          isOverBudget 
            ? "bg-destructive/10 text-destructive" 
            : "bg-muted text-muted-foreground"
        )}>
          {isOverBudget ? (
            <>
              <AlertTriangle className="w-4 h-4" />
              <span>Acima do orçamento ({percentage}%)</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              <span>{percentage}% do orçamento utilizado</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
