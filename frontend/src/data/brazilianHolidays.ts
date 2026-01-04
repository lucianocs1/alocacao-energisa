/**
 * Feriados Nacionais Brasileiros
 * Estes feriados são calculados automaticamente e não precisam ser adicionados manualmente.
 * 
 * Feriados fixos: mesma data todo ano
 * Feriados móveis: calculados com base na Páscoa
 */

export interface BrazilianHoliday {
  name: string;
  day: number;
  month: number; // 0-11 (JavaScript format)
  type: 'fixed' | 'easter-based';
  easterOffset?: number; // dias de diferença da Páscoa (negativo = antes, positivo = depois)
}

// Feriados nacionais fixos
const FIXED_HOLIDAYS: BrazilianHoliday[] = [
  { name: 'Confraternização Universal', day: 1, month: 0, type: 'fixed' },
  { name: 'Tiradentes', day: 21, month: 3, type: 'fixed' },
  { name: 'Dia do Trabalho', day: 1, month: 4, type: 'fixed' },
  { name: 'Independência do Brasil', day: 7, month: 8, type: 'fixed' },
  { name: 'Nossa Senhora Aparecida', day: 12, month: 9, type: 'fixed' },
  { name: 'Finados', day: 2, month: 10, type: 'fixed' },
  { name: 'Proclamação da República', day: 15, month: 10, type: 'fixed' },
  { name: 'Natal', day: 25, month: 11, type: 'fixed' },
];

// Feriados nacionais móveis (baseados na Páscoa)
const EASTER_BASED_HOLIDAYS: BrazilianHoliday[] = [
  { name: 'Carnaval', day: 0, month: 0, type: 'easter-based', easterOffset: -47 },
  { name: 'Sexta-feira Santa', day: 0, month: 0, type: 'easter-based', easterOffset: -2 },
  { name: 'Corpus Christi', day: 0, month: 0, type: 'easter-based', easterOffset: 60 },
];

/**
 * Calcula a data da Páscoa para um determinado ano usando o algoritmo de Meeus/Jones/Butcher
 */
export function calculateEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month, day);
}

/**
 * Retorna todos os feriados nacionais brasileiros para um determinado ano
 */
export function getBrazilianNationalHolidays(year: number): { name: string; date: Date; isNational: true }[] {
  const holidays: { name: string; date: Date; isNational: true }[] = [];
  
  // Adiciona feriados fixos
  for (const holiday of FIXED_HOLIDAYS) {
    holidays.push({
      name: holiday.name,
      date: new Date(year, holiday.month, holiday.day),
      isNational: true,
    });
  }
  
  // Calcula a Páscoa e adiciona feriados móveis
  const easter = calculateEasterDate(year);
  
  for (const holiday of EASTER_BASED_HOLIDAYS) {
    const date = new Date(easter);
    date.setDate(easter.getDate() + (holiday.easterOffset || 0));
    
    holidays.push({
      name: holiday.name,
      date,
      isNational: true,
    });
  }
  
  // Ordena por data
  holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return holidays;
}

/**
 * Verifica se uma data é um feriado nacional brasileiro
 */
export function isNationalHoliday(date: Date, year?: number): { isHoliday: boolean; name?: string } {
  const y = year || date.getFullYear();
  const holidays = getBrazilianNationalHolidays(y);
  
  const found = holidays.find(h => 
    h.date.getDate() === date.getDate() &&
    h.date.getMonth() === date.getMonth() &&
    h.date.getFullYear() === date.getFullYear()
  );
  
  return {
    isHoliday: !!found,
    name: found?.name,
  };
}

/**
 * Conta quantas horas são perdidas com feriados nacionais em um mês específico
 * Considera apenas dias úteis (seg-sex)
 */
export function getNationalHolidayHoursInMonth(
  month: number, // 0-11
  year: number,
  dailyHours: number = 8
): { totalHours: number; holidays: { name: string; date: Date }[] } {
  const holidays = getBrazilianNationalHolidays(year)
    .filter(h => h.date.getMonth() === month)
    .filter(h => {
      const day = h.date.getDay();
      return day !== 0 && day !== 6; // Exclui sábados e domingos
    });
  
  return {
    totalHours: holidays.length * dailyHours,
    holidays,
  };
}

/**
 * Retorna o total de horas perdidas com feriados nacionais no ano inteiro
 * Considera apenas dias úteis (seg-sex)
 */
export function getNationalHolidayHoursInYear(
  year: number,
  dailyHours: number = 8
): { totalHours: number; totalDays: number; holidays: { name: string; date: Date }[] } {
  const holidays = getBrazilianNationalHolidays(year)
    .filter(h => {
      const day = h.date.getDay();
      return day !== 0 && day !== 6; // Exclui sábados e domingos
    });
  
  return {
    totalHours: holidays.length * dailyHours,
    totalDays: holidays.length,
    holidays,
  };
}
