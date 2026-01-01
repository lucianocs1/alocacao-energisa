using System.ComponentModel.DataAnnotations;

namespace ResourceFlow.Domain.Entities;

public class CalendarEvent
{
    public Guid Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    public DateTime Date { get; set; }
    
    [Required]
    public CalendarEventType Type { get; set; }
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    /// <summary>
    /// Se true, afeta todos os departamentos. Se false, verificar DepartmentId.
    /// </summary>
    public bool IsCompanyWide { get; set; } = true;
    
    /// <summary>
    /// Se não for company-wide, qual departamento é afetado
    /// </summary>
    public Guid? DepartmentId { get; set; }
    public Department? Department { get; set; }
    
    /// <summary>
    /// Quantas horas de trabalho são perdidas neste dia (padrão: 8 = dia inteiro)
    /// </summary>
    public int HoursLost { get; set; } = 8;
    
    /// <summary>
    /// Ano de referência para facilitar consultas
    /// </summary>
    public int Year { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum CalendarEventType
{
    /// <summary>
    /// Feriado nacional/estadual/municipal
    /// </summary>
    Holiday = 1,
    
    /// <summary>
    /// Dia ponte (emenda de feriado)
    /// </summary>
    BridgeDay = 2,
    
    /// <summary>
    /// Recesso (ex: fim de ano)
    /// </summary>
    Recess = 3,
    
    /// <summary>
    /// Ponto facultativo
    /// </summary>
    OptionalDay = 4
}
