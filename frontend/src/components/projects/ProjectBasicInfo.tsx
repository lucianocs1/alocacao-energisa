import { useState, useEffect } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjects } from '@/contexts/ProjectContext';
import { generateColorForProject } from '@/lib/utils';

interface ProjectBasicInfoProps {
  onValidationChange: (isValid: boolean) => void;
}

export const ProjectBasicInfo = ({ onValidationChange }: ProjectBasicInfoProps) => {
  const { createProjectData, setCreateProjectData } = useProjects();
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    validateForm();
  }, [createProjectData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!createProjectData.name.trim()) {
      newErrors.name = 'Nome do projeto é obrigatório';
    }

    if (!createProjectData.startDate) {
      newErrors.startDate = 'Data de início é obrigatória';
    }

    if (!createProjectData.endDate) {
      newErrors.endDate = 'Data de término é obrigatória';
    }

    if (createProjectData.startDate && createProjectData.endDate && createProjectData.startDate > createProjectData.endDate) {
      newErrors.dateRange = 'Data de início deve ser anterior à data de término';
    }

    setErrors(newErrors);
    onValidationChange(Object.keys(newErrors).length === 0);
  };

  const handleColorChange = () => {
    const newColor = generateColorForProject();
    setCreateProjectData({
      ...createProjectData,
      color: newColor,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Projeto *</Label>
          <Input
            id="name"
            placeholder="Ex: Reforma Tributária"
            value={createProjectData.name}
            onChange={(e) =>
              setCreateProjectData({
                ...createProjectData,
                name: e.target.value,
              })
            }
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição do Projeto</Label>
        <Input
          id="description"
          placeholder="Descreva o objetivo e escopo do projeto..."
          value={createProjectData.description}
          onChange={(e) =>
            setCreateProjectData({
              ...createProjectData,
              description: e.target.value,
            })
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="startDate">Data de Início *</Label>
          <Input
            id="startDate"
            type="date"
            value={createProjectData.startDate ? createProjectData.startDate.toISOString().split('T')[0] : ''}
            onChange={(e) =>
              setCreateProjectData({
                ...createProjectData,
                startDate: e.target.value ? new Date(e.target.value) : null,
              })
            }
            className={errors.startDate ? 'border-red-500' : ''}
          />
          {errors.startDate && (
            <p className="text-sm text-red-500">{errors.startDate}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Data de Término *</Label>
          <Input
            id="endDate"
            type="date"
            value={createProjectData.endDate ? createProjectData.endDate.toISOString().split('T')[0] : ''}
            onChange={(e) =>
              setCreateProjectData({
                ...createProjectData,
                endDate: e.target.value ? new Date(e.target.value) : null,
              })
            }
            className={errors.endDate ? 'border-red-500' : ''}
          />
          {errors.endDate && (
            <p className="text-sm text-red-500">{errors.endDate}</p>
          )}
        </div>
      </div>

      {errors.dateRange && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.dateRange}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade *</Label>
          <Select value={createProjectData.priority} onValueChange={(value: any) =>
            setCreateProjectData({
              ...createProjectData,
              priority: value,
            })
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Cor do Projeto</Label>
          <div className="flex gap-2 items-center">
            <div
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer hover:border-gray-500 transition-colors"
              style={{ backgroundColor: createProjectData.color }}
              onClick={handleColorChange}
              title="Clique para gerar uma nova cor"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleColorChange}
            >
              Gerar Cor
            </Button>
          </div>
        </div>
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-blue-900 dark:text-blue-100">
            Dicas para Preencher
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p>• A descrição ajuda a equipe a entender o contexto do projeto</p>
          <p>• Use datas realistas para melhor planejamento</p>
          <p>• A prioridade afeta a visualização e alocação de recursos</p>
        </CardContent>
      </Card>
    </div>
  );
};
