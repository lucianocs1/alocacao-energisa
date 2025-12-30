import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjects } from '@/contexts/ProjectContext';
import { useTeam } from '@/contexts/TeamContext';
import { Demand } from '@/types/planner';

interface ProjectDemandsProps {
  onValidationChange: (isValid: boolean) => void;
}

export const ProjectDemands = ({ onValidationChange }: ProjectDemandsProps) => {
  const { createProjectData, setCreateProjectData } = useProjects();
  const { teams, loading: loadingTeams } = useTeam();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validar quando as demandas mudarem
  useEffect(() => {
    validateDemands();
  }, [createProjectData.demands]);

  const validateDemands = () => {
    const newErrors: Record<string, string> = {};

    if (createProjectData.demands.length === 0) {
      newErrors.demands = 'Pelo menos uma demanda é obrigatória';
    }

    createProjectData.demands.forEach((demand, index) => {
      if (!demand.name.trim()) {
        newErrors[`demand-${index}-name`] = 'Nome é obrigatório';
      }
      if (!demand.teamId) {
        newErrors[`demand-${index}-team`] = 'Equipe é obrigatória';
      }
      if (!demand.startDate) {
        newErrors[`demand-${index}-start`] = 'Data de início é obrigatória';
      }
      if (!demand.endDate) {
        newErrors[`demand-${index}-end`] = 'Data de término é obrigatória';
      }
      if (demand.totalHours <= 0) {
        newErrors[`demand-${index}-hours`] = 'Horas deve ser maior que 0';
      }
      if (demand.startDate && demand.endDate && demand.startDate > demand.endDate) {
        newErrors[`demand-${index}-dateRange`] = 'Data de início deve ser anterior ao término';
      }
    });

    setErrors(newErrors);
    onValidationChange(Object.keys(newErrors).length === 0);
  };

  const addDemand = () => {
    const newDemand: Omit<Demand, 'id' | 'projectId' | 'allocatedHours' | 'createdAt' | 'isNew'> = {
      name: '',
      description: '',
      teamId: '',
      startDate: createProjectData.startDate || new Date(),
      endDate: createProjectData.endDate || new Date(),
      phases: [],
      totalHours: 0,
      status: 'pending',
    };

    const updated = {
      ...createProjectData,
      demands: [...createProjectData.demands, newDemand],
    };

    setCreateProjectData(updated);
    setTimeout(() => validateDemands(), 0);
  };

  const removeDemand = (index: number) => {
    const updated = {
      ...createProjectData,
      demands: createProjectData.demands.filter((_, i) => i !== index),
    };

    setCreateProjectData(updated);
    setTimeout(() => validateDemands(), 0);
  };

  const updateDemand = (index: number, field: keyof Omit<Demand, 'id' | 'projectId' | 'allocatedHours' | 'createdAt' | 'isNew'>, value: any) => {
    const updated = {
      ...createProjectData,
      demands: createProjectData.demands.map((demand, i) =>
        i === index ? { ...demand, [field]: value } : demand
      ),
    };

    setCreateProjectData(updated);
    setTimeout(() => validateDemands(), 0);
  };

  return (
    <div className="space-y-6">
      {errors.demands && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.demands}</AlertDescription>
        </Alert>
      )}

      {createProjectData.demands.map((demand, index) => (
        <Card key={index} className="relative">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Demanda {index + 1}</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeDemand(index)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Demanda *</Label>
                  <Input
                    placeholder="Ex: Frente Contábil - Abertura de Razão"
                    value={demand.name}
                    onChange={(e) => updateDemand(index, 'name', e.target.value)}
                    className={errors[`demand-${index}-name`] ? 'border-red-500' : ''}
                  />
                  {errors[`demand-${index}-name`] && (
                    <p className="text-sm text-red-500">{errors[`demand-${index}-name`]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Equipe Responsável *</Label>
                  <Select
                    value={demand.teamId}
                    onValueChange={(value) => updateDemand(index, 'teamId', value)}
                    disabled={loadingTeams}
                  >
                    <SelectTrigger className={errors[`demand-${index}-team`] ? 'border-red-500' : ''}>
                      <SelectValue placeholder={loadingTeams ? "Carregando departamentos..." : "Selecione um departamento"} />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[`demand-${index}-team`] && (
                    <p className="text-sm text-red-500">{errors[`demand-${index}-team`]}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  placeholder="Descreva os detalhes da demanda..."
                  value={demand.description || ''}
                  onChange={(e) => updateDemand(index, 'description', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Data de Início *</Label>
                  <Input
                    type="date"
                    value={demand.startDate ? demand.startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => updateDemand(index, 'startDate', e.target.value ? new Date(e.target.value) : null)}
                    className={errors[`demand-${index}-start`] ? 'border-red-500' : ''}
                  />
                  {errors[`demand-${index}-start`] && (
                    <p className="text-sm text-red-500">{errors[`demand-${index}-start`]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Data de Término *</Label>
                  <Input
                    type="date"
                    value={demand.endDate ? demand.endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => updateDemand(index, 'endDate', e.target.value ? new Date(e.target.value) : null)}
                    className={errors[`demand-${index}-end`] ? 'border-red-500' : ''}
                  />
                  {errors[`demand-${index}-end`] && (
                    <p className="text-sm text-red-500">{errors[`demand-${index}-end`]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Horas Estimadas *</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Ex: 1000"
                    value={demand.totalHours || ''}
                    onChange={(e) => updateDemand(index, 'totalHours', parseInt(e.target.value) || 0)}
                    className={errors[`demand-${index}-hours`] ? 'border-red-500' : ''}
                  />
                  {errors[`demand-${index}-hours`] && (
                    <p className="text-sm text-red-500">{errors[`demand-${index}-hours`]}</p>
                  )}
                </div>
              </div>

              {errors[`demand-${index}-dateRange`] && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors[`demand-${index}-dateRange`]}</AlertDescription>
                </Alert>
              )}

              {/* Datas das Fases */}
              <div className="mt-6 pt-4 border-t space-y-4">
                <h4 className="font-semibold text-sm">Datas das Fases (Opcional)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Início Homologação</Label>
                    <Input
                      type="date"
                      value={demand.hmgStartDate ? demand.hmgStartDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => updateDemand(index, 'hmgStartDate', e.target.value ? new Date(e.target.value) : null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fim Homologação</Label>
                    <Input
                      type="date"
                      value={demand.hmgEndDate ? demand.hmgEndDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => updateDemand(index, 'hmgEndDate', e.target.value ? new Date(e.target.value) : null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>GO Live</Label>
                    <Input
                      type="date"
                      value={demand.goLiveDate ? demand.goLiveDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => updateDemand(index, 'goLiveDate', e.target.value ? new Date(e.target.value) : null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Operação Assistida</Label>
                    <Input
                      type="date"
                      value={demand.assistedOpDate ? demand.assistedOpDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => updateDemand(index, 'assistedOpDate', e.target.value ? new Date(e.target.value) : null)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        onClick={addDemand}
        variant="outline"
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Demanda
      </Button>
    </div>
  );
};
