using Microsoft.EntityFrameworkCore;
using ResourceFlow.Domain.Entities;

namespace ResourceFlow.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Department> Departments { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<Demand> Demands { get; set; }
    public DbSet<DemandPhase> DemandPhases { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<EmployeeVacation> EmployeeVacations { get; set; }
    public DbSet<EmployeeFixedAllocation> EmployeeFixedAllocations { get; set; }
    public DbSet<Allocation> Allocations { get; set; }
    public DbSet<CalendarEvent> CalendarEvents { get; set; }
    public DbSet<EmployeeLoan> EmployeeLoans { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configuração da entidade User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.Role).IsRequired();
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Índices
            entity.HasIndex(e => e.Email).IsUnique();

            // Relacionamento com Department
            entity.HasOne(e => e.Department)
                .WithMany(d => d.Coordinators)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Configuração da entidade Department
        modelBuilder.Entity<Department>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Índices
            entity.HasIndex(e => e.Code).IsUnique();
        });

        // Configuração da entidade Project
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Color).HasMaxLength(50);
            entity.Property(e => e.Priority).IsRequired();
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Índices
            entity.HasIndex(e => e.Code).IsUnique();

            // Relacionamento com User (criador)
            entity.HasOne(e => e.CreatedBy)
                .WithMany()
                .HasForeignKey(e => e.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuração da entidade Demand
        modelBuilder.Entity<Demand>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.TotalHours).IsRequired();
            entity.Property(e => e.AllocatedHours).HasDefaultValue(0);
            entity.Property(e => e.Status).IsRequired();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Relacionamento com Project
            entity.HasOne(e => e.Project)
                .WithMany(p => p.Demands)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relacionamento com Department (Team)
            entity.HasOne(e => e.Team)
                .WithMany()
                .HasForeignKey(e => e.TeamId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuração da entidade DemandPhase
        modelBuilder.Entity<DemandPhase>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(255);
            entity.Property(e => e.IsMilestone).HasDefaultValue(false);

            // Relacionamento com Demand
            entity.HasOne(e => e.Demand)
                .WithMany(d => d.Phases)
                .HasForeignKey(e => e.DemandId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configuração da entidade Employee
        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Role).IsRequired().HasMaxLength(100);
            entity.Property(e => e.DailyHours).HasDefaultValue(8);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Relacionamento com Department
            entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuração da entidade EmployeeVacation
        modelBuilder.Entity<EmployeeVacation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.StartDate).IsRequired();
            entity.Property(e => e.EndDate).IsRequired();

            // Relacionamento com Employee
            entity.HasOne(e => e.Employee)
                .WithMany(emp => emp.Vacations)
                .HasForeignKey(e => e.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configuração da entidade EmployeeFixedAllocation
        modelBuilder.Entity<EmployeeFixedAllocation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.HoursPerMonth).IsRequired();

            // Relacionamento com Employee
            entity.HasOne(e => e.Employee)
                .WithMany(emp => emp.FixedAllocations)
                .HasForeignKey(e => e.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configuração da entidade Allocation
        modelBuilder.Entity<Allocation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Month).IsRequired();
            entity.Property(e => e.Year).IsRequired();
            entity.Property(e => e.Hours).IsRequired();
            entity.Property(e => e.IsLoan).HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Relacionamento com Employee
            entity.HasOne(e => e.Employee)
                .WithMany()
                .HasForeignKey(e => e.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relacionamento com Demand
            entity.HasOne(e => e.Demand)
                .WithMany()
                .HasForeignKey(e => e.DemandId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relacionamento com Project
            entity.HasOne(e => e.Project)
                .WithMany()
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relacionamento com Department (SourceTeam)
            entity.HasOne(e => e.SourceTeam)
                .WithMany()
                .HasForeignKey(e => e.SourceTeamId)
                .OnDelete(DeleteBehavior.SetNull);

            // Índice composto para evitar duplicação
            entity.HasIndex(e => new { e.EmployeeId, e.DemandId, e.Month, e.Year })
                .IsUnique();
        });

        // Configuração da entidade CalendarEvent
        modelBuilder.Entity<CalendarEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Date).IsRequired();
            entity.Property(e => e.Type).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IsCompanyWide).HasDefaultValue(true);
            entity.Property(e => e.HoursLost).HasDefaultValue(8);
            entity.Property(e => e.Year).IsRequired();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Relacionamento com Department
            entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

            // Índices
            entity.HasIndex(e => e.Year);
            entity.HasIndex(e => e.Date);
            entity.HasIndex(e => new { e.Year, e.Type });
        });

        // Configuração da entidade EmployeeLoan
        modelBuilder.Entity<EmployeeLoan>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Reason).HasMaxLength(500);
            entity.Property(e => e.Notes).HasMaxLength(1000);
            entity.Property(e => e.StartDate).IsRequired();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Relacionamento com Employee
            entity.HasOne(e => e.Employee)
                .WithMany()
                .HasForeignKey(e => e.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relacionamento com SourceDepartment
            entity.HasOne(e => e.SourceDepartment)
                .WithMany()
                .HasForeignKey(e => e.SourceDepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relacionamento com TargetDepartment
            entity.HasOne(e => e.TargetDepartment)
                .WithMany()
                .HasForeignKey(e => e.TargetDepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relacionamento com User (quem solicitou)
            entity.HasOne(e => e.RequestedByUser)
                .WithMany()
                .HasForeignKey(e => e.RequestedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            // Índices
            entity.HasIndex(e => e.EmployeeId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => new { e.TargetDepartmentId, e.Status });
            entity.HasIndex(e => new { e.SourceDepartmentId, e.Status });
        });
    }
}
