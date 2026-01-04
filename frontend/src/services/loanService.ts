import api from './api';

// DTOs
export interface CreateLoanRequest {
  employeeId: string;
  targetDepartmentId: string;
  startDate: string;
  expectedEndDate?: string;
  reason?: string;
  notes?: string;
}

export interface ReturnLoanRequest {
  notes?: string;
}

export interface LoanDto {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  sourceDepartmentId: string;
  sourceDepartmentName: string;
  targetDepartmentId: string;
  targetDepartmentName: string;
  startDate: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  status: 'Pending' | 'Active' | 'Returned' | 'Rejected' | 'Cancelled';
  reason?: string;
  notes?: string;
  requestedByUserName?: string;
  approvedByUserName?: string;
  approvedAt?: string;
  createdAt: string;
  isActive: boolean;
  isPending: boolean;
}

export interface ApproveLoanRequest {
  notes?: string;
}

export interface AvailableEmployeeDto {
  id: string;
  name: string;
  role: string;
  departmentId: string;
  departmentName: string;
  dailyHours: number;
  isCurrentlyLoaned: boolean;
  currentLoanDepartment?: string;
}

export const loanService = {
  /**
   * Lista funcionários disponíveis para empréstimo (de outros departamentos)
   */
  async getAvailableEmployees(departmentId: string): Promise<AvailableEmployeeDto[]> {
    try {
      const response = await api.get<AvailableEmployeeDto[]>(`/api/loans/available/${departmentId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar funcionários disponíveis:', error);
      return [];
    }
  },

  /**
   * Cria um novo empréstimo
   */
  async createLoan(request: CreateLoanRequest): Promise<LoanDto | null> {
    try {
      const response = await api.post<LoanDto>('/api/loans', request);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar empréstimo:', error);
      throw new Error(error.response?.data?.message || 'Erro ao criar empréstimo');
    }
  },

  /**
   * Obtém um empréstimo pelo ID
   */
  async getLoan(loanId: string): Promise<LoanDto | null> {
    try {
      const response = await api.get<LoanDto>(`/api/loans/${loanId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar empréstimo:', error);
      return null;
    }
  },

  /**
   * Lista empréstimos ativos de um departamento (enviados + recebidos)
   */
  async getLoansByDepartment(departmentId: string): Promise<LoanDto[]> {
    try {
      const response = await api.get<LoanDto[]>(`/api/loans/department/${departmentId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar empréstimos do departamento:', error);
      return [];
    }
  },

  /**
   * Lista funcionários emprestados PARA um departamento (recebidos)
   */
  async getLoansReceived(departmentId: string): Promise<LoanDto[]> {
    try {
      const response = await api.get<LoanDto[]>(`/api/loans/received/${departmentId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar empréstimos recebidos:', error);
      return [];
    }
  },

  /**
   * Lista funcionários emprestados DE um departamento (enviados)
   */
  async getLoansSent(departmentId: string): Promise<LoanDto[]> {
    try {
      const response = await api.get<LoanDto[]>(`/api/loans/sent/${departmentId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar empréstimos enviados:', error);
      return [];
    }
  },

  /**
   * Lista empréstimos pendentes de aprovação para um departamento (como origem)
   */
  async getPendingLoans(departmentId: string): Promise<LoanDto[]> {
    try {
      const response = await api.get<LoanDto[]>(`/api/loans/pending/${departmentId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar empréstimos pendentes:', error);
      return [];
    }
  },

  /**
   * Lista todos os empréstimos
   */
  async getAllLoans(includeInactive = false): Promise<LoanDto[]> {
    try {
      const response = await api.get<LoanDto[]>('/api/loans', {
        params: { includeInactive }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar todos os empréstimos:', error);
      return [];
    }
  },

  /**
   * Aprova um empréstimo pendente
   */
  async approveLoan(loanId: string, notes?: string): Promise<LoanDto | null> {
    try {
      const response = await api.post<LoanDto>(`/api/loans/${loanId}/approve`, { notes });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao aprovar empréstimo:', error);
      throw new Error(error.response?.data?.message || 'Erro ao aprovar empréstimo');
    }
  },

  /**
   * Rejeita um empréstimo pendente
   */
  async rejectLoan(loanId: string, notes?: string): Promise<LoanDto | null> {
    try {
      const response = await api.post<LoanDto>(`/api/loans/${loanId}/reject`, { notes });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao rejeitar empréstimo:', error);
      throw new Error(error.response?.data?.message || 'Erro ao rejeitar empréstimo');
    }
  },

  /**
   * Devolve um funcionário emprestado
   */
  async returnLoan(loanId: string, notes?: string): Promise<LoanDto | null> {
    try {
      const response = await api.post<LoanDto>(`/api/loans/${loanId}/return`, { notes });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao devolver empréstimo:', error);
      throw new Error(error.response?.data?.message || 'Erro ao devolver funcionário');
    }
  },

  /**
   * Cancela um empréstimo
   */
  async cancelLoan(loanId: string): Promise<boolean> {
    try {
      await api.delete(`/api/loans/${loanId}`);
      return true;
    } catch (error) {
      console.error('Erro ao cancelar empréstimo:', error);
      return false;
    }
  },

  /**
   * Verifica se um funcionário está atualmente emprestado
   */
  async getActiveLoanForEmployee(employeeId: string): Promise<LoanDto | null> {
    try {
      const response = await api.get<LoanDto>(`/api/loans/employee/${employeeId}/active`);
      return response.data;
    } catch (error) {
      return null;
    }
  }
};

export default loanService;
