import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { TeamProvider } from "@/contexts/TeamContext";
import Index from "./pages/Index";
import ProjectsHubPage from "./pages/ProjectsHubPage";
import DemandsPage from "./pages/DemandsPage";
import TeamPage from "./pages/TeamPage";
import CoordinatorDashboardPage from "./pages/CoordinatorDashboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TeamProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/projects" element={<ProjectsHubPage />} />
              <Route path="/demands" element={<DemandsPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/coordinator" element={<CoordinatorDashboardPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TeamProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
