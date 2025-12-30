namespace ResourceFlow.Domain.Entities;

public class DemandPhase
{
    public Guid Id { get; set; }
    public Guid DemandId { get; set; }
    public PhaseType Type { get; set; }
    public string? Name { get; set; } // Nome customizado opcional
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsMilestone { get; set; } // True para Go-Live (apenas 1 dia)

    // Relacionamentos
    public virtual Demand? Demand { get; set; }
}

public enum PhaseType
{
    Construction = 1,      // Construção
    Homologation = 2,      // Homologação
    GoLive = 3,            // Go Live
    AssistedOperation = 4, // Operação Assistida
    Maintenance = 5        // Manutenção
}
