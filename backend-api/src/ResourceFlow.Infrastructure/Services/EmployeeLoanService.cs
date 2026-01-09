using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ResourceFlow.Application.DTOs.Loans;
using ResourceFlow.Application.Interfaces;
using ResourceFlow.Domain.Entities;
using ResourceFlow.Infrastructure.Data;

namespace ResourceFlow.Infrastructure.Services;

public class EmployeeLoanService : IEmployeeLoanService
{
    private readonly ApplicationDbContext _context;

    public EmployeeLoanService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<LoanDto> CreateLoanAsync(CreateLoanRequest request, Guid requestedByUserId)
    {
        // Verificar se o funcionário existe
        var employee = await _context.Employees
            .Include(e => e.Department)
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId);
            
        if (employee == null)
            throw new InvalidOperationException("Funcionário não encontrado");
            
        // Verificar se o departamento de destino existe
        var targetDepartment = await _context.Departments.FindAsync(request.TargetDepartmentId);
        if (targetDepartment == null)
            throw new InvalidOperationException("Departamento de destino não encontrado");
            
        // Verificar se o funcionário já está emprestado ou tem solicitação pendente
        var existingLoan = await _context.Set<EmployeeLoan>()
            .FirstOrDefaultAsync(l => l.EmployeeId == request.EmployeeId && 
                (l.Status == LoanStatus.Active || l.Status == LoanStatus.Pending));
            
        if (existingLoan != null)
        {
            if (existingLoan.Status == LoanStatus.Active)
                throw new InvalidOperationException("Este funcionário já está emprestado para outro departamento");
            else
                throw new InvalidOperationException("Já existe uma solicitação de empréstimo pendente para este funcionário");
        }
            
        // Verificar se não está tentando emprestar para o próprio departamento
        if (employee.DepartmentId == request.TargetDepartmentId)
            throw new InvalidOperationException("Não é possível emprestar um funcionário para seu próprio departamento");

        var loan = new EmployeeLoan
        {
            Id = Guid.NewGuid(),
            EmployeeId = request.EmployeeId,
            SourceDepartmentId = employee.DepartmentId,
            TargetDepartmentId = request.TargetDepartmentId,
            StartDate = request.StartDate,
            ExpectedEndDate = request.ExpectedEndDate,
            Reason = request.Reason,
            Notes = request.Notes,
            RequestedByUserId = requestedByUserId,
            Status = LoanStatus.Pending, // Começa como pendente, aguardando aprovação
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Set<EmployeeLoan>().Add(loan);
        await _context.SaveChangesAsync();

        return await GetLoanByIdAsync(loan.Id) ?? throw new InvalidOperationException("Erro ao criar empréstimo");
    }

    public async Task<LoanDto> ApproveLoanAsync(Guid loanId, Guid approvedByUserId, ApproveLoanRequest? request = null)
    {
        var loan = await _context.Set<EmployeeLoan>()
            .FirstOrDefaultAsync(l => l.Id == loanId);
            
        if (loan == null)
            throw new InvalidOperationException("Empréstimo não encontrado");
            
        if (loan.Status != LoanStatus.Pending)
            throw new InvalidOperationException("Este empréstimo não está pendente de aprovação");

        loan.Status = LoanStatus.Active;
        loan.ApprovedByUserId = approvedByUserId;
        loan.ApprovedAt = DateTime.UtcNow;
        loan.UpdatedAt = DateTime.UtcNow;
        
        if (request?.Notes != null)
        {
            loan.Notes = string.IsNullOrEmpty(loan.Notes) 
                ? $"Aprovação: {request.Notes}" 
                : $"{loan.Notes}\nAprovação: {request.Notes}";
        }

        await _context.SaveChangesAsync();

        return await GetLoanByIdAsync(loan.Id) ?? throw new InvalidOperationException("Erro ao aprovar empréstimo");
    }

