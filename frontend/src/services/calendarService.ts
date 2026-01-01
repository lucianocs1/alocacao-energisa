import api from './api';

export interface CalendarEvent {
  id: string;
  name: string;
  date: string;
  type: 'Holiday' | 'BridgeDay' | 'Recess' | 'OptionalDay';
  typeLabel: string;
  description?: string;
  isCompanyWide: boolean;
  departmentId?: string;
  departmentName?: string;
  hoursLost: number;
  year: number;
}

export interface CalendarEventListResponse {
  events: CalendarEvent[];
  totalCount: number;
}

export interface YearCalendarSummary {
  year: number;
  totalHolidays: number;
  totalBridgeDays: number;
  totalRecessDays: number;
  totalOptionalDays: number;
  totalHoursLost: number;
  events: CalendarEvent[];
}

export interface CreateCalendarEventRequest {
  name: string;
  date: string;
  type: 'Holiday' | 'BridgeDay' | 'Recess' | 'OptionalDay';
  description?: string;
  isCompanyWide: boolean;
  departmentId?: string;
  hoursLost: number;
}

export interface UpdateCalendarEventRequest extends CreateCalendarEventRequest {}

const calendarService = {
  async getEvents(year?: number, departmentId?: string): Promise<CalendarEventListResponse> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (departmentId) params.append('departmentId', departmentId);
    
    const response = await api.get(`/api/calendar?${params.toString()}`);
    return response.data;
  },

  async getYearSummary(year: number, departmentId?: string): Promise<YearCalendarSummary> {
    const params = departmentId ? `?departmentId=${departmentId}` : '';
    const response = await api.get(`/api/calendar/year/${year}${params}`);
    return response.data;
  },

  async getEventsByRange(startDate: Date, endDate: Date, departmentId?: string): Promise<CalendarEvent[]> {
    const params = new URLSearchParams();
    params.append('startDate', startDate.toISOString());
    params.append('endDate', endDate.toISOString());
    if (departmentId) params.append('departmentId', departmentId);
    
    const response = await api.get(`/api/calendar/range?${params.toString()}`);
    return response.data;
  },

  async getEvent(id: string): Promise<CalendarEvent> {
    const response = await api.get(`/api/calendar/${id}`);
    return response.data;
  },

  async createEvent(request: CreateCalendarEventRequest): Promise<CalendarEvent> {
    const response = await api.post('/api/calendar', request);
    return response.data;
  },

  async updateEvent(id: string, request: UpdateCalendarEventRequest): Promise<CalendarEvent> {
    const response = await api.put(`/api/calendar/${id}`, request);
    return response.data;
  },

  async deleteEvent(id: string): Promise<void> {
    await api.delete(`/api/calendar/${id}`);
  },

  async seedHolidays(year: number): Promise<void> {
    await api.post(`/api/calendar/seed/${year}`);
  }
};

export default calendarService;
