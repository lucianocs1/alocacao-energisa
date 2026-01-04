using Microsoft.EntityFrameworkCore;
using ResourceFlow.Domain.Entities;
using System.Security.Cryptography;
using System.Text;

namespace ResourceFlow.Infrastructure.Data;

public static class DataSeeder
{
    public static void Seed(ApplicationDbContext context)
    {
        // Garantir que os departamentos existam
        SeedDepartments(context);
        
        // Criar usuários padrão
        SeedUsers(context);
    }

    private static void SeedDepartments(ApplicationDbContext context)
    {
        if (context.Departments.Any())
        {
            return;
        }

        var departments = new List<Department>
        {
            new Department
            {
                Id = Guid.NewGuid(),
                Name = "Contábil",
                Code = "CONT",
                Description = "Departamento Contábil",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Department
            {
                Id = Guid.NewGuid(),
                Name = "Fiscal",
                Code = "FISC",
                Description = "Departamento Fiscal",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        context.Departments.AddRange(departments);
        context.SaveChanges();
    }

    private static void SeedUsers(ApplicationDbContext context)
    {
        // Verificar se já existem usuários
        if (context.Users.Any())
        {
            return;
        }

        // Obter departamentos existentes
        var departments = context.Departments.ToList();
        var contDept = departments.FirstOrDefault(d => d.Code == "CONT");
        var fiscDept = departments.FirstOrDefault(d => d.Code == "FISC");

        // Criar usuários padrão
        var users = new List<User>
        {
            new User
            {
                Id = Guid.NewGuid(),
                Email = "gerente@resourceflow.com",
                FullName = "Gerente Sistema",
                PasswordHash = HashPassword("senha123"),
                Role = UserRole.Manager,
                DepartmentId = null,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = Guid.NewGuid(),
                Email = "coordenador.contabil@resourceflow.com",
                FullName = "Coordenador Contábil",
                PasswordHash = HashPassword("senha123"),
                Role = UserRole.Coordinator,
                DepartmentId = contDept?.Id,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = Guid.NewGuid(),
                Email = "coordenador.fiscal@resourceflow.com",
                FullName = "Coordenador Fiscal",
                PasswordHash = HashPassword("senha123"),
                Role = UserRole.Coordinator,
                DepartmentId = fiscDept?.Id,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        context.Users.AddRange(users);
        context.SaveChanges();
    }

    private static string HashPassword(string password)
    {
        using (var sha256 = SHA256.Create())
        {
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }
}
