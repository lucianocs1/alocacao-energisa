using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResourceFlow.Application.DTOs.Allocations;
using ResourceFlow.Application.Interfaces;
using System.Security.Claims;

namespace ResourceFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AllocationsController : ControllerBase
{
    private readonly IAllocationService _allocationService;

    public AllocationsController(IAllocationService allocationService)
    {
        _allocationService = allocationService;
    }

    /// <summary>
    /// Obtém todos os dados necessários para a página de alocação
    /// </summary>
    [HttpGet("page-data")]
    public async Task<ActionResult<AllocationPageDataResponse>> GetPageData([FromQuery] Guid? teamId = null, [FromQuery] int? year = null)
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var userDepartmentId = User.FindFirst("DepartmentId")?.Value;

        // Se for coordenador, usar sua equipe
        if (userRole == "Coordinator" && !string.IsNullOrEmpty(userDepartmentId))
        {
            var departmentId = Guid.Parse(userDepartmentId);
            return Ok(await _allocationService.GetAllocationPageDataAsync(departmentId, year));
        }

        return Ok(await _allocationService.GetAllocationPageDataAsync(teamId, year));
    }

    /// <summary>
    /// Obtém todas as alocações com filtros opcionais
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<AllocationListResponse>> GetAllocations(
        [FromQuery] Guid? teamId = null, 
        [FromQuery] Guid? employeeId = null, 
        [FromQuery] int? year = null)
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var userDepartmentId = User.FindFirst("DepartmentId")?.Value;

        // Se for coordenador, filtrar por sua equipe
        if (userRole == "Coordinator" && !string.IsNullOrEmpty(userDepartmentId))
        {
            var departmentId = Guid.Parse(userDepartmentId);
            return Ok(await _allocationService.GetAllocationsAsync(departmentId, employeeId, year));
        }

        return Ok(await _allocationService.GetAllocationsAsync(teamId, employeeId, year));
    }

    /// <summary>
    /// Obtém uma alocação por ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AllocationDto>> GetAllocation(Guid id)
    {
        var allocation = await _allocationService.GetAllocationByIdAsync(id);
        if (allocation == null)
            return NotFound(new { message = "Alocação não encontrada" });

        return Ok(allocation);
    }

    /// <summary>
    /// Cria uma nova alocação
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<AllocationDto>> CreateAllocation([FromBody] CreateAllocationRequest request)
    {
        try
        {
            var allocation = await _allocationService.CreateAllocationAsync(request);
            return CreatedAtAction(nameof(GetAllocation), new { id = allocation.Id }, allocation);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Cria múltiplas alocações de uma vez
    /// </summary>
    [HttpPost("bulk")]
    public async Task<ActionResult<List<AllocationDto>>> CreateBulkAllocations([FromBody] BulkCreateAllocationRequest request)
    {
        try
        {
            var allocations = await _allocationService.CreateBulkAllocationsAsync(request);
            return Ok(allocations);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Atualiza uma alocação
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AllocationDto>> UpdateAllocation(Guid id, [FromBody] UpdateAllocationRequest request)
    {
        var allocation = await _allocationService.UpdateAllocationAsync(id, request);
        if (allocation == null)
            return NotFound(new { message = "Alocação não encontrada" });

        return Ok(allocation);
    }

    /// <summary>
    /// Remove uma alocação
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteAllocation(Guid id)
    {
        var deleted = await _allocationService.DeleteAllocationAsync(id);
        if (!deleted)
            return NotFound(new { message = "Alocação não encontrada" });

        return NoContent();
    }

    /// <summary>
    /// Remove alocações por filtro (funcionário/demanda/mês/ano)
    /// </summary>
    [HttpDelete("by-filter")]
    public async Task<ActionResult> DeleteAllocationsByFilter(
        [FromQuery] Guid employeeId, 
        [FromQuery] Guid demandId, 
        [FromQuery] int month, 
        [FromQuery] int year)
    {
        var deleted = await _allocationService.DeleteAllocationsByFilterAsync(employeeId, demandId, month, year);
        if (!deleted)
            return NotFound(new { message = "Nenhuma alocação encontrada com os filtros especificados" });

        return NoContent();
    }
}
