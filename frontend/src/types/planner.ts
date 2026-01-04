// Team (Mesa/Equipe) - Top level organization
export interface Team {
  id: string;
  name: string;           // "Contábil", "Financeiro", "Obras Des/Tra"
  description?: string;
  color: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  teamId: string;         // A qual equipe pertence
  dailyHours: number;     // Default 8
  vacations: VacationPeriod[];
  fixedAllocations: FixedAllocation[];
}

export interface VacationPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
}

export interface FixedAllocation {
  id: string;
  name: string;
  hoursPerMonth: number;
}

// Status de uma demanda
export type DemandStatus = 'pending' | 'partial' | 'allocated' | 'in-progress' | 'completed';

// Tipos de fase do projeto
export type PhaseType = 'construction' | 'homologation' | 'go-live' | 'assisted-operation' | 'maintenance';

// Configuração visual de cada fase
export const PHASE_CONFIG: Record<PhaseType, { label: string; color: string; bgColor: string; icon: string }> = {
  'construction': { 
    label: 'Construção', 
    color: 'bg-blue-500', 
    bgColor: 'bg-blue-100 dark:bg-blue-950',
    icon: '🔵' 
  },
  'homologation': { 
    label: 'Homologação', 
    color: 'bg-orange-500', 
    bgColor: 'bg-orange-100 dark:bg-orange-950',
    icon: '🟠' 
  },
  'go-live': { 
    label: 'Go Live', 
    color: 'bg-red-500', 
    bgColor: 'bg-red-100 dark:bg-red-950',
    icon: '♦️' 
  },
  'assisted-operation': { 
    label: 'Op. Assistida', 
    color: 'bg-green-500', 
    bgColor: 'bg-green-100 dark:bg-green-950',
    icon: '🟢' 
  },
  'maintenance': { 
    label: 'Manutenção', 
    color: 'bg-gray-500', 
    bgColor: 'bg-gray-100 dark:bg-gray-900',
    icon: '⚪' 
  },
};

// Fase do cronograma
export interface ProjectPhase {
  id: string;
  type: PhaseType;
  name?: string;          // Nome customizado opcional
  startDate: Date;
  endDate: Date;
  isMilestone?: boolean;  // True para Go-Live (apenas 1 dia)
}

// Projeto Macro (Nível 1) - Ex: "Reforma Tributária"
export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  color: string;
  priority: 'high' | 'medium' | 'low';
  demands: Demand[];      // Sub-demandas do projeto
}

// Demanda (Nível 2) - Ex: "Frente Contábil - Abertura de Razão"
export interface Demand {
  id: string;
  projectId: string;      // Projeto pai
  name: string;
  description?: string;
  teamId: string;         // Mesa responsável
  startDate: Date;
  endDate: Date;
  phases: ProjectPhase[]; // Cronograma de fases
  totalHours: number;     // Horas estimadas
  allocatedHours: number; // Horas já alocadas
  status: DemandStatus;
  createdAt: Date;
  isNew?: boolean;        // Flag para mostrar badge "Nova"
  // Datas das fases
  hmgStartDate?: Date;    // Início da Homologação
  hmgEndDate?: Date;      // Fim da Homologação
  goLiveDate?: Date;      // GO Live (Marco)
  assistedOpDate?: Date;  // Operação Assistida
  // Campos extras vindos da API (para evitar lookup de projeto)
  _projectName?: string;
  _projectColor?: string;
}

export interface Allocation {
  id: string;
  employeeId: string;
  demandId: string;       // Agora referencia Demand em vez de Project (ou ID especial para férias/treinamento)
  projectId: string;      // Referência ao projeto pai para facilitar queries
  month: number; // 0-11
  year: number;
  hours: number;
  isLoan?: boolean; // Marcado quando funcionário é emprestado de outra equipe
  sourceTeamId?: string; // Equipe de origem do empréstimo
  allocationType?: string; // Tipo especial: VACATION, TRAINING, etc.
  // Informações adicionais para alocações de demandas de outros departamentos
  demandName?: string;
  projectName?: string;
  projectColor?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: Date;
  type: 'national' | 'local';
}

export interface CalendarConfig {
  dailyHours: number; // Global default (8h)
  holidays: Holiday[];
}

