import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, Calendar, Users, Clock, AlertTriangle, CheckCircle2, CircleDot, ArrowRightCircle, Diamond, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Project, Demand, DEMAND_STATUS_CONFIG, MONTHS, PHASE_CONFIG, Team } from '@/types/planner';
import { GanttBar, GanttLegend } from '@/components/allocation/GanttBar';
import { CreateProjectWizard } from '@/components/projects/CreateProjectWizard';
import { useProjects } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';

const ProjectsHubPage = () => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const { projects, loading, refreshProjects } = useProjects();
  const { usuario } = useAuth();
  const { selectedTeam, teams, getTeamById } = useTeam();

  // Filtrar projetos baseado no role do usuário
  const filteredProjects = projects.filter(project => {
    // Gerentes veem todos os projetos
    if (usuario?.role === 'Gerente' || usuario?.role === 'Admin' || usuario?.role === 'Manager' || usuario?.role === '1') {
      return true;
    }
    // Coordenadores veem apenas projetos que têm demandas da sua mesa
    if ((usuario?.role === 'Coordenador' || usuario?.role === 'Coordinator' || usuario?.role === '2') && selectedTeam) {
      return project.demands.some(demand => demand.teamId === selectedTeam.id);
    }
    return false;
  });

  const isManager = usuario?.role === 'Gerente' || usuario?.role === 'Admin' || usuario?.role === 'Manager' || usuario?.role === '1';

  const handleProjectCreated = async (newProject: Project) => {
    // Refresh para buscar do backend
    await refreshProjects();
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

  const getPriorityBadge = (priority: Project['priority']) => {
    const config = {
      high: { label: 'Alta', className: 'bg-red-100 text-red-800 border-red-200' },
      medium: { label: 'Média', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      low: { label: 'Baixa', className: 'bg-green-100 text-green-800 border-green-200' },
    };
    return config[priority];
  };

  const getStatusIcon = (status: Demand['status']) => {
    switch (status) {
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'partial':
        return <CircleDot className="h-4 w-4 text-orange-500" />;
      case 'allocated':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <ArrowRightCircle className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const formatMonth = (date: Date) => MONTHS[date.getMonth()];
    return `${formatMonth(startDate)}/${startDate.getFullYear()} - ${formatMonth(endDate)}/${endDate.getFullYear()}`;
  };

  const calculateProjectProgress = (project: Project) => {
    const totalHours = project.demands.reduce((sum, d) => sum + d.totalHours, 0);
    const allocatedHours = project.demands.reduce((sum, d) => sum + d.allocatedHours, 0);
    return totalHours > 0 ? Math.round((allocatedHours / totalHours) * 100) : 0;
  };

  const getProjectStats = (project: Project) => {
    const pending = project.demands.filter(d => d.status === 'pending').length;
    const partial = project.demands.filter(d => d.status === 'partial').length;
    const allocated = project.demands.filter(d => d.status === 'allocated' || d.status === 'in-progress').length;
    const completed = project.demands.filter(d => d.status === 'completed').length;
    return { pending, partial, allocated, completed };
  };

  // Timeline visualization helper
  const getTimelinePosition = (date: Date, startDate: Date, endDate: Date) => {
    const total = endDate.getTime() - startDate.getTime();
    const current = date.getTime() - startDate.getTime();
    return Math.max(0, Math.min(100, (current / total) * 100));
  };

  const renderDemandRow = (demand: Demand, project: Project) => {
    const team = getTeamById(demand.teamId);
    const statusConfig = DEMAND_STATUS_CONFIG[demand.status];
    const progress = demand.totalHours > 0 
      ? Math.round((demand.allocatedHours / demand.totalHours) * 100) 
      : 0;

    // Calculate timeline bar position within project timeline
    const barStart = getTimelinePosition(demand.startDate, project.startDate, project.endDate);
    const barEnd = getTimelinePosition(demand.endDate, project.startDate, project.endDate);
    const barWidth = barEnd - barStart;

    return (
      <div
        key={demand.id}
        className="flex items-center gap-4 py-3 px-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
      >
        {/* Demand Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {getStatusIcon(demand.status)}
            <span className="font-medium truncate">{demand.name}</span>
            {demand.isNew && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                Nova
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDateRange(demand.startDate, demand.endDate)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {demand.allocatedHours}/{demand.totalHours}h
            </span>
          </div>
        </div>

        {/* Team Badge */}
        <div className="w-44">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={`${team?.color.replace('bg-', 'border-')} ${team?.color.replace('bg-', 'text-').replace('-500', '-700')} whitespace-nowrap`}
              >
                <Users className="h-3 w-3 mr-1" />
                {team?.name || 'N/A'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Mesa responsável</TooltipContent>
          </Tooltip>
        </div>

        {/* Status */}
        <div className="w-24">
          <Badge className={`${statusConfig.color} text-white text-xs`}>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Progress */}
        <div className="w-24 flex items-center gap-2">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground w-10">{progress}%</span>
        </div>

        {/* Gantt Timeline Bar with Phases */}
        <div className="w-64 hidden lg:block">
          <GanttBar 
            phases={demand.phases}
            startDate={demand.startDate}
            endDate={demand.endDate}
            height="md"
            showLabels={false}
          />
        </div>
      </div>
    );
  };

  const renderProjectCard = (project: Project) => {
    const isExpanded = expandedProjects.has(project.id);
    const priorityConfig = getPriorityBadge(project.priority);
    const progress = calculateProjectProgress(project);
    const stats = getProjectStats(project);

    return (
      <Collapsible key={project.id} open={isExpanded} onOpenChange={() => toggleProject(project.id)}>
        <Card className="mb-4 overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              style={{ borderLeft: `4px solid ${project.color}` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {project.code}
                      </Badge>
                      <Badge variant="outline" className={priorityConfig.className}>
                        {priorityConfig.label}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">
                      {project.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDateRange(project.startDate, project.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 w-32">
                    <Progress value={progress} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground">{progress}%</span>
                  </div>
                </div>
              </div>

              {/* Project Stats Summary */}
              <div className="flex items-center gap-4 mt-3 ml-8">
                <span className="text-sm text-muted-foreground">
                  {project.demands.length} demanda{project.demands.length !== 1 ? 's' : ''}:
                </span>
                {stats.pending > 0 && (
                  <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700 text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {stats.pending} pendente{stats.pending !== 1 ? 's' : ''}
                  </Badge>
                )}
                {stats.partial > 0 && (
                  <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700 text-xs">
                    <CircleDot className="h-3 w-3 mr-1" />
                    {stats.partial} parcial
                  </Badge>
                )}
                {stats.allocated > 0 && (
                  <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {stats.allocated} alocada{stats.allocated !== 1 ? 's' : ''}
                  </Badge>
                )}
                {stats.completed > 0 && (
                  <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {stats.completed} concluída{stats.completed !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="p-0">
              {/* Demands Header */}
              <div className="flex items-center gap-4 py-2 px-4 bg-muted/30 border-y text-xs font-medium text-muted-foreground">
                <div className="flex-1">DEMANDA</div>
                <div className="w-44">MESA</div>
                <div className="w-24">STATUS</div>
                <div className="w-24">PROGRESSO</div>
                <div className="w-64 hidden lg:block">CRONOGRAMA DE FASES</div>
              </div>
              
              {/* Demands List */}
              {project.demands.map(demand => renderDemandRow(demand, project))}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  };

  // Calculate global stats
  const allDemands = filteredProjects.flatMap(p => p.demands);
  const globalStats = {
    total: allDemands.length,
    pending: allDemands.filter(d => d.status === 'pending').length,
    partial: allDemands.filter(d => d.status === 'partial').length,
    allocated: allDemands.filter(d => d.status === 'allocated' || d.status === 'in-progress').length,
    completed: allDemands.filter(d => d.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Hub de Projetos</h1>
          <p className="text-muted-foreground">
            {isManager 
              ? 'Visão consolidada de todos os projetos e suas demandas'
              : 'Projetos relacionados à sua equipe'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refreshProjects()}
            title="Atualizar projetos"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {isManager && (
            <Button
              onClick={() => setCreateProjectOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          )}
        </div>
      </div>

      {/* Phase Legend */}
      <Card className="mb-6">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Legenda de Fases:</span>
            <GanttLegend />
          </div>
        </CardContent>
      </Card>

      {/* Global Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{filteredProjects.length}</div>
            <p className="text-xs text-muted-foreground">Projetos Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{globalStats.total}</div>
            <p className="text-xs text-muted-foreground">Total Demandas</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-700">{globalStats.pending}</div>
            <p className="text-xs text-yellow-600">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-700">{globalStats.partial}</div>
            <p className="text-xs text-orange-600">Parcialmente Alocadas</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-700">{globalStats.allocated}</div>
            <p className="text-xs text-green-600">Totalmente Alocadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.length > 0 ? (
          filteredProjects.map(project => renderProjectCard(project))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Nenhum projeto encontrado para sua equipe.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Project Wizard */}
      <CreateProjectWizard
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};

export default ProjectsHubPage;
