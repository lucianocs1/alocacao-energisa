import { Employee, Project, Demand, Allocation, Holiday, CalendarConfig, Team, ProjectPhase } from '@/types/planner';

// Teams (Mesas/Equipes)
export const mockTeams: Team[] = [
  {
    id: 'team-obras',
    name: 'Obras de Dis. e Tra.',
    description: 'Obras de Distribuição e Transmissão',
    color: 'bg-green-500',
  },
  {
    id: 'team-contabil',
    name: 'Contábil',
    description: 'Equipe de contabilidade e auditoria',
    color: 'bg-cyan-500',
  },
  {
    id: 'team-financeiro',
    name: 'Financeiro',
    description: 'Equipe financeira e tesouraria',
    color: 'bg-teal-500',
  },
];

// Global calendar configuration
export const calendarConfig: CalendarConfig = {
  dailyHours: 8,
  holidays: [],
};

// Brazilian holidays for 2024/2025
export const mockHolidays: Holiday[] = [
  { id: 'hol-1', name: 'Ano Novo', date: new Date(2024, 0, 1), type: 'national' },
  { id: 'hol-2', name: 'Carnaval', date: new Date(2024, 1, 12), type: 'national' },
  { id: 'hol-3', name: 'Carnaval', date: new Date(2024, 1, 13), type: 'national' },
  { id: 'hol-4', name: 'Sexta-feira Santa', date: new Date(2024, 2, 29), type: 'national' },
  { id: 'hol-5', name: 'Tiradentes', date: new Date(2024, 3, 21), type: 'national' },
  { id: 'hol-6', name: 'Dia do Trabalho', date: new Date(2024, 4, 1), type: 'national' },
  { id: 'hol-7', name: 'Corpus Christi', date: new Date(2024, 4, 30), type: 'national' },
  { id: 'hol-8', name: 'Independência', date: new Date(2024, 8, 7), type: 'national' },
  { id: 'hol-9', name: 'Nossa Senhora Aparecida', date: new Date(2024, 9, 12), type: 'national' },
  { id: 'hol-10', name: 'Finados', date: new Date(2024, 10, 2), type: 'national' },
  { id: 'hol-11', name: 'Proclamação da República', date: new Date(2024, 10, 15), type: 'national' },
  { id: 'hol-12', name: 'Natal', date: new Date(2024, 11, 25), type: 'national' },
  // 2025
  { id: 'hol-13', name: 'Ano Novo', date: new Date(2025, 0, 1), type: 'national' },
  { id: 'hol-14', name: 'Carnaval', date: new Date(2025, 2, 3), type: 'national' },
  { id: 'hol-15', name: 'Carnaval', date: new Date(2025, 2, 4), type: 'national' },
];

calendarConfig.holidays = mockHolidays;

export const mockEmployees: Employee[] = [
  // Equipe Contábil
  {
    id: 'emp-1',
    name: 'Marina Costa',
    role: 'Coordenadora',
    teamId: 'team-contabil',
    dailyHours: 8,
    vacations: [],
    fixedAllocations: []
  },
  {
    id: 'emp-2',
    name: 'Fernanda Lima',
    role: 'Analista Sênior',
    teamId: 'team-contabil',
    dailyHours: 8,
    vacations: [
      { id: 'vac-3', startDate: new Date(2024, 3, 10), endDate: new Date(2024, 3, 20) }
    ],
    fixedAllocations: []
  },
  {
    id: 'emp-3',
    name: 'Lucas Ferreira',
    role: 'Analista Pleno',
    teamId: 'team-contabil',
    dailyHours: 8,
    vacations: [],
    fixedAllocations: [
      { id: 'fix-1', name: 'Relatórios Mensais', hoursPerMonth: 20 }
    ]
  },
  // Equipe Financeiro
  {
    id: 'emp-4',
    name: 'Igor Santos',
    role: 'Gerente Financeiro',
    teamId: 'team-financeiro',
    dailyHours: 8,
    vacations: [
      { id: 'vac-1', startDate: new Date(2024, 11, 20), endDate: new Date(2025, 0, 5) }
    ],
    fixedAllocations: [
      { id: 'fix-2', name: 'Gestão de Caixa', hoursPerMonth: 40 }
    ]
  },
  {
    id: 'emp-5',
    name: 'Patricia Oliveira',
    role: 'Analista de Tesouraria',
    teamId: 'team-financeiro',
    dailyHours: 8,
    vacations: [],
    fixedAllocations: []
  },
  {
    id: 'emp-6',
    name: 'Carlos Silva',
    role: 'Analista de Contas',
    teamId: 'team-financeiro',
    dailyHours: 8,
    vacations: [
      { id: 'vac-2', startDate: new Date(2024, 6, 1), endDate: new Date(2024, 6, 15) }
    ],
    fixedAllocations: []
  },
  // Equipe Obras de Des. e Tra.
  {
    id: 'emp-7',
    name: 'Eduardo',
    role: 'Analista de Sisitemas II',
    teamId: 'team-obras',
    dailyHours: 8,
    vacations: [],
    fixedAllocations: [
      { id: 'fix-3', name: 'Gestão de Equipe', hoursPerMonth: 40 }
    ]
  },
  {
    id: 'emp-8',
    name: 'Marcos',
    role: 'Analista de Sisitemas II',
    teamId: 'team-obras',
    dailyHours: 8,
    vacations: [],
    fixedAllocations: []
  },
  {
    id: 'emp-9',
    name: 'André',
    role: 'Desenvolvedor Técnico',
    teamId: 'team-obras',
    dailyHours: 8,
    vacations: [],
    fixedAllocations: [
      { id: 'fix-4', name: 'Vistorias', hoursPerMonth: 30 }
    ]
  },
];

