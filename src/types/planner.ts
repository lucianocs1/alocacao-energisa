export type CellType = 'Contábil' | 'Fiscal' | 'Societário' | 'Trabalhista';

export interface Employee {
  id: string;
  name: string;
  role: string;
  cell: CellType;
  monthlyCapacity: number; // hours per month
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

export interface Project {
  id: string;
  name: string;
  code: string;
  budgetHours: number;
  allocatedHours: number;
  color: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Allocation {
  id: string;
  employeeId: string;
  projectId: string;
  month: number; // 0-11
  year: number;
  hours: number;
}

export interface MonthlyCapacity {
  month: number;
  year: number;
  totalCapacity: number;
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

export const CELL_COLORS: Record<CellType, string> = {
  'Contábil': 'bg-chart-1',
  'Fiscal': 'bg-chart-2',
  'Societário': 'bg-chart-3',
  'Trabalhista': 'bg-chart-4',
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
