using System.Security.Cryptography;
using System.Text;
using ResourceFlow.Application.Interfaces;
using ResourceFlow.Domain.Entities;

namespace ResourceFlow.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;

    public AuthService(IUserRepository userRepository, ITokenService tokenService)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
    }

    public async Task<AuthResult> LoginAsync(string email, string password)
    {
        var user = await _userRepository.GetByEmailAsync(email);

        if (user == null || !user.IsActive)
        {
            return new AuthResult
            {
                Success = false,
                Message = "Email ou senha inválidos."
            };
        }

        if (!VerifyPassword(password, user.PasswordHash))
        {
            return new AuthResult
            {
                Success = false,
                Message = "Email ou senha inválidos."
            };
        }

        // Atualizar último login
        user.LastLoginAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);

        var token = _tokenService.GenerateToken(user.Id, user.Email, user.Role.ToString());

        return new AuthResult
        {
            Success = true,
            Message = "Login realizado com sucesso.",
            User = user,
            Token = token
        };
    }

    public async Task<AuthResult> RegisterAsync(string email, string fullName, string password, UserRole role, Guid? departmentId = null)
    {
        var existingUser = await _userRepository.GetByEmailAsync(email);

        if (existingUser != null)
        {
            return new AuthResult
            {
                Success = false,
                Message = "Email já cadastrado."
            };
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            FullName = fullName,
            PasswordHash = HashPassword(password),
            Role = role,
            DepartmentId = departmentId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user);

        var token = _tokenService.GenerateToken(user.Id, user.Email, user.Role.ToString());

        return new AuthResult
        {
            Success = true,
            Message = "Usuário registrado com sucesso.",
            User = user,
            Token = token
        };
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _userRepository.GetByEmailAsync(email);
    }

    public async Task<User?> GetUserByIdAsync(Guid userId)
    {
        return await _userRepository.GetByIdAsync(userId);
    }

    private static string HashPassword(string password)
    {
        using (var sha256 = SHA256.Create())
        {
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }

    private static bool VerifyPassword(string password, string hash)
    {
        var hashOfInput = HashPassword(password);
        return hashOfInput == hash;
    }
}
