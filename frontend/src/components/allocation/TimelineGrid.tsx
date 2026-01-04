import { useMemo, useState } from 'react';
import { Employee, Demand, Allocation, MONTHS } from '@/types/planner';
import { CapacityBar } from './CapacityBar';
import { AllocationBlock } from './AllocationBlock';
import { getPhaseForMonth } from './GanttBar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Plus, Umbrella, UserPlus, ExternalLink, GraduationCap } from 'lucide-react';
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
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useCalendar } from '@/hooks/useCalendar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTeam } from '@/contexts/TeamContext';

// IDs especiais para tipos de alocação que não são demandas
export const SPECIAL_ALLOCATION_TYPES = {
  VACATION: '__VACATION__',
  TRAINING: '__TRAINING__',
} as const;

// Configuração dos tipos especiais
export const SPECIAL_ALLOCATION_CONFIG = {
  [SPECIAL_ALLOCATION_TYPES.VACATION]: {
    label: 'Férias',
    color: '#f97316', // orange
    icon: Umbrella,
  },
  [SPECIAL_ALLOCATION_TYPES.TRAINING]: {
    label: 'Treinamento',
    color: '#8b5cf6', // purple
    icon: GraduationCap,
  },
} as const;

interface TimelineGridProps {
  employees: Employee[];
  demands: Demand[];
  allocations: Allocation[];
  year: number; // Ano para exibição e alocação
  guestEmployees?: Employee[]; // Employees borrowed from other teams (received)
  loanedOutEmployeeIds?: string[]; // IDs of employees loaned OUT to other teams
  allEmployees?: Employee[];   // All employees for borrowing functionality
  onAddAllocation: (allocation: Omit<Allocation, 'id'>) => void;
  onRemoveAllocation: (id: string) => void;
  onAddGuestEmployee?: (employeeId: string) => void;
}

