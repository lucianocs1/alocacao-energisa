using ResourceFlow.Domain.Entities;

namespace ResourceFlow.Application.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(Guid id);
    Task<List<User>> GetAllAsync();
    Task AddAsync(User user);
    Task UpdateAsync(User user);
    Task DeleteAsync(Guid id);
}

public interface IDepartmentRepository
{
    Task<Department?> GetByIdAsync(Guid id);
    Task<List<Department>> GetAllAsync();
    Task AddAsync(Department department);
    Task UpdateAsync(Department department);
}
