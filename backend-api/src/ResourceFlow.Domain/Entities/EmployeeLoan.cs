using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ResourceFlow.Domain.Entities;

/// <summary>
/// Representa um empréstimo de funcionário entre departamentos
/// </summary>
public class EmployeeLoan
{
    [Key]
    public Guid Id { get; set; }
    
    /// <summary>
    /// Funcionário que está sendo emprestado
    /// </summary>
    [Required]
    public Guid EmployeeId { get; set; }
    
    [ForeignKey(nameof(EmployeeId))]
    public Employee? Employee { get; set; }
    
    /// <summary>
    /// Departamento de origem (dono do funcionário)
    /// </summary>
    [Required]
    public Guid SourceDepartmentId { get; set; }
    
    [ForeignKey(nameof(SourceDepartmentId))]
    public Department? SourceDepartment { get; set; }
    
    /// <summary>
    /// Departamento de destino (que está pegando emprestado)
    /// </summary>
    [Required]
    public Guid TargetDepartmentId { get; set; }
    
    [ForeignKey(nameof(TargetDepartmentId))]
    public Department? TargetDepartment { get; set; }
    
    /// <summary>
    /// Data de início do empréstimo
    /// </summary>
    [Required]
    public DateTime StartDate { get; set; }
    
    /// <summary>
    /// Data de término prevista do empréstimo (opcional)
    /// </summary>
    public DateTime? ExpectedEndDate { get; set; }
    
    /// <summary>
    /// Data real de devolução (quando o empréstimo é encerrado)
    /// </summary>
    public DateTime? ActualEndDate { get; set; }
    
    /// <summary>
    /// Status do empréstimo: Active, Returned, Cancelled
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Active";
    
    /// <summary>
    /// Motivo/justificativa do empréstimo
    /// </summary>
    [MaxLength(500)]
    public string? Reason { get; set; }
    
    /// <summary>
    /// Observações adicionais
    /// </summary>
    [MaxLength(1000)]
    public string? Notes { get; set; }
    
    /// <summary>
    /// Usuário que solicitou o empréstimo
    /// </summary>
    public Guid? RequestedByUserId { get; set; }
    
    [ForeignKey(nameof(RequestedByUserId))]
    public User? RequestedByUser { get; set; }
    
    /// <summary>
    /// Data de criação do registro
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Data da última atualização
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
    
    /// <summary>
    /// Verifica se o empréstimo está ativo
    /// </summary>
    public bool IsActive => Status == LoanStatus.Active && ActualEndDate == null;
    
    /// <summary>
    /// Verifica se o empréstimo está pendente de aprovação
    /// </summary>
    public bool IsPending => Status == LoanStatus.Pending;
    
    /// <summary>
    /// Usuário que aprovou/rejeitou o empréstimo
    /// </summary>
    public Guid? ApprovedByUserId { get; set; }
    
    [ForeignKey(nameof(ApprovedByUserId))]
    public User? ApprovedByUser { get; set; }
    
    /// <summary>
    /// Data da aprovação/rejeição
    /// </summary>
    public DateTime? ApprovedAt { get; set; }
}

/// <summary>
/// Status possíveis para um empréstimo
/// </summary>
public static class LoanStatus
{
    public const string Pending = "Pending";       // Aguardando aprovação
    public const string Active = "Active";         // Aprovado e ativo
    public const string Returned = "Returned";     // Devolvido
    public const string Rejected = "Rejected";     // Rejeitado pelo coordenador de origem
    public const string Cancelled = "Cancelled";   // Cancelado pelo solicitante
}