export interface MonthlyCapacity {
  month: number;
  year: number;
  workingDays: number;
  totalCapacity: number; // workingDays * dailyHours
  allocatedHours: number;
  vacationHours: number;
  fixedHours: number;
  availableHours: number;
  utilizationPercent: number;
}

export const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const DEMAND_STATUS_CONFIG: Record<DemandStatus, { label: string; color: string; icon: string }> = {
  'pending': { label: 'Pendente', color: 'bg-yellow-500', icon: '⚠️' },
  'partial': { label: 'Parcial', color: 'bg-orange-500', icon: '🔶' },
  'allocated': { label: 'Alocado', color: 'bg-green-500', icon: '✅' },
  'in-progress': { label: 'Em andamento', color: 'bg-blue-500', icon: '🔄' },
  'completed': { label: 'Concluído', color: 'bg-gray-500', icon: '✔️' },
};

export const TEAM_COLORS: Record<string, string> = {
  'team-contabil': 'bg-blue-500',
  'team-financeiro': 'bg-emerald-500',
  'team-obras': 'bg-amber-500',
};

export const TEAM_BORDER_COLORS: Record<string, string> = {
  'team-contabil': 'border-blue-500',
  'team-financeiro': 'border-emerald-500',
  'team-obras': 'border-amber-500',
};

export const PROJECT_COLORS = [
  'hsl(175, 70%, 40%)',
  'hsl(200, 70%, 50%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)',
  'hsl(340, 75%, 55%)',
  'hsl(160, 60%, 45%)',
  'hsl(220, 70%, 55%)',
];

// ========================================
// Azure DevOps Integration Types
// ========================================

// Work Item do Azure DevOps
export interface AzureWorkItem {
  id: number;
  title: string;
  workItemType: string;       // "Task", "User Story", "Bug", etc.
  state: string;              // "New", "Active", "Closed", etc.
  assignedTo?: string;        // Nome do colaborador
  assignedToEmail?: string;   // Email para matching
  areaPath: string;           // Área/Mesa no Azure
  iterationPath: string;      // Sprint/Iteração
  originalEstimate?: number;  // Horas estimadas
  completedWork?: number;     // Horas trabalhadas (apontadas)
  remainingWork?: number;     // Horas restantes
  parentId?: number;          // ID do item pai (User Story)
  tags?: string[];
  createdDate: Date;
  changedDate: Date;
}

// Registro de tempo (Apontamento de HH)
export interface TimeEntry {
  id: string;
  workItemId: number;
  employeeId: string;         // ID interno do colaborador
  employeeEmail: string;      // Email para matching com Azure
  demandId: string;           // ID da demanda local
  date: Date;
  hours: number;
  description?: string;
  source: 'azure' | 'manual'; // Origem do apontamento
  syncedAt?: Date;            // Quando foi sincronizado
}

// Resumo de horas por colaborador
export interface EmployeeTimeReport {
  employeeId: string;
  employeeName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalPlannedHours: number;   // Horas planejadas/alocadas
  totalWorkedHours: number;    // Horas efetivamente trabalhadas
  byDemand: {
    demandId: string;
    demandName: string;
    projectName: string;
    plannedHours: number;
    workedHours: number;
    variance: number;          // Diferença (trabalhado - planejado)
    workItems: AzureWorkItem[];
  }[];
  utilizationPercent: number;  // % de utilização
}

// Resumo da mesa/equipe para o coordenador
export interface TeamDashboardData {
  teamId: string;
  teamName: string;
  period: {
    month: number;
    year: number;
  };
  summary: {
    totalCapacity: number;      // Capacidade total da equipe
    totalPlanned: number;       // Total planejado
    totalWorked: number;        // Total trabalhado (Azure)
    utilizationPercent: number;
  };
  employees: EmployeeTimeReport[];
  demands: {
    demandId: string;
    demandName: string;
    projectName: string;
    totalPlanned: number;
    totalWorked: number;
    status: DemandStatus;
  }[];
}

// Configuração da integração Azure DevOps
export interface AzureDevOpsConfig {
  organization: string;
  project: string;
  personalAccessToken?: string;
  areaPathMapping: Record<string, string>; // teamId -> areaPath
}
