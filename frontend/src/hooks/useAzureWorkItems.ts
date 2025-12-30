import { useQuery } from '@tanstack/react-query';
import { useTeam } from '@/contexts/TeamContext';
import { 
  AzureWorkItem, 
  TeamDashboardData, 
  EmployeeTimeReport 
} from '@/types/planner';
import { 
  getMockWorkItems, 
  groupWorkItemsByEmployee,
  calculateWorkedHoursByEmployee 
} from '@/services/azureDevOpsService';
import { mockEmployees, mockProjects, getAllDemands } from '@/data/mockData';

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
 */
export function useCoordinatorDashboard(month: number, year: number) {
  const { selectedTeam } = useTeam();
  const { data: workItems = [], isLoading: isLoadingWorkItems } = useTeamWorkItems();

  return useQuery({
    queryKey: ['coordinatorDashboard', selectedTeam?.id, month, year],
    queryFn: async (): Promise<TeamDashboardData | null> => {
      if (!selectedTeam) return null;

      // Simula delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Colaboradores da equipe
      const teamEmployees = mockEmployees.filter(
        (emp) => emp.teamId === selectedTeam.id
      );

      // Demandas da equipe
      const allDemands = getAllDemands();
      const teamDemands = allDemands.filter(
        (d) => d.teamId === selectedTeam.id
      );

      // Agrupar work items por colaborador
      const workItemsByEmployee = groupWorkItemsByEmployee(workItems);
      const hoursByEmployee = calculateWorkedHoursByEmployee(workItems);

      // Gerar relatório por colaborador
      const employeeReports: EmployeeTimeReport[] = teamEmployees.map((emp) => {
        // Mock de email baseado no nome
        const emailKey = emp.name.toLowerCase().replace(' ', '.') + '@energisa.com.br';
        const empWorkItems = workItemsByEmployee.get(emailKey) || [];
        const workedHours = hoursByEmployee.get(emailKey) || 0;

        // Calcular horas planejadas (alocações do mês)
        const plannedHours = 160; // TODO: Calcular baseado em allocations

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          period: {
            startDate: new Date(year, month, 1),
            endDate: new Date(year, month + 1, 0),
          },
          totalPlannedHours: plannedHours,
          totalWorkedHours: workedHours,
          byDemand: teamDemands.slice(0, 2).map((demand) => {
            const project = mockProjects.find((p) => p.id === demand.projectId);
            const demandWorkItems = empWorkItems.filter(
              (wi) => wi.tags?.some((tag) => 
                demand.name.toLowerCase().includes(tag.toLowerCase())
              )
            );
            const demandWorked = demandWorkItems.reduce(
              (sum, wi) => sum + (wi.completedWork || 0), 
              0
            );

            return {
              demandId: demand.id,
              demandName: demand.name,
              projectName: project?.name || '',
              plannedHours: Math.round(plannedHours / 2),
              workedHours: demandWorked || Math.round(workedHours / 2),
              variance: (demandWorked || Math.round(workedHours / 2)) - Math.round(plannedHours / 2),
              workItems: demandWorkItems,
            };
          }),
          utilizationPercent: plannedHours > 0 
            ? Math.round((workedHours / plannedHours) * 100) 
            : 0,
        };
      });

      // Calcular totais
      const totalCapacity = teamEmployees.length * 160; // 160h/mês por colaborador
      const totalPlanned = employeeReports.reduce(
        (sum, r) => sum + r.totalPlannedHours, 
        0
      );
      const totalWorked = employeeReports.reduce(
        (sum, r) => sum + r.totalWorkedHours, 
        0
      );

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
        demands: teamDemands.map((demand) => {
          const project = mockProjects.find((p) => p.id === demand.projectId);
          return {
            demandId: demand.id,
            demandName: demand.name,
            projectName: project?.name || '',
            totalPlanned: demand.allocatedHours,
            totalWorked: Math.round(demand.allocatedHours * 0.7), // Mock
            status: demand.status,
          };
        }),
      };
    },
    enabled: !!selectedTeam && workItems !== undefined,
  });
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