// Projetos Macro (Nível 1) com Sub-demandas (Nível 2)
export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Reforma Tributária',
    code: 'RT-2024',
    description: 'Adequação aos novos impostos da reforma tributária',
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 6, 31),
    color: 'hsl(200, 70%, 50%)',
    priority: 'high',
    demands: [
      {
        id: 'dem-1',
        projectId: 'proj-1',
        name: 'Frente Contábil - Abertura de Razão',
        description: 'Análise e ajuste do plano de contas',
        teamId: 'team-contabil',
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 5, 30),
        phases: [
          { id: 'phase-1a', type: 'construction', startDate: new Date(2024, 0, 1), endDate: new Date(2024, 3, 15) },
          { id: 'phase-1b', type: 'homologation', startDate: new Date(2024, 3, 16), endDate: new Date(2024, 4, 15) },
          { id: 'phase-1c', type: 'go-live', startDate: new Date(2024, 4, 16), endDate: new Date(2024, 4, 16), isMilestone: true },
          { id: 'phase-1d', type: 'assisted-operation', startDate: new Date(2024, 4, 17), endDate: new Date(2024, 5, 30) },
        ],
        totalHours: 3000,
        allocatedHours: 1200,
        status: 'partial',
        createdAt: new Date(2024, 0, 5),
        isNew: false,
      },
      {
        id: 'dem-2',
        projectId: 'proj-1',
        name: 'Frente Financeira - Fluxo de Caixa',
        description: 'Adequação do fluxo de caixa às novas alíquotas',
        teamId: 'team-financeiro',
        startDate: new Date(2024, 1, 1),
        endDate: new Date(2024, 6, 31),
        phases: [
          { id: 'phase-2a', type: 'construction', startDate: new Date(2024, 1, 1), endDate: new Date(2024, 4, 31) },
          { id: 'phase-2b', type: 'homologation', startDate: new Date(2024, 5, 1), endDate: new Date(2024, 5, 20) },
          { id: 'phase-2c', type: 'go-live', startDate: new Date(2024, 5, 21), endDate: new Date(2024, 5, 21), isMilestone: true },
          { id: 'phase-2d', type: 'assisted-operation', startDate: new Date(2024, 5, 22), endDate: new Date(2024, 6, 31) },
        ],
        totalHours: 1500,
        allocatedHours: 1500,
        status: 'allocated',
        createdAt: new Date(2024, 0, 10),
        isNew: false,
      },
      {
        id: 'dem-3',
        projectId: 'proj-1',
        name: 'Frente Obras - Adequação de Contratos',
        description: 'Revisão de contratos de obra com novos tributos',
        teamId: 'team-obras',
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 3, 30),
        phases: [
          { id: 'phase-3a', type: 'construction', startDate: new Date(2024, 0, 1), endDate: new Date(2024, 1, 28) },
          { id: 'phase-3b', type: 'homologation', startDate: new Date(2024, 2, 1), endDate: new Date(2024, 2, 20) },
          { id: 'phase-3c', type: 'go-live', startDate: new Date(2024, 2, 21), endDate: new Date(2024, 2, 21), isMilestone: true },
          { id: 'phase-3d', type: 'assisted-operation', startDate: new Date(2024, 2, 22), endDate: new Date(2024, 3, 30) },
        ],
        totalHours: 1100,
        allocatedHours: 1100,
        status: 'completed',
        createdAt: new Date(2024, 0, 8),
        isNew: false,
      },
    ],
  },
  {
    id: 'proj-2',
    name: 'Manutenção Legal',
    code: 'ML-2024',
    description: 'Manutenção de obrigações legais e fiscais',
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 11, 31),
    color: 'hsl(160, 60%, 45%)',
    priority: 'medium',
    demands: [
      {
        id: 'dem-4',
        projectId: 'proj-2',
        name: 'Fechamento Dep. Judicial',
        description: 'Acompanhamento de depósitos judiciais',
        teamId: 'team-contabil',
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 11, 31),
        phases: [
          { id: 'phase-4a', type: 'maintenance', startDate: new Date(2024, 0, 1), endDate: new Date(2024, 11, 31) },
        ],
        totalHours: 1000,
        allocatedHours: 400,
        status: 'in-progress',
        createdAt: new Date(2024, 0, 2),
        isNew: false,
      },
      {
        id: 'dem-5',
        projectId: 'proj-2',
        name: 'Relatórios SPED',
        description: 'Geração de relatórios fiscais obrigatórios',
        teamId: 'team-financeiro',
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 11, 31),
        phases: [
          { id: 'phase-5a', type: 'maintenance', startDate: new Date(2024, 0, 1), endDate: new Date(2024, 11, 31) },
        ],
        totalHours: 800,
        allocatedHours: 200,
        status: 'partial',
        createdAt: new Date(2024, 0, 3),
        isNew: false,
      },
    ],
  },
  {
    id: 'proj-3',
    name: 'Expansão Unidade Norte',
    code: 'EUN-2024',
    description: 'Construção da nova unidade no norte do estado',
    startDate: new Date(2024, 2, 1),
    endDate: new Date(2024, 11, 31),
    color: 'hsl(280, 65%, 60%)',
    priority: 'high',
    demands: [
      {
        id: 'dem-6',
        projectId: 'proj-3',
        name: 'Engenharia e Projetos',
        description: 'Elaboração de projetos técnicos',
        teamId: 'team-obras',
        startDate: new Date(2024, 2, 1),
        endDate: new Date(2024, 8, 30),
        phases: [
          { id: 'phase-6a', type: 'construction', startDate: new Date(2024, 2, 1), endDate: new Date(2024, 6, 15) },
          { id: 'phase-6b', type: 'homologation', startDate: new Date(2024, 6, 16), endDate: new Date(2024, 7, 15) },
          { id: 'phase-6c', type: 'go-live', startDate: new Date(2024, 7, 16), endDate: new Date(2024, 7, 16), isMilestone: true },
          { id: 'phase-6d', type: 'assisted-operation', startDate: new Date(2024, 7, 17), endDate: new Date(2024, 8, 30) },
        ],
        totalHours: 2000,
        allocatedHours: 800,
        status: 'partial',
        createdAt: new Date(2024, 1, 15),
        isNew: false,
      },
      {
        id: 'dem-7',
        projectId: 'proj-3',
        name: 'Controle Orçamentário',
        description: 'Gestão financeira da obra',
        teamId: 'team-financeiro',
        startDate: new Date(2024, 2, 1),
        endDate: new Date(2024, 11, 31),
        phases: [
          { id: 'phase-7a', type: 'construction', startDate: new Date(2024, 2, 1), endDate: new Date(2024, 8, 30) },
          { id: 'phase-7b', type: 'assisted-operation', startDate: new Date(2024, 9, 1), endDate: new Date(2024, 11, 31) },
        ],
        totalHours: 600,
        allocatedHours: 0,
        status: 'pending',
        createdAt: new Date(2024, 1, 20),
        isNew: true,
      },
    ],
  },
  {
    id: 'proj-4',
    name: 'Auditoria Anual 2024',
    code: 'AUD-2024',
    description: 'Auditoria externa anual',
    startDate: new Date(2024, 9, 1),
    endDate: new Date(2024, 11, 31),
    color: 'hsl(38, 92%, 50%)',
    priority: 'high',
    demands: [
      {
        id: 'dem-8',
        projectId: 'proj-4',
        name: 'Preparação de Documentos',
        description: 'Organização de documentação para auditoria',
        teamId: 'team-contabil',
        startDate: new Date(2024, 9, 1),
        endDate: new Date(2024, 10, 30),
        phases: [
          { id: 'phase-8a', type: 'construction', startDate: new Date(2024, 9, 1), endDate: new Date(2024, 10, 15) },
          { id: 'phase-8b', type: 'go-live', startDate: new Date(2024, 10, 16), endDate: new Date(2024, 10, 16), isMilestone: true },
          { id: 'phase-8c', type: 'assisted-operation', startDate: new Date(2024, 10, 17), endDate: new Date(2024, 10, 30) },
        ],
        totalHours: 400,
        allocatedHours: 0,
        status: 'pending',
        createdAt: new Date(2024, 8, 1),
        isNew: true,
      },
      {
        id: 'dem-9',
        projectId: 'proj-4',
        name: 'Conciliações Bancárias',
        description: 'Verificação de todas as contas bancárias',
        teamId: 'team-financeiro',
        startDate: new Date(2024, 9, 1),
        endDate: new Date(2024, 10, 15),
        phases: [
          { id: 'phase-9a', type: 'construction', startDate: new Date(2024, 9, 1), endDate: new Date(2024, 9, 31) },
          { id: 'phase-9b', type: 'homologation', startDate: new Date(2024, 10, 1), endDate: new Date(2024, 10, 10) },
          { id: 'phase-9c', type: 'go-live', startDate: new Date(2024, 10, 11), endDate: new Date(2024, 10, 11), isMilestone: true },
          { id: 'phase-9d', type: 'assisted-operation', startDate: new Date(2024, 10, 12), endDate: new Date(2024, 10, 15) },
        ],
        totalHours: 200,
        allocatedHours: 0,
        status: 'pending',
        createdAt: new Date(2024, 8, 1),
        isNew: true,
      },
    ],
  },
];

