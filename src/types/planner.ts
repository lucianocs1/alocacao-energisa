export type CellType = 'Contábil' | 'Fiscal' | 'Societário' | 'Trabalhista';

export interface Employee {
  id: string;
  name: string;
  role: string;
  cell: CellType; // Home team
  dailyHours: number; // Default 8
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
  ownerCell: CellType; // The cell that owns the project
}

export interface Allocation {
  id: string;
  employeeId: string;
  projectId: string;
  month: number; // 0-11
  year: number;
  hours: number;
  isCrossTeam?: boolean; // Marked when employee is from another cell
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

export const CELL_COLORS: Record<CellType, string> = {
  'Contábil': 'bg-chart-1',
  'Fiscal': 'bg-chart-2',
  'Societário': 'bg-chart-3',
  'Trabalhista': 'bg-chart-4',
};

export const CELL_BORDER_COLORS: Record<CellType, string> = {
  'Contábil': 'border-chart-1',
  'Fiscal': 'border-chart-2',
  'Societário': 'border-chart-3',
  'Trabalhista': 'border-chart-4',
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
