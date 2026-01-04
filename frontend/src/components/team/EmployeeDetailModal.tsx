import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Employee, VacationPeriod, FixedAllocation } from '@/types/planner';
import { employeeService } from '@/services/employeeService';
import { useTeam } from '@/contexts/TeamContext';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Plus, Trash2, Calendar, Briefcase, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface EmployeeDetailModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee;
  onSave: () => void;
}

export function EmployeeDetailModal({ open, onClose, employee, onSave }: EmployeeDetailModalProps) {
  const { selectedTeam, teams } = useTeam();
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [roles, setRoles] = useState<{ value: string; label: string }[]>([]);
  const [localEmployee, setLocalEmployee] = useState<Employee>(employee);
  
  // Coordenador só pode editar no seu próprio departamento
  const isCoordinator = usuario?.role === 'Coordenador';
  const userDepartmentId = usuario?.departmentId;
  
  // Filtra departamentos disponíveis: coordenador só vê o seu, gerente vê todos
  const availableDepartments = useMemo(() => {
    if (isCoordinator && userDepartmentId) {
      return teams.filter(team => team.id === userDepartmentId);
    }
    return teams;
  }, [teams, isCoordinator, userDepartmentId]);
  
  // Form states
  const [formData, setFormData] = useState({
    name: employee.name,
    role: employee.role,
    departmentId: employee.teamId,
    dailyHours: employee.dailyHours,
  });

  // Vacation form
  const [vacationStartDate, setVacationStartDate] = useState('');
  const [vacationEndDate, setVacationEndDate] = useState('');

  // Fixed allocation form
  const [fixedName, setFixedName] = useState('');
  const [fixedHours, setFixedHours] = useState('40');

  useEffect(() => {
    const loadRoles = async () => {
      const rolesData = await employeeService.getRoles();
      setRoles(rolesData);
    };
    loadRoles();
  }, []);

  useEffect(() => {
    setLocalEmployee(employee);
    setFormData({
      name: employee.name,
      role: employee.role,
      departmentId: employee.teamId,
      dailyHours: employee.dailyHours,
    });
  }, [employee]);

  const handleSaveInfo = async () => {
    setLoading(true);
    try {
      await employeeService.updateEmployee(employee.id, formData);
      toast.success('Informações atualizadas!');
      onSave();
    } catch (error) {
      toast.error('Erro ao salvar informações');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVacation = async () => {
    if (!vacationStartDate || !vacationEndDate) {
      toast.error('Preencha as datas de início e fim');
      return;
    }

    setLoading(true);
    try {
      const newVacation = await employeeService.addVacation(
        employee.id,
        new Date(vacationStartDate),
        new Date(vacationEndDate)
      );
      if (newVacation) {
        setLocalEmployee({
          ...localEmployee,
          vacations: [...localEmployee.vacations, newVacation],
        });
        setVacationStartDate('');
        setVacationEndDate('');
        toast.success('Férias adicionadas!');
        onSave();
      }
    } catch (error) {
      toast.error('Erro ao adicionar férias');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVacation = async (vacationId: string) => {
    setLoading(true);
    try {
      const success = await employeeService.removeVacation(employee.id, vacationId);
      if (success) {
        setLocalEmployee({
          ...localEmployee,
          vacations: localEmployee.vacations.filter(v => v.id !== vacationId),
        });
        toast.success('Férias removidas!');
        onSave();
      }
    } catch (error) {
      toast.error('Erro ao remover férias');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFixedAllocation = async () => {
    if (!fixedName || !fixedHours) {
      toast.error('Preencha o nome e as horas');
      return;
    }

    setLoading(true);
    try {
      const newAllocation = await employeeService.addFixedAllocation(
        employee.id,
        fixedName,
        parseInt(fixedHours)
      );
      if (newAllocation) {
        setLocalEmployee({
          ...localEmployee,
          fixedAllocations: [...localEmployee.fixedAllocations, newAllocation],
        });
        setFixedName('');
        setFixedHours('40');
        toast.success('Alocação fixa adicionada!');
        onSave();
      }
    } catch (error) {
      toast.error('Erro ao adicionar alocação fixa');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFixedAllocation = async (allocationId: string) => {
    setLoading(true);
    try {
      const success = await employeeService.removeFixedAllocation(employee.id, allocationId);
      if (success) {
        setLocalEmployee({
          ...localEmployee,
          fixedAllocations: localEmployee.fixedAllocations.filter(f => f.id !== allocationId),
        });
        toast.success('Alocação fixa removida!');
        onSave();
      }
    } catch (error) {
      toast.error('Erro ao remover alocação fixa');
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = (startDate: Date, endDate: Date) => {
    return `${format(startDate, "dd 'de' MMMM", { locale: ptBR })} até ${format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
  };

  const calculateVacationDays = (startDate: Date, endDate: Date) => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {employee.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="vacations" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Férias ({localEmployee.vacations.length})
            </TabsTrigger>
            <TabsTrigger value="fixed" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Fixas ({localEmployee.fixedAllocations.length})
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Cargo</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                disabled={isCoordinator}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dailyHours">Jornada Diária (horas)</Label>
              <Input
                id="dailyHours"
                type="number"
                min="1"
                max="12"
                value={formData.dailyHours}
                onChange={(e) => setFormData({ ...formData, dailyHours: parseInt(e.target.value) || 8 })}
              />
            </div>

            <Button onClick={handleSaveInfo} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Informações
            </Button>
          </TabsContent>

          {/* Vacations Tab */}
          <TabsContent value="vacations" className="space-y-4 mt-4">
            {/* Add vacation form */}
            <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
              <Label className="text-sm font-medium">Adicionar Período de Férias</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Início</Label>
                  <Input
                    type="date"
                    value={vacationStartDate}
                    onChange={(e) => setVacationStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Fim</Label>
                  <Input
                    type="date"
                    value={vacationEndDate}
                    onChange={(e) => setVacationEndDate(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={handleAddVacation} 
                disabled={loading || !vacationStartDate || !vacationEndDate}
                size="sm"
                className="w-full"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Adicionar Férias
              </Button>
            </div>

            {/* Vacation list */}
            <div className="space-y-2">
              {localEmployee.vacations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhum período de férias cadastrado</p>
                </div>
              ) : (
                localEmployee.vacations
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .map((vacation) => (
                    <div 
                      key={vacation.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-orange-50 dark:bg-orange-950/20"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {formatDateRange(new Date(vacation.startDate), new Date(vacation.endDate))}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {calculateVacationDays(new Date(vacation.startDate), new Date(vacation.endDate))} dias
                        </Badge>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover férias?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover este período de férias?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveVacation(vacation.id)}>
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))
              )}
            </div>
          </TabsContent>

          {/* Fixed Allocations Tab */}
          <TabsContent value="fixed" className="space-y-4 mt-4">
            {/* Add fixed allocation form */}
            <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
              <Label className="text-sm font-medium">Adicionar Alocação Fixa</Label>
              <p className="text-xs text-muted-foreground">
                Alocações fixas são atividades recorrentes que consomem horas todo mês (ex: reuniões, suporte, etc)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nome</Label>
                  <Input
                    placeholder="Ex: Reunião Semanal"
                    value={fixedName}
                    onChange={(e) => setFixedName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Horas/Mês</Label>
                  <Input
                    type="number"
                    min="1"
                    max="160"
                    value={fixedHours}
                    onChange={(e) => setFixedHours(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={handleAddFixedAllocation} 
                disabled={loading || !fixedName || !fixedHours}
                size="sm"
                className="w-full"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Adicionar Alocação Fixa
              </Button>
            </div>

            {/* Fixed allocations list */}
            <div className="space-y-2">
              {localEmployee.fixedAllocations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma alocação fixa cadastrada</p>
                </div>
              ) : (
                localEmployee.fixedAllocations.map((allocation) => (
                  <div 
                    key={allocation.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20"
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{allocation.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          {allocation.hoursPerMonth}h/mês
                        </Badge>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover alocação fixa?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover "{allocation.name}"?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemoveFixedAllocation(allocation.id)}>
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
