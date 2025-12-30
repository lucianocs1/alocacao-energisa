import { AzureWorkItem, AzureDevOpsConfig, TimeEntry } from '@/types/planner';

// Configuração padrão - será substituída por variáveis de ambiente em produção
const defaultConfig: AzureDevOpsConfig = {
  organization: 'sua-org',
  project: 'seu-projeto',
  areaPathMapping: {
    'team-obras': 'Projeto\\Obras de Dis. e Tra.',
    'team-contabil': 'Projeto\\Contábil',
    'team-financeiro': 'Projeto\\Financeiro',
  },
};

// URLs base da API do Azure DevOps
const getBaseUrl = (config: AzureDevOpsConfig) =>
  `https://dev.azure.com/${config.organization}/${config.project}/_apis`;

// Headers para autenticação
const getHeaders = (pat?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (pat) {
    headers['Authorization'] = `Basic ${btoa(`:${pat}`)}`;
  }

  return headers;
};

/**
 * Busca Work Items por query WIQL
 */
export async function queryWorkItems(
  wiql: string,
  config: AzureDevOpsConfig = defaultConfig
): Promise<AzureWorkItem[]> {
  try {
    // 1. Executar a query WIQL para obter IDs
    const queryResponse = await fetch(
      `${getBaseUrl(config)}/wit/wiql?api-version=7.0`,
      {
        method: 'POST',
        headers: getHeaders(config.personalAccessToken),
        body: JSON.stringify({ query: wiql }),
      }
    );

    if (!queryResponse.ok) {
      throw new Error(`Azure DevOps query failed: ${queryResponse.statusText}`);
    }

    const queryResult = await queryResponse.json();
    const workItemIds: number[] = queryResult.workItems?.map((wi: { id: number }) => wi.id) || [];

    if (workItemIds.length === 0) {
      return [];
    }

    // 2. Buscar detalhes dos Work Items (em lotes de 200)
    const batchSize = 200;
    const allWorkItems: AzureWorkItem[] = [];

    for (let i = 0; i < workItemIds.length; i += batchSize) {
      const batchIds = workItemIds.slice(i, i + batchSize);
      const detailsResponse = await fetch(
        `${getBaseUrl(config)}/wit/workitems?ids=${batchIds.join(',')}&$expand=all&api-version=7.0`,
        {
          headers: getHeaders(config.personalAccessToken),
        }
      );

      if (!detailsResponse.ok) {
        throw new Error(`Failed to fetch work item details: ${detailsResponse.statusText}`);
      }

      const detailsResult = await detailsResponse.json();
      const workItems = detailsResult.value.map(mapAzureWorkItem);
      allWorkItems.push(...workItems);
    }

    return allWorkItems;
  } catch (error) {
    console.error('Error querying Azure DevOps:', error);
    throw error;
  }
}

/**
 * Busca Work Items por Area Path (Mesa/Equipe)
 */
export async function getWorkItemsByAreaPath(
  areaPath: string,
  config: AzureDevOpsConfig = defaultConfig
): Promise<AzureWorkItem[]> {
  const wiql = `
    SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo],
           [Microsoft.VSTS.Scheduling.OriginalEstimate],
           [Microsoft.VSTS.Scheduling.CompletedWork],
           [Microsoft.VSTS.Scheduling.RemainingWork]
    FROM WorkItems
    WHERE [System.AreaPath] UNDER '${areaPath}'
      AND [System.State] <> 'Removed'
    ORDER BY [System.ChangedDate] DESC
  `;

  return queryWorkItems(wiql, config);
}

/**
 * Busca Work Items atribuídos a um colaborador
 */
export async function getWorkItemsByAssignee(
  email: string,
  config: AzureDevOpsConfig = defaultConfig
): Promise<AzureWorkItem[]> {
  const wiql = `
    SELECT [System.Id], [System.Title], [System.State],
           [Microsoft.VSTS.Scheduling.OriginalEstimate],
           [Microsoft.VSTS.Scheduling.CompletedWork],
           [Microsoft.VSTS.Scheduling.RemainingWork]
    FROM WorkItems
    WHERE [System.AssignedTo] = '${email}'
      AND [System.State] <> 'Removed'
    ORDER BY [System.ChangedDate] DESC
  `;

  return queryWorkItems(wiql, config);
}

/**
 * Busca Work Items de um período específico
 */
export async function getWorkItemsByPeriod(
  areaPath: string,
  startDate: Date,
  endDate: Date,
  config: AzureDevOpsConfig = defaultConfig
): Promise<AzureWorkItem[]> {
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const wiql = `
    SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo],
           [Microsoft.VSTS.Scheduling.OriginalEstimate],
           [Microsoft.VSTS.Scheduling.CompletedWork],
           [Microsoft.VSTS.Scheduling.RemainingWork]
    FROM WorkItems
    WHERE [System.AreaPath] UNDER '${areaPath}'
      AND [System.ChangedDate] >= '${startStr}'
      AND [System.ChangedDate] <= '${endStr}'
      AND [System.State] <> 'Removed'
    ORDER BY [System.AssignedTo], [System.ChangedDate] DESC
  `;

  return queryWorkItems(wiql, config);
}

