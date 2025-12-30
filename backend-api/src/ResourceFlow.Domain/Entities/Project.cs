namespace ResourceFlow.Domain.Entities;

public class Project
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Color { get; set; } = "#3B82F6"; // Default blue
    public ProjectPriority Priority { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatedById { get; set; }

    // Relacionamentos
    public virtual User? CreatedBy { get; set; }
    public virtual ICollection<Demand> Demands { get; set; } = new List<Demand>();
}

public enum ProjectPriority
{
    Low = 1,
    Medium = 2,
    High = 3
}
