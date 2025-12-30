import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Project, Demand } from '@/types/planner';
import { projectService } from '@/services/projectService';
import { useAuth } from '@/contexts/AuthContext';

interface CreateProjectData {
  // Project data
  name: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
  priority: 'high' | 'medium' | 'low';
  color: string;
  
  // Demands data
  demands: Omit<Demand, 'id' | 'projectId' | 'allocatedHours' | 'createdAt' | 'isNew'>[];
}

interface ProjectContextType {
  projects: Project[];
  loading: boolean;
  error: string | null;
  createProjectData: CreateProjectData;
  setCreateProjectData: (data: CreateProjectData) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  resetCreateProjectData: () => void;
  refreshProjects: () => Promise<void>;
  createProjectFromData: () => Promise<Project | null>;
}

const defaultCreateProjectData: CreateProjectData = {
  name: '',
  description: '',
  startDate: null,
  endDate: null,
  priority: 'medium',
  color: 'hsl(200, 70%, 50%)',
  demands: [],
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createProjectData, setCreateProjectData] = useState<CreateProjectData>(defaultCreateProjectData);
  const { estaAutenticado } = useAuth();

  const refreshProjects = useCallback(async () => {
    if (!estaAutenticado) return;
    
    setLoading(true);
    setError(null);
    try {
      const fetchedProjects = await projectService.getProjects();
      setProjects(fetchedProjects);
    } catch (err) {
      setError('Erro ao carregar projetos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [estaAutenticado]);

  // Carregar projetos ao autenticar
  useEffect(() => {
    if (estaAutenticado) {
      refreshProjects();
    }
  }, [estaAutenticado, refreshProjects]);

  const addProject = (project: Project) => {
    setProjects(prev => [...prev, project]);
  };

  const updateProject = (id: string, projectData: Partial<Project>) => {
    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, ...projectData } : p))
    );
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const resetCreateProjectData = () => {
    setCreateProjectData(defaultCreateProjectData);
  };

  const createProjectFromData = async (): Promise<Project | null> => {
    if (!createProjectData.name || !createProjectData.startDate || !createProjectData.endDate) {
      return null;
    }

    try {
      const projectToCreate: Partial<Project> = {
        name: createProjectData.name,
        description: createProjectData.description,
        startDate: createProjectData.startDate,
        endDate: createProjectData.endDate,
        priority: createProjectData.priority,
        color: createProjectData.color,
        demands: createProjectData.demands.map((d, index) => ({
          ...d,
          id: `temp-${index}`,
          projectId: '',
          allocatedHours: 0,
          createdAt: new Date(),
          isNew: true,
        })),
      };

      const createdProject = await projectService.createProject(projectToCreate);
      
      if (createdProject) {
        addProject(createdProject);
        resetCreateProjectData();
      }
      
      return createdProject;
    } catch (err) {
      console.error('Erro ao criar projeto:', err);
      return null;
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        loading,
        error,
        createProjectData,
        setCreateProjectData,
        addProject,
        updateProject,
        deleteProject,
        resetCreateProjectData,
        refreshProjects,
        createProjectFromData,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects deve ser usado dentro de ProjectProvider');
  }
  return context;
};
