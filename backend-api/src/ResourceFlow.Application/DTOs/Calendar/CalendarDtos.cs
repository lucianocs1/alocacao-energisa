namespace ResourceFlow.Application.DTOs.Calendar;

public class CreateCalendarEventRequest
{
    public string Name { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Type { get; set; } = "Holiday"; // Holiday, BridgeDay, Recess, OptionalDay
    public string? Description { get; set; }
    public bool IsCompanyWide { get; set; } = true;
    public Guid? DepartmentId { get; set; }
    public int HoursLost { get; set; } = 8;
}

public class UpdateCalendarEventRequest
{
    public string Name { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Type { get; set; } = "Holiday";
    public string? Description { get; set; }
    public bool IsCompanyWide { get; set; } = true;
    public Guid? DepartmentId { get; set; }
    public int HoursLost { get; set; } = 8;
}

public class CalendarEventDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Type { get; set; } = string.Empty;
    public string TypeLabel { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsCompanyWide { get; set; }
    public Guid? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public int HoursLost { get; set; }
    public int Year { get; set; }
}

public class CalendarEventListResponse
{
    public List<CalendarEventDto> Events { get; set; } = new();
    public int TotalCount { get; set; }
}

public class YearCalendarSummary
{
    public int Year { get; set; }
    public int TotalHolidays { get; set; }
    public int TotalBridgeDays { get; set; }
    public int TotalRecessDays { get; set; }
    public int TotalOptionalDays { get; set; }
    public int TotalHoursLost { get; set; }
    public List<CalendarEventDto> Events { get; set; } = new();
}
