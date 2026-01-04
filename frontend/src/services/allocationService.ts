import api from './api';
import { Allocation, Employee, Demand, ProjectPhase, VacationPeriod, FixedAllocation } from '@/types/planner';

// ========== Types ==========

interface AllocationDto {
  id: string;
  employeeId: string;
  employeeName: string;
  demandId?: string | null;
  demandName?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  month: number;
  year: number;
  hours: number;
  isLoan: boolean;
  sourceTeamId?: string;
  sourceTeamName?: string;
  allocationType?: string | null;
  createdAt: string;
}

interface AllocationEmployeeDto {
  id: string;
  name: string;
  role: string;
  teamId: string;
  teamName: string;
  dailyHours: number;
  vacations: VacationPeriodDto[];
  fixedAllocations: FixedAllocationSimpleDto[];
}

interface VacationPeriodDto {
  id: string;
  startDate: string;
  endDate: string;
}

interface FixedAllocationSimpleDto {
  id: string;
  name: string;
  hoursPerMonth: number;
}

interface AllocationDemandDto {
  id: string;
  projectId: string;
  projectName: string;
  projectColor: string;
  name: string;
  description?: string;
  teamId: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  allocatedHours: number;
  status: string;
  phases: DemandPhaseSimpleDto[];
}

interface DemandPhaseSimpleDto {
  id: string;
  type: string;
  name?: string;
  startDate: string;
  endDate: string;
  isMilestone: boolean;
}

interface AllocationStatsDto {
  totalEmployees: number;
  totalDemands: number;
  totalHoursAllocated: number;
  loanAllocationsCount: number;
  overloadedEmployeesCount: number;
}

interface AllocationPageDataResponse {
  employees: AllocationEmployeeDto[];
  demands: AllocationDemandDto[];
  allocations: AllocationDto[];
  stats: AllocationStatsDto;
}

interface AllocationListResponse {
  allocations: AllocationDto[];
  totalCount: number;
}

interface CreateAllocationRequest {
  employeeId: string;
  demandId?: string | null;
  projectId?: string | null;
  month: number;
  year: number;
  hours: number;
  isLoan: boolean;
  sourceTeamId?: string;
  allocationType?: string | null; // null = demanda, "VACATION" = férias, "TRAINING" = treinamento
}

// ========== Exported Types ==========

export interface AllocationPageData {
  employees: Employee[];
  demands: Demand[];
  allocations: Allocation[];
  stats: {
    totalEmployees: number;
    totalDemands: number;
    totalHoursAllocated: number;
    loanAllocationsCount: number;
    overloadedEmployeesCount: number;
  };
}

// Constantes para tipos especiais de alocação (devem corresponder ao TimelineGrid)
const SPECIAL_ALLOCATION_TYPES = {
  VACATION: '__VACATION__',
  TRAINING: '__TRAINING__',
} as const;

// Mapeamento de IDs especiais para AllocationType do backend
const SPECIAL_TYPE_TO_ALLOCATION_TYPE: Record<string, string> = {
  [SPECIAL_ALLOCATION_TYPES.VACATION]: 'VACATION',
  [SPECIAL_ALLOCATION_TYPES.TRAINING]: 'TRAINING',
};

// Mapeamento inverso: AllocationType do backend para IDs especiais do frontend
const ALLOCATION_TYPE_TO_SPECIAL_ID: Record<string, string> = {
  'VACATION': SPECIAL_ALLOCATION_TYPES.VACATION,
  'TRAINING': SPECIAL_ALLOCATION_TYPES.TRAINING,
};

// ========== Helper Functions ==========

const parseDate = (dateString: string): Date => {
  const date = new Date(dateString);
  if (!dateString.includes('T')) {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }
  return date;
};

const mapDtoToAllocation = (dto: AllocationDto): Allocation => {
  // Se tiver allocationType, usar o ID especial correspondente
  const demandId = dto.allocationType 
    ? ALLOCATION_TYPE_TO_SPECIAL_ID[dto.allocationType] || dto.demandId || ''
    : dto.demandId || '';
  
  return {
    id: dto.id,
    employeeId: dto.employeeId,
    demandId: demandId,
    projectId: dto.projectId || '',
    month: dto.month,
    year: dto.year,
    hours: dto.hours,
    isLoan: dto.isLoan,
    sourceTeamId: dto.sourceTeamId,
    allocationType: dto.allocationType || undefined,
    // Informações adicionais para demandas de outros departamentos
    demandName: dto.demandName || undefined,
    projectName: dto.projectName || undefined,
  };
};

const mapDtoToEmployee = (dto: AllocationEmployeeDto): Employee => ({
  id: dto.id,
  name: dto.name,
  role: dto.role,
  teamId: dto.teamId,
  dailyHours: dto.dailyHours,
  vacations: dto.vacations.map(v => ({
    id: v.id,
    startDate: parseDate(v.startDate),
    endDate: parseDate(v.endDate),
  })),
  fixedAllocations: dto.fixedAllocations.map(f => ({
    id: f.id,
    name: f.name,
    hoursPerMonth: f.hoursPerMonth,
  })),
});

