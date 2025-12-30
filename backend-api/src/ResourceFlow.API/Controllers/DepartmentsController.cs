using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ResourceFlow.Infrastructure.Data;

namespace ResourceFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DepartmentsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetDepartments()
    {
        var departments = await _context.Departments
            .Where(d => d.IsActive)
            .OrderBy(d => d.Name)
            .Select(d => new
            {
                d.Id,
                d.Name,
                d.Code,
                d.Description
            })
            .ToListAsync();

        return Ok(departments);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDepartment(Guid id)
    {
        var department = await _context.Departments
            .Where(d => d.Id == id && d.IsActive)
            .Select(d => new
            {
                d.Id,
                d.Name,
                d.Code,
                d.Description
            })
            .FirstOrDefaultAsync();

        if (department == null)
        {
            return NotFound();
        }

        return Ok(department);
    }
}
