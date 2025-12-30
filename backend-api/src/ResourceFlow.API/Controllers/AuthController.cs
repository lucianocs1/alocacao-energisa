using Microsoft.AspNetCore.Mvc;
using ResourceFlow.Application.DTOs.Auth;
using ResourceFlow.Application.Interfaces;
using ResourceFlow.Domain.Entities;

namespace ResourceFlow.API.Controllers;

[ApiController]
[Route("api/autenticacao")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("entrar")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _authService.LoginAsync(request.Email, request.Password);

        if (!result.Success)
        {
            return Unauthorized(new LoginResponse
            {
                Success = false,
                Message = result.Message
            });
        }

        var userDto = MapUserToDto(result.User);

        return Ok(new LoginResponse
        {
            Success = true,
            Message = result.Message,
            User = userDto,
            Token = result.Token
        });
    }

    [HttpPost("registrar")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (request.Password != request.ConfirmPassword)
        {
            return BadRequest(new { message = "As senhas não conferem." });
        }

        // Validação básica
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Todos os campos são obrigatórios." });
        }

        // Por padrão, novos usuários são registrados como coordenadores
        var result = await _authService.RegisterAsync(
            request.Email,
            request.FullName,
            request.Password,
            Domain.Entities.UserRole.Coordinator
        );

        if (!result.Success)
        {
            return BadRequest(new LoginResponse
            {
                Success = false,
                Message = result.Message
            });
        }

        var userDto = MapUserToDto(result.User);

        return Ok(new LoginResponse
        {
            Success = true,
            Message = result.Message,
            User = userDto,
            Token = result.Token
        });
    }

    private UserDto MapUserToDto(Domain.Entities.User? user)
    {
        if (user == null)
            return null!;

        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Role = TranslateRole(user.Role),
            DepartmentId = user.DepartmentId,
            DepartmentName = user.Department?.Name,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        };
    }

    private string TranslateRole(UserRole role)
    {
        return role switch
        {
            UserRole.Manager => "Gerente",
            UserRole.Coordinator => "Coordenador",
            _ => role.ToString()
        };
    }
}