    public async Task<LoanDto> RejectLoanAsync(Guid loanId, Guid rejectedByUserId, ApproveLoanRequest? request = null)
    {
        var loan = await _context.Set<EmployeeLoan>()
            .FirstOrDefaultAsync(l => l.Id == loanId);
            
        if (loan == null)
            throw new InvalidOperationException("Empréstimo não encontrado");
            
        if (loan.Status != LoanStatus.Pending)
            throw new InvalidOperationException("Este empréstimo não está pendente de aprovação");

        loan.Status = LoanStatus.Rejected;
        loan.ApprovedByUserId = rejectedByUserId;
        loan.ApprovedAt = DateTime.UtcNow;
        loan.UpdatedAt = DateTime.UtcNow;
        
        if (request?.Notes != null)
        {
            loan.Notes = string.IsNullOrEmpty(loan.Notes) 
                ? $"Rejeição: {request.Notes}" 
                : $"{loan.Notes}\nRejeição: {request.Notes}";
        }

        await _context.SaveChangesAsync();

        return await GetLoanByIdAsync(loan.Id) ?? throw new InvalidOperationException("Erro ao rejeitar empréstimo");
    }

    public async Task<LoanDto> ReturnLoanAsync(Guid loanId, ReturnLoanRequest? request = null)
    {
        var loan = await _context.Set<EmployeeLoan>()
            .FirstOrDefaultAsync(l => l.Id == loanId);
            
        if (loan == null)
            throw new InvalidOperationException("Empréstimo não encontrado");
            
        if (loan.Status != LoanStatus.Active)
            throw new InvalidOperationException("Este empréstimo não está ativo");

        loan.Status = LoanStatus.Returned;
        loan.ActualEndDate = DateTime.UtcNow;
        loan.UpdatedAt = DateTime.UtcNow;
        
        if (request?.Notes != null)
        {
            loan.Notes = string.IsNullOrEmpty(loan.Notes) 
                ? $"Devolução: {request.Notes}" 
                : $"{loan.Notes}\nDevolução: {request.Notes}";
        }

        await _context.SaveChangesAsync();

        return await GetLoanByIdAsync(loan.Id) ?? throw new InvalidOperationException("Erro ao devolver empréstimo");
    }

