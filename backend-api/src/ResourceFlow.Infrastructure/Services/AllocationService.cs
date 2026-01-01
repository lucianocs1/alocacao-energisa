using Microsoft.EntityFrameworkCore;
using ResourceFlow.Application.DTOs.Allocations;
using ResourceFlow.Application.Interfaces;
using ResourceFlow.Domain.Entities;
using ResourceFlow.Infrastructure.Data;

namespace ResourceFlow.Infrastructure.Services;

public class AllocationService : IAllocationService
{
    private readonly ApplicationDbContext _context;

    public AllocationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AllocationPageDataResponse> GetAllocationPageDataAsync(Guid? teamId = null, int? year = null)
    {
        var currentYear = year ?? DateTime.Now.Year;

        // Buscar funcionários
        var employeesQuery = _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Vacations)
            .Include(e => e.FixedAllocations)
            .Where(e => e.IsActive);

        if (teamId.HasValue)
        {
            employeesQuery = employeesQuery.Where(e => e.DepartmentId == teamId.Value);
        }

        var employees = await employeesQuery.OrderBy(e => e.Name).ToListAsync();

        // Buscar demandas (do ano atual ou que se estendem para o ano atual)
        var demandsQuery = _context.Demands
            .Include(d => d.Project)
            .Include(d => d.Team)
            .Include(d => d.Phases)
            .Where(d => d.Project!.IsActive);

        if (teamId.HasValue)
        {
            demandsQuery = demandsQuery.Where(d => d.TeamId == teamId.Value);
        }

        // Filtrar demandas do ano
        demandsQuery = demandsQuery.Where(d => 
            d.StartDate.Year <= currentYear && d.EndDate.Year >= currentYear);

        var demands = await demandsQuery.OrderBy(d => d.Name).ToListAsync();

        // Buscar alocações
        var allocationsQuery = _context.Allocations
            .Include(a => a.Employee)
            .Include(a => a.Demand)
            .Include(a => a.Project)
            .Include(a => a.SourceTeam)
            .Where(a => a.Year == currentYear);

        if (teamId.HasValue)
        {
            var employeeIds = employees.Select(e => e.Id).ToHashSet();
            var demandIds = demands.Select(d => d.Id).ToHashSet();
            allocationsQuery = allocationsQuery.Where(a => 
                employeeIds.Contains(a.EmployeeId) || demandIds.Contains(a.DemandId));
        }

        var allocations = await allocationsQuery.ToListAsync();

        // Calcular estatísticas
        var stats = new AllocationStatsDto
        {
            TotalEmployees = employees.Count,
            TotalDemands = demands.Count,
            TotalHoursAllocated = allocations.Sum(a => a.Hours),
            LoanAllocationsCount = allocations.Count(a => a.IsLoan),
            OverloadedEmployeesCount = 0 // Calculado no frontend baseado na capacidade
        };

