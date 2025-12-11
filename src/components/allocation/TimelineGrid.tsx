import { useMemo, useState } from 'react';
import { Employee, Project, Allocation, MONTHS, CELL_COLORS, CellType } from '@/types/planner';
import { CapacityBar } from './CapacityBar';
import { AllocationBlock } from './AllocationBlock';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Plus, Umbrella } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface TimelineGridProps {
  employees: Employee[];
  projects: Project[];
  allocations: Allocation[];
  onAddAllocation: (allocation: Omit<Allocation, 'id'>) => void;
  onRemoveAllocation: (id: string) => void;
}

export function TimelineGrid({ 
  employees, 
  projects, 
  allocations,
  onAddAllocation,
  onRemoveAllocation
}: TimelineGridProps) {
  const [selectedCell, setSelectedCell] = useState<{ employeeId: string; month: number } | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [hours, setHours] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const year = 2024;

  // Group employees by cell
  const groupedEmployees = useMemo(() => {
    const groups: Record<CellType, Employee[]> = {
      'Contábil': [],
      'Fiscal': [],
      'Societário': [],
      'Trabalhista': [],
    };
    
    employees.forEach(emp => {
      groups[emp.cell].push(emp);
    });
    
    return groups;
  }, [employees]);

  const getEmployeeMonthData = (employee: Employee, month: number) => {
    const monthAllocations = allocations.filter(
      a => a.employeeId === employee.id && a.month === month && a.year === year
    );
    
    const totalAllocated = monthAllocations.reduce((sum, a) => sum + a.hours, 0);
    const fixedHours = employee.fixedAllocations.reduce((sum, f) => sum + f.hoursPerMonth, 0);
    
    // Check vacation
    const isOnVacation = employee.vacations.some(v => {
      const vacStart = new Date(v.startDate);
      const vacEnd = new Date(v.endDate);
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      return vacStart <= monthEnd && vacEnd >= monthStart;
    });

    return {
      allocations: monthAllocations,
      totalAllocated,
      fixedHours,
      isOnVacation,
      blockedHours: fixedHours + (isOnVacation ? employee.monthlyCapacity : 0),
    };
  };

  const handleCellClick = (employeeId: string, month: number) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    const monthData = getEmployeeMonthData(employee, month);
    if (monthData.isOnVacation) {
      toast.error('Não é possível alocar durante período de férias');
      return;
    }

    setSelectedCell({ employeeId, month });
    setDialogOpen(true);
  };

  const handleAddAllocation = () => {
    if (!selectedCell || !selectedProject || !hours) return;

    const hoursNum = parseInt(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      toast.error('Insira um valor válido de horas');
      return;
    }

    const employee = employees.find(e => e.id === selectedCell.employeeId);
    const project = projects.find(p => p.id === selectedProject);
    
    if (!employee || !project) return;

    const monthData = getEmployeeMonthData(employee, selectedCell.month);
    const newTotal = monthData.totalAllocated + hoursNum;
    const available = employee.monthlyCapacity - monthData.blockedHours;

    if (newTotal > available) {
      toast.warning(`Atenção: ${employee.name} ficará sobrecarregado em ${MONTHS[selectedCell.month]}`);
    }

    onAddAllocation({
      employeeId: selectedCell.employeeId,
      projectId: selectedProject,
      month: selectedCell.month,
      year,
      hours: hoursNum,
    });

    toast.success(`${hoursNum}h alocadas para ${project.name}`);
    setDialogOpen(false);
    setSelectedCell(null);
    setSelectedProject('');
    setHours('');
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[1200px]">
        {/* Header */}
        <div className="flex border-b border-border sticky top-0 bg-background z-10">
          <div className="w-56 flex-shrink-0 p-3 font-medium text-sm border-r border-border">
            Recurso
          </div>
          {MONTHS.map((month, idx) => (
            <div 
              key={month}
              className="flex-1 min-w-[80px] p-3 text-center text-sm font-medium border-r border-border last:border-r-0"
            >
              {month}
            </div>
          ))}
        </div>

        {/* Body */}
        {(Object.keys(groupedEmployees) as CellType[]).map(cell => (
          <div key={cell} className="border-b border-border">
            {/* Cell Header */}
            <div className="flex bg-muted/30">
              <div className="w-56 flex-shrink-0 p-2 border-r border-border">
                <Badge variant="secondary" className={cn("text-xs", CELL_COLORS[cell], "text-primary-foreground")}>
                  {cell}
                </Badge>
              </div>
              <div className="flex-1" />
            </div>

            {/* Employees */}
            {groupedEmployees[cell].map(employee => (
              <div 
                key={employee.id}
                className="flex border-t border-border/50 hover:bg-muted/20 transition-colors"
              >
                {/* Employee Info */}
                <div className="w-56 flex-shrink-0 p-3 border-r border-border">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm">{employee.name}</span>
                    <span className="text-xs text-muted-foreground">{employee.role}</span>
                    {employee.fixedAllocations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {employee.fixedAllocations.map(fa => (
                          <Badge 
                            key={fa.id} 
                            variant="outline" 
                            className="text-[10px] px-1.5 py-0"
                          >
                            {fa.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline Cells */}
                {MONTHS.map((_, monthIdx) => {
                  const monthData = getEmployeeMonthData(employee, monthIdx);
                  const available = employee.monthlyCapacity - monthData.fixedHours;
                  
                  return (
                    <div 
                      key={monthIdx}
                      className={cn(
                        "flex-1 min-w-[80px] p-2 border-r border-border/50 last:border-r-0",
                        "cursor-pointer transition-colors",
                        monthData.isOnVacation ? "bg-capacity-blocked/20" : "hover:bg-accent/50"
                      )}
                      onClick={() => handleCellClick(employee.id, monthIdx)}
                    >
                      {monthData.isOnVacation ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <Umbrella className="w-4 h-4 mr-1" />
                          <span className="text-xs">Férias</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <CapacityBar
                            utilized={monthData.totalAllocated}
                            total={employee.monthlyCapacity}
                            blocked={monthData.fixedHours}
                            showLabel={false}
                            size="sm"
                          />
                          <div className="flex flex-wrap gap-1">
                            {monthData.allocations.map(alloc => {
                              const project = projects.find(p => p.id === alloc.projectId);
                              if (!project) return null;
                              return (
                                <AllocationBlock
                                  key={alloc.id}
                                  project={project}
                                  hours={alloc.hours}
                                  onRemove={() => onRemoveAllocation(alloc.id)}
                                />
                              );
                            })}
                          </div>
                          {monthData.allocations.length === 0 && (
                            <div className="flex items-center justify-center h-6 opacity-0 hover:opacity-100 transition-opacity">
                              <Plus className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Add Allocation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Alocação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Projeto</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Horas</Label>
              <Input
                type="number"
                placeholder="Ex: 40"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            <Button onClick={handleAddAllocation} className="w-full">
              Adicionar Alocação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
