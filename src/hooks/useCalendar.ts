import { useMemo, useState } from 'react';
import { Employee, Holiday, VacationPeriod } from '@/types/planner';
import { 
  getMonthlyCapacityHours, 
  getVacationHoursInMonth,
  getWorkingDaysInMonth 
} from '@/lib/calendarEngine';
import { mockHolidays, calendarConfig } from '@/data/mockData';

export interface MonthCapacityInfo {
  workingDays: number;
  totalHours: number;
  vacationHours: number;
  fixedHours: number;
  availableHours: number;
}

export function useCalendar() {
  const [holidays, setHolidays] = useState<Holiday[]>(mockHolidays);
  const [globalDailyHours] = useState(calendarConfig.dailyHours);

  const getMonthCapacity = (
    month: number,
    year: number,
    employee: Employee
  ): MonthCapacityInfo => {
    const dailyHours = employee.dailyHours || globalDailyHours;
    const workingDays = getWorkingDaysInMonth(month, year, holidays);
    const totalHours = workingDays * dailyHours;
    
    // Calculate vacation hours for this month
    let vacationHours = 0;
    employee.vacations.forEach((vacation: VacationPeriod) => {
      vacationHours += getVacationHoursInMonth(
        month,
        year,
        new Date(vacation.startDate),
        new Date(vacation.endDate),
        dailyHours,
        holidays
      );
    });
    
    // Fixed allocations (monthly recurring)
    const fixedHours = employee.fixedAllocations.reduce(
      (sum, fa) => sum + fa.hoursPerMonth, 
      0
    );
    
    const availableHours = Math.max(0, totalHours - vacationHours - fixedHours);
    
    return {
      workingDays,
      totalHours,
      vacationHours,
      fixedHours,
      availableHours,
    };
  };

  const getMonthInfo = (month: number, year: number) => {
    const workingDays = getWorkingDaysInMonth(month, year, holidays);
    const totalHours = getMonthlyCapacityHours(month, year, globalDailyHours, holidays);
    
    return {
      workingDays,
      totalHours,
    };
  };

  const addHoliday = (holiday: Omit<Holiday, 'id'>) => {
    const newHoliday = { ...holiday, id: `hol-${Date.now()}` };
    setHolidays([...holidays, newHoliday]);
  };

  const removeHoliday = (id: string) => {
    setHolidays(holidays.filter(h => h.id !== id));
  };

  return {
    holidays,
    globalDailyHours,
    getMonthCapacity,
    getMonthInfo,
    addHoliday,
    removeHoliday,
  };
}
