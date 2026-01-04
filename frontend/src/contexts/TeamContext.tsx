import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Team } from '@/types/planner';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface TeamContextType {
  teams: Team[];
  selectedTeam: Team | null;
  setSelectedTeam: (team: Team | null) => void;
  getTeamById: (id: string) => Team | undefined;
  getTeamColor: (teamId: string) => string;
  isCoordinator: boolean;
  loading: boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

// Cores para os departamentos
const departmentColors = [
  'hsl(200, 70%, 50%)', // Azul
  'hsl(340, 75%, 55%)', // Rosa
  'hsl(280, 65%, 60%)', // Roxo
  'hsl(160, 60%, 45%)', // Verde
  'hsl(30, 80%, 55%)',  // Laranja
  'hsl(270, 70%, 60%)', // Violeta
  'hsl(180, 60%, 50%)', // Ciano
];

export function TeamProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeamState] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const { usuario } = useAuth();

  const isCoordinator = usuario?.role === 'Coordenador' || usuario?.role === 'Coordinator' || usuario?.role === '2';

  // Buscar departamentos da API quando usuário logar
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        
        const response = await api.get<Department[]>('/api/departments');
        
        if (response.data && response.data.length > 0) {
          // Converter departamentos em teams com cores
          const teamsFromApi: Team[] = response.data.map((dept, index) => ({
            id: dept.id,
            name: dept.name,
            color: departmentColors[index % departmentColors.length],
            members: [],
          }));
          setTeams(teamsFromApi);

          // Definir equipe selecionada baseado no papel
          const userIsCoordinator = usuario?.role === 'Coordenador' || usuario?.role === 'Coordinator' || usuario?.role === '2';
          
          if (userIsCoordinator && usuario?.departmentId) {
            const coordenadorTeam = teamsFromApi.find(t => t.id === usuario.departmentId);
            if (coordenadorTeam) {
              setSelectedTeamState(coordenadorTeam);
            }
          } else if (teamsFromApi.length > 0) {
            // Para gerentes, seleciona o primeiro departamento
            setSelectedTeamState(teamsFromApi[0]);
          }
        } else {
          console.warn('⚠️ Nenhum departamento retornado pela API');
        }
      } catch (error) {
        console.error('❌ Erro ao buscar departamentos:', error);
      } finally {
        setLoading(false);
      }
    };

    // Buscar quando usuário estiver logado
    if (usuario) {
      fetchDepartments();
    }
  }, [usuario]);

  const setSelectedTeam = (team: Team | null) => {
    // Coordenadores não podem trocar de equipe
    if (!isCoordinator) {
      setSelectedTeamState(team);
    }
  };

  const getTeamById = (id: string) => teams.find(t => t.id === id);

  const getTeamColor = (teamId: string): string => {
    const team = getTeamById(teamId);
    return team?.color || 'bg-gray-500';
  };

  return (
    <TeamContext.Provider 
      value={{ 
        teams, 
        selectedTeam, 
        setSelectedTeam, 
        getTeamById,
        getTeamColor,
        isCoordinator,
        loading
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}
