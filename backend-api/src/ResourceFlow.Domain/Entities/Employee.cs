namespace ResourceFlow.Domain.Entities;

public class Employee
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // Cargo
    public Guid DepartmentId { get; set; }
    public int DailyHours { get; set; } = 8;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Relacionamentos
    public virtual Department Department { get; set; } = null!;
    public virtual ICollection<EmployeeVacation> Vacations { get; set; } = new List<EmployeeVacation>();
    public virtual ICollection<EmployeeFixedAllocation> FixedAllocations { get; set; } = new List<EmployeeFixedAllocation>();
}

public class EmployeeVacation
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    // Relacionamentos
    public virtual Employee Employee { get; set; } = null!;
}

public class EmployeeFixedAllocation
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int HoursPerMonth { get; set; }

    // Relacionamentos
    public virtual Employee Employee { get; set; } = null!;
}

// Cargos disponíveis
public static class EmployeeRoles
{
    public const string ProgramadorSistemasI = "Programador Sistemas I";
    public const string ProgramadorSistemasII = "Programador Sistemas II";
    public const string ProgramadorSistemasIII = "Programador Sistemas III";
    public const string AnalistaDesenvSistemasI = "Anl. Desenvolv. Sistemas I";
    public const string AnalistaDesenvSistemasII = "Anl. Desenvolv. Sistemas II";
    public const string AnalistaDesenvSistemasIII = "Anl. Desenvolv. Sistemas III";
    public const string EspecialistaDesenvSistemas = "Esp. Desenlv. Sistemas";
    public const string ProductOwner = "Product Owner";

    public static readonly string[] All = new[]
    {
        ProgramadorSistemasI,
        ProgramadorSistemasII,
        ProgramadorSistemasIII,
        AnalistaDesenvSistemasI,
        AnalistaDesenvSistemasII,
        AnalistaDesenvSistemasIII,
        EspecialistaDesenvSistemas,
        ProductOwner
    };
}
