namespace ResourceFlow.Domain.Entities;

/// <summary>
/// Representa a alocação de um funcionário em uma demanda para um mês/ano específico
/// </summary>
public class Allocation
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid? DemandId { get; set; } // Nullable para alocações especiais (férias, treinamento)
    public Guid? ProjectId { get; set; } // Nullable para alocações especiais
    public int Month { get; set; } // 0-11 (Janeiro = 0)
    public int Year { get; set; }
    public int Hours { get; set; }
    public bool IsLoan { get; set; } // True quando funcionário é emprestado de outra equipe
    public Guid? SourceTeamId { get; set; } // Equipe de origem do empréstimo
    public string? AllocationType { get; set; } // null = demanda normal, "VACATION" = férias, "TRAINING" = treinamento
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Relacionamentos
    public virtual Employee Employee { get; set; } = null!;
    public virtual Demand? Demand { get; set; }
    public virtual Project? Project { get; set; }
    public virtual Department? SourceTeam { get; set; }
}
