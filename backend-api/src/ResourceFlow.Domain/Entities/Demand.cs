namespace ResourceFlow.Domain.Entities;

public class Demand
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid TeamId { get; set; } // DepartmentId - Mesa responsável
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalHours { get; set; }
    public int AllocatedHours { get; set; }
    public DemandStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Datas das fases
    public DateTime? HmgStartDate { get; set; }
    public DateTime? HmgEndDate { get; set; }
    public DateTime? GoLiveDate { get; set; }
    public DateTime? AssistedOpDate { get; set; }

    // Relacionamentos
    public virtual Project? Project { get; set; }
    public virtual Department? Team { get; set; }
    public virtual ICollection<DemandPhase> Phases { get; set; } = new List<DemandPhase>();
}

public enum DemandStatus
{
    Pending = 1,      // Pendente
    Partial = 2,      // Parcialmente Alocado
    Allocated = 3,    // Totalmente Alocado
    InProgress = 4,   // Em Andamento
    Completed = 5     // Concluído
}
