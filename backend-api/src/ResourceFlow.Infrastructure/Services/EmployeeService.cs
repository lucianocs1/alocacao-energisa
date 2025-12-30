using Microsoft.EntityFrameworkCore;
using ResourceFlow.Application.DTOs.Employees;
using ResourceFlow.Application.Interfaces;
using ResourceFlow.Domain.Entities;
using ResourceFlow.Infrastructure.Data;

namespace ResourceFlow.Infrastructure.Services;

public class EmployeeService : IEmployeeService
{
    private readonly ApplicationDbContext _context;

    public EmployeeService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EmployeeListResponse> GetEmployeesAsync(Guid? departmentId = null)
    {
        var query = _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Vacations)
            .Include(e => e.FixedAllocations)
            .Where(e => e.IsActive);

        if (departmentId.HasValue)
        {
            query = query.Where(e => e.DepartmentId == departmentId.Value);
        }

        var employees = await query.OrderBy(e => e.Name).ToListAsync();

        return new EmployeeListResponse
        {
            Employees = employees.Select(MapToDto).ToList(),
            TotalCount = employees.Count
        };
    }

    public async Task<EmployeeDto?> GetEmployeeByIdAsync(Guid id)
    {
        var employee = await _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Vacations)
            .Include(e => e.FixedAllocations)
            .FirstOrDefaultAsync(e => e.Id == id);

        return employee != null ? MapToDto(employee) : null;
    }

    public async Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeRequest request)
    {
        var employee = new Employee
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Role = request.Role,
            DepartmentId = request.DepartmentId,
            DailyHours = request.DailyHours,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Employees.Add(employee);

        // Adicionar férias
        foreach (var vacation in request.Vacations)
        {
            _context.EmployeeVacations.Add(new EmployeeVacation
            {
                Id = Guid.NewGuid(),
                EmployeeId = employee.Id,
                StartDate = vacation.StartDate,
                EndDate = vacation.EndDate
            });
        }

        // Adicionar alocações fixas
        foreach (var allocation in request.FixedAllocations)
        {
            _context.EmployeeFixedAllocations.Add(new EmployeeFixedAllocation
            {
                Id = Guid.NewGuid(),
                EmployeeId = employee.Id,
                Name = allocation.Name,
                HoursPerMonth = allocation.HoursPerMonth
            });
        }

        await _context.SaveChangesAsync();

        return (await GetEmployeeByIdAsync(employee.Id))!;
    }

    public async Task<EmployeeDto?> UpdateEmployeeAsync(Guid id, UpdateEmployeeRequest request)
    {
        var employee = await _context.Employees.FindAsync(id);
        if (employee == null) return null;

        employee.Name = request.Name;
        employee.Role = request.Role;
        employee.DepartmentId = request.DepartmentId;
        employee.DailyHours = request.DailyHours;
        employee.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetEmployeeByIdAsync(id);
    }

    public async Task<bool> DeleteEmployeeAsync(Guid id)
    {
        var employee = await _context.Employees.FindAsync(id);
        if (employee == null) return false;

        employee.IsActive = false;
        employee.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    // Férias
    public async Task<VacationDto> AddVacationAsync(Guid employeeId, CreateVacationRequest request)
    {
        var vacation = new EmployeeVacation
        {
            Id = Guid.NewGuid(),
            EmployeeId = employeeId,
            StartDate = request.StartDate,
            EndDate = request.EndDate
        };

        _context.EmployeeVacations.Add(vacation);
        await _context.SaveChangesAsync();

        return new VacationDto
        {
            Id = vacation.Id,
            StartDate = vacation.StartDate,
            EndDate = vacation.EndDate
        };
    }

    public async Task<bool> RemoveVacationAsync(Guid employeeId, Guid vacationId)
    {
        var vacation = await _context.EmployeeVacations
            .FirstOrDefaultAsync(v => v.Id == vacationId && v.EmployeeId == employeeId);

        if (vacation == null) return false;

        _context.EmployeeVacations.Remove(vacation);
        await _context.SaveChangesAsync();
        return true;
    }

    // Alocações Fixas
    public async Task<FixedAllocationDto> AddFixedAllocationAsync(Guid employeeId, CreateFixedAllocationRequest request)
    {
        var allocation = new EmployeeFixedAllocation
        {
            Id = Guid.NewGuid(),
            EmployeeId = employeeId,
            Name = request.Name,
            HoursPerMonth = request.HoursPerMonth
        };

        _context.EmployeeFixedAllocations.Add(allocation);
        await _context.SaveChangesAsync();

        return new FixedAllocationDto
        {
            Id = allocation.Id,
            Name = allocation.Name,
            HoursPerMonth = allocation.HoursPerMonth
        };
    }

    public async Task<bool> RemoveFixedAllocationAsync(Guid employeeId, Guid allocationId)
    {
        var allocation = await _context.EmployeeFixedAllocations
            .FirstOrDefaultAsync(a => a.Id == allocationId && a.EmployeeId == employeeId);

        if (allocation == null) return false;

        _context.EmployeeFixedAllocations.Remove(allocation);
        await _context.SaveChangesAsync();
        return true;
    }

    // Cargos
    public Task<RolesListResponse> GetRolesAsync()
    {
        var roles = EmployeeRoles.All.Select(r => new RoleDto
        {
            Value = r,
            Label = r
        }).ToList();

        return Task.FromResult(new RolesListResponse { Roles = roles });
    }

    private static EmployeeDto MapToDto(Employee employee)
    {
        return new EmployeeDto
        {
            Id = employee.Id,
            Name = employee.Name,
            Role = employee.Role,
            TeamId = employee.DepartmentId,
            TeamName = employee.Department?.Name,
            DailyHours = employee.DailyHours,
            IsActive = employee.IsActive,
            CreatedAt = employee.CreatedAt,
            Vacations = employee.Vacations.Select(v => new VacationDto
            {
                Id = v.Id,
                StartDate = v.StartDate,
                EndDate = v.EndDate
            }).ToList(),
            FixedAllocations = employee.FixedAllocations.Select(f => new FixedAllocationDto
            {
                Id = f.Id,
                Name = f.Name,
                HoursPerMonth = f.HoursPerMonth
            }).ToList()
        };
    }
}