const mapDtoToDemand = (dto: AllocationDemandDto): Demand => ({
  id: dto.id,
  projectId: dto.projectId,
  name: dto.name,
  description: dto.description,
  teamId: dto.teamId,
  startDate: parseDate(dto.startDate),
  endDate: parseDate(dto.endDate),
  totalHours: dto.totalHours,
  allocatedHours: dto.allocatedHours,
  status: dto.status as Demand['status'],
  createdAt: new Date(),
  isNew: false,
  phases: dto.phases.map(p => ({
    id: p.id,
    type: p.type as ProjectPhase['type'],
    name: p.name,
    startDate: parseDate(p.startDate),
    endDate: parseDate(p.endDate),
    isMilestone: p.isMilestone,
  })),
  // Adicionar info do projeto para uso em componentes
  _projectName: dto.projectName,
  _projectColor: dto.projectColor,
});

// ========== API Service ==========

export const allocationService = {
  /**
   * Obtém todos os dados necessários para a página de alocação
   */
  async getPageData(teamId?: string, year?: number): Promise<AllocationPageData> {
    try {
      const params: Record<string, string | number> = {};
      if (teamId) params.teamId = teamId;
      if (year) params.year = year;

      const response = await api.get<AllocationPageDataResponse>('/api/allocations/page-data', { params });
      
      return {
        employees: response.data.employees.map(mapDtoToEmployee),
        demands: response.data.demands.map(mapDtoToDemand),
        allocations: response.data.allocations.map(mapDtoToAllocation),
        stats: {
          totalEmployees: response.data.stats.totalEmployees,
          totalDemands: response.data.stats.totalDemands,
          totalHoursAllocated: response.data.stats.totalHoursAllocated,
          loanAllocationsCount: response.data.stats.loanAllocationsCount,
          overloadedEmployeesCount: response.data.stats.overloadedEmployeesCount,
        },
      };
    } catch (error) {
      console.error('Erro ao buscar dados da página de alocação:', error);
      return {
        employees: [],
        demands: [],
        allocations: [],
        stats: {
          totalEmployees: 0,
          totalDemands: 0,
          totalHoursAllocated: 0,
          loanAllocationsCount: 0,
          overloadedEmployeesCount: 0,
        },
      };
    }
  },

  /**
   * Obtém todas as alocações com filtros
   */
  async getAllocations(teamId?: string, employeeId?: string, year?: number): Promise<Allocation[]> {
    try {
      const params: Record<string, string | number> = {};
      if (teamId) params.teamId = teamId;
      if (employeeId) params.employeeId = employeeId;
      if (year) params.year = year;

      const response = await api.get<AllocationListResponse>('/api/allocations', { params });
      return response.data.allocations.map(mapDtoToAllocation);
    } catch (error) {
      console.error('Erro ao buscar alocações:', error);
      return [];
    }
  },

  /**
   * Cria uma nova alocação
   */
  async createAllocation(allocation: Omit<Allocation, 'id'>): Promise<Allocation | null> {
    try {
      // Verifica se é um tipo especial de alocação (férias, treinamento, etc.)
      const isSpecialType = Object.values(SPECIAL_ALLOCATION_TYPES).includes(allocation.demandId as any);
      const allocationType = isSpecialType ? SPECIAL_TYPE_TO_ALLOCATION_TYPE[allocation.demandId] : null;

      const request: CreateAllocationRequest = {
        employeeId: allocation.employeeId,
        demandId: isSpecialType ? null : allocation.demandId,
        projectId: isSpecialType ? null : allocation.projectId,
        month: allocation.month,
        year: allocation.year,
        hours: allocation.hours,
        isLoan: allocation.isLoan ?? false,
        sourceTeamId: allocation.sourceTeamId,
        allocationType: allocationType,
      };

      const response = await api.post<AllocationDto>('/api/allocations', request);
      return mapDtoToAllocation(response.data);
    } catch (error) {
      console.error('Erro ao criar alocação:', error);
      return null;
    }
  },

  /**
   * Atualiza uma alocação existente
   */
  async updateAllocation(id: string, hours: number): Promise<Allocation | null> {
    try {
      const response = await api.put<AllocationDto>(`/api/allocations/${id}`, { hours });
      return mapDtoToAllocation(response.data);
    } catch (error) {
      console.error('Erro ao atualizar alocação:', error);
      return null;
    }
  },

  /**
   * Remove uma alocação
   */
  async deleteAllocation(id: string): Promise<boolean> {
    try {
      await api.delete(`/api/allocations/${id}`);
      return true;
    } catch (error) {
      console.error('Erro ao remover alocação:', error);
      return false;
    }
  },

  /**
   * Remove alocações por filtro
   */
  async deleteAllocationsByFilter(employeeId: string, demandId: string, month: number, year: number): Promise<boolean> {
    try {
      await api.delete('/api/allocations/by-filter', {
        params: { employeeId, demandId, month, year }
      });
      return true;
    } catch (error) {
      console.error('Erro ao remover alocações:', error);
      return false;
    }
  },
};
