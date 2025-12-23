import { AlertTriangle, CircleDot, Clock, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Demand, Project, DEMAND_STATUS_CONFIG } from '@/types/planner';
import { mockProjects } from '@/data/mockData';

interface AllocationBacklogProps {
  teamId: string;
  onDemandSelect?: (demand: Demand) => void;
  selectedDemandId?: string;
}

export function AllocationBacklog({ teamId, onDemandSelect, selectedDemandId }: AllocationBacklogProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Get all demands for the team that are pending or partial
  const getTeamPendingDemands = () => {
    const demandsWithProject: { demand: Demand; project: Project }[] = [];
    
    mockProjects.forEach(project => {
      project.demands.forEach(demand => {
        if (demand.teamId === teamId && (demand.status === 'pending' || demand.status === 'partial')) {
          demandsWithProject.push({ demand, project });
        }
      });
    });

    return demandsWithProject;
  };

  // Group demands by project
  const groupDemandsByProject = () => {
    const pendingDemands = getTeamPendingDemands();
    const grouped = new Map<string, { project: Project; demands: Demand[] }>();

    pendingDemands.forEach(({ demand, project }) => {
      if (!grouped.has(project.id)) {
        grouped.set(project.id, { project, demands: [] });
      }
      grouped.get(project.id)!.demands.push(demand);
    });

    return Array.from(grouped.values());
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: Demand['status']) => {
    switch (status) {
      case 'pending':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'partial':
        return <CircleDot className="h-3 w-3 text-orange-500" />;
      default:
        return null;
    }
  };

  const groupedDemands = groupDemandsByProject();
  const totalPending = getTeamPendingDemands().length;

  // Start with all projects expanded by default
  if (expandedProjects.size === 0 && groupedDemands.length > 0) {
    const allProjectIds = groupedDemands.map(g => g.project.id);
    allProjectIds.forEach(id => expandedProjects.add(id));
  }

  return (
    <Card className="h-full flex flex-col border-l-4 border-l-yellow-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Backlog de Alocação
          </CardTitle>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            {totalPending}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Demandas aguardando alocação de recursos
        </p>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-4 pb-4 space-y-3">
            {groupedDemands.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Nenhuma demanda pendente</p>
                <p className="text-xs mt-1">Todas as demandas da equipe estão alocadas!</p>
              </div>
            ) : (
              groupedDemands.map(({ project, demands }) => (
                <Collapsible
                  key={project.id}
                  open={expandedProjects.has(project.id)}
                  onOpenChange={() => toggleProject(project.id)}
                >
                  <CollapsibleTrigger asChild>
                    <div 
                      className="flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                      style={{ borderLeft: `3px solid ${project.color}` }}
                    >
                      {expandedProjects.has(project.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium flex-1 truncate">
                        {project.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {demands.length}
                      </Badge>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="ml-4 mt-1 space-y-2">
                      {demands.map(demand => {
                        const statusConfig = DEMAND_STATUS_CONFIG[demand.status];
                        const remainingHours = demand.totalHours - demand.allocatedHours;
                        const isSelected = selectedDemandId === demand.id;

                        return (
                          <Tooltip key={demand.id}>
                            <TooltipTrigger asChild>
                              <div
                                onClick={() => onDemandSelect?.(demand)}
                                className={cn(
                                  "flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-all",
                                  "hover:border-primary/50 hover:bg-muted/50",
                                  isSelected && "border-primary bg-primary/5",
                                  demand.status === 'pending' && "border-yellow-200 bg-yellow-50/50",
                                  demand.status === 'partial' && "border-orange-200 bg-orange-50/50"
                                )}
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    {getStatusIcon(demand.status)}
                                    <span className="text-xs font-medium truncate">
                                      {demand.name}
                                    </span>
                                    {demand.isNew && (
                                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-[10px] px-1">
                                        Nova
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                      variant="outline" 
                                      className={cn("text-[10px] px-1", statusConfig.color.replace('bg-', 'border-'), statusConfig.color.replace('bg-', 'text-').replace('-500', '-700'))}
                                    >
                                      {statusConfig.label}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                      <Clock className="h-2.5 w-2.5" />
                                      {remainingHours}h restantes
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">{demand.name}</p>
                                {demand.description && (
                                  <p className="text-xs text-muted-foreground">{demand.description}</p>
                                )}
                                <div className="flex items-center gap-2 text-xs pt-1">
                                  <span>Total: {demand.totalHours}h</span>
                                  <span>|</span>
                                  <span>Alocado: {demand.allocatedHours}h</span>
                                  <span>|</span>
                                  <span className="text-yellow-600 font-medium">Falta: {remainingHours}h</span>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
