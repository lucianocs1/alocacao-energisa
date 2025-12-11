import { useMemo, useState } from 'react';
import { Employee, Project, Allocation, MONTHS, CELL_COLORS, CELL_BORDER_COLORS, CellType } from '@/types/planner';
import { CapacityBar } from './CapacityBar';
import { AllocationBlock } from './AllocationBlock';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Plus, Umbrella, UserPlus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useCalendar } from '@/hooks/useCalendar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TimelineGridProps {
  employees: Employee[];
  projects: Project[];
  allocations: Allocation[];
  currentCell?: CellType; // For filtering by cell view
  guestEmployees?: Employee[]; // Cross-team employees added to this view
  onAddAllocation: (allocation: Omit<Allocation, 'id'>) => void;
  onRemoveAllocation: (id: string) => void;
  onAddGuestEmployee?: (employeeId: string) => void;
}

export function TimelineGrid({ 
  employees, 
  projects, 
  allocations,
  currentCell,
  guestEmployees = [],
  onAddAllocation,
  onRemoveAllocation,
  onAddGuestEmployee
}: TimelineGridProps) {
  const [selectedCell, setSelectedCell] = useState<{ employeeId: string; month: number } | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [hours, setHours] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [selectedGuestEmployee, setSelectedGuestEmployee] = useState<string>('');

  const { getMonthCapacity, getMonthInfo } = useCalendar();
  const year = 2024;

  // Combine home employees with guest employees
  const allEmployees = useMemo(() => {
    const guestIds = new Set(guestEmployees.map(e => e.id));
    return [
      ...employees.filter(e => !guestIds.has(e.id)),
      ...guestEmployees
    ];
  }, [employees, guestEmployees]);

  // Group employees by cell (home team)
  const groupedEmployees = useMemo(() => {
    const groups: Record<CellType, { home: Employee[]; guests: Employee[] }> = {
      'Contábil': { home: [], guests: [] },
      'Fiscal': { home: [], guests: [] },
      'Societário': { home: [], guests: [] },
      'Trabalhista': { home: [], guests: [] },
    };
    
    // If currentCell is set, only show that cell's employees
    if (currentCell) {
      groups[currentCell].home = employees.filter(e => e.cell === currentCell);
      groups[currentCell].guests = guestEmployees.filter(e => e.cell !== currentCell);
    } else {
      allEmployees.forEach(emp => {
        const isGuest = guestEmployees.some(g => g.id === emp.id);
        if (isGuest) {
          // Guest shows under the cell they're visiting, not their home cell
          // For now, show under their home cell with a badge
          groups[emp.cell].guests.push(emp);
        } else {
          groups[emp.cell].home.push(emp);
        }
      });
    }
    
    return groups;
  }, [allEmployees, employees, guestEmployees, currentCell]);

  // Available employees from other cells (for guest selection)
  const availableExternalEmployees = useMemo(() => {
    if (!currentCell) return [];
    const currentIds = new Set([...employees.map(e => e.id), ...guestEmployees.map(e => e.id)]);
    // In a real app, this would come from all employees not in currentCell
    return employees.filter(e => e.cell !== currentCell && !currentIds.has(e.id));
  }, [employees, guestEmployees, currentCell]);

  const getEmployeeMonthData = (employee: Employee, month: number) => {
    const capacity = getMonthCapacity(month, year, employee);
    
    const monthAllocations = allocations.filter(
      a => a.employeeId === employee.id && a.month === month && a.year === year
    );
    
    const totalAllocated = monthAllocations.reduce((sum, a) => sum + a.hours, 0);
    
    // Check vacation
    const isOnVacation = capacity.vacationHours >= capacity.totalHours * 0.5; // More than 50% vacation = show as vacation

    return {
      allocations: monthAllocations,
      totalAllocated,
      capacity,
      isOnVacation,
      blockedHours: capacity.fixedHours + capacity.vacationHours,
    };
  };

  const handleCellClick = (employeeId: string, month: number) => {
    const employee = allEmployees.find(e => e.id === employeeId);
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

    const employee = allEmployees.find(e => e.id === selectedCell.employeeId);
    const project = projects.find(p => p.id === selectedProject);
    
    if (!employee || !project) return;

    const monthData = getEmployeeMonthData(employee, selectedCell.month);
    const newTotal = monthData.totalAllocated + hoursNum;
    const available = monthData.capacity.availableHours;
    const monthInfo = getMonthInfo(selectedCell.month, year);

    // Check if this is a cross-team allocation
    const isCrossTeam = currentCell ? employee.cell !== currentCell : false;

    if (newTotal > available) {
      const excess = newTotal - available;
      toast.warning(
        `Atenção: ${MONTHS[selectedCell.month]} tem apenas ${monthInfo.workingDays} dias úteis (${available}h disponíveis). ` +
        `Você está alocando ${excess}h extras. Considerar hora extra ou banco?`,
        { duration: 5000 }
      );
    }

    onAddAllocation({
      employeeId: selectedCell.employeeId,
      projectId: selectedProject,
      month: selectedCell.month,
      year,
      hours: hoursNum,
      isCrossTeam,
    });

    toast.success(`${hoursNum}h alocadas para ${project.name}${isCrossTeam ? ' (recurso externo)' : ''}`);
    setDialogOpen(false);
    setSelectedCell(null);
    setSelectedProject('');
    setHours('');
  };

  const handleAddGuestEmployee = () => {
    if (!selectedGuestEmployee || !onAddGuestEmployee) return;
    onAddGuestEmployee(selectedGuestEmployee);
    setGuestDialogOpen(false);
    setSelectedGuestEmployee('');
    toast.success('Recurso externo adicionado');
  };

  const renderEmployeeRow = (employee: Employee, isGuest: boolean = false) => (
    <div 
      key={employee.id}
      className={cn(
        "flex border-t border-border/50 hover:bg-muted/20 transition-colors",
        isGuest && "bg-muted/10"
      )}
    >
      {/* Employee Info */}
      <div className={cn(
        "w-56 flex-shrink-0 p-3 border-r border-border",
        isGuest && `border-l-4 ${CELL_BORDER_COLORS[employee.cell]}`
      )}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{employee.name}</span>
            {isGuest && (
              <Tooltip>
                <TooltipTrigger>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  Recurso externo de {employee.cell}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{employee.role}</span>
          {isGuest && (
            <Badge variant="outline" className={cn("text-[10px] w-fit", CELL_COLORS[employee.cell], "text-primary-foreground")}>
              {employee.cell}
            </Badge>
          )}
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
        const monthInfo = getMonthInfo(monthIdx, year);
        
        return (
          <Tooltip key={monthIdx}>
            <TooltipTrigger asChild>
              <div 
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
                      total={monthData.capacity.totalHours}
                      blocked={monthData.blockedHours}
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
                            isCrossTeam={alloc.isCrossTeam}
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
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="text-xs">
                <p className="font-medium">{MONTHS[monthIdx]} {year}</p>
                <p>{monthInfo.workingDays} dias úteis • {monthData.capacity.totalHours}h capacidade</p>
                {monthData.blockedHours > 0 && (
                  <p className="text-muted-foreground">{monthData.blockedHours}h bloqueadas</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[1200px]">
        {/* Header */}
        <div className="flex border-b border-border sticky top-0 bg-background z-10">
          <div className="w-56 flex-shrink-0 p-3 font-medium text-sm border-r border-border flex items-center justify-between">
            <span>Recurso</span>
            {currentCell && onAddGuestEmployee && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2"
                onClick={() => setGuestDialogOpen(true)}
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            )}
          </div>
          {MONTHS.map((month, idx) => {
            const monthInfo = getMonthInfo(idx, year);
            return (
              <Tooltip key={month}>
                <TooltipTrigger asChild>
                  <div 
                    className="flex-1 min-w-[80px] p-3 text-center text-sm font-medium border-r border-border last:border-r-0 cursor-help"
                  >
                    <div>{month}</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      {monthInfo.workingDays}d • {monthInfo.totalHours}h
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {monthInfo.workingDays} dias úteis = {monthInfo.totalHours}h de capacidade base
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Body */}
        {(Object.keys(groupedEmployees) as CellType[]).map(cell => {
          const cellData = groupedEmployees[cell];
          if (cellData.home.length === 0 && cellData.guests.length === 0) return null;
          
          return (
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

              {/* Home Employees */}
              {cellData.home.map(employee => renderEmployeeRow(employee, false))}
              
              {/* Guest Employees */}
              {cellData.guests.length > 0 && (
                <>
                  <div className="flex bg-muted/10 border-t border-dashed border-border">
                    <div className="w-56 flex-shrink-0 p-1.5 px-3 border-r border-border">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Recursos Externos
                      </span>
                    </div>
                    <div className="flex-1" />
                  </div>
                  {cellData.guests.map(employee => renderEmployeeRow(employee, true))}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Allocation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Alocação</DialogTitle>
          </DialogHeader>
          {selectedCell && (
            <div className="space-y-4 pt-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm">
                  <span className="text-muted-foreground">Mês:</span>{' '}
                  <span className="font-medium">{MONTHS[selectedCell.month]} {year}</span>
                </p>
                {(() => {
                  const monthInfo = getMonthInfo(selectedCell.month, year);
                  return (
                    <p className="text-xs text-muted-foreground mt-1">
                      {monthInfo.workingDays} dias úteis • {monthInfo.totalHours}h de capacidade base
                    </p>
                  );
                })()}
              </div>
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
          )}
        </DialogContent>
      </Dialog>

      {/* Add Guest Employee Dialog */}
      <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buscar Recurso Externo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Adicione um recurso de outra célula para trabalhar em seus projetos.
              As horas alocadas serão somadas com as alocações do time de origem.
            </p>
            <div className="space-y-2">
              <Label>Funcionário</Label>
              <Select value={selectedGuestEmployee} onValueChange={setSelectedGuestEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um recurso" />
                </SelectTrigger>
                <SelectContent>
                  {availableExternalEmployees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-[10px]", CELL_COLORS[emp.cell], "text-primary-foreground")}>
                          {emp.cell}
                        </Badge>
                        {emp.name} - {emp.role}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddGuestEmployee} className="w-full">
              Adicionar Recurso
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
