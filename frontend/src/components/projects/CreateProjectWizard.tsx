import { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/contexts/ProjectContext';
import { ProjectBasicInfo } from './ProjectBasicInfo';
import { ProjectDemands } from './ProjectDemands';
import { ProjectReview } from './ProjectReview';
import { Project } from '@/types/planner';
import { useToast } from '@/hooks/use-toast';

interface CreateProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (project: Project) => void;
}

export const CreateProjectWizard = ({ open, onOpenChange, onProjectCreated }: CreateProjectWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [stepValidation, setStepValidation] = useState({
    0: false,
    1: false,
    2: true, // Review step doesn't need validation
  });
  const { createProjectData, resetCreateProjectData, createProjectFromData } = useProjects();
  const { toast } = useToast();

  const steps = [
    {
      title: 'Informações Básicas',
      description: 'Defina o nome, código e cronograma do projeto',
      component: <ProjectBasicInfo onValidationChange={(valid) => handleValidationChange(0, valid)} />,
    },
    {
      title: 'Demandas',
      description: 'Adicione as demandas do projeto',
      component: <ProjectDemands onValidationChange={(valid) => handleValidationChange(1, valid)} />,
    },
    {
      title: 'Revisar',
      description: 'Verifique as informações antes de criar',
      component: <ProjectReview />,
    },
  ];

  const handleValidationChange = (step: number, isValid: boolean) => {
    setStepValidation((prev) => ({
      ...prev,
      [step]: isValid,
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    
    try {
      const createdProject = await createProjectFromData();
      
      if (createdProject) {
        // Reset form and close
        setCurrentStep(0);
        onOpenChange(false);

        // Call callback if provided
        onProjectCreated?.(createdProject);

        // Show success toast
        toast({
          title: "Projeto criado com sucesso!",
          description: `O projeto "${createdProject.name}" foi criado.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Erro ao criar projeto",
          description: "Verifique os dados e tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      toast({
        title: "Erro ao criar projeto",
        description: "Ocorreu um erro ao salvar o projeto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetCreateProjectData();
      setCurrentStep(0);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{steps[currentStep].title}</DialogTitle>
          <DialogDescription>{steps[currentStep].description}</DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex gap-2 my-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-1 rounded-full transition-colors ${
                index <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="my-6">
          {steps[currentStep].component}
        </div>

        {/* Footer with Actions */}
        <div className="flex gap-3 justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="flex gap-2">
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!stepValidation[currentStep as keyof typeof stepValidation]}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={!stepValidation[1] || isCreating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isCreating ? (
                  <>
                    <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Criando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Criar Projeto
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Step Counter */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Etapa {currentStep + 1} de {steps.length}
        </p>
      </DialogContent>
    </Dialog>
  );
};
