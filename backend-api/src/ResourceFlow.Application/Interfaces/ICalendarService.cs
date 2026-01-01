using ResourceFlow.Application.DTOs.Calendar;

namespace ResourceFlow.Application.Interfaces;

public interface ICalendarService
{
    Task<CalendarEventListResponse> GetEventsAsync(int? year = null, Guid? departmentId = null);
    Task<YearCalendarSummary> GetYearSummaryAsync(int year, Guid? departmentId = null);
    Task<CalendarEventDto?> GetEventByIdAsync(Guid id);
    Task<CalendarEventDto> CreateEventAsync(CreateCalendarEventRequest request);
    Task<CalendarEventDto?> UpdateEventAsync(Guid id, UpdateCalendarEventRequest request);
    Task<bool> DeleteEventAsync(Guid id);
    Task<List<CalendarEventDto>> GetEventsByDateRangeAsync(DateTime startDate, DateTime endDate, Guid? departmentId = null);
    Task SeedDefaultHolidaysAsync(int year);
}
