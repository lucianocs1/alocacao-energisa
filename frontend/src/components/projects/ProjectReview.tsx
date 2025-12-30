import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MONTHS } from '@/types/planner';
import { useProjects } from '@/contexts/ProjectContext';
import { useTeam } from '@/contexts/TeamContext';

export const ProjectReview = () => {
  const { createProjectData } = useProjects();
  const { getTeamById } = useTeam();

  const getTeamName = (teamId: string) => {
    return getTeamById(teamId)?.name || 'Equipe não identificada';
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      high: { label: 'Alta', className: 'bg-red-100 text-red-800' },
      medium: { label: 'Média', className: 'bg-yellow-100 text-yellow-800' },
      low: { label: 'Baixa', className: 'bg-green-100 text-green-800' },
    };
    return labels[priority as keyof typeof labels];
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return `${date.getDate()}/${MONTHS[date.getMonth()]}/${date.getFullYear()}`;
  };

  const totalHours = useMemo(() => {
    return createProjectData.demands.reduce((sum, d) => sum + d.totalHours, 0);
  }, [createProjectData.demands]);

  const formatMonthDiff = (startDate: Date | null, endDate: Date | null) => {
    if (!startDate || !endDate) return '-';
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
    return `${months + 1} mês${months > 0 ? 'es' : ''}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Projeto</CardTitle>
          <CardDescription>Verifique as informações antes de criar o projeto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Nome</p>
            <p className="font-semibold text-lg">{createProjectData.name || '-'}</p>
          </div>

          {createProjectData.description && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Descrição</p>
              <p className="text-sm">{createProjectData.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Período</p>
              <p className="font-semibold">
                {formatDate(createProjectData.startDate)} até {formatDate(createProjectData.endDate)}
              </p>
              <p className="text-xs text-gray-500">{formatMonthDiff(createProjectData.startDate, createProjectData.endDate)}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Prioridade</p>
              <div>
                <Badge className={getPriorityLabel(createProjectData.priority).className}>
                  {getPriorityLabel(createProjectData.priority).label}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Cor</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: createProjectData.color }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demandas ({createProjectData.demands.length})</CardTitle>
          <CardDescription>Total de {totalHours.toLocaleString('pt-BR')} horas estimadas</CardDescription>
        </CardHeader>
        <CardContent>
          {createProjectData.demands.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma demanda adicionada</p>
          ) : (
            <div className="space-y-3">
              {createProjectData.demands.map((demand, index) => (
                <div key={index} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{demand.name}</p>
                      <Badge variant="outline" className="flex-shrink-0">
                        {getTeamName(demand.teamId)}
                      </Badge>
                    </div>
                    {demand.description && (
                      <p className="text-sm text-gray-600 mt-1">{demand.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>{formatDate(demand.startDate)} → {formatDate(demand.endDate)}</span>
                      <span className="font-semibold text-gray-700">{demand.totalHours.toLocaleString('pt-BR')}h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm text-blue-900 dark:text-blue-100">
            Próximos Passos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p>✓ Seu projeto será criado e aparecerá na lista de projetos</p>
          <p>✓ Você poderá gerenciar as demandas e alocações posteriormente</p>
          <p>✓ As fases do projeto podem ser ajustadas conforme necessário</p>
        </CardContent>
      </Card>
    </div>
  );
};
