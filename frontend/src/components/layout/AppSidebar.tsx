import { LayoutGrid, Briefcase, Users, ChevronDown, FolderKanban, ClipboardList } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { useTeam } from '@/contexts/TeamContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { 
    title: 'Hub de Projetos', 
    url: '/projetos', 
    icon: FolderKanban,
    description: 'Visão geral de projetos e demandas'
  },
  { 
    title: 'Alocação', 
    url: '/', 
    icon: LayoutGrid,
    description: 'Painel de alocação de recursos'
  },
  { 
    title: 'Painel Coordenador', 
    url: '/coordenador', 
    icon: ClipboardList,
    description: 'Acompanhamento de HH da equipe'
  },
  { 
    title: 'Demandas', 
    url: '/demandas', 
    icon: Briefcase,
    description: 'Dashboard de projetos'
  },
  { 
    title: 'Equipe', 
    url: '/equipe', 
    icon: Users,
    description: 'Gestão de pessoas'
  },
];

export function AppSidebar() {
  const { teams, selectedTeam, setSelectedTeam, isCoordinator } = useTeam();
  const { usuario } = useAuth();

  return (
    <aside className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Team Selector */}
      <div className="px-3 py-4 border-b border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/60 px-3 mb-2">Equipe Ativa</p>
        {isCoordinator ? (
          // Coordenadores veem apenas sua equipe (sem dropdown)
          <div className={cn(
            "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg",
            "bg-sidebar-accent text-sidebar-foreground"
          )}>
            <div className={cn("w-3 h-3 rounded-full", selectedTeam?.color)} />
            <span className="text-sm font-medium">{selectedTeam?.name || 'Equipe'}</span>
          </div>
        ) : (
          // Gerentes podem selecionar entre todas as equipes
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg transition-all",
                "bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground"
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", selectedTeam?.color)} />
                  <span className="text-sm font-medium">{selectedTeam?.name || 'Selecione'}</span>
                </div>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {teams.map((team) => (
                <DropdownMenuItem
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    selectedTeam?.id === team.id && "bg-accent"
                  )}
                >
                  <div className={cn("w-3 h-3 rounded-full", team.color)} />
                  <div className="flex flex-col">
                    <span className="text-sm">{team.name}</span>
                    {team.description && (
                      <span className="text-xs text-muted-foreground">{team.description}</span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems
            .filter(item => {
              // Coordenadores não veem o Hub de Projetos
              if (item.url === '/projetos' && usuario?.role === 'Coordenador') {
                return false;
              }
              return true;
            })
            .map((item) => (
            <li key={item.url}>
              <NavLink
                to={item.url}
                end={item.url === '/'}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
              >
                <item.icon className="w-5 h-5" />
                <div className="flex flex-col">
                  <span className="text-sm">{item.title}</span>
                </div>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