export function TimelineGrid({ 
  employees, 
  demands, 
  allocations,
  year,
  guestEmployees = [],
  loanedOutEmployeeIds = [],
  allEmployees = [],
  onAddAllocation,
  onRemoveAllocation,
  onAddGuestEmployee
}: TimelineGridProps) {
  const [selectedCell, setSelectedCell] = useState<{ employeeId: string; month: number } | null>(null);
  const [selectedDemandId, setSelectedDemandId] = useState<string>('');
  const [hours, setHours] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [selectedGuestEmployee, setSelectedGuestEmployee] = useState<string>('');

  const { getMonthCapacity, getMonthInfo } = useCalendar(year);
  const { selectedTeam, getTeamById, getTeamColor } = useTeam();

  // Combine team employees with guest employees
  const combinedEmployees = useMemo(() => {
    const guestIds = new Set(guestEmployees.map(e => e.id));
    return [
      ...employees.filter(e => !guestIds.has(e.id)),
      ...guestEmployees
    ];
  }, [employees, guestEmployees]);

  // Identify which employees are guests (from other teams)
  const guestEmployeeIds = useMemo(() => new Set(guestEmployees.map(e => e.id)), [guestEmployees]);
  
  // Identify which employees are loaned out (to other teams)
  const loanedOutIds = useMemo(() => new Set(loanedOutEmployeeIds), [loanedOutEmployeeIds]);

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
    const employee = combinedEmployees.find(e => e.id === employeeId);
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
    if (!selectedCell || !selectedDemandId || !hours) return;

    const hoursNum = parseInt(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      toast.error('Insira um valor válido de horas');
      return;
    }

    const employee = combinedEmployees.find(e => e.id === selectedCell.employeeId);
    if (!employee) return;

    const monthData = getEmployeeMonthData(employee, selectedCell.month);
    const newTotal = monthData.totalAllocated + hoursNum;
    const available = monthData.capacity.availableHours;
    const monthInfo = getMonthInfo(selectedCell.month, year);

    // Verificar se é um tipo especial (férias ou treinamento)
    const isSpecialType = Object.values(SPECIAL_ALLOCATION_TYPES).includes(selectedDemandId as any);
    
    // Para tipos especiais, usar IDs e projectId especiais
    let demandId = selectedDemandId;
    let projectId = selectedDemandId; // Para tipos especiais, projectId = demandId
    let isLoan = false;
    let allocationName = '';

    if (isSpecialType) {
      const config = SPECIAL_ALLOCATION_CONFIG[selectedDemandId as keyof typeof SPECIAL_ALLOCATION_CONFIG];
      allocationName = config?.label || 'Alocação';
    } else {
      // É uma demanda normal
      const demand = demands.find(d => d.id === selectedDemandId);
      if (!demand) {
        toast.error('Demanda não encontrada');
        return;
      }
      
      projectId = demand.projectId;
      allocationName = demand.name;
      
      // Check if this is a loan (employee from different team than the demand)
      isLoan = employee.teamId !== demand.teamId;

      // Check phase for the selected month
      const phaseForMonth = getPhaseForMonth(demand.phases, selectedCell.month, year);
      
      // Alert for Go-Live period
      if (phaseForMonth?.isMilestone || phaseForMonth?.type === 'go-live') {
        toast.warning(
          `⚠️ ATENÇÃO: ${MONTHS[selectedCell.month]} é período de GO-LIVE! ` +
          `Certifique-se de que o recurso estará 100% disponível. Férias não recomendadas.`,
          { duration: 6000 }
        );
      }

      // Alert for Assisted Operation (less hours needed)
      if (phaseForMonth?.type === 'assisted-operation' && hoursNum > available * 0.5) {
        toast.info(
          `💡 Dica: ${MONTHS[selectedCell.month]} é período de Operação Assistida. ` +
          `Geralmente requer menos horas (suporte). Você alocou ${hoursNum}h.`,
          { duration: 5000 }
        );
      }
    }

    // BLOQUEAR alocação quando excede horas disponíveis
    if (newTotal > available) {
      const excess = newTotal - available;
      const remainingAvailable = available - monthData.totalAllocated;
      toast.error(
        `Não é possível alocar ${hoursNum}h. ${MONTHS[selectedCell.month]} tem apenas ${remainingAvailable}h disponíveis ` +
        `(${monthInfo.workingDays} dias úteis × ${employee.dailyHours || 8}h - ${monthData.blockedHours}h bloqueadas). ` +
        `Excesso: ${excess}h.`,
        { duration: 6000 }
      );
      return;
    }

    onAddAllocation({
      employeeId: selectedCell.employeeId,
      demandId: demandId,
      projectId: projectId,
      month: selectedCell.month,
      year,
      hours: hoursNum,
      isLoan,
      sourceTeamId: isLoan ? employee.teamId : undefined,
    });

    const employeeTeam = getTeamById(employee.teamId);
    toast.success(`${hoursNum}h alocadas para ${allocationName}${isLoan ? ` (empréstimo de ${employeeTeam?.name})` : ''}`);
    setDialogOpen(false);
    setSelectedCell(null);
    setSelectedDemandId('');
    setHours('');
  };

  const handleAddGuestEmployee = () => {
    if (!selectedGuestEmployee || !onAddGuestEmployee) return;
    onAddGuestEmployee(selectedGuestEmployee);
    setGuestDialogOpen(false);
    setSelectedGuestEmployee('');
    toast.success('Recurso emprestado adicionado');
  };

  const renderEmployeeRow = (employee: Employee, status: 'own' | 'guest' | 'loaned-out' = 'own') => {
    const employeeTeam = getTeamById(employee.teamId);
    const teamColor = getTeamColor(employee.teamId);
    const isGuest = status === 'guest';
    const isLoanedOut = status === 'loaned-out';
    
    return (
      <div 
        key={employee.id}
        className={cn(
          "flex border-t border-border/50 hover:bg-muted/20 transition-colors",
          isGuest && "bg-muted/10",
          isLoanedOut && "bg-yellow-50/30 dark:bg-yellow-950/10"
        )}
      >
        {/* Employee Info */}
        <div className={cn(
          "w-36 sm:w-44 lg:w-56 flex-shrink-0 p-2 sm:p-3 border-r border-border",
          isGuest && `border-l-4 ${teamColor}`,
          isLoanedOut && "border-l-4 border-l-yellow-500"
        )}>
          <div className="flex flex-col gap-0.5 sm:gap-1">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-medium text-xs sm:text-sm truncate">{employee.name}</span>
              {isGuest && (
                <Tooltip>
                  <TooltipTrigger>
                    <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Emprestado de {employeeTeam?.name}
                  </TooltipContent>
                </Tooltip>
              )}
              {isLoanedOut && (
                <Tooltip>
                  <TooltipTrigger>
                    <ExternalLink className="w-3 h-3 text-yellow-600 flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Emprestado para outro departamento
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{employee.role}</span>
            {isGuest && employeeTeam && (
              <Badge variant="outline" className={cn("text-[9px] sm:text-[10px] w-fit text-white", teamColor)}>
                {employeeTeam.name}
              </Badge>
            )}
            {isLoanedOut && (
              <Badge variant="outline" className="text-[9px] sm:text-[10px] w-fit border-yellow-500 text-yellow-600">
                Emprestado
              </Badge>
            )}
            {employee.fixedAllocations.length > 0 && (
              <div className="flex flex-wrap gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
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
                  "flex-1 min-w-[60px] sm:min-w-[70px] lg:min-w-[80px] p-1 sm:p-2 border-r border-border/50 last:border-r-0 relative",
                  "cursor-pointer transition-colors",
                  monthData.isOnVacation ? "bg-capacity-blocked/20" : "hover:bg-accent/50"
                )}
                onClick={() => handleCellClick(employee.id, monthIdx)}
              >
                {monthData.isOnVacation ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Umbrella className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                    <span className="text-[10px] sm:text-xs">Férias</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 sm:gap-1.5">
                    <CapacityBar
                      utilized={monthData.totalAllocated}
                      total={monthData.capacity.totalHours}
                      blocked={monthData.blockedHours}
                      showLabel={false}
                      size="sm"
                    />
                    {/* Allocations displayed side by side */}
                    <div className="flex flex-row flex-wrap gap-0.5 sm:gap-1">
                      {monthData.allocations.map(alloc => {
                        // Verificar se é um tipo especial
                        const isSpecialType = Object.values(SPECIAL_ALLOCATION_TYPES).includes(alloc.demandId as any);
                        
                        if (isSpecialType) {
                          const config = SPECIAL_ALLOCATION_CONFIG[alloc.demandId as keyof typeof SPECIAL_ALLOCATION_CONFIG];
                          const IconComponent = config?.icon;
                          
                          return (
                            <AllocationBlock
                              key={alloc.id}
                              demand={{
                                id: alloc.demandId,
                                name: config?.label || 'Alocação',
                                projectId: alloc.projectId,
                                teamId: '',
                                startDate: new Date(),
                                endDate: new Date(),
                                phases: [],
                                totalHours: 0,
                                allocatedHours: 0,
                                status: 'allocated',
                                createdAt: new Date(),
                              }}
                              project={{
                                id: alloc.projectId,
                                name: config?.label || 'Alocação',
                                color: config?.color || '#888',
                              }}
                              hours={alloc.hours}
                              isLoan={false}
                              isSpecial={true}
                              specialIcon={IconComponent}
                              onRemove={() => onRemoveAllocation(alloc.id)}
                            />
                          );
                        }
                        
                        const demand = demands.find(d => d.id === alloc.demandId);
                        
                        // Se a demanda não for encontrada (ex: alocação de outro departamento),
                        // usar as informações que vêm da própria alocação
                        if (!demand) {
                          // Se não temos demandName, é uma alocação órfã - não exibir
                          if (!alloc.demandName) return null;
                          
                          // Criar objeto demand e project temporários com dados da alocação
                          return (
                            <AllocationBlock
                              key={alloc.id}
                              demand={{
                                id: alloc.demandId,
                                name: alloc.demandName,
                                projectId: alloc.projectId,
                                teamId: '',
                                startDate: new Date(),
                                endDate: new Date(),
                                phases: [],
                                totalHours: 0,
                                allocatedHours: 0,
                                status: 'allocated',
                                createdAt: new Date(),
                              }}
                              project={{
                                id: alloc.projectId,
                                name: alloc.projectName || 'Projeto Externo',
                                color: '#6b7280', // Cor cinza para projetos externos
                              }}
                              hours={alloc.hours}
                              isLoan={true} // Marcar como empréstimo já que é de outro departamento
                              onRemove={() => onRemoveAllocation(alloc.id)}
                            />
                          );
                        }
                        
                        // Usar dados do projeto que vem junto com a demanda
                        const projectInfo = {
                          id: demand.projectId,
                          name: demand._projectName || 'Projeto',
                          color: demand._projectColor || '#888',
                        };
                        
                        return (
                          <AllocationBlock
                            key={alloc.id}
                            demand={demand}
                            project={projectInfo}
                            hours={alloc.hours}
                            isLoan={alloc.isLoan}
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
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[900px] lg:min-w-[1200px]">
        {/* Header */}
        <div className="flex border-b border-border sticky top-0 bg-background z-10">
          <div className="w-36 sm:w-44 lg:w-56 flex-shrink-0 p-2 sm:p-3 font-medium text-xs sm:text-sm border-r border-border flex items-center justify-between">
            <span>Recurso</span>
            {onAddGuestEmployee && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 sm:h-7 px-1 sm:px-2"
                onClick={() => setGuestDialogOpen(true)}
              >
                <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            )}
          </div>
          {MONTHS.map((month, idx) => {
            const monthInfo = getMonthInfo(idx, year);
            return (
              <Tooltip key={month}>
                <TooltipTrigger asChild>
                  <div 
                    className="flex-1 min-w-[60px] sm:min-w-[70px] lg:min-w-[80px] p-1.5 sm:p-3 text-center text-xs sm:text-sm font-medium border-r border-border last:border-r-0 cursor-help"
                  >
                    <div className="truncate">{month.slice(0, 3)}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground font-normal hidden sm:block">
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

        {/* Body - Team Employees */}
        <div className="border-b border-border">
          {/* Team Employees - separar próprios de emprestados (enviados) */}
          {employees.map(employee => {
            const isLoanedOut = loanedOutIds.has(employee.id);
            return renderEmployeeRow(employee, isLoanedOut ? 'loaned-out' : 'own');
          })}
          
          {/* Guest Employees (borrowed from other teams - received) */}
          {guestEmployees.length > 0 && (
            <>
              <div className="flex bg-muted/10 border-t border-dashed border-border">
                <div className="w-36 sm:w-44 lg:w-56 flex-shrink-0 p-1.5 px-2 sm:px-3 border-r border-border">
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wide">
                    Recursos Emprestados (Recebidos)
                  </span>
                </div>
                <div className="flex-1" />
              </div>
              {guestEmployees.map(employee => renderEmployeeRow(employee, 'guest'))}
            </>
          )}
          
          {employees.length === 0 && guestEmployees.length === 0 && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Nenhum recurso nesta equipe
            </div>
          )}
        </div>
      </div>

      {/* Add Allocation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Alocação</DialogTitle>
          </DialogHeader>
          {selectedCell && (
            <div className="space-y-4 pt-4">
              {(() => {
                const employee = combinedEmployees.find(e => e.id === selectedCell.employeeId);
                const monthData = employee ? getEmployeeMonthData(employee, selectedCell.month) : null;
                const monthInfo = getMonthInfo(selectedCell.month, year);
                const availableHours = monthData?.capacity.availableHours ?? 0;
                const alreadyAllocated = monthData?.totalAllocated ?? 0;
                const remainingHours = Math.max(0, availableHours - alreadyAllocated);
                
                return (
                  <>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Recurso:</span>{' '}
                        <span className="font-medium">{employee?.name}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Mês:</span>{' '}
                        <span className="font-medium">{MONTHS[selectedCell.month]} {year}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {monthInfo.workingDays} dias úteis • {monthInfo.totalHours}h de capacidade base
                      </p>
                    </div>
                    
                    {/* Resumo de disponibilidade */}
                    <div className={cn(
                      "p-3 rounded-lg border",
                      remainingHours <= 0 ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800" : 
                      remainingHours < 20 ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800" :
                      "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                    )}>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Capacidade disponível:</span>
                        <span className="font-medium">{availableHours}h</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Já alocado:</span>
                        <span className="font-medium">{alreadyAllocated}h</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold pt-1 border-t mt-1">
                        <span className={remainingHours <= 0 ? "text-red-600" : remainingHours < 20 ? "text-yellow-600" : "text-green-600"}>
                          Horas restantes:
                        </span>
                        <span className={remainingHours <= 0 ? "text-red-600" : remainingHours < 20 ? "text-yellow-600" : "text-green-600"}>
                          {remainingHours}h
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Tipo de Alocação</Label>
                      <Select value={selectedDemandId} onValueChange={setSelectedDemandId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de alocação" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Demandas primeiro */}
                          {demands.length > 0 && (
                            <SelectGroup>
                              <SelectLabel className="text-xs text-muted-foreground">Demandas</SelectLabel>
                              {demands.map(demand => {
                                return (
                                  <SelectItem key={demand.id} value={demand.id}>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: demand._projectColor || '#888' }}
                                      />
                                      <span className="truncate">{demand.name}</span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectGroup>
                          )}
                          
                          {demands.length > 0 && <SelectSeparator />}
                          
                          {/* Opções especiais */}
                          <SelectGroup>
                            <SelectLabel className="text-xs text-muted-foreground">Ausências</SelectLabel>
                            <SelectItem value={SPECIAL_ALLOCATION_TYPES.VACATION}>
                              <div className="flex items-center gap-2">
                                <Umbrella className="w-3 h-3 text-orange-500" />
                                <span>Férias</span>
                              </div>
                            </SelectItem>
                            <SelectItem value={SPECIAL_ALLOCATION_TYPES.TRAINING}>
                              <div className="flex items-center gap-2">
                                <GraduationCap className="w-3 h-3 text-purple-500" />
                                <span>Treinamento</span>
                              </div>
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Horas 
                        <span className="text-muted-foreground font-normal ml-1">
                          (máx: {remainingHours}h)
                        </span>
                      </Label>
                      <Input
                        type="number"
                        placeholder={`Ex: ${Math.min(40, remainingHours)}`}
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        max={remainingHours}
                        min={1}
                        className={parseInt(hours) > remainingHours ? "border-red-500 focus-visible:ring-red-500" : ""}
                      />
                      {parseInt(hours) > remainingHours && (
                        <p className="text-xs text-red-500">
                          Excede o limite disponível em {parseInt(hours) - remainingHours}h
                        </p>
                      )}
                    </div>
                    <Button 
                      onClick={handleAddAllocation} 
                      className="w-full"
                      disabled={remainingHours <= 0 || !hours || parseInt(hours) <= 0 || parseInt(hours) > remainingHours}
                    >
                      Adicionar Alocação
                    </Button>
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Guest Employee Dialog */}
      <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emprestar Recurso de Outra Equipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Adicione um recurso de outra equipe para trabalhar em suas demandas.
              As horas alocadas serão somadas com as alocações do time de origem.
            </p>
            <p className="text-sm text-muted-foreground italic">
              (Funcionalidade em desenvolvimento - será possível buscar recursos de outras equipes)
            </p>
            <Button onClick={() => setGuestDialogOpen(false)} variant="outline" className="w-full">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
