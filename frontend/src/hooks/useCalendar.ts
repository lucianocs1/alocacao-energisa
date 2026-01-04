import { useMemo, useState, useEffect, useCallback } from 'react';
import { Employee, Holiday, VacationPeriod } from '@/types/planner';
import { 
  getMonthlyCapacityHours, 
  getVacationHoursInMonth,
  getWorkingDaysInMonth 
} from '@/lib/calendarEngine';
import { calendarConfig } from '@/data/mockData';
import calendarService, { CalendarEvent } from '@/services/calendarService';

export interface MonthCapacityInfo {
  workingDays: number;
  totalHours: number;
  vacationHours: number;
  fixedHours: number;
  availableHours: number;
}

/**
 * Converte eventos do calendário do backend para o formato Holiday
 */
const convertEventsToHolidays = (events: CalendarEvent[]): Holiday[] => {
  return events.map(event => ({
    id: event.id,
    name: event.name,
    date: new Date(event.date),
    type: event.type === 'Holiday' ? 'local' as const : 'local' as const, // Todos são eventos locais/customizados
  }));
};

export function useCalendar(year?: number) {
  const [customHolidays, setCustomHolidays] = useState<Holiday[]>([]);
  const [globalDailyHours] = useState(calendarConfig.dailyHours);
  const [loading, setLoading] = useState(false);

  // Busca eventos do calendário do backend
  const loadCalendarEvents = useCallback(async (targetYear: number) => {
    try {
      setLoading(true);
      const response = await calendarService.getEvents(targetYear);
      const holidays = convertEventsToHolidays(response.events);
      setCustomHolidays(holidays);
    } catch (error) {
      console.error('Erro ao carregar eventos do calendário:', error);
      // Em caso de erro, usa lista vazia (feriados nacionais ainda funcionam via calendarEngine)
      setCustomHolidays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega eventos quando o ano muda
  useEffect(() => {
    if (year) {
      loadCalendarEvents(year);
    }
  }, [year, loadCalendarEvents]);

  const getMonthCapacity = (
    month: number,
    targetYear: number,
    employee: Employee
  ): MonthCapacityInfo => {
    const dailyHours = employee.dailyHours || globalDailyHours;
    // Passa os feriados customizados - os nacionais são adicionados automaticamente pelo calendarEngine
    const workingDays = getWorkingDaysInMonth(month, targetYear, customHolidays);
    const totalHours = workingDays * dailyHours;
    
    // Calculate vacation hours for this month
    let vacationHours = 0;
    employee.vacations.forEach((vacation: VacationPeriod) => {
      vacationHours += getVacationHoursInMonth(
        month,
        targetYear,
        new Date(vacation.startDate),
        new Date(vacation.endDate),
        dailyHours,
        customHolidays
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

  const getMonthInfo = (month: number, targetYear: number) => {
    const workingDays = getWorkingDaysInMonth(month, targetYear, customHolidays);
    const totalHours = getMonthlyCapacityHours(month, targetYear, globalDailyHours, customHolidays);
    
    return {
      workingDays,
      totalHours,
    };
  };

  const addHoliday = (holiday: Omit<Holiday, 'id'>) => {
    const newHoliday = { ...holiday, id: `hol-${Date.now()}` };
    setCustomHolidays([...customHolidays, newHoliday]);
  };

  const removeHoliday = (id: string) => {
    setCustomHolidays(customHolidays.filter(h => h.id !== id));
  };

  return {
    holidays: customHolidays,
    globalDailyHours,
    loading,
    getMonthCapacity,
    getMonthInfo,
    addHoliday,
    removeHoliday,
    refreshCalendar: loadCalendarEvents,
  };
}
