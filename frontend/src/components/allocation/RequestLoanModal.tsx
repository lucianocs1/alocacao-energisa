import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, Building2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { loanService, AvailableEmployeeDto, CreateLoanRequest } from '@/services/loanService';
import { cn } from '@/lib/utils';

interface RequestLoanModalProps {
  open: boolean;
  onClose: () => void;
  targetDepartmentId: string;
  targetDepartmentName: string;
  onLoanCreated: () => void;
}

export function RequestLoanModal({ 
  open, 
  onClose, 
  targetDepartmentId,
  targetDepartmentName,
  onLoanCreated 
}: RequestLoanModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<AvailableEmployeeDto[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  
  // Agrupar funcionários por departamento
  const employeesByDepartment = availableEmployees.reduce((acc, emp) => {
    const key = emp.departmentId;
    if (!acc[key]) {
      acc[key] = {
        departmentName: emp.departmentName,
        employees: []
      };
    }
    acc[key].employees.push(emp);
    return acc;
  }, {} as Record<string, { departmentName: string; employees: AvailableEmployeeDto[] }>);

  // Lista de departamentos disponíveis
  const departments = Object.entries(employeesByDepartment).map(([id, data]) => ({
    id,
    name: data.departmentName,
    employeeCount: data.employees.length
  }));

  // Funcionários do departamento selecionado
  const employeesInSelectedDept = selectedDepartmentId 
    ? employeesByDepartment[selectedDepartmentId]?.employees || []
    : [];

  useEffect(() => {
    if (open && targetDepartmentId) {
      loadAvailableEmployees();
    }
  }, [open, targetDepartmentId]);

  const loadAvailableEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const employees = await loanService.getAvailableEmployees(targetDepartmentId);
      setAvailableEmployees(employees);
    } catch (error) {
      toast.error('Erro ao carregar funcionários disponíveis');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployeeId) {
      toast.error('Selecione um funcionário');
      return;
    }

    setLoading(true);
    try {
      const request: CreateLoanRequest = {
        employeeId: selectedEmployeeId,
        targetDepartmentId,
        startDate: new Date().toISOString(),
        expectedEndDate: expectedEndDate || undefined,
        reason: reason || undefined,
        notes: notes || undefined,
      };

      await loanService.createLoan(request);
      
      const selectedEmployee = availableEmployees.find(e => e.id === selectedEmployeeId);
      toast.success(`${selectedEmployee?.name} foi emprestado para ${targetDepartmentName}`);
      
      handleClose();
      onLoanCreated();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao solicitar empréstimo');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedDepartmentId('');
    setSelectedEmployeeId('');
    setReason('');
    setNotes('');
    setExpectedEndDate('');
    onClose();
  };

  // Quando mudar o departamento, limpar o funcionário selecionado
  const handleDepartmentChange = (deptId: string) => {
    setSelectedDepartmentId(deptId);
    setSelectedEmployeeId('');
  };

  const selectedEmployee = availableEmployees.find(e => e.id === selectedEmployeeId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Solicitar Empréstimo de Recurso
          </DialogTitle>
          <DialogDescription>
            Solicite um recurso de outro departamento para trabalhar temporariamente em <strong>{targetDepartmentName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Seleção de Departamento */}
          <div className="space-y-2">
            <Label>Departamento de Origem *</Label>
            {loadingEmployees ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : departments.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum departamento com recursos disponíveis</p>
              </div>
            ) : (
              <Select value={selectedDepartmentId} onValueChange={handleDepartmentChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name} ({dept.employeeCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Seleção de Recurso */}
          <div className="space-y-2">
            <Label>Recurso *</Label>
            <Select 
              value={selectedEmployeeId} 
              onValueChange={setSelectedEmployeeId}
              disabled={!selectedDepartmentId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={selectedDepartmentId ? "Selecione o recurso" : "Selecione um departamento primeiro"} />
              </SelectTrigger>
              <SelectContent>
                {employeesInSelectedDept.map(emp => (
                  <SelectItem 
                    key={emp.id} 
                    value={emp.id}
                    disabled={emp.isCurrentlyLoaned}
                  >
                    {emp.name} - {emp.role}
                    {emp.isCurrentlyLoaned && " (Emprestado)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data prevista de devolução */}
          <div className="space-y-2">
            <Label htmlFor="expectedEndDate">Previsão de Devolução (opcional)</Label>
            <Input
              id="expectedEndDate"
              type="date"
              value={expectedEndDate}
              onChange={(e) => setExpectedEndDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo do Empréstimo</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Apoio no projeto X, Substituição de férias..."
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !selectedEmployeeId}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Solicitar Empréstimo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
