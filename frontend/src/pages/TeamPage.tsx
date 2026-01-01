import { useState, useEffect } from 'react';
import { EmployeeCard } from '@/components/team/EmployeeCard';
import { EmployeeModal } from '@/components/team/EmployeeModal';
import { EmployeeDetailModal } from '@/components/team/EmployeeDetailModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, Users, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useCalendar } from '@/hooks/useCalendar';
import { useTeam } from '@/contexts/TeamContext';
import { Employee } from '@/types/planner';
import { employeeService } from '@/services/employeeService';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function TeamPage() {
  const { selectedTeam } = useTeam();
  const { getMonthCapacity } = useCalendar();
  const { toast } = useToast();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await employeeService.getEmployees(selectedTeam?.id);
      setEmployees(data);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTeam) {
      loadEmployees();
    }
  }, [selectedTeam]);

  const handleNewEmployee = () => {
    setSelectedEmployee(null);
    setModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDetailModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleDetailModalClose = () => {
    setDetailModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleSave = (isNew: boolean = false) => {
    loadEmployees();
    toast({
      title: isNew ? 'Recurso criado!' : 'Recurso atualizado!',
      description: isNew ? 'O novo recurso foi adicionado com sucesso.' : 'As alterações foram salvas.',
    });
  };

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    
    try {
      const success = await employeeService.deleteEmployee(employeeToDelete.id);
      if (success) {
        loadEmployees();
        toast({
          title: 'Recurso excluído!',
          description: `${employeeToDelete.name} foi removido da equipe.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o recurso.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  // Calculate total capacity using current month
  const currentDate = new Date();
  const totalCapacity = employees.reduce((sum, e) => {
    const capacity = getMonthCapacity(currentDate.getMonth(), currentDate.getFullYear(), e);
    return sum + capacity.totalHours;
  }, 0);
  
  const totalFixedHours = employees.reduce((sum, e) => 
    sum + e.fixedAllocations.reduce((s, f) => s + f.hoursPerMonth, 0), 0
  );

  const totalAvailable = employees.reduce((sum, e) => {
    const capacity = getMonthCapacity(currentDate.getMonth(), currentDate.getFullYear(), e);
    return sum + capacity.availableHours;
  }, 0);

  const currentMonth = currentDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

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
        <Button onClick={handleNewEmployee}>
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
              <p className="text-2xl font-bold">{employees.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Capacidade ({currentMonth})</p>
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
            <p className="text-sm text-muted-foreground">Disponível ({currentMonth})</p>
            <p className="text-2xl font-bold text-success">{totalAvailable}h</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.length > 0 ? (
            employees.map(employee => (
              <EmployeeCard 
                key={employee.id} 
                employee={employee}
                onEdit={() => handleEditEmployee(employee)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p>Nenhum recurso cadastrado nesta equipe</p>
              <Button variant="outline" className="mt-4" onClick={handleNewEmployee}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar primeiro recurso
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal for New Employee */}
      <EmployeeModal
        open={modalOpen}
        onClose={handleModalClose}
        employee={null}
        onSave={handleSave}
      />

      {/* Modal for Employee Details (with vacation management) */}
      {selectedEmployee && (
        <EmployeeDetailModal
          open={detailModalOpen}
          onClose={handleDetailModalClose}
          employee={selectedEmployee}
          onSave={() => {
            loadEmployees();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{employeeToDelete?.name}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
