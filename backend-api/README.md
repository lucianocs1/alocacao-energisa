# Resource Flow API

Sistema de gestão de alocação de recursos utilizando .NET 8 com Clean Architecture.

## 🏗️ Arquitetura

O projeto segue os princípios de **Clean Architecture** com separação clara de responsabilidades:

### Camadas

- **ResourceFlow.Domain**: Camada de domínio contendo entidades e regras de negócio
- **ResourceFlow.Application**: Camada de aplicação com DTOs, Services e Interfaces
- **ResourceFlow.Infrastructure**: Camada de infraestrutura com DbContext e Repositories
- **ResourceFlow.API**: Camada de API com Controllers e configurações

## 🔐 Autenticação

O sistema utiliza **JWT (JSON Web Token)** para autenticação com dois tipos de usuários:

### Manager (Gerente)
- ✅ Acesso total ao sistema
- ✅ Visualizar todas as alocações
- ✅ Gerenciar usuários e departamentos

### Coordinator (Coordenador)
- ✅ Acesso restrito ao seu departamento
- ✅ Visualizar alocações da sua mesa
- ✅ Gerenciar alocações do departamento

## 📊 Banco de Dados

**PostgreSQL** com as seguintes tabelas:
- `users` - Usuários do sistema
- `departments` - Departamentos (Contábil, Fiscal, etc.)

## 🚀 Quick Start

### Pré-requisitos
- .NET 8.0 SDK
- PostgreSQL 13+

### Setup

1. **Restaurar dependências**
```bash
cd backend-api/src/ResourceFlow.API
dotnet restore
```

2. **Aplicar migrations**
```bash
dotnet ef database update --project ../ResourceFlow.Infrastructure
```

3. **Executar a API**
```bash
dotnet run
```

API disponível em `https://localhost:7000` ou `http://localhost:5000`

## 📚 Endpoints

### Autenticação

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

**Registrar**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "novo@example.com",
  "fullName": "Novo Usuário",
  "password": "senha123",
  "confirmPassword": "senha123"
}
```

## 🔧 Configuração

Arquivo: `src/ResourceFlow.API/appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=recursosen;Username=dono;Password=dono"
  },
  "Jwt": {
    "Secret": "your-secret-key",
    "Issuer": "ResourceFlow",
    "Audience": "ResourceFlowAPI"
  }
}
```

## 📖 Documentação

Ver [SETUP.md](./SETUP.md) para instruções detalhadas de configuração e troubleshooting.

## 🔄 Fluxo de Desenvolvimento

1. Adicionar entidade em `Domain/Entities`
2. Adicionar interfaces em `Application/Interfaces`
3. Implementar repository em `Infrastructure/Repositories`
4. Implementar service em `Application/Services`
5. Criar DTOs em `Application/DTOs`
6. Criar controller em `API/Controllers`
7. Adicionar migration: `dotnet ef migrations add NomeMigration`
8. Aplicar migration: `dotnet ef database update`

## 📝 Roadmap

- [x] Estrutura de Clean Architecture
- [x] Autenticação JWT
- [x] Entity User com roles
- [x] Entity Department
- [ ] API de Projects
- [ ] API de Demands
- [ ] API de Allocations
- [ ] Autorização baseada em roles
- [ ] Validações robustas
- [ ] Logs e Monitoring
- [ ] Testes Unitários
- [ ] Testes de Integração

## 🤝 Contribuindo

1. Criar branch para feature: `git checkout -b feature/nova-feature`
2. Commit: `git commit -am 'Adiciona nova feature'`
3. Push: `git push origin feature/nova-feature`
4. Criar Pull Request

## 📄 Licença

Proprietário

---

**Desenvolvido com ❤️ usando .NET 8 e Clean Architecture**
