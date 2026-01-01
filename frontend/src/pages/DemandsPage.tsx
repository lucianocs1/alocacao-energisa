import { useState, useEffect } from 'react';
import { demandService, DemandsDashboardData } from '@/services/demandService';
import { ProjectCard } from '@/components/demands/ProjectCard';
import { Card, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTeam } from '@/contexts/TeamContext';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function DemandsPage() {
  const { selectedTeam } = useTeam();
  const [dashboardData, setDashboardData] = useState<DemandsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await demandService.getDemandsDashboard(selectedTeam?.id);
        setDashboardData(data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTeam?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredProjects = dashboardData?.projects ?? [];
  const totalBudget = dashboardData?.totalBudgetHours ?? 0;
  const totalAllocated = dashboardData?.totalAllocatedHours ?? 0;
  const overBudgetProjectsCount = dashboardData?.overBudgetProjectsCount ?? 0;

  const pieData = filteredProjects.map(p => ({
    name: p.name,
    value: p.allocatedHours,
    color: p.color,
  }));

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Dashboard de Demandas</h1>
          {selectedTeam && (
            <span className={cn("px-2 py-1 rounded text-xs text-white", selectedTeam.color)}>
              {selectedTeam.name}
            </span>
          )}
        </div>
        <p className="text-muted-foreground">
          Acompanhe o orçamento e alocação de cada projeto
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Orçamento Total</p>
            <p className="text-3xl font-bold text-primary">{totalBudget}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Total Alocado</p>
            <p className="text-3xl font-bold">{totalAllocated}h</p>
            <p className="text-sm text-muted-foreground mt-1">
              {totalBudget > 0 ? Math.round((totalAllocated / totalBudget) * 100) : 0}% do orçamento
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Projetos Acima do Orçamento</p>
            <p className="text-3xl font-bold text-destructive">{overBudgetProjectsCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Projetos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.length > 0 ? (
              filteredProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Nenhum projeto encontrado nesta equipe
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Distribuição de Horas</h2>
          <Card>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value}h`, 'Alocado']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend 
                    formatter={(value) => (
                      <span className="text-sm text-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
