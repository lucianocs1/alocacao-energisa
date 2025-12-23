import { mockEmployees } from '@/data/mockData';
import { EmployeeCard } from '@/components/team/EmployeeCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useCalendar } from '@/hooks/useCalendar';
import { useTeam } from '@/contexts/TeamContext';

export default function TeamPage() {
  const { selectedTeam } = useTeam();
  const { getMonthCapacity } = useCalendar();

  // Filter employees by selected team
  const filteredEmployees = selectedTeam 
    ? mockEmployees.filter(e => e.teamId === selectedTeam.id)
    : mockEmployees;

  // Calculate total capacity using a reference month (January 2024) for filtered employees
  const totalCapacity = filteredEmployees.reduce((sum, e) => {
    const capacity = getMonthCapacity(0, 2024, e);
    return sum + capacity.totalHours;
  }, 0);
  
  const totalFixedHours = filteredEmployees.reduce((sum, e) => 
    sum + e.fixedAllocations.reduce((s, f) => s + f.hoursPerMonth, 0), 0
  );

  const totalAvailable = filteredEmployees.reduce((sum, e) => {
    const capacity = getMonthCapacity(0, 2024, e);
    return sum + capacity.availableHours;
  }, 0);

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Gestão de Equipe</h1>
            {selectedTeam && (
              <span className={cn("px-2 py-1 rounded text-xs text-white", selectedTeam.color)}>
                {selectedTeam.name}
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            Gerencie recursos, férias e alocações fixas
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Recurso
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Recursos</p>
              <p className="text-2xl font-bold">{filteredEmployees.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Capacidade (Jan/24)</p>
            <p className="text-2xl font-bold">{totalCapacity}h</p>
            <p className="text-xs text-muted-foreground">Varia por mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Horas Fixas/Mês</p>
            <p className="text-2xl font-bold">{totalFixedHours}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Disponível (Jan/24)</p>
            <p className="text-2xl font-bold text-success">{totalAvailable}h</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map(employee => (
            <EmployeeCard 
              key={employee.id} 
              employee={employee}
              onEdit={() => {}}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhum recurso encontrado nesta equipe
          </div>
        )}
      </div>
    </div>
  );
}
