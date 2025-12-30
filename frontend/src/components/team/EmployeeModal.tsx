import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Employee } from '@/types/planner';
import { employeeService } from '@/services/employeeService';
import { useTeam } from '@/contexts/TeamContext';
import { Loader2 } from 'lucide-react';

interface EmployeeModalProps {
  open: boolean;
  onClose: () => void;
  employee?: Employee | null;
  onSave: (isNew: boolean) => void;
  onDelete?: () => void;
}

export function EmployeeModal({ open, onClose, employee, onSave, onDelete }: EmployeeModalProps) {
  const { selectedTeam, teams } = useTeam();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<{ value: string; label: string }[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    departmentId: selectedTeam?.id || '',
    dailyHours: 8,
  });

  useEffect(() => {
    const loadRoles = async () => {
      const rolesData = await employeeService.getRoles();
      setRoles(rolesData);
    };
    loadRoles();
  }, []);

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        role: employee.role,
        departmentId: employee.teamId,
        dailyHours: employee.dailyHours,
      });
    } else {
      setFormData({
        name: '',
        role: '',
        departmentId: selectedTeam?.id || '',
        dailyHours: 8,
      });
    }
  }, [employee, selectedTeam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const isNew = !employee;

    try {
      if (employee) {
        await employeeService.updateEmployee(employee.id, formData);
      } else {
        await employeeService.createEmployee(formData);
      }
      onSave(isNew);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {employee ? 'Editar Recurso' : 'Novo Recurso'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo do recurso"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Cargo *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              required
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
            <Label htmlFor="department">Departamento *</Label>
            <Select
              value={formData.departmentId}
              onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o departamento" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
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

          <div className="flex justify-between gap-2 pt-4">
            <div>
              {employee && onDelete && (
                <Button 
                  type="button" 
                  variant="destructive"
                  onClick={() => {
                    onDelete();
                    onClose();
                  }}
                >
                  Excluir
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !formData.name || !formData.role || !formData.departmentId}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {employee ? 'Salvar' : 'Criar Recurso'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
