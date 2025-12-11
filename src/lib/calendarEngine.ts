import { Holiday } from '@/types/planner';

/**
 * Calendar Engine - Calculates working days and hours per month
 * considering weekends and holidays
 */

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isHoliday(date: Date, holidays: Holiday[]): boolean {
  return holidays.some(holiday => isSameDay(new Date(holiday.date), date));
}

export function getWorkingDaysInMonth(
  month: number, // 0-11
  year: number,
  holidays: Holiday[]
): number {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  let workingDays = 0;
  
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const currentDate = new Date(year, month, day);
    
    if (!isWeekend(currentDate) && !isHoliday(currentDate, holidays)) {
      workingDays++;
    }
  }
  
  return workingDays;
}

export function getMonthlyCapacityHours(
  month: number,
  year: number,
  dailyHours: number,
  holidays: Holiday[]
): number {
  const workingDays = getWorkingDaysInMonth(month, year, holidays);
  return workingDays * dailyHours;
}

export function getVacationDaysInMonth(
  month: number,
  year: number,
  vacationStart: Date,
  vacationEnd: Date,
  holidays: Holiday[]
): number {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  
  // Check if vacation overlaps with this month
  const effectiveStart = new Date(Math.max(vacationStart.getTime(), monthStart.getTime()));
  const effectiveEnd = new Date(Math.min(vacationEnd.getTime(), monthEnd.getTime()));
  
  if (effectiveStart > effectiveEnd) {
    return 0; // No overlap
  }
  
  let vacationWorkingDays = 0;
  
  for (let d = new Date(effectiveStart); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
    if (!isWeekend(d) && !isHoliday(d, holidays)) {
      vacationWorkingDays++;
    }
  }
  
  return vacationWorkingDays;
}

export function getVacationHoursInMonth(
  month: number,
  year: number,
  vacationStart: Date,
  vacationEnd: Date,
  dailyHours: number,
  holidays: Holiday[]
): number {
  const vacationDays = getVacationDaysInMonth(month, year, vacationStart, vacationEnd, holidays);
  return vacationDays * dailyHours;
}

export function formatMonthCapacity(hours: number, workingDays: number): string {
  return `${hours}h (${workingDays} dias úteis)`;
}