/**
 * Mapeia resposta da API para nosso tipo interno
 */
function mapAzureWorkItem(item: any): AzureWorkItem {
  const fields = item.fields || {};

  return {
    id: item.id,
    title: fields['System.Title'] || '',
    workItemType: fields['System.WorkItemType'] || '',
    state: fields['System.State'] || '',
    assignedTo: fields['System.AssignedTo']?.displayName,
    assignedToEmail: fields['System.AssignedTo']?.uniqueName,
    areaPath: fields['System.AreaPath'] || '',
    iterationPath: fields['System.IterationPath'] || '',
    originalEstimate: fields['Microsoft.VSTS.Scheduling.OriginalEstimate'],
    completedWork: fields['Microsoft.VSTS.Scheduling.CompletedWork'],
    remainingWork: fields['Microsoft.VSTS.Scheduling.RemainingWork'],
    parentId: fields['System.Parent'],
    tags: fields['System.Tags']?.split(';').map((t: string) => t.trim()) || [],
    createdDate: new Date(fields['System.CreatedDate']),
    changedDate: new Date(fields['System.ChangedDate']),
  };
}

/**
 * Calcula o total de horas trabalhadas por colaborador
 */
export function calculateWorkedHoursByEmployee(
  workItems: AzureWorkItem[]
): Map<string, number> {
  const hoursByEmployee = new Map<string, number>();

  workItems.forEach((wi) => {
    if (wi.assignedToEmail && wi.completedWork) {
      const current = hoursByEmployee.get(wi.assignedToEmail) || 0;
      hoursByEmployee.set(wi.assignedToEmail, current + wi.completedWork);
    }
  });

  return hoursByEmployee;
}

/**
 * Agrupa Work Items por colaborador
 */
export function groupWorkItemsByEmployee(
  workItems: AzureWorkItem[]
): Map<string, AzureWorkItem[]> {
  const byEmployee = new Map<string, AzureWorkItem[]>();

  workItems.forEach((wi) => {
    const key = wi.assignedToEmail || 'unassigned';
    const items = byEmployee.get(key) || [];
    items.push(wi);
    byEmployee.set(key, items);
  });

  return byEmployee;
}

// ========================================
// Mock Data para desenvolvimento
// ========================================

/**
 * Gera dados mock para desenvolvimento sem conexão com Azure
 */
export function getMockWorkItems(teamId: string): AzureWorkItem[] {
  const mockData: AzureWorkItem[] = [
    {
      id: 1001,
      title: 'Implementar relatório de fechamento',
      workItemType: 'Task',
      state: 'Active',
      assignedTo: 'Marina Costa',
      assignedToEmail: 'marina.costa@energisa.com.br',
      areaPath: defaultConfig.areaPathMapping[teamId] || '',
      iterationPath: 'Sprint 12',
      originalEstimate: 40,
      completedWork: 32,
      remainingWork: 8,
      tags: ['contabilidade', 'relatório'],
      createdDate: new Date(2025, 10, 1),
      changedDate: new Date(2025, 11, 10),
    },
    {
      id: 1002,
      title: 'Revisar lançamentos fiscais',
      workItemType: 'Task',
      state: 'Closed',
      assignedTo: 'Fernanda Lima',
      assignedToEmail: 'fernanda.lima@energisa.com.br',
      areaPath: defaultConfig.areaPathMapping[teamId] || '',
      iterationPath: 'Sprint 12',
      originalEstimate: 24,
      completedWork: 28,
      remainingWork: 0,
      tags: ['fiscal'],
      createdDate: new Date(2025, 10, 5),
      changedDate: new Date(2025, 11, 8),
    },
    {
      id: 1003,
      title: 'Configurar novo plano de contas',
      workItemType: 'Task',
      state: 'Active',
      assignedTo: 'Lucas Ferreira',
      assignedToEmail: 'lucas.ferreira@energisa.com.br',
      areaPath: defaultConfig.areaPathMapping[teamId] || '',
      iterationPath: 'Sprint 12',
      originalEstimate: 16,
      completedWork: 8,
      remainingWork: 8,
      tags: ['configuração'],
      createdDate: new Date(2025, 10, 10),
      changedDate: new Date(2025, 11, 12),
    },
  ];

  return mockData;
}

/**
 * Gera TimeEntries mock baseados nos WorkItems
 */
export function getMockTimeEntries(
  workItems: AzureWorkItem[],
  employeeMapping: Map<string, string> // email -> employeeId
): TimeEntry[] {
  return workItems
    .filter((wi) => wi.completedWork && wi.completedWork > 0)
    .map((wi, index) => ({
      id: `te-${wi.id}-${index}`,
      workItemId: wi.id,
      employeeId: employeeMapping.get(wi.assignedToEmail || '') || '',
      employeeEmail: wi.assignedToEmail || '',
      demandId: 'demand-1', // Será mapeado corretamente em produção
      date: wi.changedDate,
      hours: wi.completedWork || 0,
      description: wi.title,
      source: 'azure' as const,
      syncedAt: new Date(),
    }));
}