        return new AllocationPageDataResponse
        {
            Employees = employees.Select(MapEmployeeToDto).ToList(),
            Demands = demands.Select(MapDemandToDto).ToList(),
            Allocations = allocations.Select(MapToDto).ToList(),
            Stats = stats
        };
    }

    public async Task<AllocationListResponse> GetAllocationsAsync(Guid? teamId = null, Guid? employeeId = null, int? year = null)
    {
        var query = _context.Allocations
            .Include(a => a.Employee)
            .Include(a => a.Demand)
            .Include(a => a.Project)
            .Include(a => a.SourceTeam)
            .AsQueryable();

        if (teamId.HasValue)
        {
            query = query.Where(a => 
                a.Employee.DepartmentId == teamId.Value || 
                a.Demand.TeamId == teamId.Value);
        }

        if (employeeId.HasValue)
        {
            query = query.Where(a => a.EmployeeId == employeeId.Value);
        }

        if (year.HasValue)
        {
            query = query.Where(a => a.Year == year.Value);
        }

        var allocations = await query.OrderBy(a => a.Year).ThenBy(a => a.Month).ToListAsync();

        return new AllocationListResponse
        {
            Allocations = allocations.Select(MapToDto).ToList(),
            TotalCount = allocations.Count
        };
    }

    public async Task<AllocationDto?> GetAllocationByIdAsync(Guid id)
    {
        var allocation = await _context.Allocations
            .Include(a => a.Employee)
            .Include(a => a.Demand)
            .Include(a => a.Project)
            .Include(a => a.SourceTeam)
            .FirstOrDefaultAsync(a => a.Id == id);

        return allocation == null ? null : MapToDto(allocation);
    }

    public async Task<AllocationDto> CreateAllocationAsync(CreateAllocationRequest request)
    {
        // Verificar se já existe uma alocação para este funcionário/demanda/mês/ano
        var existing = await _context.Allocations.FirstOrDefaultAsync(a =>
            a.EmployeeId == request.EmployeeId &&
            a.DemandId == request.DemandId &&
            a.Month == request.Month &&
            a.Year == request.Year);

        if (existing != null)
        {
            // Atualizar horas da alocação existente
            existing.Hours += request.Hours;
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            
            return (await GetAllocationByIdAsync(existing.Id))!;
        }

        var allocation = new Allocation
        {
            Id = Guid.NewGuid(),
            EmployeeId = request.EmployeeId,
            DemandId = request.DemandId,
            ProjectId = request.ProjectId,
            Month = request.Month,
            Year = request.Year,
            Hours = request.Hours,
            IsLoan = request.IsLoan,
            SourceTeamId = request.SourceTeamId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Allocations.Add(allocation);
        
        // Atualizar horas alocadas na demanda
        var demand = await _context.Demands.FindAsync(request.DemandId);
        if (demand != null)
        {
            demand.AllocatedHours += request.Hours;
            demand.UpdatedAt = DateTime.UtcNow;
            
            // Atualizar status da demanda
            UpdateDemandStatus(demand);
        }

        await _context.SaveChangesAsync();

        return (await GetAllocationByIdAsync(allocation.Id))!;
    }

    public async Task<List<AllocationDto>> CreateBulkAllocationsAsync(BulkCreateAllocationRequest request)
    {
        var results = new List<AllocationDto>();
        
        foreach (var allocationRequest in request.Allocations)
        {
            var result = await CreateAllocationAsync(allocationRequest);
            results.Add(result);
        }

        return results;
    }

    public async Task<AllocationDto?> UpdateAllocationAsync(Guid id, UpdateAllocationRequest request)
    {
        var allocation = await _context.Allocations.FindAsync(id);
        if (allocation == null) return null;

        var hoursDiff = request.Hours - allocation.Hours;

        allocation.Hours = request.Hours;
        allocation.UpdatedAt = DateTime.UtcNow;

        // Atualizar horas alocadas na demanda
        var demand = await _context.Demands.FindAsync(allocation.DemandId);
        if (demand != null)
        {
            demand.AllocatedHours += hoursDiff;
            demand.UpdatedAt = DateTime.UtcNow;
            UpdateDemandStatus(demand);
        }

        await _context.SaveChangesAsync();

        return await GetAllocationByIdAsync(id);
    }

    public async Task<bool> DeleteAllocationAsync(Guid id)
    {
        var allocation = await _context.Allocations.FindAsync(id);
        if (allocation == null) return false;

        // Atualizar horas alocadas na demanda
        var demand = await _context.Demands.FindAsync(allocation.DemandId);
        if (demand != null)
        {
            demand.AllocatedHours -= allocation.Hours;
            if (demand.AllocatedHours < 0) demand.AllocatedHours = 0;
            demand.UpdatedAt = DateTime.UtcNow;
            UpdateDemandStatus(demand);
        }

        _context.Allocations.Remove(allocation);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteAllocationsByFilterAsync(Guid employeeId, Guid demandId, int month, int year)
    {
        var allocations = await _context.Allocations
            .Where(a => a.EmployeeId == employeeId && 
                       a.DemandId == demandId && 
                       a.Month == month && 
                       a.Year == year)
            .ToListAsync();

        if (!allocations.Any()) return false;

        var totalHours = allocations.Sum(a => a.Hours);

        // Atualizar horas alocadas na demanda
        var demand = await _context.Demands.FindAsync(demandId);
        if (demand != null)
        {
            demand.AllocatedHours -= totalHours;
            if (demand.AllocatedHours < 0) demand.AllocatedHours = 0;
            demand.UpdatedAt = DateTime.UtcNow;
            UpdateDemandStatus(demand);
        }

        _context.Allocations.RemoveRange(allocations);
        await _context.SaveChangesAsync();

        return true;
    }

    // ========== Helper Methods ==========

    private void UpdateDemandStatus(Demand demand)
    {
        if (demand.AllocatedHours == 0)
        {
            demand.Status = DemandStatus.Pending;
        }
        else if (demand.AllocatedHours >= demand.TotalHours)
        {
            demand.Status = DemandStatus.Allocated;
        }
        else
        {
            demand.Status = DemandStatus.Partial;
        }
    }

    private AllocationDto MapToDto(Allocation allocation)
    {
        return new AllocationDto
        {
            Id = allocation.Id,
            EmployeeId = allocation.EmployeeId,
            EmployeeName = allocation.Employee?.Name ?? string.Empty,
            DemandId = allocation.DemandId,
            DemandName = allocation.Demand?.Name ?? string.Empty,
            ProjectId = allocation.ProjectId,
            ProjectName = allocation.Project?.Name ?? string.Empty,
            Month = allocation.Month,
            Year = allocation.Year,
            Hours = allocation.Hours,
            IsLoan = allocation.IsLoan,
            SourceTeamId = allocation.SourceTeamId,
            SourceTeamName = allocation.SourceTeam?.Name,
            CreatedAt = allocation.CreatedAt
        };
    }

    private AllocationEmployeeDto MapEmployeeToDto(Employee employee)
    {
        return new AllocationEmployeeDto
        {
            Id = employee.Id,
            Name = employee.Name,
            Role = employee.Role,
            TeamId = employee.DepartmentId,
            TeamName = employee.Department?.Name ?? string.Empty,
            DailyHours = employee.DailyHours,
            Vacations = employee.Vacations.Select(v => new VacationPeriodDto
            {
                Id = v.Id,
                StartDate = v.StartDate,
                EndDate = v.EndDate
            }).ToList(),
            FixedAllocations = employee.FixedAllocations.Select(f => new FixedAllocationSimpleDto
            {
                Id = f.Id,
                Name = f.Name,
                HoursPerMonth = f.HoursPerMonth
            }).ToList()
        };
    }

    private AllocationDemandDto MapDemandToDto(Demand demand)
    {
        return new AllocationDemandDto
        {
            Id = demand.Id,
            ProjectId = demand.ProjectId,
            ProjectName = demand.Project?.Name ?? string.Empty,
            ProjectColor = demand.Project?.Color ?? string.Empty,
            Name = demand.Name,
            Description = demand.Description,
            TeamId = demand.TeamId,
            StartDate = demand.StartDate,
            EndDate = demand.EndDate,
            TotalHours = demand.TotalHours,
            AllocatedHours = demand.AllocatedHours,
            Status = MapStatusToString(demand.Status),
            Phases = demand.Phases.Select(p => new DemandPhaseSimpleDto
            {
                Id = p.Id,
                Type = MapPhaseTypeToString(p.Type),
                Name = p.Name,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                IsMilestone = p.IsMilestone
            }).ToList()
        };
    }

    private string MapStatusToString(DemandStatus status) => status switch
    {
        DemandStatus.Pending => "pending",
        DemandStatus.Partial => "partial",
        DemandStatus.Allocated => "allocated",
        DemandStatus.InProgress => "in-progress",
        DemandStatus.Completed => "completed",
        _ => "pending"
    };

    private string MapPhaseTypeToString(PhaseType type) => type switch
    {
        PhaseType.Construction => "construction",
        PhaseType.Homologation => "homologation",
        PhaseType.GoLive => "go-live",
        PhaseType.AssistedOperation => "assisted-operation",
        PhaseType.Maintenance => "maintenance",
        _ => "construction"
    };
}
