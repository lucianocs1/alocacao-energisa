namespace ResourceFlow.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public Guid? DepartmentId { get; set; } // Para coordenadores, o ID do departamento que coordenam
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }

    // Relacionamentos
    public virtual Department? Department { get; set; }
}

public enum UserRole
{
    Manager = 1,      // Gerente - acesso total
    Coordinator = 2   // Coordenador - acesso restrito ao seu departamento
}
