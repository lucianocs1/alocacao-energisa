import { useState } from 'react';
import { TimelineGrid } from '@/components/allocation/TimelineGrid';
import { mockEmployees, mockProjects, mockAllocations } from '@/data/mockData';
import { Allocation, Employee } from '@/types/planner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { useCalendar } from '@/hooks/useCalendar';
import { Badge } from '@/components/ui/badge';

export default function AllocationPage() {
  const [allocations, setAllocations] = useState<Allocation[]>(mockAllocations);
  const [guestEmployees, setGuestEmployees] = useState<Employee[]>([]);
  const { getMonthCapacity, holidays } = useCalendar();

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

  // Calculate stats
  const totalHoursAllocated = allocations.reduce((sum, a) => sum + a.hours, 0);
  const crossTeamAllocations = allocations.filter(a => a.isCrossTeam).length;
  
  const overloadedCount = mockEmployees.filter(emp => {
    const empAllocations = allocations.filter(a => a.employeeId === emp.id);
    
    // Check each month
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
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Painel de Alocação</h1>
          <p className="text-muted-foreground">
            Gerencie a distribuição de recursos ao longo do ano fiscal
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {holidays.length} feriados cadastrados
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
              <p className="text-2xl font-bold">{mockEmployees.length}</p>
              {guestEmployees.length > 0 && (
                <p className="text-xs text-muted-foreground">+{guestEmployees.length} externos</p>
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
              <p className="text-sm text-muted-foreground">Projetos</p>
              <p className="text-2xl font-bold">{mockProjects.length}</p>
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
              {crossTeamAllocations > 0 && (
                <p className="text-xs text-purple-500">{crossTeamAllocations} cross-team</p>
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
            employees={mockEmployees}
            projects={mockProjects}
            allocations={allocations}
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
