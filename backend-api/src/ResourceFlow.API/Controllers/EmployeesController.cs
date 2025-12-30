using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResourceFlow.Application.DTOs.Employees;
using ResourceFlow.Application.Interfaces;

namespace ResourceFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;

    public EmployeesController(IEmployeeService employeeService)
    {
        _employeeService = employeeService;
    }

    /// <summary>
    /// Lista todos os funcionários, opcionalmente filtrados por departamento
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<EmployeeListResponse>> GetEmployees([FromQuery] Guid? departmentId)
    {
        var result = await _employeeService.GetEmployeesAsync(departmentId);
        return Ok(result);
    }

    /// <summary>
    /// Obtém um funcionário pelo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<EmployeeDto>> GetEmployee(Guid id)
    {
        var employee = await _employeeService.GetEmployeeByIdAsync(id);
        if (employee == null)
            return NotFound(new { message = "Funcionário não encontrado" });

        return Ok(employee);
    }

    /// <summary>
    /// Cria um novo funcionário
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<EmployeeDto>> CreateEmployee([FromBody] CreateEmployeeRequest request)
    {
        var employee = await _employeeService.CreateEmployeeAsync(request);
        return CreatedAtAction(nameof(GetEmployee), new { id = employee.Id }, employee);
    }

    /// <summary>
    /// Atualiza um funcionário existente
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<EmployeeDto>> UpdateEmployee(Guid id, [FromBody] UpdateEmployeeRequest request)
    {
        var employee = await _employeeService.UpdateEmployeeAsync(id, request);
        if (employee == null)
            return NotFound(new { message = "Funcionário não encontrado" });

        return Ok(employee);
    }

    /// <summary>
    /// Remove um funcionário (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteEmployee(Guid id)
    {
        var result = await _employeeService.DeleteEmployeeAsync(id);
        if (!result)
            return NotFound(new { message = "Funcionário não encontrado" });

        return NoContent();
    }

    /// <summary>
    /// Adiciona período de férias a um funcionário
    /// </summary>
    [HttpPost("{id}/vacations")]
    public async Task<ActionResult<VacationDto>> AddVacation(Guid id, [FromBody] CreateVacationRequest request)
    {
        var vacation = await _employeeService.AddVacationAsync(id, request);
        return Ok(vacation);
    }

    /// <summary>
    /// Remove período de férias de um funcionário
    /// </summary>
    [HttpDelete("{id}/vacations/{vacationId}")]
    public async Task<ActionResult> RemoveVacation(Guid id, Guid vacationId)
    {
        var result = await _employeeService.RemoveVacationAsync(id, vacationId);
        if (!result)
            return NotFound(new { message = "Férias não encontradas" });

        return NoContent();
    }

    /// <summary>
    /// Adiciona alocação fixa a um funcionário
    /// </summary>
    [HttpPost("{id}/fixed-allocations")]
    public async Task<ActionResult<FixedAllocationDto>> AddFixedAllocation(Guid id, [FromBody] CreateFixedAllocationRequest request)
    {
        var allocation = await _employeeService.AddFixedAllocationAsync(id, request);
        return Ok(allocation);
    }

    /// <summary>
    /// Remove alocação fixa de um funcionário
    /// </summary>
    [HttpDelete("{id}/fixed-allocations/{allocationId}")]
    public async Task<ActionResult> RemoveFixedAllocation(Guid id, Guid allocationId)
    {
        var result = await _employeeService.RemoveFixedAllocationAsync(id, allocationId);
        if (!result)
            return NotFound(new { message = "Alocação fixa não encontrada" });

        return NoContent();
    }

    /// <summary>
    /// Lista todos os cargos disponíveis
    /// </summary>
    [HttpGet("roles")]
    public async Task<ActionResult<RolesListResponse>> GetRoles()
    {
        var roles = await _employeeService.GetRolesAsync();
        return Ok(roles);
    }
}
