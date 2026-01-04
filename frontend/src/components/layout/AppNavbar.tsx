import { LogOut, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface AppNavbarProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

const getRoleLabel = (role?: string): string => {
  if (!role) return 'Usuário';
  
  const roleMap: Record<string, string> = {
    'Admin': 'Administrador',
    'Manager': 'Gerente',
    'Gerente': 'Gerente',
    'Coordinator': 'Coordenador',
    'Coordenador': 'Coordenador',
    '1': 'Gerente',
    '2': 'Coordenador',
    '3': 'Usuário',
  };
  
  return roleMap[role] || role;
};

export function AppNavbar({ onMenuClick, showMenuButton }: AppNavbarProps) {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    sair();
    navigate('/login');
  };

  return (
    <nav className="h-14 sm:h-16 bg-background border-b border-border flex items-center justify-between px-3 sm:px-6">
      {/* Left side: Menu button + Logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile menu button */}
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-md">
            <span className="text-lg sm:text-xl font-bold text-white">E</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              Energisa
            </span>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground -mt-1 hidden xs:block">
              Alocação de Recursos
            </span>
          </div>
        </div>
      </div>
      
      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 sm:gap-3 hover:bg-muted px-2 sm:px-3"
          >
            <div className="flex flex-col items-end">
              <span className="text-xs sm:text-sm font-medium text-foreground truncate max-w-[100px] sm:max-w-none">
                {usuario?.fullName}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                {getRoleLabel(usuario?.role)}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-xs text-muted-foreground">Conectado como</p>
            <p className="text-sm font-medium text-foreground truncate">{usuario?.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{usuario?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-red-600">
            <LogOut className="h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
