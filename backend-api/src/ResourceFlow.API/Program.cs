using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using ResourceFlow.Application.Interfaces;
using ResourceFlow.Application.Services;
using ResourceFlow.Infrastructure.Data;
using ResourceFlow.Infrastructure.Repositories;
using ResourceFlow.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "your-super-secret-key-that-should-be-at-least-32-characters-long";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ResourceFlow";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ResourceFlowAPI";

// Configuração do banco de dados
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// Configuração de Autenticação JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// Registro de Serviços
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IAllocationService, AllocationService>();
builder.Services.AddScoped<ICalendarService, CalendarService>();
builder.Services.AddScoped<ITokenService>(sp =>
    new TokenService(jwtSecret, jwtIssuer, jwtAudience, 1440));

// Configuração de Controllers
builder.Services.AddControllers();

// Configuração de CORS
var allowedOrigins = builder.Configuration["CORS:AllowedOrigins"]?.Split(',') 
    ?? new[] { "http://localhost:8080", "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Aplicar Migrations e Seed automaticamente
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    try
    {
        logger.LogInformation("Aplicando migrations...");
        dbContext.Database.Migrate();
        logger.LogInformation("Migrations aplicadas com sucesso.");
        
        logger.LogInformation("Executando seed de dados...");
        DataSeeder.Seed(dbContext);
        logger.LogInformation("Seed executado com sucesso.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Erro ao aplicar migrations ou seed.");
        throw;
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check endpoint para o Render
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.Run();
