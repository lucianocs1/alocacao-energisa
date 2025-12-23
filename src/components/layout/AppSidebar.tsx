import { LayoutGrid, Briefcase, Users, ChevronDown, FolderKanban, ClipboardList } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { useTeam } from '@/contexts/TeamContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { 
    title: 'Hub de Projetos', 
    url: '/projects', 
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
    url: '/coordinator', 
    icon: ClipboardList,
    description: 'Acompanhamento de HH da equipe'
  },
  { 
    title: 'Demandas', 
    url: '/demands', 
    icon: Briefcase,
    description: 'Dashboard de projetos'
  },
  { 
    title: 'Equipe', 
    url: '/team', 
    icon: Users,
    description: 'Gestão de pessoas'
  },
];

export function AppSidebar() {
  const { teams, selectedTeam, setSelectedTeam } = useTeam();

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-md">
            <span className="text-xl font-bold text-white">E</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-sidebar-foreground tracking-tight">
              Energisa
            </span>
            <span className="text-[10px] text-sidebar-foreground/60 -mt-1">
              Alocação de Recursos
            </span>
          </div>
        </div>
      </div>

      {/* Team Selector */}
      <div className="px-3 py-4 border-b border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/60 px-3 mb-2">Equipe Ativa</p>
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
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
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

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="px-3 py-2 rounded-lg bg-sidebar-accent/50">
          <p className="text-xs text-sidebar-foreground/60">
            Ano fiscal: <span className="text-sidebar-foreground font-medium">2025</span>
          </p>
        </div>
      </div>
    </aside>
  );
}
