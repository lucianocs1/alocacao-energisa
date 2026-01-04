import { useState, useEffect, useMemo, useCallback } from 'react';
import { TimelineGrid } from '@/components/allocation/TimelineGrid';
import { allocationService, AllocationPageData } from '@/services/allocationService';
import { employeeService } from '@/services/employeeService';
import { loanService, LoanDto } from '@/services/loanService';
import { Allocation, Employee, Demand } from '@/types/planner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, Clock, AlertTriangle, Calendar, Loader2, ChevronLeft, ChevronRight, UserPlus, ArrowLeftRight } from 'lucide-react';
import { useCalendar } from '@/hooks/useCalendar';
import { Badge } from '@/components/ui/badge';
import { useTeam } from '@/contexts/TeamContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RequestLoanModal } from '@/components/allocation/RequestLoanModal';
import { ManageLoansModal } from '@/components/allocation/ManageLoansModal';

export default function AllocationPage() {
  const [pageData, setPageData] = useState<AllocationPageData | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]); // Todos os funcionários para empréstimo
  const [guestEmployees, setGuestEmployees] = useState<Employee[]>([]);
  const [loanedOutEmployeeIds, setLoanedOutEmployeeIds] = useState<string[]>([]); // IDs dos funcionários emprestados (enviados)
  const [receivedLoans, setReceivedLoans] = useState<LoanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Modais de empréstimo
  const [requestLoanModalOpen, setRequestLoanModalOpen] = useState(false);
  const [manageLoansModalOpen, setManageLoansModalOpen] = useState(false);
  
  const { getMonthCapacity, holidays } = useCalendar(selectedYear);
  const { selectedTeam } = useTeam();

  // Anos disponíveis para seleção (ano atual -1 até +2)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  }, []);

  // Carregar dados da página
  const loadPageData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await allocationService.getPageData(selectedTeam?.id, selectedYear);
      setPageData(data);
      setAllocations(data.allocations);

      // Carregar todos os funcionários para funcionalidade de empréstimo
      if (selectedTeam) {
        const employees = await employeeService.getEmployees();
        setAllEmployees(employees);
        
        // Carregar empréstimos (recebidos e enviados)
        try {
          const [received, sent] = await Promise.all([
            loanService.getLoansReceived(selectedTeam.id),
            loanService.getLoansSent(selectedTeam.id)
          ]);
          
          const activeReceived = received.filter(l => l.status === 'Active');
          const activeSent = sent.filter(l => l.status === 'Active');
          
          setReceivedLoans(activeReceived);
          
          // Os funcionários emprestados recebidos já vêm na lista de employees do backend
          // Salvamos os IDs para identificá-los visualmente no TimelineGrid
          const receivedIds = activeReceived.map(l => l.employeeId);
          setGuestEmployees([]); // Não precisamos mais - backend já inclui na lista
          
          // Passamos os IDs para o TimelineGrid identificar visualmente
          // (será usado para mostrar como "guest" os funcionários que não são do departamento)
          
          // IDs dos funcionários emprestados (enviados) - para mostrar na timeline
          const sentIds = activeSent.map(l => l.employeeId);
          setLoanedOutEmployeeIds(sentIds);
          
        } catch (loanError) {
          console.error('Erro ao carregar empréstimos:', loanError);
          setReceivedLoans([]);
          setGuestEmployees([]);
          setLoanedOutEmployeeIds([]);
        }
      } else {
        setGuestEmployees([]);
        setReceivedLoans([]);
        setLoanedOutEmployeeIds([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da página');
    } finally {
      setLoading(false);
    }
  }, [selectedTeam?.id, selectedYear]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  // Funcionários da equipe
  const teamEmployees = useMemo(() => pageData?.employees ?? [], [pageData]);

  // Demandas da equipe
  const teamDemands = useMemo(() => pageData?.demands ?? [], [pageData]);

  // Handler para adicionar alocação
  const handleAddAllocation = async (newAllocation: Omit<Allocation, 'id'>) => {
    try {
      const created = await allocationService.createAllocation(newAllocation);
      if (created) {
        // Atualizar lista local (pode ser substituído por reload completo)
        setAllocations(prev => {
          // Verificar se já existe uma alocação para este funcionário/demanda/mês/ano
          const existingIndex = prev.findIndex(a => 
            a.employeeId === created.employeeId &&
            a.demandId === created.demandId &&
            a.month === created.month &&
            a.year === created.year
          );
          
          if (existingIndex >= 0) {
            // Atualizar alocação existente
            const updated = [...prev];
            updated[existingIndex] = created;
            return updated;
          }
          
          return [...prev, created];
        });
        
        // Também atualizar allocatedHours na demanda localmente
        if (pageData) {
          const updatedDemands = pageData.demands.map(d => {
            if (d.id === newAllocation.demandId) {
              return { ...d, allocatedHours: d.allocatedHours + newAllocation.hours };
            }
            return d;
          });
          setPageData({ ...pageData, demands: updatedDemands });
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar alocação:', error);
      toast.error('Erro ao adicionar alocação');
    }
  };

  // Handler para remover alocação
  const handleRemoveAllocation = async (id: string) => {
    try {
      const allocation = allocations.find(a => a.id === id);
      const success = await allocationService.deleteAllocation(id);
      if (success) {
        setAllocations(prev => prev.filter(a => a.id !== id));
        
        // Atualizar allocatedHours na demanda localmente
        if (allocation && pageData) {
          const updatedDemands = pageData.demands.map(d => {
            if (d.id === allocation.demandId) {
              return { ...d, allocatedHours: Math.max(0, d.allocatedHours - allocation.hours) };
            }
            return d;
          });
          setPageData({ ...pageData, demands: updatedDemands });
        }
        
        toast.success('Alocação removida');
      }
    } catch (error) {
      console.error('Erro ao remover alocação:', error);
      toast.error('Erro ao remover alocação');
    }
  };

  // Handler para adicionar funcionário emprestado
  const handleAddGuestEmployee = (employeeId: string) => {
    const employee = allEmployees.find(e => e.id === employeeId);
    if (employee && !guestEmployees.find(g => g.id === employeeId)) {
      setGuestEmployees([...guestEmployees, employee]);
    }
  };

  // Handler quando um empréstimo é criado ou modificado
  const handleLoanChanged = () => {
    loadPageData();
  };

  // Calcular estatísticas
  const totalHoursAllocated = useMemo(() => 
    allocations.reduce((sum, a) => sum + a.hours, 0),
    [allocations]
  );

  const loanAllocationsCount = useMemo(() => 
    allocations.filter(a => a.isLoan).length,
    [allocations]
  );

  const overloadedCount = useMemo(() => {
    return teamEmployees.filter(emp => {
      const empAllocations = allocations.filter(a => a.employeeId === emp.id);
      
      for (let month = 0; month < 12; month++) {
        const monthAllocations = empAllocations.filter(a => a.month === month && a.year === selectedYear);
        const totalForMonth = monthAllocations.reduce((s, a) => s + a.hours, 0);
        const capacity = getMonthCapacity(month, selectedYear, emp);
        
        if (totalForMonth > capacity.availableHours) {
          return true;
        }
      }
      return false;
    }).length;
  }, [teamEmployees, allocations, selectedYear, getMonthCapacity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 fade-in overflow-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold">Painel de Alocação</h1>
            {selectedTeam && (
              <span className={cn("px-2 py-1 rounded text-xs text-white", selectedTeam.color)}>
                {selectedTeam.name}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Gerencie a distribuição de recursos ao longo do ano fiscal
          </p>
        </div>

        {/* Ações: Empréstimos e Seletor de Ano */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botões de Empréstimo */}
          {selectedTeam && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRequestLoanModalOpen(true)}
                className="h-8 sm:h-9"
              >
                <UserPlus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Solicitar</span> Empréstimo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setManageLoansModalOpen(true)}
                className="h-8 sm:h-9"
              >
                <ArrowLeftRight className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Gerenciar</span> Empréstimos
                {receivedLoans.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {receivedLoans.length}
                  </Badge>
                )}
              </Button>
            </>
          )}
          
          {/* Seletor de Ano */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => setSelectedYear(y => Math.max(availableYears[0], y - 1))}
            disabled={selectedYear <= availableYears[0]}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[90px] sm:w-[100px] h-8 sm:h-9">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => setSelectedYear(y => Math.min(availableYears[availableYears.length - 1], y + 1))}
            disabled={selectedYear >= availableYears[availableYears.length - 1]}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
            <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Recursos</p>
              <p className="text-lg sm:text-2xl font-bold">{teamEmployees.length}</p>
              {guestEmployees.length > 0 && (
                <p className="text-[10px] sm:text-xs text-muted-foreground">+{guestEmployees.length} emprestados</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
            <div className="p-2 sm:p-3 rounded-lg bg-chart-2/10">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-chart-2" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Demandas</p>
              <p className="text-lg sm:text-2xl font-bold">{teamDemands.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
            <div className="p-2 sm:p-3 rounded-lg bg-chart-3/10">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-chart-3" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Horas Alocadas</p>
              <p className="text-lg sm:text-2xl font-bold">{totalHoursAllocated}h</p>
              {loanAllocationsCount > 0 && (
                <p className="text-[10px] sm:text-xs text-purple-500">{loanAllocationsCount} empréstimos</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
            <div className="p-2 sm:p-3 rounded-lg bg-destructive/10">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Totalmente Alocado</p>
              <p className="text-lg sm:text-2xl font-bold">{overloadedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Grid */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Timeline de Alocação - {selectedYear}</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            Capacidade calculada automaticamente baseada em dias úteis (excluindo fins de semana e feriados)
          </p>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <TimelineGrid
            employees={teamEmployees}
            demands={teamDemands}
            allocations={allocations}
            year={selectedYear}
            guestEmployees={guestEmployees}
            allEmployees={allEmployees}
            loanedOutEmployeeIds={loanedOutEmployeeIds}
            onAddAllocation={handleAddAllocation}
            onRemoveAllocation={handleRemoveAllocation}
            onAddGuestEmployee={handleAddGuestEmployee}
          />
        </CardContent>
      </Card>

      {/* Modais de Empréstimo */}
      {selectedTeam && (
        <>
          <RequestLoanModal
            open={requestLoanModalOpen}
            onClose={() => setRequestLoanModalOpen(false)}
            targetDepartmentId={selectedTeam.id}
            targetDepartmentName={selectedTeam.name}
            onLoanCreated={handleLoanChanged}
          />
          <ManageLoansModal
            open={manageLoansModalOpen}
            onClose={() => setManageLoansModalOpen(false)}
            departmentId={selectedTeam.id}
            departmentName={selectedTeam.name}
            onLoanChanged={handleLoanChanged}
          />
        </>
      )}
    </div>
  );
}
