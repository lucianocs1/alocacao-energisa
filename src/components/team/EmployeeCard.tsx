import { Employee, CELL_COLORS } from '@/types/planner';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmployeeCardProps {
  employee: Employee;
  onEdit?: () => void;
}

export function EmployeeCard({ employee, onEdit }: EmployeeCardProps) {
  const totalFixedHours = employee.fixedAllocations.reduce((sum, f) => sum + f.hoursPerMonth, 0);
  const availableHours = employee.monthlyCapacity - totalFixedHours;

  return (
    <Card className="card-glow transition-all duration-300 hover:shadow-lg cursor-pointer" onClick={onEdit}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{employee.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{employee.role}</p>
          </div>
          <Badge className={cn("text-xs", CELL_COLORS[employee.cell], "text-primary-foreground")}>
            {employee.cell}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capacity */}
        <div className="flex items-center gap-3 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <div>
            <span className="text-muted-foreground">Capacidade: </span>
            <span className="font-medium">{employee.monthlyCapacity}h/mês</span>
          </div>
        </div>

        {/* Fixed Allocations */}
        {employee.fixedAllocations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="w-4 h-4" />
              <span>Alocações Fixas</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {employee.fixedAllocations.map(fa => (
                <Badge key={fa.id} variant="secondary" className="text-xs">
                  {fa.name} ({fa.hoursPerMonth}h)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Vacations */}
        {employee.vacations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Férias Programadas</span>
            </div>
            <div className="space-y-1">
              {employee.vacations.map(vac => (
                <div 
                  key={vac.id} 
                  className="text-xs bg-capacity-blocked/20 text-muted-foreground px-2 py-1 rounded"
                >
                  {format(new Date(vac.startDate), "dd MMM", { locale: ptBR })} - {format(new Date(vac.endDate), "dd MMM yyyy", { locale: ptBR })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Hours */}
        <div className="pt-2 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Disponível/mês</span>
            <span className="text-lg font-semibold text-success">{availableHours}h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
