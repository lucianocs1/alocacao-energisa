using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResourceFlow.Application.DTOs.Loans;
using ResourceFlow.Application.Interfaces;

namespace ResourceFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LoansController : ControllerBase
{
    private readonly IEmployeeLoanService _loanService;

    public LoansController(IEmployeeLoanService loanService)
    {
        _loanService = loanService;
    }

    /// <summary>
    /// Lista funcionários disponíveis para empréstimo (de outros departamentos)
    /// </summary>
    [HttpGet("available/{departmentId}")]
    public async Task<ActionResult<List<AvailableEmployeeDto>>> GetAvailableEmployees(Guid departmentId)
    {
        var employees = await _loanService.GetAvailableEmployeesForLoanAsync(departmentId);
        return Ok(employees);
    }

    /// <summary>
    /// Cria um novo empréstimo de funcionário
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<LoanDto>> CreateLoan([FromBody] CreateLoanRequest request)
    {
        try
        {
            var userId = GetUserId();
            var loan = await _loanService.CreateLoanAsync(request, userId);
            return CreatedAtAction(nameof(GetLoan), new { id = loan.Id }, loan);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Obtém um empréstimo pelo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<LoanDto>> GetLoan(Guid id)
    {
        var loan = await _loanService.GetLoanByIdAsync(id);
        if (loan == null)
            return NotFound();
        return Ok(loan);
    }

    /// <summary>
    /// Lista empréstimos ativos de um departamento
    /// </summary>
    [HttpGet("department/{departmentId}")]
    public async Task<ActionResult<List<LoanDto>>> GetLoansByDepartment(Guid departmentId)
    {
        var loans = await _loanService.GetActiveLoansByDepartmentAsync(departmentId);
        return Ok(loans);
    }

    /// <summary>
    /// Lista funcionários emprestados PARA um departamento (recebidos)
    /// </summary>
    [HttpGet("received/{departmentId}")]
    public async Task<ActionResult<List<LoanDto>>> GetLoansReceived(Guid departmentId)
    {
        var loans = await _loanService.GetLoansReceivedByDepartmentAsync(departmentId);
        return Ok(loans);
    }

    /// <summary>
    /// Lista funcionários emprestados DE um departamento (enviados)
    /// </summary>
    [HttpGet("sent/{departmentId}")]
    public async Task<ActionResult<List<LoanDto>>> GetLoansSent(Guid departmentId)
    {
        var loans = await _loanService.GetLoansSentByDepartmentAsync(departmentId);
        return Ok(loans);
    }

    /// <summary>
    /// Lista empréstimos pendentes de aprovação para um departamento
    /// </summary>
    [HttpGet("pending/{departmentId}")]
    public async Task<ActionResult<List<LoanDto>>> GetPendingLoans(Guid departmentId)
    {
        var loans = await _loanService.GetPendingLoansForDepartmentAsync(departmentId);
        return Ok(loans);
    }

    /// <summary>
    /// Lista todos os empréstimos
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<LoanDto>>> GetAllLoans([FromQuery] bool includeInactive = false)
    {
        var loans = await _loanService.GetAllLoansAsync(includeInactive);
        return Ok(loans);
    }

    /// <summary>
    /// Aprova um empréstimo pendente
    /// </summary>
    [HttpPost("{id}/approve")]
    public async Task<ActionResult<LoanDto>> ApproveLoan(Guid id, [FromBody] ApproveLoanRequest? request = null)
    {
        try
        {
            var userId = GetUserId();
            var loan = await _loanService.ApproveLoanAsync(id, userId, request);
            return Ok(loan);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Rejeita um empréstimo pendente
    /// </summary>
    [HttpPost("{id}/reject")]
    public async Task<ActionResult<LoanDto>> RejectLoan(Guid id, [FromBody] ApproveLoanRequest? request = null)
    {
        try
        {
            var userId = GetUserId();
            var loan = await _loanService.RejectLoanAsync(id, userId, request);
            return Ok(loan);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Devolve um funcionário emprestado
    /// </summary>
    [HttpPost("{id}/return")]
    public async Task<ActionResult<LoanDto>> ReturnLoan(Guid id, [FromBody] ReturnLoanRequest? request = null)
    {
        try
        {
            var loan = await _loanService.ReturnLoanAsync(id, request);
            return Ok(loan);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Cancela um empréstimo
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> CancelLoan(Guid id)
    {
        var success = await _loanService.CancelLoanAsync(id);
        if (!success)
            return NotFound();
        return NoContent();
    }

    /// <summary>
    /// Verifica se um funcionário está atualmente emprestado
    /// </summary>
    [HttpGet("employee/{employeeId}/active")]
    public async Task<ActionResult<LoanDto?>> GetActiveLoanForEmployee(Guid employeeId)
    {
        var loan = await _loanService.GetActiveLoanForEmployeeAsync(employeeId);
        return Ok(loan);
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }
}
