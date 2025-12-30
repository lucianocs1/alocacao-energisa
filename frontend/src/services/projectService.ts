import api from './api';
import { Project, Demand, ProjectPhase } from '@/types/planner';

// ========== Types ==========

interface ProjectDto {
  id: string;
  name: string;
  code: string;
  description?: string;
  startDate: string;
  endDate: string;
  color: string;
  priority: string;
  isActive: boolean;
  createdAt: string;
  demands: DemandDto[];
}

interface DemandDto {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  teamId: string;
  teamName?: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  allocatedHours: number;
  status: string;
  createdAt: string;
  isNew: boolean;
  phases: PhaseDto[];
  hmgStartDate?: string;
  hmgEndDate?: string;
  goLiveDate?: string;
  assistedOpDate?: string;
}

interface PhaseDto {
  id: string;
  type: string;
  name?: string;
  startDate: string;
  endDate: string;
  isMilestone: boolean;
}

interface CreateProjectRequest {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  color: string;
  priority: string;
  demands: CreateDemandRequest[];
}

interface CreateDemandRequest {
  name: string;
  description?: string;
  teamId: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  phases: CreatePhaseRequest[];
  hmgStartDate?: string;
  hmgEndDate?: string;
  goLiveDate?: string;
  assistedOpDate?: string;
}

interface CreatePhaseRequest {
  type: string;
  name?: string;
  startDate: string;
  endDate: string;
  isMilestone: boolean;
}

interface ProjectListResponse {
  projects: ProjectDto[];
  totalCount: number;
}

interface ProjectStatsDto {
  totalProjects: number;
  totalDemands: number;
  pendingDemands: number;
  partialDemands: number;
  allocatedDemands: number;
  completedDemands: number;
}

// ========== Helper Functions ==========

// Converte string ISO para Date mantendo apenas a data (sem hora/timezone)
const parseDate = (dateString: string): Date => {
  const date = new Date(dateString);
  // Se a string não tem hora (YYYY-MM-DD), ajusta para evitar problemas de timezone
  if (!dateString.includes('T')) {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }
  return date;
};

const mapDtoToProject = (dto: ProjectDto): Project => ({
  id: dto.id,
  name: dto.name,
  code: dto.code,
  description: dto.description,
  startDate: parseDate(dto.startDate),
  endDate: parseDate(dto.endDate),
  color: dto.color,
  priority: dto.priority as 'high' | 'medium' | 'low',
  demands: dto.demands.map(mapDtoToDemand),
});

const mapDtoToDemand = (dto: DemandDto): Demand => ({
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
  createdAt: new Date(dto.createdAt),
  isNew: dto.isNew,
  phases: dto.phases.map(mapDtoToPhase),
  hmgStartDate: dto.hmgStartDate ? parseDate(dto.hmgStartDate) : undefined,
  hmgEndDate: dto.hmgEndDate ? parseDate(dto.hmgEndDate) : undefined,
  goLiveDate: dto.goLiveDate ? parseDate(dto.goLiveDate) : undefined,
  assistedOpDate: dto.assistedOpDate ? parseDate(dto.assistedOpDate) : undefined,
});

const mapDtoToPhase = (dto: PhaseDto): ProjectPhase => ({
  id: dto.id,
  type: dto.type as ProjectPhase['type'],
  name: dto.name,
  startDate: parseDate(dto.startDate),
  endDate: parseDate(dto.endDate),
  isMilestone: dto.isMilestone,
});

