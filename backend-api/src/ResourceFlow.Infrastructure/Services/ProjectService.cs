using Microsoft.EntityFrameworkCore;
using ResourceFlow.Application.DTOs.Projects;
using ResourceFlow.Application.Interfaces;
using ResourceFlow.Domain.Entities;
using ResourceFlow.Infrastructure.Data;

namespace ResourceFlow.Infrastructure.Services;

public class ProjectService : IProjectService
{
    private readonly ApplicationDbContext _context;

    public ProjectService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProjectListResponse> GetAllProjectsAsync()
    {
        var projects = await _context.Projects
            .Include(p => p.Demands)
                .ThenInclude(d => d.Team)
            .Include(p => p.Demands)
                .ThenInclude(d => d.Phases)
            .Where(p => p.IsActive)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return new ProjectListResponse
        {
            Projects = projects.Select(MapToDto).ToList(),
            TotalCount = projects.Count
        };
    }

    public async Task<ProjectListResponse> GetProjectsByTeamAsync(Guid teamId)
    {
        var projects = await _context.Projects
            .Include(p => p.Demands)
                .ThenInclude(d => d.Team)
            .Include(p => p.Demands)
                .ThenInclude(d => d.Phases)
            .Where(p => p.IsActive && p.Demands.Any(d => d.TeamId == teamId))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return new ProjectListResponse
        {
            Projects = projects.Select(MapToDto).ToList(),
            TotalCount = projects.Count
        };
    }

    public async Task<ProjectDto?> GetProjectByIdAsync(Guid id)
    {
        var project = await _context.Projects
            .Include(p => p.Demands)
                .ThenInclude(d => d.Team)
            .Include(p => p.Demands)
                .ThenInclude(d => d.Phases)
            .FirstOrDefaultAsync(p => p.Id == id);

        return project == null ? null : MapToDto(project);
    }

    public async Task<ProjectDto> CreateProjectAsync(CreateProjectRequest request, Guid userId)
    {
        var project = new Project
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Code = GenerateProjectCode(request.Name),
            Description = request.Description,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Color = request.Color,
            Priority = ParsePriority(request.Priority),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedById = userId
        };

        _context.Projects.Add(project);

        // Criar demandas
        foreach (var demandRequest in request.Demands)
        {
            var demand = new Demand
            {
                Id = Guid.NewGuid(),
                ProjectId = project.Id,
                Name = demandRequest.Name,
                Description = demandRequest.Description,
                TeamId = demandRequest.TeamId,
                StartDate = demandRequest.StartDate,
                EndDate = demandRequest.EndDate,
                TotalHours = demandRequest.TotalHours,
                AllocatedHours = 0,
                Status = DemandStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                HmgStartDate = demandRequest.HmgStartDate,
                HmgEndDate = demandRequest.HmgEndDate,
                GoLiveStartDate = demandRequest.GoLiveStartDate,
                GoLiveEndDate = demandRequest.GoLiveEndDate,
                AssistedOpStartDate = demandRequest.AssistedOpStartDate,
                AssistedOpEndDate = demandRequest.AssistedOpEndDate
            };

            _context.Demands.Add(demand);

            // Criar fases da demanda
            foreach (var phaseRequest in demandRequest.Phases)
            {
                var phase = new DemandPhase
                {
                    Id = Guid.NewGuid(),
                    DemandId = demand.Id,
                    Type = ParsePhaseType(phaseRequest.Type),
                    Name = phaseRequest.Name,
                    StartDate = phaseRequest.StartDate,
                    EndDate = phaseRequest.EndDate,
                    IsMilestone = phaseRequest.IsMilestone
                };

                _context.DemandPhases.Add(phase);
            }
        }

        await _context.SaveChangesAsync();

