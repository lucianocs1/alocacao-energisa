import { useQuery } from '@tanstack/react-query';
import { useTeam } from '@/contexts/TeamContext';
import { 
  AzureWorkItem, 
  TeamDashboardData, 
  EmployeeTimeReport,
  DemandStatus
} from '@/types/planner';
import { 
  getMockWorkItems, 
  groupWorkItemsByEmployee,
  calculateWorkedHoursByEmployee 
} from '@/services/azureDevOpsService';
import { allocationService } from '@/services/allocationService';
import { employeeService } from '@/services/employeeService';
import calendarService from '@/services/calendarService';

// Flag para usar mock data durante desenvolvimento
const USE_MOCK_DATA = true;

/**
 * Hook para buscar Work Items da equipe selecionada
 */
export function useTeamWorkItems() {
  const { selectedTeam } = useTeam();

  return useQuery({
    queryKey: ['workItems', selectedTeam?.id],
    queryFn: async (): Promise<AzureWorkItem[]> => {
      if (!selectedTeam) return [];

      if (USE_MOCK_DATA) {
        // Simula delay de API
        await new Promise((resolve) => setTimeout(resolve, 500));
        return getMockWorkItems(selectedTeam.id);
      }

      // TODO: Implementar chamada real à API do Azure DevOps
      // return getWorkItemsByAreaPath(areaPath, config);
      return [];
    },
    enabled: !!selectedTeam,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para gerar o dashboard do coordenador
 * Busca dados reais de alocação (planejado) e mock de horas trabalhadas (realizado)
 * Futuramente: horas trabalhadas virão do Azure DevOps
 */
export function useCoordinatorDashboard(month: number, year: number) {
  const { selectedTeam } = useTeam();

  return useQuery({
    queryKey: ['coordinatorDashboard', selectedTeam?.id, month, year],
    queryFn: async (): Promise<TeamDashboardData | null> => {
      if (!selectedTeam) return null;

      try {
        // Buscar dados reais do backend
        const [pageData, teamEmployees, calendarSummary] = await Promise.all([
          allocationService.getPageData(selectedTeam.id, year),
          employeeService.getEmployees(selectedTeam.id),
          calendarService.getYearSummary(year),
        ]);

        const { allocations, demands } = pageData;
        
        // Filtrar alocações do mês selecionado
        const monthAllocations = allocations.filter(
          a => a.month === month && a.year === year
        );

        // Calcular dias úteis no mês considerando eventos do calendário
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const workDaysInMonth = calculateWorkDays(year, month, daysInMonth, calendarSummary?.hoursLost || 0);
        
        // Gerar relatório por colaborador
        const employeeReports: EmployeeTimeReport[] = teamEmployees.map((emp) => {
          // Horas planejadas: soma das alocações do mês para este colaborador
          const empAllocations = monthAllocations.filter(a => a.employeeId === emp.id);
          const plannedHours = empAllocations.reduce((sum, a) => sum + a.hours, 0);

          // Capacidade do colaborador no mês (considerando férias e eventos)
          const capacityHours = Math.round(emp.dailyHours * workDaysInMonth);

          // MOCK: Horas trabalhadas (futuramente do Azure DevOps)
          // Simula uma variação entre 70-110% do planejado
          const workedHours = plannedHours > 0 
            ? Math.round(plannedHours * (0.7 + Math.random() * 0.4))
            : 0;

          // Agrupar por demanda
          const demandGroups = new Map<string, { 
            demandId: string; 
            demandName: string; 
            projectName: string;
            planned: number;
          }>();

          empAllocations.forEach(alloc => {
            const demand = demands.find(d => d.id === alloc.demandId);
            if (demand) {
              const existing = demandGroups.get(alloc.demandId);
              if (existing) {
                existing.planned += alloc.hours;
              } else {
                demandGroups.set(alloc.demandId, {
                  demandId: alloc.demandId,
                  demandName: demand.name,
                  projectName: (demand as any)._projectName || 'Projeto',
                  planned: alloc.hours,
                });
              }
            }
          });

          // Converter para array com mock de horas trabalhadas por demanda
          const byDemand = Array.from(demandGroups.values()).map(group => {
            // MOCK: Distribuir horas trabalhadas proporcionalmente
            const demandWorked = plannedHours > 0
              ? Math.round((group.planned / plannedHours) * workedHours)
              : 0;
            
            return {
              demandId: group.demandId,
              demandName: group.demandName,
              projectName: group.projectName,
              plannedHours: group.planned,
              workedHours: demandWorked,
              variance: demandWorked - group.planned,
              workItems: [], // Futuramente: work items do Azure
            };
          });

          return {
            employeeId: emp.id,
            employeeName: emp.name,
            period: {
              startDate: new Date(year, month, 1),
              endDate: new Date(year, month + 1, 0),
            },
            totalPlannedHours: plannedHours,
            totalWorkedHours: workedHours,
            capacityHours,
            byDemand,
            utilizationPercent: plannedHours > 0 
              ? Math.round((workedHours / plannedHours) * 100) 
              : 0,
          };
        });

        // Calcular totais
        const totalCapacity = employeeReports.reduce((sum, r) => sum + (r.capacityHours || 160), 0);
        const totalPlanned = employeeReports.reduce((sum, r) => sum + r.totalPlannedHours, 0);
        const totalWorked = employeeReports.reduce((sum, r) => sum + r.totalWorkedHours, 0);

        // Agrupar demandas com totais
        const demandSummary = demands.map(demand => {
          const demandAllocations = monthAllocations.filter(a => a.demandId === demand.id);
          const totalPlannedForDemand = demandAllocations.reduce((sum, a) => sum + a.hours, 0);
          // MOCK: Horas trabalhadas por demanda
          const totalWorkedForDemand = totalPlannedForDemand > 0
            ? Math.round(totalPlannedForDemand * (0.7 + Math.random() * 0.4))
            : 0;

          return {
            demandId: demand.id,
            demandName: demand.name,
            projectName: (demand as any)._projectName || 'Projeto',
            totalPlanned: totalPlannedForDemand,
            totalWorked: totalWorkedForDemand,
            status: demand.status as DemandStatus,
          };
        }).filter(d => d.totalPlanned > 0); // Só mostrar demandas com alocação

        return {
          teamId: selectedTeam.id,
          teamName: selectedTeam.name,
          period: { month, year },
          summary: {
            totalCapacity,
            totalPlanned,
            totalWorked,
            utilizationPercent: totalPlanned > 0 
              ? Math.round((totalWorked / totalPlanned) * 100) 
              : 0,
          },
          employees: employeeReports,
          demands: demandSummary,
        };
      } catch (error) {
        console.error('Erro ao carregar dashboard do coordenador:', error);
        return null;
      }
    },
    enabled: !!selectedTeam,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Calcula dias úteis no mês considerando feriados
 */
function calculateWorkDays(year: number, month: number, daysInMonth: number, hoursLostInYear: number): number {
  let workDays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    // Não conta sábado (6) e domingo (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workDays++;
    }
  }
  // Desconta aproximadamente feriados do mês (dividido por 12)
  const avgHoursLostPerMonth = hoursLostInYear / 12;
  const daysLost = Math.round(avgHoursLostPerMonth / 8);
  return Math.max(workDays - daysLost, 15); // Mínimo 15 dias úteis
}

/**
 * Hook para buscar Work Items de um colaborador específico
 */
export function useEmployeeWorkItems(employeeEmail: string) {
  return useQuery({
    queryKey: ['employeeWorkItems', employeeEmail],
    queryFn: async (): Promise<AzureWorkItem[]> => {
      if (!employeeEmail) return [];

      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        // Retorna work items mock filtrados pelo email
        const allMock = getMockWorkItems('team-obras');
        return allMock.filter((wi) => wi.assignedToEmail === employeeEmail);
      }

      // TODO: Implementar chamada real
      return [];
    },
    enabled: !!employeeEmail,
  });
}
