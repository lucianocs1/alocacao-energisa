import { Employee, Project, Allocation, Holiday, CalendarConfig } from '@/types/planner';

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
  {
    id: 'emp-1',
    name: 'Igor Santos',
    role: 'Analista Sênior',
    cell: 'Fiscal',
    dailyHours: 8,
    vacations: [
      { id: 'vac-1', startDate: new Date(2024, 11, 20), endDate: new Date(2025, 0, 5) }
    ],
    fixedAllocations: [
      { id: 'fix-1', name: 'LE/SM', hoursPerMonth: 40 }
    ]
  },
  {
    id: 'emp-2',
    name: 'Marina Costa',
    role: 'Coordenadora',
    cell: 'Contábil',
    dailyHours: 8,
    vacations: [],
    fixedAllocations: []
  },
  {
    id: 'emp-3',
    name: 'Carlos Silva',
    role: 'Analista Pleno',
    cell: 'Fiscal',
    dailyHours: 8,
    vacations: [
      { id: 'vac-2', startDate: new Date(2024, 6, 1), endDate: new Date(2024, 6, 15) }
    ],
    fixedAllocations: [
      { id: 'fix-2', name: 'Relatórios Mensais', hoursPerMonth: 20 }
    ]
  },
  {
    id: 'emp-4',
    name: 'Juliana Mendes',
    role: 'Analista Júnior',
    cell: 'Societário',
    dailyHours: 8,
    vacations: [],
    fixedAllocations: []
  },
  {
    id: 'emp-5',
    name: 'Roberto Almeida',
    role: 'Gerente',
    cell: 'Trabalhista',
    dailyHours: 6, // Part-time example
    vacations: [],
    fixedAllocations: [
      { id: 'fix-3', name: 'Gestão de Equipe', hoursPerMonth: 40 }
    ]
  },
  {
    id: 'emp-6',
    name: 'Fernanda Lima',
    role: 'Analista Sênior',
    cell: 'Contábil',
    dailyHours: 8,
    vacations: [
      { id: 'vac-3', startDate: new Date(2024, 3, 10), endDate: new Date(2024, 3, 20) }
    ],
    fixedAllocations: []
  },
];

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Reforma Tributária',
    code: 'RT-2024',
    budgetHours: 500,
    allocatedHours: 320,
    color: 'hsl(175, 70%, 40%)',
    priority: 'high',
    ownerCell: 'Fiscal'
  },
  {
    id: 'proj-2',
    name: 'PIS/COFINS',
    code: 'PC-2024',
    budgetHours: 300,
    allocatedHours: 180,
    color: 'hsl(200, 70%, 50%)',
    priority: 'medium',
    ownerCell: 'Fiscal'
  },
  {
    id: 'proj-3',
    name: 'Auditoria Anual',
    code: 'AUD-2024',
    budgetHours: 400,
    allocatedHours: 450,
    color: 'hsl(38, 92%, 50%)',
    priority: 'high',
    ownerCell: 'Contábil'
  },
  {
    id: 'proj-4',
    name: 'Reestruturação Societária',
    code: 'RS-2024',
    budgetHours: 250,
    allocatedHours: 100,
    color: 'hsl(280, 65%, 60%)',
    priority: 'low',
    ownerCell: 'Societário'
  },
  {
    id: 'proj-5',
    name: 'Compliance Trabalhista',
    code: 'CT-2024',
    budgetHours: 200,
    allocatedHours: 80,
    color: 'hsl(340, 75%, 55%)',
    priority: 'medium',
    ownerCell: 'Trabalhista'
  },
];

export const mockAllocations: Allocation[] = [
  { id: 'alloc-1', employeeId: 'emp-1', projectId: 'proj-1', month: 0, year: 2024, hours: 80 },
  { id: 'alloc-2', employeeId: 'emp-1', projectId: 'proj-2', month: 1, year: 2024, hours: 60 },
  { id: 'alloc-3', employeeId: 'emp-2', projectId: 'proj-1', month: 0, year: 2024, hours: 100, isCrossTeam: true }, // Contábil -> Fiscal project
  { id: 'alloc-4', employeeId: 'emp-2', projectId: 'proj-3', month: 2, year: 2024, hours: 120 },
  { id: 'alloc-5', employeeId: 'emp-3', projectId: 'proj-2', month: 0, year: 2024, hours: 40 },
  { id: 'alloc-6', employeeId: 'emp-3', projectId: 'proj-1', month: 1, year: 2024, hours: 80 },
  { id: 'alloc-7', employeeId: 'emp-4', projectId: 'proj-4', month: 0, year: 2024, hours: 50 },
  { id: 'alloc-8', employeeId: 'emp-4', projectId: 'proj-4', month: 1, year: 2024, hours: 50 },
  { id: 'alloc-9', employeeId: 'emp-5', projectId: 'proj-5', month: 0, year: 2024, hours: 40 },
  { id: 'alloc-10', employeeId: 'emp-5', projectId: 'proj-5', month: 1, year: 2024, hours: 40 },
  { id: 'alloc-11', employeeId: 'emp-6', projectId: 'proj-3', month: 0, year: 2024, hours: 80 },
  { id: 'alloc-12', employeeId: 'emp-6', projectId: 'proj-3', month: 1, year: 2024, hours: 100 },
  { id: 'alloc-13', employeeId: 'emp-6', projectId: 'proj-3', month: 2, year: 2024, hours: 150 },
  { id: 'alloc-14', employeeId: 'emp-1', projectId: 'proj-1', month: 2, year: 2024, hours: 140 },
];
