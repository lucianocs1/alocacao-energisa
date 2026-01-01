namespace ResourceFlow.Domain.Entities;

/// <summary>
/// Representa a alocação de um funcionário em uma demanda para um mês/ano específico
/// </summary>
public class Allocation
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid DemandId { get; set; }
    public Guid ProjectId { get; set; } // Referência ao projeto pai para facilitar queries
    public int Month { get; set; } // 0-11 (Janeiro = 0)
    public int Year { get; set; }
    public int Hours { get; set; }
    public bool IsLoan { get; set; } // True quando funcionário é emprestado de outra equipe
    public Guid? SourceTeamId { get; set; } // Equipe de origem do empréstimo
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Relacionamentos
    public virtual Employee Employee { get; set; } = null!;
    public virtual Demand Demand { get; set; } = null!;
    public virtual Project Project { get; set; } = null!;
    public virtual Department? SourceTeam { get; set; }
}
