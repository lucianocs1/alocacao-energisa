namespace ResourceFlow.Application.DTOs.Allocations;

// ========== Request DTOs ==========

public class CreateAllocationRequest
{
    public Guid EmployeeId { get; set; }
    public Guid DemandId { get; set; }
    public Guid ProjectId { get; set; }
    public int Month { get; set; } // 0-11
    public int Year { get; set; }
    public int Hours { get; set; }
    public bool IsLoan { get; set; }
    public Guid? SourceTeamId { get; set; }
}

public class UpdateAllocationRequest
{
    public int Hours { get; set; }
}

public class BulkCreateAllocationRequest
{
    public List<CreateAllocationRequest> Allocations { get; set; } = new();
}

// ========== Response DTOs ==========

public class AllocationDto
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public Guid DemandId { get; set; }
    public string DemandName { get; set; } = string.Empty;
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public int Month { get; set; }
    public int Year { get; set; }
    public int Hours { get; set; }
    public bool IsLoan { get; set; }
    public Guid? SourceTeamId { get; set; }
    public string? SourceTeamName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AllocationListResponse
{
    public List<AllocationDto> Allocations { get; set; } = new();
    public int TotalCount { get; set; }
}

// ========== Allocation Page Data DTOs ==========

/// <summary>
/// Dados completos para a página de alocação
/// </summary>
public class AllocationPageDataResponse
{
    public List<AllocationEmployeeDto> Employees { get; set; } = new();
    public List<AllocationDemandDto> Demands { get; set; } = new();
    public List<AllocationDto> Allocations { get; set; } = new();
    public AllocationStatsDto Stats { get; set; } = new();
}

/// <summary>
/// Funcionário com dados necessários para a timeline de alocação
/// </summary>
public class AllocationEmployeeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public int DailyHours { get; set; }
    public List<VacationPeriodDto> Vacations { get; set; } = new();
    public List<FixedAllocationSimpleDto> FixedAllocations { get; set; } = new();
}

public class VacationPeriodDto
{
    public Guid Id { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public class FixedAllocationSimpleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int HoursPerMonth { get; set; }
}

/// <summary>
/// Demanda com dados necessários para alocação
/// </summary>
public class AllocationDemandDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string ProjectColor { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid TeamId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalHours { get; set; }
    public int AllocatedHours { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<DemandPhaseSimpleDto> Phases { get; set; } = new();
}

public class DemandPhaseSimpleDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Name { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsMilestone { get; set; }
}

/// <summary>
/// Estatísticas da página de alocação
/// </summary>
public class AllocationStatsDto
{
    public int TotalEmployees { get; set; }
    public int TotalDemands { get; set; }
    public int TotalHoursAllocated { get; set; }
    public int LoanAllocationsCount { get; set; }
    public int OverloadedEmployeesCount { get; set; }
}
