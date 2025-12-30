using ResourceFlow.Application.DTOs.Employees;

namespace ResourceFlow.Application.Interfaces;

public interface IEmployeeService
{
    Task<EmployeeListResponse> GetEmployeesAsync(Guid? departmentId = null);
    Task<EmployeeDto?> GetEmployeeByIdAsync(Guid id);
    Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeRequest request);
    Task<EmployeeDto?> UpdateEmployeeAsync(Guid id, UpdateEmployeeRequest request);
    Task<bool> DeleteEmployeeAsync(Guid id);
    
    // Férias
    Task<VacationDto> AddVacationAsync(Guid employeeId, CreateVacationRequest request);
    Task<bool> RemoveVacationAsync(Guid employeeId, Guid vacationId);
    
    // Alocações Fixas
    Task<FixedAllocationDto> AddFixedAllocationAsync(Guid employeeId, CreateFixedAllocationRequest request);
    Task<bool> RemoveFixedAllocationAsync(Guid employeeId, Guid allocationId);
    
    // Cargos
    Task<RolesListResponse> GetRolesAsync();
}
