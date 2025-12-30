using ResourceFlow.Application.DTOs.Projects;

namespace ResourceFlow.Application.Interfaces;

public interface IProjectService
{
    Task<ProjectListResponse> GetAllProjectsAsync();
    Task<ProjectListResponse> GetProjectsByTeamAsync(Guid teamId);
    Task<ProjectDto?> GetProjectByIdAsync(Guid id);
    Task<ProjectDto> CreateProjectAsync(CreateProjectRequest request, Guid userId);
    Task<ProjectDto?> UpdateProjectAsync(Guid id, UpdateProjectRequest request);
    Task<bool> DeleteProjectAsync(Guid id);
    
    // Demandas
    Task<DemandDto?> GetDemandByIdAsync(Guid id);
    Task<DemandDto> AddDemandToProjectAsync(Guid projectId, CreateDemandRequest request);
    Task<DemandDto?> UpdateDemandAsync(Guid id, UpdateDemandRequest request);
    Task<bool> DeleteDemandAsync(Guid id);
    
    // Estatísticas
    Task<ProjectStatsDto> GetProjectStatsAsync(Guid? teamId = null);
}
