import api from './api';

// ========== Types ==========

export interface ProjectDemandsSummary {
  id: string;
  name: string;
  code: string;
  color: string;
  priority: 'high' | 'medium' | 'low';
  budgetHours: number;
  allocatedHours: number;
  teamId?: string;
}

interface ProjectDemandsSummaryDto {
  id: string;
  name: string;
  code: string;
  color: string;
  priority: string;
  budgetHours: number;
  allocatedHours: number;
  teamId?: string;
}

interface ProjectDemandsSummaryListResponse {
  projects: ProjectDemandsSummaryDto[];
  totalBudgetHours: number;
  totalAllocatedHours: number;
  overBudgetProjectsCount: number;
}

export interface DemandsDashboardData {
  projects: ProjectDemandsSummary[];
  totalBudgetHours: number;
  totalAllocatedHours: number;
  overBudgetProjectsCount: number;
}

// ========== Helper Functions ==========

const mapDtoToSummary = (dto: ProjectDemandsSummaryDto): ProjectDemandsSummary => ({
  id: dto.id,
  name: dto.name,
  code: dto.code,
  color: dto.color,
  priority: dto.priority as 'high' | 'medium' | 'low',
  budgetHours: dto.budgetHours,
  allocatedHours: dto.allocatedHours,
  teamId: dto.teamId,
});

// ========== API Service ==========

export const demandService = {
  /**
   * Obtém o resumo dos projetos para o dashboard de demandas
   * @param teamId - Opcional. Filtrar por equipe
   */
  async getDemandsDashboard(teamId?: string): Promise<DemandsDashboardData> {
    try {
      const params = teamId ? { teamId } : {};
      const response = await api.get<ProjectDemandsSummaryListResponse>(
        '/api/projects/demands-summary',
        { params }
      );

      return {
        projects: response.data.projects.map(mapDtoToSummary),
        totalBudgetHours: response.data.totalBudgetHours,
        totalAllocatedHours: response.data.totalAllocatedHours,
        overBudgetProjectsCount: response.data.overBudgetProjectsCount,
      };
    } catch (error) {
      console.error('Erro ao buscar dashboard de demandas:', error);
      return {
        projects: [],
        totalBudgetHours: 0,
        totalAllocatedHours: 0,
        overBudgetProjectsCount: 0,
      };
    }
  },
};
