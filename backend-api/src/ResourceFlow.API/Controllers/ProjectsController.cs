using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResourceFlow.Application.DTOs.Projects;
using ResourceFlow.Application.Interfaces;
using System.Security.Claims;

namespace ResourceFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    /// <summary>
    /// Obtém todos os projetos (Gerentes veem todos, Coordenadores veem apenas da sua equipe)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ProjectListResponse>> GetProjects([FromQuery] Guid? teamId = null)
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var userDepartmentId = User.FindFirst("DepartmentId")?.Value;

        // Se for coordenador, filtrar por equipe
        if (userRole == "Coordinator" && !string.IsNullOrEmpty(userDepartmentId))
        {
            var departmentId = Guid.Parse(userDepartmentId);
            var result = await _projectService.GetProjectsByTeamAsync(departmentId);
            return Ok(result);
        }

        // Se teamId foi especificado, filtrar
        if (teamId.HasValue)
        {
            var result = await _projectService.GetProjectsByTeamAsync(teamId.Value);
            return Ok(result);
        }

        // Gerente vê todos
        return Ok(await _projectService.GetAllProjectsAsync());
    }

    /// <summary>
    /// Obtém um projeto por ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProjectDto>> GetProject(Guid id)
    {
        var project = await _projectService.GetProjectByIdAsync(id);
        if (project == null)
            return NotFound(new { message = "Projeto não encontrado" });

        return Ok(project);
    }

    /// <summary>
    /// Cria um novo projeto (apenas Gerentes)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ProjectDto>> CreateProject([FromBody] CreateProjectRequest request)
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "Manager")
        {
            return Forbid();
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Usuário não identificado" });
        }

        try
        {
            var project = await _projectService.CreateProjectAsync(request, userId);
            return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Atualiza um projeto (apenas Gerentes)
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ProjectDto>> UpdateProject(Guid id, [FromBody] UpdateProjectRequest request)
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "Manager")
        {
            return Forbid();
        }

        var project = await _projectService.UpdateProjectAsync(id, request);
        if (project == null)
            return NotFound(new { message = "Projeto não encontrado" });

        return Ok(project);
    }

    /// <summary>
    /// Deleta um projeto (soft delete - apenas Gerentes)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteProject(Guid id)
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "Manager")
        {
            return Forbid();
        }

        var deleted = await _projectService.DeleteProjectAsync(id);
        if (!deleted)
            return NotFound(new { message = "Projeto não encontrado" });

        return NoContent();
    }

    // ========== Demandas ==========

    /// <summary>
    /// Obtém uma demanda por ID
    /// </summary>
    [HttpGet("demands/{id:guid}")]
    public async Task<ActionResult<DemandDto>> GetDemand(Guid id)
    {
        var demand = await _projectService.GetDemandByIdAsync(id);
        if (demand == null)
            return NotFound(new { message = "Demanda não encontrada" });

        return Ok(demand);
    }

    /// <summary>
    /// Adiciona uma demanda a um projeto
    /// </summary>
    [HttpPost("{projectId:guid}/demands")]
    public async Task<ActionResult<DemandDto>> AddDemand(Guid projectId, [FromBody] CreateDemandRequest request)
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "Manager")
        {
            return Forbid();
        }

        try
        {
            var demand = await _projectService.AddDemandToProjectAsync(projectId, request);
            return CreatedAtAction(nameof(GetDemand), new { id = demand.Id }, demand);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Atualiza uma demanda
    /// </summary>
    [HttpPut("demands/{id:guid}")]
    public async Task<ActionResult<DemandDto>> UpdateDemand(Guid id, [FromBody] UpdateDemandRequest request)
    {
        var demand = await _projectService.UpdateDemandAsync(id, request);
        if (demand == null)
            return NotFound(new { message = "Demanda não encontrada" });

        return Ok(demand);
    }

    /// <summary>
    /// Deleta uma demanda
    /// </summary>
    [HttpDelete("demands/{id:guid}")]
    public async Task<ActionResult> DeleteDemand(Guid id)
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "Manager")
        {
            return Forbid();
        }

        var deleted = await _projectService.DeleteDemandAsync(id);
        if (!deleted)
            return NotFound(new { message = "Demanda não encontrada" });

        return NoContent();
    }

    // ========== Estatísticas ==========

    /// <summary>
    /// Obtém estatísticas dos projetos
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<ProjectStatsDto>> GetStats([FromQuery] Guid? teamId = null)
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var userDepartmentId = User.FindFirst("DepartmentId")?.Value;

        // Se for coordenador, usar sua equipe
        if (userRole == "Coordinator" && !string.IsNullOrEmpty(userDepartmentId))
        {
            var departmentId = Guid.Parse(userDepartmentId);
            return Ok(await _projectService.GetProjectStatsAsync(departmentId));
        }

        return Ok(await _projectService.GetProjectStatsAsync(teamId));
    }
}
