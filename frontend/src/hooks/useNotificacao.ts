import { useToast } from '@/hooks/use-toast';

export function useNotificacao() {
  const { toast } = useToast();

  const sucesso = (title: string, description?: string) => {
    try {
      const { dismiss } = toast({
        title,
        description,
        variant: 'default',
      });
      
      // Remover após 4 segundos
      setTimeout(() => {
        try {
          dismiss();
        } catch (e) {
          console.error('Erro ao dismissar toast de sucesso:', e);
        }
      }, 4000);
    } catch (e) {
      console.error('Erro ao criar toast de sucesso:', e);
    }
  };

  const erro = (title: string, description?: string) => {
    try {
      const { dismiss } = toast({
        title,
        description,
        variant: 'destructive',
      });
      
      // Remover após 4 segundos
      setTimeout(() => {
        try {
          dismiss();
        } catch (e) {
          console.error('Erro ao dismissar toast de erro:', e);
        }
      }, 4000);
    } catch (e) {
      console.error('Erro ao criar toast de erro:', e);
    }
  };

  const info = (title: string, description?: string) => {
    try {
      const { dismiss } = toast({
        title,
        description,
      });
      
      // Remover após 4 segundos
      setTimeout(() => {
        try {
          dismiss();
        } catch (e) {
          console.error('Erro ao dismissar toast de info:', e);
        }
      }, 4000);
    } catch (e) {
      console.error('Erro ao criar toast de info:', e);
    }
  };

  return { sucesso, erro, info };
}