        return (await GetProjectByIdAsync(project.Id))!;
    }

    public async Task<ProjectDto?> UpdateProjectAsync(Guid id, UpdateProjectRequest request)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null) return null;

        project.Name = request.Name;
        project.Code = GenerateProjectCode(request.Name);
        project.Description = request.Description;
        project.StartDate = request.StartDate;
        project.EndDate = request.EndDate;
        project.Color = request.Color;
        project.Priority = ParsePriority(request.Priority);
        project.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetProjectByIdAsync(id);
    }

    public async Task<bool> DeleteProjectAsync(Guid id)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null) return false;

        project.IsActive = false;
        project.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<DemandDto?> GetDemandByIdAsync(Guid id)
    {
        var demand = await _context.Demands
            .Include(d => d.Team)
            .Include(d => d.Phases)
            .FirstOrDefaultAsync(d => d.Id == id);

        return demand == null ? null : MapDemandToDto(demand);
    }

    public async Task<DemandDto> AddDemandToProjectAsync(Guid projectId, CreateDemandRequest request)
    {
        var demand = new Demand
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Name = request.Name,
            Description = request.Description,
            TeamId = request.TeamId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            TotalHours = request.TotalHours,
            AllocatedHours = 0,
            Status = DemandStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            HmgStartDate = request.HmgStartDate,
            HmgEndDate = request.HmgEndDate,
            GoLiveStartDate = request.GoLiveStartDate,
            GoLiveEndDate = request.GoLiveEndDate,
            AssistedOpStartDate = request.AssistedOpStartDate,
            AssistedOpEndDate = request.AssistedOpEndDate
        };

        _context.Demands.Add(demand);

        // Criar fases
        foreach (var phaseRequest in request.Phases)
        {
            var phase = new DemandPhase
            {
                Id = Guid.NewGuid(),
                DemandId = demand.Id,
                Type = ParsePhaseType(phaseRequest.Type),
                Name = phaseRequest.Name,
                StartDate = phaseRequest.StartDate,
                EndDate = phaseRequest.EndDate,
                IsMilestone = phaseRequest.IsMilestone
            };

            _context.DemandPhases.Add(phase);
        }

        await _context.SaveChangesAsync();

        return (await GetDemandByIdAsync(demand.Id))!;
    }

    public async Task<DemandDto?> UpdateDemandAsync(Guid id, UpdateDemandRequest request)
    {
        var demand = await _context.Demands.FindAsync(id);
        if (demand == null) return null;

        demand.Name = request.Name;
        demand.Description = request.Description;
        demand.TeamId = request.TeamId;
        demand.StartDate = request.StartDate;
        demand.EndDate = request.EndDate;
        demand.TotalHours = request.TotalHours;
        demand.AllocatedHours = request.AllocatedHours;
        demand.Status = ParseDemandStatus(request.Status);
        demand.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetDemandByIdAsync(id);
    }

    public async Task<bool> DeleteDemandAsync(Guid id)
    {
        var demand = await _context.Demands
            .Include(d => d.Phases)
            .FirstOrDefaultAsync(d => d.Id == id);
        
        if (demand == null) return false;

        _context.DemandPhases.RemoveRange(demand.Phases);
        _context.Demands.Remove(demand);

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ProjectStatsDto> GetProjectStatsAsync(Guid? teamId = null)
    {
        var demandsQuery = _context.Demands
            .Include(d => d.Project)
            .Where(d => d.Project!.IsActive);

        if (teamId.HasValue)
        {
            demandsQuery = demandsQuery.Where(d => d.TeamId == teamId.Value);
        }

        var demands = await demandsQuery.ToListAsync();
        var projectIds = demands.Select(d => d.ProjectId).Distinct().ToList();

        return new ProjectStatsDto
        {
            TotalProjects = projectIds.Count,
            TotalDemands = demands.Count,
            PendingDemands = demands.Count(d => d.Status == DemandStatus.Pending),
            PartialDemands = demands.Count(d => d.Status == DemandStatus.Partial),
            AllocatedDemands = demands.Count(d => d.Status == DemandStatus.Allocated || d.Status == DemandStatus.InProgress),
            CompletedDemands = demands.Count(d => d.Status == DemandStatus.Completed)
        };
    }

    public async Task<ProjectDemandsSummaryListResponse> GetProjectsDemandsSummaryAsync(Guid? teamId = null)
    {
        var projectsQuery = _context.Projects
            .Include(p => p.Demands)
            .Where(p => p.IsActive);

        // Se teamId foi especificado, filtrar projetos que tenham demandas dessa equipe
        if (teamId.HasValue)
        {
            projectsQuery = projectsQuery.Where(p => p.Demands.Any(d => d.TeamId == teamId.Value));
        }

        var projects = await projectsQuery.OrderByDescending(p => p.CreatedAt).ToListAsync();

        var summaries = projects.Select(p =>
        {
            // Se teamId foi especificado, calcular apenas as horas das demandas dessa equipe
            var relevantDemands = teamId.HasValue
                ? p.Demands.Where(d => d.TeamId == teamId.Value).ToList()
                : p.Demands.ToList();

            return new ProjectDemandsSummaryDto
            {
                Id = p.Id,
                Name = p.Name,
                Code = p.Code,
                Color = p.Color,
                Priority = p.Priority.ToString().ToLower(),
                BudgetHours = relevantDemands.Sum(d => d.TotalHours),
                AllocatedHours = relevantDemands.Sum(d => d.AllocatedHours),
                TeamId = teamId
            };
        }).ToList();

        return new ProjectDemandsSummaryListResponse
        {
            Projects = summaries,
            TotalBudgetHours = summaries.Sum(s => s.BudgetHours),
            TotalAllocatedHours = summaries.Sum(s => s.AllocatedHours),
            OverBudgetProjectsCount = summaries.Count(s => s.AllocatedHours > s.BudgetHours)
        };
    }

    // ========== Helper Methods ==========

    private ProjectDto MapToDto(Project project)
    {
        return new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Code = project.Code,
            Description = project.Description,
            StartDate = project.StartDate,
            EndDate = project.EndDate,
            Color = project.Color,
            Priority = project.Priority.ToString().ToLower(),
            IsActive = project.IsActive,
            CreatedAt = project.CreatedAt,
            Demands = project.Demands.Select(MapDemandToDto).ToList()
        };
    }

    private DemandDto MapDemandToDto(Demand demand)
    {
        return new DemandDto
        {
            Id = demand.Id,
            ProjectId = demand.ProjectId,
            Name = demand.Name,
            Description = demand.Description,
            TeamId = demand.TeamId,
            TeamName = demand.Team?.Name,
            StartDate = demand.StartDate,
            EndDate = demand.EndDate,
            TotalHours = demand.TotalHours,
            AllocatedHours = demand.AllocatedHours,
            Status = MapStatusToString(demand.Status),
            CreatedAt = demand.CreatedAt,
            IsNew = demand.CreatedAt > DateTime.UtcNow.AddDays(-7),
            Phases = demand.Phases.Select(MapPhaseToDto).ToList(),
            HmgStartDate = demand.HmgStartDate,
            HmgEndDate = demand.HmgEndDate,
            GoLiveStartDate = demand.GoLiveStartDate,
            GoLiveEndDate = demand.GoLiveEndDate,
            AssistedOpStartDate = demand.AssistedOpStartDate,
            AssistedOpEndDate = demand.AssistedOpEndDate
        };
    }

    private PhaseDto MapPhaseToDto(DemandPhase phase)
    {
        return new PhaseDto
        {
            Id = phase.Id,
            Type = MapPhaseTypeToString(phase.Type),
            Name = phase.Name,
            StartDate = phase.StartDate,
            EndDate = phase.EndDate,
            IsMilestone = phase.IsMilestone
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

    private ProjectPriority ParsePriority(string priority) => priority.ToLower() switch
    {
        "high" => ProjectPriority.High,
        "medium" => ProjectPriority.Medium,
        "low" => ProjectPriority.Low,
        _ => ProjectPriority.Medium
    };

    private DemandStatus ParseDemandStatus(string status) => status.ToLower() switch
    {
        "pending" => DemandStatus.Pending,
        "partial" => DemandStatus.Partial,
        "allocated" => DemandStatus.Allocated,
        "in-progress" => DemandStatus.InProgress,
        "completed" => DemandStatus.Completed,
        _ => DemandStatus.Pending
    };

    private PhaseType ParsePhaseType(string type) => type.ToLower() switch
    {
        "construction" => PhaseType.Construction,
        "homologation" => PhaseType.Homologation,
        "go-live" => PhaseType.GoLive,
        "assisted-operation" => PhaseType.AssistedOperation,
        "maintenance" => PhaseType.Maintenance,
        _ => PhaseType.Construction
    };

    private string GenerateProjectCode(string projectName)
    {
        // Pega as iniciais do nome do projeto
        var words = projectName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var initials = string.Concat(words.Select(w => char.ToUpper(w[0])));
        
        // Adiciona o ano atual
        var currentYear = DateTime.Now.Year;
        
        return $"{initials}-{currentYear}";
    }
}
