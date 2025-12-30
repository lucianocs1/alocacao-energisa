import { useState, useMemo } from 'react';
import { TimelineGrid } from '@/components/allocation/TimelineGrid';
import { mockEmployees, mockAllocations, getAllDemands } from '@/data/mockData';
import { Allocation, Employee } from '@/types/planner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { useCalendar } from '@/hooks/useCalendar';
import { Badge } from '@/components/ui/badge';
import { useTeam } from '@/contexts/TeamContext';
import { cn } from '@/lib/utils';

export default function AllocationPage() {
  const [allocations, setAllocations] = useState<Allocation[]>(mockAllocations);
  const [guestEmployees, setGuestEmployees] = useState<Employee[]>([]);
  const { getMonthCapacity, holidays } = useCalendar();
  const { selectedTeam } = useTeam();

  // Filter employees by selected team
  const teamEmployees = useMemo(() => 
    selectedTeam 
      ? mockEmployees.filter(e => e.teamId === selectedTeam.id)
      : mockEmployees,
    [selectedTeam]
  );

  // Get demands that belong to this team (from all projects)
  const teamDemands = useMemo(() => {
    if (!selectedTeam) return getAllDemands();
    return getAllDemands().filter(d => d.teamId === selectedTeam.id);
  }, [selectedTeam]);

  // Filter allocations relevant to this team (by employee or by demand)
  const teamAllocations = useMemo(() => {
    if (!selectedTeam) return allocations;
    const teamEmpIds = new Set(teamEmployees.map(e => e.id));
    const teamDemandIds = new Set(teamDemands.map(d => d.id));
    return allocations.filter(a => 
      teamEmpIds.has(a.employeeId) || teamDemandIds.has(a.demandId)
    );
  }, [selectedTeam, teamEmployees, teamDemands, allocations]);

  const handleAddAllocation = (newAllocation: Omit<Allocation, 'id'>) => {
    const id = `alloc-${Date.now()}`;
    setAllocations([...allocations, { ...newAllocation, id }]);
  };

  const handleRemoveAllocation = (id: string) => {
    setAllocations(allocations.filter(a => a.id !== id));
  };

  const handleAddGuestEmployee = (employeeId: string) => {
    const employee = mockEmployees.find(e => e.id === employeeId);
    if (employee && !guestEmployees.find(g => g.id === employeeId)) {
      setGuestEmployees([...guestEmployees, employee]);
    }
  };

  // Calculate stats for current team
  const totalHoursAllocated = teamAllocations.reduce((sum, a) => sum + a.hours, 0);
  const loanAllocations = teamAllocations.filter(a => a.isLoan).length;
  
  const overloadedCount = teamEmployees.filter(emp => {
    const empAllocations = allocations.filter(a => a.employeeId === emp.id);
    
    for (let month = 0; month < 12; month++) {
      const monthAllocations = empAllocations.filter(a => a.month === month);
      const totalForMonth = monthAllocations.reduce((s, a) => s + a.hours, 0);
      const capacity = getMonthCapacity(month, 2024, emp);
      
      if (totalForMonth > capacity.availableHours) {
        return true;
      }
    }
    return false;
  }).length;

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
              {loanAllocations > 0 && (
                <p className="text-xs text-purple-500">{loanAllocations} empréstimos</p>
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
            allocations={teamAllocations}
            guestEmployees={guestEmployees}
            onAddAllocation={handleAddAllocation}
            onRemoveAllocation={handleRemoveAllocation}
            onAddGuestEmployee={handleAddGuestEmployee}
          />
        </CardContent>
      </Card>
    </div>
  );
}
