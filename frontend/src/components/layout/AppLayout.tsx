import { ReactNode, useState, useEffect } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppNavbar } from './AppNavbar';
import { useIsMobile, useScreenSize } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const screenSize = useScreenSize();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Fechar sidebar quando mudar para desktop
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Sidebar width based on screen size
  const sidebarWidth = screenSize === 'notebook' ? 'w-56' : 'w-64';
  const mainMargin = screenSize === 'notebook' ? 'lg:ml-56' : 'lg:ml-64';

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Navbar fixa no topo cobrindo toda a largura */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <AppNavbar 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          showMenuButton={isMobile}
        />
      </div>
      
      {/* Overlay para mobile quando sidebar está aberto */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-14 sm:top-16 bottom-0 z-30 overflow-y-auto transition-transform duration-300 ease-in-out",
        sidebarWidth,
        // Mobile: slide in/out
        isMobile ? (sidebarOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
        // Desktop: always visible
        "lg:translate-x-0"
      )}>
        <AppSidebar onNavigate={() => isMobile && setSidebarOpen(false)} />
      </div>
      
      {/* Conteúdo principal */}
      <main className={cn(
        "pt-14 sm:pt-16 min-h-screen overflow-auto transition-all duration-300",
        // No mobile: sem margem (sidebar sobrepõe)
        // No desktop: margem para sidebar
        "lg:ml-0",
        mainMargin
      )}>
        <div className="p-3 sm:p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
