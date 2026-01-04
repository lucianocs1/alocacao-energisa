using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResourceFlow.Application.DTOs.Calendar;
using ResourceFlow.Application.Interfaces;
using System.Security.Claims;

namespace ResourceFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CalendarController : ControllerBase
{
    private readonly ICalendarService _calendarService;

    public CalendarController(ICalendarService calendarService)
    {
        _calendarService = calendarService;
    }

    /// <summary>
    /// Obtém todos os eventos do calendário
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<CalendarEventListResponse>> GetEvents([FromQuery] int? year, [FromQuery] Guid? departmentId)
    {
        var response = await _calendarService.GetEventsAsync(year, departmentId);
        return Ok(response);
    }

    /// <summary>
    /// Obtém resumo do calendário para um ano específico
    /// </summary>
    [HttpGet("year/{year}")]
    public async Task<ActionResult<YearCalendarSummary>> GetYearSummary(int year, [FromQuery] Guid? departmentId)
    {
        var response = await _calendarService.GetYearSummaryAsync(year, departmentId);
        return Ok(response);
    }

    /// <summary>
    /// Obtém eventos em um intervalo de datas
    /// </summary>
    [HttpGet("range")]
    public async Task<ActionResult<List<CalendarEventDto>>> GetEventsByRange(
        [FromQuery] DateTime startDate, 
        [FromQuery] DateTime endDate,
        [FromQuery] Guid? departmentId)
    {
        var events = await _calendarService.GetEventsByDateRangeAsync(startDate, endDate, departmentId);
        return Ok(events);
    }

    /// <summary>
    /// Obtém um evento pelo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<CalendarEventDto>> GetEvent(Guid id)
    {
        var evt = await _calendarService.GetEventByIdAsync(id);
        if (evt == null)
            return NotFound();
        return Ok(evt);
    }

    /// <summary>
    /// Cria um novo evento no calendário (apenas Gerentes)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CalendarEventDto>> CreateEvent(CreateCalendarEventRequest request)
    {
        // Verificar se é gerente
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "1" && userRole != "Manager" && userRole != "Gerente")
        {
            return Forbid();
        }

        var evt = await _calendarService.CreateEventAsync(request);
        return CreatedAtAction(nameof(GetEvent), new { id = evt.Id }, evt);
    }

    /// <summary>
    /// Atualiza um evento existente (apenas Gerentes)
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<CalendarEventDto>> UpdateEvent(Guid id, UpdateCalendarEventRequest request)
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "1" && userRole != "Manager" && userRole != "Gerente")
        {
            return Forbid();
        }

        var evt = await _calendarService.UpdateEventAsync(id, request);
        if (evt == null)
            return NotFound();
        return Ok(evt);
    }

    /// <summary>
    /// Remove um evento (apenas Gerentes)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteEvent(Guid id)
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "1" && userRole != "Manager" && userRole != "Gerente")
        {
            return Forbid();
        }

        var deleted = await _calendarService.DeleteEventAsync(id);
        if (!deleted)
            return NotFound();
        return NoContent();
    }

    /// <summary>
    /// Popula feriados padrão para um ano (apenas Gerentes)
    /// </summary>
    [HttpPost("seed/{year}")]
    public async Task<ActionResult> SeedHolidays(int year)
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "1" && userRole != "Manager" && userRole != "Gerente")
        {
            return Forbid();
        }

        await _calendarService.SeedDefaultHolidaysAsync(year);
        return Ok(new { message = $"Feriados para {year} foram criados com sucesso." });
    }
}
