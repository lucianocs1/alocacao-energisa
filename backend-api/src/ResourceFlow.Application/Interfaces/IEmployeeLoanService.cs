using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ResourceFlow.Application.DTOs.Loans;

namespace ResourceFlow.Application.Interfaces;

public interface IEmployeeLoanService
{
    /// <summary>
    /// Cria um novo empréstimo de funcionário
    /// </summary>
    Task<LoanDto> CreateLoanAsync(CreateLoanRequest request, Guid requestedByUserId);
    
    /// <summary>
    /// Aprova um empréstimo pendente (coordenador de origem)
    /// </summary>
    Task<LoanDto> ApproveLoanAsync(Guid loanId, Guid approvedByUserId, ApproveLoanRequest? request = null);
    
    /// <summary>
    /// Rejeita um empréstimo pendente (coordenador de origem)
    /// </summary>
    Task<LoanDto> RejectLoanAsync(Guid loanId, Guid rejectedByUserId, ApproveLoanRequest? request = null);
    
    /// <summary>
    /// Devolve um funcionário emprestado ao departamento de origem
    /// </summary>
    Task<LoanDto> ReturnLoanAsync(Guid loanId, ReturnLoanRequest? request = null);
    
    /// <summary>
    /// Cancela um empréstimo (antes de ser efetivado)
    /// </summary>
    Task<bool> CancelLoanAsync(Guid loanId);
    
    /// <summary>
    /// Obtém um empréstimo pelo ID
    /// </summary>
    Task<LoanDto?> GetLoanByIdAsync(Guid loanId);
    
    /// <summary>
    /// Lista empréstimos ativos de um departamento (que emprestou ou pegou emprestado)
    /// </summary>
    Task<List<LoanDto>> GetActiveLoansByDepartmentAsync(Guid departmentId);
    
    /// <summary>
    /// Lista funcionários emprestados PARA um departamento (recebidos)
    /// </summary>
    Task<List<LoanDto>> GetLoansReceivedByDepartmentAsync(Guid departmentId);
    
    /// <summary>
    /// Lista funcionários emprestados DE um departamento (enviados)
    /// </summary>
    Task<List<LoanDto>> GetLoansSentByDepartmentAsync(Guid departmentId);
    
    /// <summary>
    /// Lista todos os empréstimos (histórico)
    /// </summary>
    Task<List<LoanDto>> GetAllLoansAsync(bool includeInactive = false);
    
    /// <summary>
    /// Lista funcionários disponíveis para empréstimo de outros departamentos
    /// </summary>
    Task<List<AvailableEmployeeDto>> GetAvailableEmployeesForLoanAsync(Guid requestingDepartmentId);
    
    /// <summary>
    /// Verifica se um funcionário está atualmente emprestado
    /// </summary>
    Task<LoanDto?> GetActiveLoanForEmployeeAsync(Guid employeeId);
    
    /// <summary>
    /// Lista empréstimos pendentes de aprovação para um departamento (como origem)
    /// </summary>
    Task<List<LoanDto>> GetPendingLoansForDepartmentAsync(Guid departmentId);
}
