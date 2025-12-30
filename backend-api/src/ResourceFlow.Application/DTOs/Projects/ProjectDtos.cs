using ResourceFlow.Domain.Entities;

namespace ResourceFlow.Application.DTOs.Projects;

// ========== Request DTOs ==========

public class CreateProjectRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Color { get; set; } = "#3B82F6";
    public string Priority { get; set; } = "medium"; // low, medium, high
    public List<CreateDemandRequest> Demands { get; set; } = new();
}

public class UpdateProjectRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Color { get; set; } = "#3B82F6";
    public string Priority { get; set; } = "medium";
}

public class CreateDemandRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid TeamId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalHours { get; set; }
    public List<CreatePhaseRequest> Phases { get; set; } = new();
    
    // Datas das fases opcionais
    public DateTime? HmgStartDate { get; set; }
    public DateTime? HmgEndDate { get; set; }
    public DateTime? GoLiveDate { get; set; }
    public DateTime? AssistedOpDate { get; set; }
}

public class UpdateDemandRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid TeamId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalHours { get; set; }
    public int AllocatedHours { get; set; }
    public string Status { get; set; } = "pending";
}

public class CreatePhaseRequest
{
    public string Type { get; set; } = string.Empty; // construction, homologation, go-live, assisted-operation, maintenance
    public string? Name { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsMilestone { get; set; }
}

// ========== Response DTOs ==========

public class ProjectDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Color { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<DemandDto> Demands { get; set; } = new();
}

public class DemandDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid TeamId { get; set; }
    public string? TeamName { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalHours { get; set; }
    public int AllocatedHours { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsNew { get; set; } // Criado nos últimos 7 dias
    public List<PhaseDto> Phases { get; set; } = new();
    
    // Datas das fases
    public DateTime? HmgStartDate { get; set; }
    public DateTime? HmgEndDate { get; set; }
    public DateTime? GoLiveDate { get; set; }
    public DateTime? AssistedOpDate { get; set; }
}

public class PhaseDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Name { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsMilestone { get; set; }
}

public class ProjectListResponse
{
    public List<ProjectDto> Projects { get; set; } = new();
    public int TotalCount { get; set; }
}

public class ProjectStatsDto
{
    public int TotalProjects { get; set; }
    public int TotalDemands { get; set; }
    public int PendingDemands { get; set; }
    public int PartialDemands { get; set; }
    public int AllocatedDemands { get; set; }
    public int CompletedDemands { get; set; }
}