    public async Task<bool> CancelLoanAsync(Guid loanId)
    {
        var loan = await _context.Set<EmployeeLoan>()
            .FirstOrDefaultAsync(l => l.Id == loanId);
            
        if (loan == null)
            return false;
            
        loan.Status = LoanStatus.Cancelled;
        loan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<LoanDto?> GetLoanByIdAsync(Guid loanId)
    {
        var loan = await _context.Set<EmployeeLoan>()
            .Include(l => l.Employee)
            .Include(l => l.SourceDepartment)
            .Include(l => l.TargetDepartment)
            .Include(l => l.RequestedByUser)
            .FirstOrDefaultAsync(l => l.Id == loanId);

        return loan == null ? null : MapToDto(loan);
    }

    public async Task<List<LoanDto>> GetActiveLoansByDepartmentAsync(Guid departmentId)
    {
        var loans = await _context.Set<EmployeeLoan>()
            .Include(l => l.Employee)
            .Include(l => l.SourceDepartment)
            .Include(l => l.TargetDepartment)
            .Include(l => l.RequestedByUser)
            .Where(l => l.Status == LoanStatus.Active && 
                       (l.SourceDepartmentId == departmentId || l.TargetDepartmentId == departmentId))
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();

        return loans.Select(MapToDto).ToList();
    }

    public async Task<List<LoanDto>> GetLoansReceivedByDepartmentAsync(Guid departmentId)
    {
        var loans = await _context.Set<EmployeeLoan>()
            .Include(l => l.Employee)
            .Include(l => l.SourceDepartment)
            .Include(l => l.TargetDepartment)
            .Include(l => l.RequestedByUser)
            .Where(l => l.Status == LoanStatus.Active && l.TargetDepartmentId == departmentId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();

        return loans.Select(MapToDto).ToList();
    }

    public async Task<List<LoanDto>> GetLoansSentByDepartmentAsync(Guid departmentId)
    {
        var loans = await _context.Set<EmployeeLoan>()
            .Include(l => l.Employee)
            .Include(l => l.SourceDepartment)
            .Include(l => l.TargetDepartment)
            .Include(l => l.RequestedByUser)
            .Where(l => l.Status == LoanStatus.Active && l.SourceDepartmentId == departmentId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();

        return loans.Select(MapToDto).ToList();
    }

    public async Task<List<LoanDto>> GetAllLoansAsync(bool includeInactive = false)
    {
        var query = _context.Set<EmployeeLoan>()
            .Include(l => l.Employee)
            .Include(l => l.SourceDepartment)
            .Include(l => l.TargetDepartment)
            .Include(l => l.RequestedByUser)
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(l => l.Status == LoanStatus.Active);
        }

        var loans = await query
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();

        return loans.Select(MapToDto).ToList();
    }

    public async Task<List<AvailableEmployeeDto>> GetAvailableEmployeesForLoanAsync(Guid requestingDepartmentId)
    {
        // Buscar IDs dos funcionários atualmente emprestados
        var loanedEmployeeIds = await _context.Set<EmployeeLoan>()
            .Where(l => l.Status == LoanStatus.Active)
            .Select(l => l.EmployeeId)
            .ToListAsync();

        // Buscar funcionários de OUTROS departamentos
        var employees = await _context.Employees
            .Include(e => e.Department)
            .Where(e => e.DepartmentId != requestingDepartmentId && e.IsActive)
            .OrderBy(e => e.Department!.Name)
            .ThenBy(e => e.Name)
            .ToListAsync();

        // Buscar informações de empréstimos ativos para mostrar status
        var activeLoans = await _context.Set<EmployeeLoan>()
            .Include(l => l.TargetDepartment)
            .Where(l => l.Status == LoanStatus.Active)
            .ToDictionaryAsync(l => l.EmployeeId);

        return employees.Select(e => new AvailableEmployeeDto
        {
            Id = e.Id,
            Name = e.Name,
            Role = e.Role,
            DepartmentId = e.DepartmentId,
            DepartmentName = e.Department?.Name ?? "N/A",
            DailyHours = e.DailyHours,
            IsCurrentlyLoaned = activeLoans.ContainsKey(e.Id),
            CurrentLoanDepartment = activeLoans.ContainsKey(e.Id) 
                ? activeLoans[e.Id].TargetDepartment?.Name 
                : null
        }).ToList();
    }

    public async Task<LoanDto?> GetActiveLoanForEmployeeAsync(Guid employeeId)
    {
        var loan = await _context.Set<EmployeeLoan>()
            .Include(l => l.Employee)
            .Include(l => l.SourceDepartment)
            .Include(l => l.TargetDepartment)
            .Include(l => l.RequestedByUser)
            .Include(l => l.ApprovedByUser)
            .FirstOrDefaultAsync(l => l.EmployeeId == employeeId && l.Status == LoanStatus.Active);

        return loan == null ? null : MapToDto(loan);
    }

    public async Task<List<LoanDto>> GetPendingLoansForDepartmentAsync(Guid departmentId)
    {
        var loans = await _context.Set<EmployeeLoan>()
            .Include(l => l.Employee)
            .Include(l => l.SourceDepartment)
            .Include(l => l.TargetDepartment)
            .Include(l => l.RequestedByUser)
            .Where(l => l.Status == LoanStatus.Pending && l.SourceDepartmentId == departmentId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();

        return loans.Select(MapToDto).ToList();
    }

    private static LoanDto MapToDto(EmployeeLoan loan)
    {
        return new LoanDto
        {
            Id = loan.Id,
            EmployeeId = loan.EmployeeId,
            EmployeeName = loan.Employee?.Name ?? "N/A",
            EmployeeRole = loan.Employee?.Role ?? "N/A",
            SourceDepartmentId = loan.SourceDepartmentId,
            SourceDepartmentName = loan.SourceDepartment?.Name ?? "N/A",
            TargetDepartmentId = loan.TargetDepartmentId,
            TargetDepartmentName = loan.TargetDepartment?.Name ?? "N/A",
            StartDate = loan.StartDate,
            ExpectedEndDate = loan.ExpectedEndDate,
            ActualEndDate = loan.ActualEndDate,
            Status = loan.Status,
            Reason = loan.Reason,
            Notes = loan.Notes,
            RequestedByUserName = loan.RequestedByUser?.FullName,
            ApprovedByUserName = loan.ApprovedByUser?.FullName,
            ApprovedAt = loan.ApprovedAt,
            CreatedAt = loan.CreatedAt,
            IsActive = loan.IsActive,
            IsPending = loan.IsPending
        };
    }
}
