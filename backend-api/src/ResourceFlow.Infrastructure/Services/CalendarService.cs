using Microsoft.EntityFrameworkCore;
using ResourceFlow.Application.DTOs.Calendar;
using ResourceFlow.Application.Interfaces;
using ResourceFlow.Domain.Entities;
using ResourceFlow.Infrastructure.Data;

namespace ResourceFlow.Infrastructure.Services;

public class CalendarService : ICalendarService
{
    private readonly ApplicationDbContext _context;

    public CalendarService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CalendarEventListResponse> GetEventsAsync(int? year = null, Guid? departmentId = null)
    {
        var query = _context.CalendarEvents
            .Include(e => e.Department)
            .AsQueryable();

        if (year.HasValue)
        {
            query = query.Where(e => e.Year == year.Value);
        }

        if (departmentId.HasValue)
        {
            query = query.Where(e => e.IsCompanyWide || e.DepartmentId == departmentId.Value);
        }

        var events = await query
            .OrderBy(e => e.Date)
            .ToListAsync();

        return new CalendarEventListResponse
        {
            Events = events.Select(MapToDto).ToList(),
            TotalCount = events.Count
        };
    }

    public async Task<YearCalendarSummary> GetYearSummaryAsync(int year, Guid? departmentId = null)
    {
        var query = _context.CalendarEvents
            .Include(e => e.Department)
            .Where(e => e.Year == year);

        if (departmentId.HasValue)
        {
            query = query.Where(e => e.IsCompanyWide || e.DepartmentId == departmentId.Value);
        }

        var events = await query.OrderBy(e => e.Date).ToListAsync();

        return new YearCalendarSummary
        {
            Year = year,
            TotalHolidays = events.Count(e => e.Type == CalendarEventType.Holiday),
            TotalBridgeDays = events.Count(e => e.Type == CalendarEventType.BridgeDay),
            TotalRecessDays = events.Count(e => e.Type == CalendarEventType.Recess),
            TotalOptionalDays = events.Count(e => e.Type == CalendarEventType.OptionalDay),
            TotalHoursLost = events.Sum(e => e.HoursLost),
            Events = events.Select(MapToDto).ToList()
        };
    }

    public async Task<CalendarEventDto?> GetEventByIdAsync(Guid id)
    {
        var evt = await _context.CalendarEvents
            .Include(e => e.Department)
            .FirstOrDefaultAsync(e => e.Id == id);

        return evt != null ? MapToDto(evt) : null;
    }

    public async Task<CalendarEventDto> CreateEventAsync(CreateCalendarEventRequest request)
    {
        var evt = new CalendarEvent
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Date = DateTime.SpecifyKind(request.Date.Date, DateTimeKind.Utc),
            Type = ParseEventType(request.Type),
            Description = request.Description,
            IsCompanyWide = request.IsCompanyWide,
            DepartmentId = request.IsCompanyWide ? null : request.DepartmentId,
            HoursLost = request.HoursLost,
            Year = request.Date.Year,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.CalendarEvents.Add(evt);
        await _context.SaveChangesAsync();

        // Reload with department
        await _context.Entry(evt).Reference(e => e.Department).LoadAsync();

        return MapToDto(evt);
    }

    public async Task<CalendarEventDto?> UpdateEventAsync(Guid id, UpdateCalendarEventRequest request)
    {
        var evt = await _context.CalendarEvents.FindAsync(id);
        if (evt == null) return null;

        evt.Name = request.Name;
        evt.Date = DateTime.SpecifyKind(request.Date.Date, DateTimeKind.Utc);
        evt.Type = ParseEventType(request.Type);
        evt.Description = request.Description;
        evt.IsCompanyWide = request.IsCompanyWide;
        evt.DepartmentId = request.IsCompanyWide ? null : request.DepartmentId;
        evt.HoursLost = request.HoursLost;
        evt.Year = request.Date.Year;
        evt.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _context.Entry(evt).Reference(e => e.Department).LoadAsync();

        return MapToDto(evt);
    }

