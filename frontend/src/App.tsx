import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { TeamProvider } from "@/contexts/TeamContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import ProjectsHubPage from "./pages/ProjectsHubPage";
import DemandsPage from "./pages/DemandsPage";
import TeamPage from "./pages/TeamPage";
import CoordinatorDashboardPage from "./pages/CoordinatorDashboardPage";
import CalendarPage from "./pages/CalendarPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <TeamProvider>
          <ProjectProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Routes>
                          <Route path="/" element={<Navigate to="/alocacao" replace />} />
                          <Route path="/alocacao" element={<Index />} />
                          <Route path="/projetos" element={<ProjectsHubPage />} />
                          <Route path="/demandas" element={<DemandsPage />} />
                          <Route path="/equipe" element={<TeamPage />} />
                          <Route path="/coordenador" element={<CoordinatorDashboardPage />} />
                          <Route path="/calendario" element={<CalendarPage />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
          </ProjectProvider>
        </TeamProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
