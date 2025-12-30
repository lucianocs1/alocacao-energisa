import api from './api';
import { Employee, VacationPeriod, FixedAllocation } from '@/types/planner';

// ========== Types ==========

interface EmployeeDto {
  id: string;
  name: string;
  role: string;
  teamId: string;
  teamName?: string;
  dailyHours: number;
  isActive: boolean;
  createdAt: string;
  vacations: VacationDto[];
  fixedAllocations: FixedAllocationDto[];
}

interface VacationDto {
  id: string;
  startDate: string;
  endDate: string;
}

interface FixedAllocationDto {
  id: string;
  name: string;
  hoursPerMonth: number;
}

interface EmployeeListResponse {
  employees: EmployeeDto[];
  totalCount: number;
}

interface RoleDto {
  value: string;
  label: string;
}

interface RolesListResponse {
  roles: RoleDto[];
}

interface CreateEmployeeRequest {
  name: string;
  role: string;
  departmentId: string;
  dailyHours: number;
  vacations: { startDate: string; endDate: string }[];
  fixedAllocations: { name: string; hoursPerMonth: number }[];
}

interface UpdateEmployeeRequest {
  name: string;
  role: string;
  departmentId: string;
  dailyHours: number;
}

// ========== Helper Functions ==========

const mapDtoToEmployee = (dto: EmployeeDto): Employee => ({
  id: dto.id,
  name: dto.name,
  role: dto.role,
  teamId: dto.teamId,
  dailyHours: dto.dailyHours,
  vacations: dto.vacations.map(v => ({
    id: v.id,
    startDate: new Date(v.startDate),
    endDate: new Date(v.endDate),
  })),
  fixedAllocations: dto.fixedAllocations.map(f => ({
    id: f.id,
    name: f.name,
    hoursPerMonth: f.hoursPerMonth,
  })),
});

// ========== API Service ==========

export const employeeService = {
  async getEmployees(departmentId?: string): Promise<Employee[]> {
    try {
      const params = departmentId ? { departmentId } : {};
      const response = await api.get<EmployeeListResponse>('/api/employees', { params });
      return response.data.employees.map(mapDtoToEmployee);
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      return [];
    }
  },

  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const response = await api.get<EmployeeDto>(`/api/employees/${id}`);
      return mapDtoToEmployee(response.data);
    } catch (error) {
      console.error('Erro ao buscar funcionário:', error);
      return null;
    }
  },

  async createEmployee(data: {
    name: string;
    role: string;
    departmentId: string;
    dailyHours: number;
    vacations?: { startDate: Date; endDate: Date }[];
    fixedAllocations?: { name: string; hoursPerMonth: number }[];
  }): Promise<Employee | null> {
    try {
      const request: CreateEmployeeRequest = {
        name: data.name,
        role: data.role,
        departmentId: data.departmentId,
        dailyHours: data.dailyHours,
        vacations: data.vacations?.map(v => ({
          startDate: v.startDate.toISOString(),
          endDate: v.endDate.toISOString(),
        })) || [],
        fixedAllocations: data.fixedAllocations || [],
      };
      const response = await api.post<EmployeeDto>('/api/employees', request);
      return mapDtoToEmployee(response.data);
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
      return null;
    }
  },

  async updateEmployee(id: string, data: {
    name: string;
    role: string;
    departmentId: string;
    dailyHours: number;
  }): Promise<Employee | null> {
    try {
      const request: UpdateEmployeeRequest = {
        name: data.name,
        role: data.role,
        departmentId: data.departmentId,
        dailyHours: data.dailyHours,
      };
      const response = await api.put<EmployeeDto>(`/api/employees/${id}`, request);
      return mapDtoToEmployee(response.data);
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      return null;
    }
  },

  async deleteEmployee(id: string): Promise<boolean> {
    try {
      await api.delete(`/api/employees/${id}`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar funcionário:', error);
      return false;
    }
  },

  // Férias
  async addVacation(employeeId: string, startDate: Date, endDate: Date): Promise<VacationPeriod | null> {
    try {
      const response = await api.post<VacationDto>(`/api/employees/${employeeId}/vacations`, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      return {
        id: response.data.id,
        startDate: new Date(response.data.startDate),
        endDate: new Date(response.data.endDate),
      };
    } catch (error) {
      console.error('Erro ao adicionar férias:', error);
      return null;
    }
  },

  async removeVacation(employeeId: string, vacationId: string): Promise<boolean> {
    try {
      await api.delete(`/api/employees/${employeeId}/vacations/${vacationId}`);
      return true;
    } catch (error) {
      console.error('Erro ao remover férias:', error);
      return false;
    }
  },

  // Alocações Fixas
  async addFixedAllocation(employeeId: string, name: string, hoursPerMonth: number): Promise<FixedAllocation | null> {
    try {
      const response = await api.post<FixedAllocationDto>(`/api/employees/${employeeId}/fixed-allocations`, {
        name,
        hoursPerMonth,
      });
      return {
        id: response.data.id,
        name: response.data.name,
        hoursPerMonth: response.data.hoursPerMonth,
      };
    } catch (error) {
      console.error('Erro ao adicionar alocação fixa:', error);
      return null;
    }
  },

  async removeFixedAllocation(employeeId: string, allocationId: string): Promise<boolean> {
    try {
      await api.delete(`/api/employees/${employeeId}/fixed-allocations/${allocationId}`);
      return true;
    } catch (error) {
      console.error('Erro ao remover alocação fixa:', error);
      return false;
    }
  },

  // Cargos
  async getRoles(): Promise<{ value: string; label: string }[]> {
    try {
      const response = await api.get<RolesListResponse>('/api/employees/roles');
      return response.data.roles;
    } catch (error) {
      console.error('Erro ao buscar cargos:', error);
      return [];
    }
  },
};
