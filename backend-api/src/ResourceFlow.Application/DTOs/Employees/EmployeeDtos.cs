using ResourceFlow.Domain.Entities;

namespace ResourceFlow.Application.DTOs.Employees;

// ========== Request DTOs ==========

public class CreateEmployeeRequest
{
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid DepartmentId { get; set; }
    public int DailyHours { get; set; } = 8;
    public List<CreateVacationRequest> Vacations { get; set; } = new();
    public List<CreateFixedAllocationRequest> FixedAllocations { get; set; } = new();
}

public class UpdateEmployeeRequest
{
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid DepartmentId { get; set; }
    public int DailyHours { get; set; } = 8;
}

public class CreateVacationRequest
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public class CreateFixedAllocationRequest
{
    public string Name { get; set; } = string.Empty;
    public int HoursPerMonth { get; set; }
}

// ========== Response DTOs ==========

public class EmployeeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid TeamId { get; set; } // DepartmentId mapeado como TeamId para o frontend
    public string? TeamName { get; set; }
    public int DailyHours { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<VacationDto> Vacations { get; set; } = new();
    public List<FixedAllocationDto> FixedAllocations { get; set; } = new();
}

public class VacationDto
{
    public Guid Id { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public class FixedAllocationDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int HoursPerMonth { get; set; }
}

public class EmployeeListResponse
{
    public List<EmployeeDto> Employees { get; set; } = new();
    public int TotalCount { get; set; }
}

public class RoleDto
{
    public string Value { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
}

public class RolesListResponse
{
    public List<RoleDto> Roles { get; set; } = new();
}