// Helper para extrair todas as demandas dos projetos
export const getAllDemands = (): Demand[] => {
  return mockProjects.flatMap(project => project.demands);
};

// Helper para obter demandas pendentes por equipe
export const getPendingDemandsByTeam = (teamId: string): Demand[] => {
  return getAllDemands().filter(
    demand => demand.teamId === teamId && (demand.status === 'pending' || demand.status === 'partial')
  );
};

export const mockAllocations: Allocation[] = [
  // Alocações para Demanda 1 (Frente Contábil)
  { id: 'alloc-1', employeeId: 'emp-1', demandId: 'dem-1', projectId: 'proj-1', month: 0, year: 2024, hours: 80 },
  { id: 'alloc-2', employeeId: 'emp-1', demandId: 'dem-1', projectId: 'proj-1', month: 1, year: 2024, hours: 80 },
  { id: 'alloc-3', employeeId: 'emp-2', demandId: 'dem-1', projectId: 'proj-1', month: 0, year: 2024, hours: 120 },
  { id: 'alloc-4', employeeId: 'emp-2', demandId: 'dem-1', projectId: 'proj-1', month: 1, year: 2024, hours: 120 },
  { id: 'alloc-5', employeeId: 'emp-3', demandId: 'dem-1', projectId: 'proj-1', month: 0, year: 2024, hours: 100 },
  { id: 'alloc-6', employeeId: 'emp-3', demandId: 'dem-1', projectId: 'proj-1', month: 1, year: 2024, hours: 100 },
  
  // Alocações para Demanda 2 (Frente Financeira)
  { id: 'alloc-7', employeeId: 'emp-4', demandId: 'dem-2', projectId: 'proj-1', month: 1, year: 2024, hours: 100 },
  { id: 'alloc-8', employeeId: 'emp-4', demandId: 'dem-2', projectId: 'proj-1', month: 2, year: 2024, hours: 100 },
  { id: 'alloc-9', employeeId: 'emp-5', demandId: 'dem-2', projectId: 'proj-1', month: 1, year: 2024, hours: 80 },
  { id: 'alloc-10', employeeId: 'emp-5', demandId: 'dem-2', projectId: 'proj-1', month: 2, year: 2024, hours: 80 },
  
  // Alocações para Demanda 3 (Frente Obras)
  { id: 'alloc-11', employeeId: 'emp-7', demandId: 'dem-3', projectId: 'proj-1', month: 0, year: 2024, hours: 120 },
  { id: 'alloc-12', employeeId: 'emp-8', demandId: 'dem-3', projectId: 'proj-1', month: 0, year: 2024, hours: 160 },
  { id: 'alloc-13', employeeId: 'emp-9', demandId: 'dem-3', projectId: 'proj-1', month: 1, year: 2024, hours: 100 },
  
  // Alocações para Demanda 4 (Fechamento Dep. Judicial)
  { id: 'alloc-14', employeeId: 'emp-1', demandId: 'dem-4', projectId: 'proj-2', month: 0, year: 2024, hours: 40 },
  { id: 'alloc-15', employeeId: 'emp-2', demandId: 'dem-4', projectId: 'proj-2', month: 1, year: 2024, hours: 60 },
  
  // Alocações para Demanda 5 (Relatórios SPED)
  { id: 'alloc-16', employeeId: 'emp-6', demandId: 'dem-5', projectId: 'proj-2', month: 0, year: 2024, hours: 50 },
  { id: 'alloc-17', employeeId: 'emp-6', demandId: 'dem-5', projectId: 'proj-2', month: 1, year: 2024, hours: 50 },
  
  // Alocações para Demanda 6 (Engenharia Expansão Norte)
  { id: 'alloc-18', employeeId: 'emp-7', demandId: 'dem-6', projectId: 'proj-3', month: 2, year: 2024, hours: 80 },
  { id: 'alloc-19', employeeId: 'emp-8', demandId: 'dem-6', projectId: 'proj-3', month: 2, year: 2024, hours: 120 },
  { id: 'alloc-20', employeeId: 'emp-9', demandId: 'dem-6', projectId: 'proj-3', month: 3, year: 2024, hours: 100 },
];