    public async Task<bool> DeleteEventAsync(Guid id)
    {
        var evt = await _context.CalendarEvents.FindAsync(id);
        if (evt == null) return false;

        _context.CalendarEvents.Remove(evt);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<CalendarEventDto>> GetEventsByDateRangeAsync(DateTime startDate, DateTime endDate, Guid? departmentId = null)
    {
        var query = _context.CalendarEvents
            .Include(e => e.Department)
            .Where(e => e.Date >= startDate && e.Date <= endDate);

        if (departmentId.HasValue)
        {
            query = query.Where(e => e.IsCompanyWide || e.DepartmentId == departmentId.Value);
        }

        var events = await query.OrderBy(e => e.Date).ToListAsync();
        return events.Select(MapToDto).ToList();
    }

    public async Task SeedDefaultHolidaysAsync(int year)
    {
        // Verificar se já existem feriados para este ano
        var existingCount = await _context.CalendarEvents.CountAsync(e => e.Year == year);
        if (existingCount > 0) return;

        var holidays = new List<CalendarEvent>
        {
            // Feriados nacionais fixos
            new() { Name = "Confraternização Universal", Date = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc), Type = CalendarEventType.Holiday },
            new() { Name = "Tiradentes", Date = new DateTime(year, 4, 21, 0, 0, 0, DateTimeKind.Utc), Type = CalendarEventType.Holiday },
            new() { Name = "Dia do Trabalho", Date = new DateTime(year, 5, 1, 0, 0, 0, DateTimeKind.Utc), Type = CalendarEventType.Holiday },
            new() { Name = "Independência do Brasil", Date = new DateTime(year, 9, 7, 0, 0, 0, DateTimeKind.Utc), Type = CalendarEventType.Holiday },
            new() { Name = "Nossa Senhora Aparecida", Date = new DateTime(year, 10, 12, 0, 0, 0, DateTimeKind.Utc), Type = CalendarEventType.Holiday },
            new() { Name = "Finados", Date = new DateTime(year, 11, 2, 0, 0, 0, DateTimeKind.Utc), Type = CalendarEventType.Holiday },
            new() { Name = "Proclamação da República", Date = new DateTime(year, 11, 15, 0, 0, 0, DateTimeKind.Utc), Type = CalendarEventType.Holiday },
            new() { Name = "Natal", Date = new DateTime(year, 12, 25, 0, 0, 0, DateTimeKind.Utc), Type = CalendarEventType.Holiday },
        };

        // Adicionar feriados móveis (aproximados - idealmente calcular com base na Páscoa)
        // Carnaval, Sexta-feira Santa, Corpus Christi variam a cada ano
        // Para 2025:
        if (year == 2025)
        {
            holidays.AddRange(new[]
            {
                new CalendarEvent { Name = "Carnaval", Date = new DateTime(2025, 3, 3, 0, 0, 0, DateTimeKind.Utc), Type = CalendarEventType.Holiday },
                new CalendarEvent { Name = "Carnaval", Date = new DateTime(2025, 3, 4, 0, 0, 0, DateTimeKind.Utc), Type = CalendarEventType.Holiday },
                new CalendarEvent { Name = "Quarta-feira de Cinzas (até 14h)", Date = new DateTime(2025, 3, 5, 0, 0, 0, DateTimeKind.Utc), Type = CalendarEventType.OptionalDay, HoursLost = 4 },
                new CalendarEvent { Name = "Sexta-feira Santa", Date = new DateTime(2025, 4, 18, 0, 0, 0, DateTimeKind.Utc), Type = CalendarEventType.Holiday },
                new CalendarEvent { Name = "Corpus Christi", Date = new DateTime(2025, 6, 19, 0, 0, 0, DateTimeKind.Utc), Type = CalendarEventType.Holiday },
            });
        }
        else if (year == 2026)
        {
            holidays.AddRange(new[]
            {
                new CalendarEvent { Name = "Carnaval", Date = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc), Type = CalendarEventType.Holiday },
                new CalendarEvent { Name = "Carnaval", Date = new DateTime(2026, 2, 17, 0, 0, 0, DateTimeKind.Utc), Type = CalendarEventType.Holiday },
                new CalendarEvent { Name = "Quarta-feira de Cinzas (até 14h)", Date = new DateTime(2026, 2, 18, 0, 0, 0, DateTimeKind.Utc), Type = CalendarEventType.OptionalDay, HoursLost = 4 },
                new CalendarEvent { Name = "Sexta-feira Santa", Date = new DateTime(2026, 4, 3, 0, 0, 0, DateTimeKind.Utc), Type = CalendarEventType.Holiday },
                new CalendarEvent { Name = "Corpus Christi", Date = new DateTime(2026, 6, 4, 0, 0, 0, DateTimeKind.Utc), Type = CalendarEventType.Holiday },
            });
        }

        foreach (var holiday in holidays)
        {
            holiday.Id = Guid.NewGuid();
            holiday.Year = year;
            holiday.IsCompanyWide = true;
            holiday.HoursLost = holiday.HoursLost == 0 ? 8 : holiday.HoursLost;
            holiday.CreatedAt = DateTime.UtcNow;
            holiday.UpdatedAt = DateTime.UtcNow;
        }

        _context.CalendarEvents.AddRange(holidays);
        await _context.SaveChangesAsync();
    }

    private static CalendarEventDto MapToDto(CalendarEvent evt)
    {
        return new CalendarEventDto
        {
            Id = evt.Id,
            Name = evt.Name,
            Date = evt.Date,
            Type = evt.Type.ToString(),
            TypeLabel = GetTypeLabel(evt.Type),
            Description = evt.Description,
            IsCompanyWide = evt.IsCompanyWide,
            DepartmentId = evt.DepartmentId,
            DepartmentName = evt.Department?.Name,
            HoursLost = evt.HoursLost,
            Year = evt.Year
        };
    }

    private static CalendarEventType ParseEventType(string type)
    {
        return type.ToLower() switch
        {
            "holiday" => CalendarEventType.Holiday,
            "bridgeday" => CalendarEventType.BridgeDay,
            "recess" => CalendarEventType.Recess,
            "optionalday" => CalendarEventType.OptionalDay,
            _ => CalendarEventType.Holiday
        };
    }

    private static string GetTypeLabel(CalendarEventType type)
    {
        return type switch
        {
            CalendarEventType.Holiday => "Feriado",
            CalendarEventType.BridgeDay => "Dia Ponte",
            CalendarEventType.Recess => "Recesso",
            CalendarEventType.OptionalDay => "Ponto Facultativo",
            _ => "Outro"
        };
    }
}
