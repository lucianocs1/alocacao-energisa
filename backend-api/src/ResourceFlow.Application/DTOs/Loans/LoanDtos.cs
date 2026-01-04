using System;
using System.Collections.Generic;

namespace ResourceFlow.Application.DTOs.Loans;

/// <summary>
/// DTO para criar um novo empréstimo
/// </summary>
public class CreateLoanRequest
{
    public Guid EmployeeId { get; set; }
    public Guid TargetDepartmentId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? ExpectedEndDate { get; set; }
    public string? Reason { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// DTO para devolver um empréstimo
/// </summary>
public class ReturnLoanRequest
{
    public string? Notes { get; set; }
}

/// <summary>
/// DTO para aprovar ou rejeitar um empréstimo
/// </summary>
public class ApproveLoanRequest
{
    public string? Notes { get; set; }
}

/// <summary>
/// DTO de resposta para um empréstimo
/// </summary>
public class LoanDto
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string EmployeeRole { get; set; } = string.Empty;
    public Guid SourceDepartmentId { get; set; }
    public string SourceDepartmentName { get; set; } = string.Empty;
    public Guid TargetDepartmentId { get; set; }
    public string TargetDepartmentName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? ExpectedEndDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public string? Notes { get; set; }
    public string? RequestedByUserName { get; set; }
    public string? ApprovedByUserName { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
    public bool IsPending { get; set; }
}

/// <summary>
/// DTO para listar funcionários disponíveis para empréstimo
/// </summary>
public class AvailableEmployeeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public int DailyHours { get; set; }
    public bool IsCurrentlyLoaned { get; set; }
    public string? CurrentLoanDepartment { get; set; }
}

/// <summary>
/// DTO resumido de empréstimo para incluir em Employee
/// </summary>
public class EmployeeLoanSummary
{
    public Guid LoanId { get; set; }
    public Guid FromDepartmentId { get; set; }
    public string FromDepartmentName { get; set; } = string.Empty;
    public Guid ToDepartmentId { get; set; }
    public string ToDepartmentName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? ExpectedEndDate { get; set; }
    public bool IsLoanedOut { get; set; } // true = emprestado para outro dept, false = recebido de outro dept
}
