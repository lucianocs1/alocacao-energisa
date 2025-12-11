import { useState } from 'react';
import { TimelineGrid } from '@/components/allocation/TimelineGrid';
import { mockEmployees, mockProjects, mockAllocations } from '@/data/mockData';
import { Allocation } from '@/types/planner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, Clock, AlertTriangle } from 'lucide-react';

export default function AllocationPage() {
  const [allocations, setAllocations] = useState<Allocation[]>(mockAllocations);

  const handleAddAllocation = (newAllocation: Omit<Allocation, 'id'>) => {
    const id = `alloc-${Date.now()}`;
    setAllocations([...allocations, { ...newAllocation, id }]);
  };

  const handleRemoveAllocation = (id: string) => {
    setAllocations(allocations.filter(a => a.id !== id));
  };

  // Calculate stats
  const totalHoursAllocated = allocations.reduce((sum, a) => sum + a.hours, 0);
  const overloadedCount = mockEmployees.filter(emp => {
    const empAllocations = allocations.filter(a => a.employeeId === emp.id);
    const monthlyTotals: Record<number, number> = {};
    empAllocations.forEach(a => {
      monthlyTotals[a.month] = (monthlyTotals[a.month] || 0) + a.hours;
    });
    const fixedHours = emp.fixedAllocations.reduce((s, f) => s + f.hoursPerMonth, 0);
    return Object.values(monthlyTotals).some(h => h + fixedHours > emp.monthlyCapacity);
  }).length;

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Painel de Alocação</h1>
        <p className="text-muted-foreground">
          Gerencie a distribuição de recursos ao longo do ano fiscal
        </p>
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
        </CardHeader>
        <CardContent className="p-0">
          <TimelineGrid
            employees={mockEmployees}
            projects={mockProjects}
            allocations={allocations}
            onAddAllocation={handleAddAllocation}
            onRemoveAllocation={handleRemoveAllocation}
          />
        </CardContent>
      </Card>
    </div>
  );
}
