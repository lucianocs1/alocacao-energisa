import { useState } from 'react';
import { mockEmployees } from '@/data/mockData';
import { EmployeeCard } from '@/components/team/EmployeeCard';
import { CellType, CELL_COLORS } from '@/types/planner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Plus, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useCalendar } from '@/hooks/useCalendar';

export default function TeamPage() {
  const [selectedCell, setSelectedCell] = useState<CellType | 'all'>('all');
  const { getMonthCapacity } = useCalendar();

  const cells: (CellType | 'all')[] = ['all', 'Contábil', 'Fiscal', 'Societário', 'Trabalhista'];

  const filteredEmployees = selectedCell === 'all' 
    ? mockEmployees 
    : mockEmployees.filter(e => e.cell === selectedCell);

  // Calculate total capacity using a reference month (January 2024)
  const totalCapacity = mockEmployees.reduce((sum, e) => {
    const capacity = getMonthCapacity(0, 2024, e);
    return sum + capacity.totalHours;
  }, 0);
  
  const totalFixedHours = mockEmployees.reduce((sum, e) => 
    sum + e.fixedAllocations.reduce((s, f) => s + f.hoursPerMonth, 0), 0
  );

  const totalAvailable = mockEmployees.reduce((sum, e) => {
    const capacity = getMonthCapacity(0, 2024, e);
    return sum + capacity.availableHours;
  }, 0);

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Equipe</h1>
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
              <p className="text-2xl font-bold">{mockEmployees.length}</p>
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

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {cells.map(cell => (
          <Badge
            key={cell}
            variant={selectedCell === cell ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-all hover:scale-105",
              selectedCell === cell && cell !== 'all' && CELL_COLORS[cell as CellType],
              selectedCell === cell && "text-primary-foreground"
            )}
            onClick={() => setSelectedCell(cell)}
          >
            {cell === 'all' ? 'Todos' : cell}
          </Badge>
        ))}
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map(employee => (
          <EmployeeCard 
            key={employee.id} 
            employee={employee}
            onEdit={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