// Formata data para ISO string apenas com data (YYYY-MM-DD) sem hora
const formatDateOnly = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00.000Z`;
};

const mapProjectToRequest = (project: Partial<Project>): CreateProjectRequest => ({
  name: project.name || '',
  description: project.description,
  startDate: project.startDate ? formatDateOnly(project.startDate) : formatDateOnly(new Date()),
  endDate: project.endDate ? formatDateOnly(project.endDate) : formatDateOnly(new Date()),
  color: project.color || '#3B82F6',
  priority: project.priority || 'medium',
  demands: project.demands?.map(mapDemandToRequest) || [],
});

const mapDemandToRequest = (demand: Partial<Demand>): CreateDemandRequest => {
  const phases: CreatePhaseRequest[] = [];

  // Se fases já foram definidas manualmente, use-as
  if (demand.phases && demand.phases.length > 0) {
    phases.push(...demand.phases.map(mapPhaseToRequest));
  } else {
    // Cria fases automaticamente baseadas nas datas informadas
    const startDate = demand.startDate || new Date();
    const hmgStart = demand.hmgStartDate;
    const hmgEnd = demand.hmgEndDate;
    const goLive = demand.goLiveDate;
    const assistedOp = demand.assistedOpDate;
    const endDate = demand.endDate || new Date();

    // Fase de Construção (início até início de homologação ou GO Live ou fim)
    const constructionEnd = hmgStart || goLive || endDate;
    phases.push({
      type: 'construction',
      name: 'Construção',
      startDate: formatDateOnly(startDate),
      endDate: formatDateOnly(constructionEnd),
      isMilestone: false,
    });

    // Fase de Homologação (se definida)
    if (hmgStart && hmgEnd) {
      phases.push({
        type: 'homologation',
        name: 'Homologação',
        startDate: formatDateOnly(hmgStart),
        endDate: formatDateOnly(hmgEnd),
        isMilestone: false,
      });
    }

    // GO Live (Marco - se definido)
    if (goLive) {
      phases.push({
        type: 'go-live',
        name: 'GO Live',
        startDate: formatDateOnly(goLive),
        endDate: formatDateOnly(goLive),
        isMilestone: true,
      });
    }

    // Operação Assistida (se definida)
    if (assistedOp && goLive) {
      phases.push({
        type: 'assisted-operation',
        name: 'Operação Assistida',
        startDate: formatDateOnly(goLive),
        endDate: formatDateOnly(assistedOp),
        isMilestone: false,
      });
    }

    // Manutenção (do fim da Op. Assistida ou GO Live até o fim do projeto)
    if (goLive || assistedOp) {
      const maintenanceStart = assistedOp || goLive;
      if (maintenanceStart) {
        phases.push({
          type: 'maintenance',
          name: 'Manutenção',
          startDate: formatDateOnly(maintenanceStart),
          endDate: formatDateOnly(endDate),
          isMilestone: false,
        });
      }
    }
  }

  return {
    name: demand.name || '',
    description: demand.description,
    teamId: demand.teamId || '',
    startDate: demand.startDate ? formatDateOnly(demand.startDate) : formatDateOnly(new Date()),
    endDate: demand.endDate ? formatDateOnly(demand.endDate) : formatDateOnly(new Date()),
    totalHours: demand.totalHours || 0,
    phases,
    hmgStartDate: demand.hmgStartDate ? formatDateOnly(demand.hmgStartDate) : undefined,
    hmgEndDate: demand.hmgEndDate ? formatDateOnly(demand.hmgEndDate) : undefined,
    goLiveDate: demand.goLiveDate ? formatDateOnly(demand.goLiveDate) : undefined,
    assistedOpDate: demand.assistedOpDate ? formatDateOnly(demand.assistedOpDate) : undefined,
  };
};

const mapPhaseToRequest = (phase: Partial<ProjectPhase>): CreatePhaseRequest => ({
  type: phase.type || 'construction',
  name: phase.name,
  startDate: phase.startDate ? formatDateOnly(phase.startDate) : formatDateOnly(new Date()),
  endDate: phase.endDate ? formatDateOnly(phase.endDate) : formatDateOnly(new Date()),
  isMilestone: phase.isMilestone || false,
});

// ========== API Service ==========

export const projectService = {
  async getProjects(teamId?: string): Promise<Project[]> {
    try {
      const params = teamId ? { teamId } : {};
      const response = await api.get<ProjectListResponse>('/api/projects', { params });
      return response.data.projects.map(mapDtoToProject);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      return [];
    }
  },

  async getProjectById(id: string): Promise<Project | null> {
    try {
      const response = await api.get<ProjectDto>(`/api/projects/${id}`);
      return mapDtoToProject(response.data);
    } catch (error) {
      console.error('Erro ao buscar projeto:', error);
      return null;
    }
  },

  async createProject(project: Partial<Project>): Promise<Project | null> {
    try {
      const request = mapProjectToRequest(project);
      const response = await api.post<ProjectDto>('/api/projects', request);
      return mapDtoToProject(response.data);
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      throw error;
    }
  },

  async updateProject(id: string, project: Partial<Project>): Promise<Project | null> {
    try {
      const request = {
        name: project.name || '',
        code: project.code || '',
        description: project.description,
        startDate: project.startDate?.toISOString() || new Date().toISOString(),
        endDate: project.endDate?.toISOString() || new Date().toISOString(),
        color: project.color || '#3B82F6',
        priority: project.priority || 'medium',
      };
      const response = await api.put<ProjectDto>(`/api/projects/${id}`, request);
      return mapDtoToProject(response.data);
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      return null;
    }
  },

  async deleteProject(id: string): Promise<boolean> {
    try {
      await api.delete(`/api/projects/${id}`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
      return false;
    }
  },

  async addDemand(projectId: string, demand: Partial<Demand>): Promise<Demand | null> {
    try {
      const request = mapDemandToRequest(demand);
      const response = await api.post<DemandDto>(`/api/projects/${projectId}/demands`, request);
      return mapDtoToDemand(response.data);
    } catch (error) {
      console.error('Erro ao adicionar demanda:', error);
      return null;
    }
  },

  async updateDemand(id: string, demand: Partial<Demand>): Promise<Demand | null> {
    try {
      const request = {
        name: demand.name || '',
        description: demand.description,
        teamId: demand.teamId || '',
        startDate: demand.startDate?.toISOString() || new Date().toISOString(),
        endDate: demand.endDate?.toISOString() || new Date().toISOString(),
        totalHours: demand.totalHours || 0,
        allocatedHours: demand.allocatedHours || 0,
        status: demand.status || 'pending',
      };
      const response = await api.put<DemandDto>(`/api/projects/demands/${id}`, request);
      return mapDtoToDemand(response.data);
    } catch (error) {
      console.error('Erro ao atualizar demanda:', error);
      return null;
    }
  },

  async deleteDemand(id: string): Promise<boolean> {
    try {
      await api.delete(`/api/projects/demands/${id}`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar demanda:', error);
      return false;
    }
  },

  async getStats(teamId?: string): Promise<ProjectStatsDto | null> {
    try {
      const params = teamId ? { teamId } : {};
      const response = await api.get<ProjectStatsDto>('/api/projects/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return null;
    }
  },
};
