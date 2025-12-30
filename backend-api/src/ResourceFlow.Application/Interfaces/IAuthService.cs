using ResourceFlow.Domain.Entities;

namespace ResourceFlow.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResult> LoginAsync(string email, string password);
    Task<AuthResult> RegisterAsync(string email, string fullName, string password, UserRole role, Guid? departmentId = null);
    Task<User?> GetUserByEmailAsync(string email);
    Task<User?> GetUserByIdAsync(Guid userId);
}

public class AuthResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public User? User { get; set; }
    public string? Token { get; set; }
}
