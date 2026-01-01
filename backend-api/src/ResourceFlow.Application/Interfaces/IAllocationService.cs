using ResourceFlow.Application.DTOs.Allocations;

namespace ResourceFlow.Application.Interfaces;

public interface IAllocationService
{
    /// <summary>
    /// Obtém todos os dados necessários para a página de alocação
    /// </summary>
    Task<AllocationPageDataResponse> GetAllocationPageDataAsync(Guid? teamId = null, int? year = null);

    /// <summary>
    /// Obtém todas as alocações com filtros opcionais
    /// </summary>
    Task<AllocationListResponse> GetAllocationsAsync(Guid? teamId = null, Guid? employeeId = null, int? year = null);

    /// <summary>
    /// Obtém uma alocação por ID
    /// </summary>
    Task<AllocationDto?> GetAllocationByIdAsync(Guid id);

    /// <summary>
    /// Cria uma nova alocação
    /// </summary>
    Task<AllocationDto> CreateAllocationAsync(CreateAllocationRequest request);

    /// <summary>
    /// Cria múltiplas alocações de uma vez
    /// </summary>
    Task<List<AllocationDto>> CreateBulkAllocationsAsync(BulkCreateAllocationRequest request);

    /// <summary>
    /// Atualiza uma alocação existente (apenas horas)
    /// </summary>
    Task<AllocationDto?> UpdateAllocationAsync(Guid id, UpdateAllocationRequest request);

    /// <summary>
    /// Remove uma alocação
    /// </summary>
    Task<bool> DeleteAllocationAsync(Guid id);

    /// <summary>
    /// Remove todas as alocações de um funcionário em uma demanda/mês específico
    /// </summary>
    Task<bool> DeleteAllocationsByFilterAsync(Guid employeeId, Guid demandId, int month, int year);
}
