import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Project } from '@/types/planner';

interface ProjectCreatedSuccessProps {
  project: Project;
  onNavigateToAllocations?: () => void;
  onClose?: () => void;
}

export const ProjectCreatedSuccess = ({
  project,
  onNavigateToAllocations,
  onClose,
}: ProjectCreatedSuccessProps) => {
  const totalHours = project.demands.reduce((sum, d) => sum + d.totalHours, 0);

  return (
    <div className="space-y-4">
      <Card className="border-green-200 bg-green-50 dark:bg-green-950">
        <CardHeader>
          <CardTitle className="text-green-900 dark:text-green-100">
            ✓ Projeto Criado com Sucesso!
          </CardTitle>
          <CardDescription className="text-green-800 dark:text-green-200">
            Seu novo projeto está pronto para ser utilizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-green-700 dark:text-green-300">Nome do Projeto</p>
              <p className="font-semibold text-lg">{project.name}</p>
            </div>
            <div>
              <p className="text-sm text-green-700 dark:text-green-300">Código</p>
              <p className="font-semibold text-lg">{project.code}</p>
            </div>
            <div>
              <p className="text-sm text-green-700 dark:text-green-300">Demandas Criadas</p>
              <p className="font-semibold text-lg">{project.demands.length}</p>
            </div>
            <div>
              <p className="text-sm text-green-700 dark:text-green-300">Total de Horas</p>
              <p className="font-semibold text-lg">{totalHours.toLocaleString('pt-BR')}h</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Próximos passos:</strong> Você pode agora visualizar o projeto na lista e começar a alocar recursos para as demandas.
        </AlertDescription>
      </Alert>

      <div className="flex gap-2">
        <Button
          onClick={onNavigateToAllocations}
          className="bg-blue-600 hover:bg-blue-700 flex-1"
        >
          Ir para Alocações
        </Button>
        <Button
          onClick={onClose}
          variant="outline"
          className="flex-1"
        >
          Fechar
        </Button>
      </div>
    </div>
  );
};
