import { useState, useEffect, useMemo, useCallback } from 'react';
import { TimelineGrid } from '@/components/allocation/TimelineGrid';
import { allocationService, AllocationPageData } from '@/services/allocationService';
import { employeeService } from '@/services/employeeService';
import { Allocation, Employee, Demand } from '@/types/planner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, Clock, AlertTriangle, Calendar, Loader2 } from 'lucide-react';
import { useCalendar } from '@/hooks/useCalendar';
import { Badge } from '@/components/ui/badge';
import { useTeam } from '@/contexts/TeamContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AllocationPage() {
  const [pageData, setPageData] = useState<AllocationPageData | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]); // Todos os funcionários para empréstimo
  const [guestEmployees, setGuestEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { getMonthCapacity, holidays } = useCalendar();
  const { selectedTeam } = useTeam();

  const currentYear = new Date().getFullYear();

  // Carregar dados da página
  const loadPageData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await allocationService.getPageData(selectedTeam?.id, currentYear);
      setPageData(data);
      setAllocations(data.allocations);

      // Carregar todos os funcionários para funcionalidade de empréstimo
      if (selectedTeam) {
        const employees = await employeeService.getEmployees();
        setAllEmployees(employees);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da página');
    } finally {
      setLoading(false);
    }
  }, [selectedTeam?.id, currentYear]);

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
        const monthAllocations = empAllocations.filter(a => a.month === month && a.year === currentYear);
        const totalForMonth = monthAllocations.reduce((s, a) => s + a.hours, 0);
        const capacity = getMonthCapacity(month, currentYear, emp);
        
        if (totalForMonth > capacity.availableHours) {
          return true;
        }
      }
      return false;
    }).length;
  }, [teamEmployees, allocations, currentYear, getMonthCapacity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 fade-in overflow-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Painel de Alocação</h1>
            {selectedTeam && (
              <span className={cn("px-2 py-1 rounded text-xs text-white", selectedTeam.color)}>
                {selectedTeam.name}
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            Gerencie a distribuição de recursos ao longo do ano fiscal
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {holidays.length} feriados
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recursos</p>
              <p className="text-2xl font-bold">{teamEmployees.length}</p>
              {guestEmployees.length > 0 && (
                <p className="text-xs text-muted-foreground">+{guestEmployees.length} emprestados</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-chart-2/10">
              <Briefcase className="w-5 h-5 text-chart-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Demandas</p>
              <p className="text-2xl font-bold">{teamDemands.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-chart-3/10">
              <Clock className="w-5 h-5 text-chart-3" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Horas Alocadas</p>
              <p className="text-2xl font-bold">{totalHoursAllocated}h</p>
              {loanAllocationsCount > 0 && (
                <p className="text-xs text-purple-500">{loanAllocationsCount} empréstimos</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sobrecarregados</p>
              <p className="text-2xl font-bold">{overloadedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timeline de Alocação</CardTitle>
          <p className="text-sm text-muted-foreground">
            Capacidade calculada automaticamente baseada em dias úteis (excluindo fins de semana e feriados)
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <TimelineGrid
            employees={teamEmployees}
            demands={teamDemands}
            allocations={allocations}
            guestEmployees={guestEmployees}
            allEmployees={allEmployees}
            onAddAllocation={handleAddAllocation}
            onRemoveAllocation={handleRemoveAllocation}
            onAddGuestEmployee={handleAddGuestEmployee}
          />
        </CardContent>
      </Card>
    </div>
  );
}
