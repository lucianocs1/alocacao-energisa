namespace ResourceFlow.Application.Interfaces;

public interface ITokenService
{
    string GenerateToken(Guid userId, string email, string role);
    bool ValidateToken(string token);
}
