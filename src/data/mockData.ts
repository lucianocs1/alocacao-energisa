import { Employee, Project, Allocation, CellType } from '@/types/planner';

export const mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    name: 'Igor Santos',
    role: 'Analista Sênior',
    cell: 'Fiscal',
    monthlyCapacity: 160,
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
    monthlyCapacity: 160,
    vacations: [],
    fixedAllocations: []
  },
  {
    id: 'emp-3',
    name: 'Carlos Silva',
    role: 'Analista Pleno',
    cell: 'Fiscal',
    monthlyCapacity: 160,
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
    monthlyCapacity: 160,
    vacations: [],
    fixedAllocations: []
  },
  {
    id: 'emp-5',
    name: 'Roberto Almeida',
    role: 'Gerente',
    cell: 'Trabalhista',
    monthlyCapacity: 120,
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
    monthlyCapacity: 160,
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
    priority: 'high'
  },
  {
    id: 'proj-2',
    name: 'PIS/COFINS',
    code: 'PC-2024',
    budgetHours: 300,
    allocatedHours: 180,
    color: 'hsl(200, 70%, 50%)',
    priority: 'medium'
  },
  {
    id: 'proj-3',
    name: 'Auditoria Anual',
    code: 'AUD-2024',
    budgetHours: 400,
    allocatedHours: 450,
    color: 'hsl(38, 92%, 50%)',
    priority: 'high'
  },
  {
    id: 'proj-4',
    name: 'Reestruturação Societária',
    code: 'RS-2024',
    budgetHours: 250,
    allocatedHours: 100,
    color: 'hsl(280, 65%, 60%)',
    priority: 'low'
  },
  {
    id: 'proj-5',
    name: 'Compliance Trabalhista',
    code: 'CT-2024',
    budgetHours: 200,
    allocatedHours: 80,
    color: 'hsl(340, 75%, 55%)',
    priority: 'medium'
  },
];

export const mockAllocations: Allocation[] = [
  { id: 'alloc-1', employeeId: 'emp-1', projectId: 'proj-1', month: 0, year: 2024, hours: 80 },
  { id: 'alloc-2', employeeId: 'emp-1', projectId: 'proj-2', month: 1, year: 2024, hours: 60 },
  { id: 'alloc-3', employeeId: 'emp-2', projectId: 'proj-1', month: 0, year: 2024, hours: 100 },
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
