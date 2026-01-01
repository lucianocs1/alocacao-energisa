FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/ResourceFlow.API/ResourceFlow.API.csproj", "ResourceFlow.API/"]
COPY ["src/ResourceFlow.Application/ResourceFlow.Application.csproj", "ResourceFlow.Application/"]
COPY ["src/ResourceFlow.Domain/ResourceFlow.Domain.csproj", "ResourceFlow.Domain/"]
COPY ["src/ResourceFlow.Infrastructure/ResourceFlow.Infrastructure.csproj", "ResourceFlow.Infrastructure/"]
RUN dotnet restore "ResourceFlow.API/ResourceFlow.API.csproj"
COPY src/ .
WORKDIR "/src/ResourceFlow.API"
RUN dotnet build "ResourceFlow.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ResourceFlow.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENTRYPOINT ["dotnet", "ResourceFlow.API.dll"]
