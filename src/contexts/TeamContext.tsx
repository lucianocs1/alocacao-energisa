import { createContext, useContext, useState, ReactNode } from 'react';
import { Team } from '@/types/planner';
import { mockTeams } from '@/data/mockData';

interface TeamContextType {
  teams: Team[];
  selectedTeam: Team | null;
  setSelectedTeam: (team: Team) => void;
  getTeamById: (id: string) => Team | undefined;
  getTeamColor: (teamId: string) => string;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [teams] = useState<Team[]>(mockTeams);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(mockTeams[0] || null);

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
        getTeamColor
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
