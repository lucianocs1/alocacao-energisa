import { useState } from 'react';
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
import { PHASE_CONFIG, PhaseType } from '@/types/planner';

interface ProjectPhasesProps {
  projectStartDate: Date | null;
  projectEndDate: Date | null;
  onPhasesChange?: (phases: any[]) => void;
}

export const ProjectPhases = ({
  projectStartDate,
  projectEndDate,
  onPhasesChange,
}: ProjectPhasesProps) => {
  const [phases, setPhases] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const phaseTypes: PhaseType[] = ['construction', 'homologation', 'go-live', 'assisted-operation', 'maintenance'];

  const addPhase = () => {
    const newPhase = {
      id: `phase-${Date.now()}`,
      type: 'construction' as PhaseType,
      name: '',
      startDate: projectStartDate || new Date(),
      endDate: projectEndDate || new Date(),
      isMilestone: false,
    };

    const updatedPhases = [...phases, newPhase];
    setPhases(updatedPhases);
    onPhasesChange?.(updatedPhases);
  };

  const removePhase = (index: number) => {
    const updatedPhases = phases.filter((_, i) => i !== index);
    setPhases(updatedPhases);
    onPhasesChange?.(updatedPhases);
  };

  const updatePhase = (index: number, field: string, value: any) => {
    const updatedPhases = phases.map((phase, i) =>
      i === index ? { ...phase, [field]: value } : phase
    );
    setPhases(updatedPhases);
    onPhasesChange?.(updatedPhases);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-2">Fases do Projeto (Opcional)</h3>
        <p className="text-xs text-gray-500 mb-4">
          Defina as fases do cronograma: Construção, Homologação, Go-Live, Operação Assistida e Manutenção.
        </p>
      </div>

      {phases.length === 0 && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Você pode adicionar fases agora ou configurá-las depois na visualização do projeto.
          </AlertDescription>
        </Alert>
      )}

      {phases.map((phase, index) => (
        <Card key={phase.id}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-sm font-semibold">Fase {index + 1}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removePhase(index)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Fase</Label>
                  <Select
                    value={phase.type}
                    onValueChange={(value) => updatePhase(index, 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {phaseTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {PHASE_CONFIG[type].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nome Customizado (Opcional)</Label>
                  <Input
                    placeholder="Ex: Levantamento de Requisitos"
                    value={phase.name || ''}
                    onChange={(e) => updatePhase(index, 'name', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input
                    type="date"
                    value={phase.startDate ? phase.startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => updatePhase(index, 'startDate', e.target.value ? new Date(e.target.value) : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Término</Label>
                  <Input
                    type="date"
                    value={phase.endDate ? phase.endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => updatePhase(index, 'endDate', e.target.value ? new Date(e.target.value) : null)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`milestone-${index}`}
                    checked={phase.isMilestone || false}
                    onChange={(e) => updatePhase(index, 'isMilestone', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor={`milestone-${index}`} className="!mt-0">
                    Marcar como marco (milestone) - duração de 1 dia
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        onClick={addPhase}
        variant="outline"
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Fase
      </Button>
    </div>
  );
};
