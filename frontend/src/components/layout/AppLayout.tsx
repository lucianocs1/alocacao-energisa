import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppNavbar } from './AppNavbar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background">
      {/* Navbar fixa no topo cobrindo toda a largura */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <AppNavbar />
      </div>
      
      {/* Sidebar fixo na lateral ocupando toda a altura abaixo da navbar */}
      <div className="fixed left-0 top-16 bottom-0 w-64 z-30 overflow-y-auto">
        <AppSidebar />
      </div>
      
      {/* Conteúdo principal */}
      <main className="ml-64 pt-16 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}
