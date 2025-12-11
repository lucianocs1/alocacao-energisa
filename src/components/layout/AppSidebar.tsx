import { LayoutGrid, Briefcase, Users, Calendar } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';

const navItems = [
  { 
    title: 'Alocação', 
    url: '/', 
    icon: LayoutGrid,
    description: 'Painel de alocação de recursos'
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
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Calendar className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">
            ResourcePlan
          </span>
        </div>
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
            Ano fiscal: <span className="text-sidebar-foreground font-medium">2024</span>
          </p>
        </div>
      </div>
    </aside>
  );
}
