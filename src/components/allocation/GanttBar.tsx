import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ProjectPhase, PHASE_CONFIG, MONTHS } from '@/types/planner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Diamond } from 'lucide-react';

interface GanttBarProps {
  phases: ProjectPhase[];
  startDate: Date;
  endDate: Date;
  height?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export function GanttBar({ 
  phases, 
  startDate, 
  endDate, 
  height = 'md',
  showLabels = false,
  className 
}: GanttBarProps) {
  const heightClass = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  }[height];

  // Calculate timeline range
  const timelineStart = startDate.getTime();
  const timelineEnd = endDate.getTime();
  const totalDuration = timelineEnd - timelineStart;

  // Sort phases by start date
  const sortedPhases = useMemo(() => 
    [...phases].sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
    [phases]
  );

  const getPhasePosition = (phase: ProjectPhase) => {
    const phaseStart = Math.max(phase.startDate.getTime(), timelineStart);
    const phaseEnd = Math.min(phase.endDate.getTime(), timelineEnd);
    
    const left = ((phaseStart - timelineStart) / totalDuration) * 100;
    const width = ((phaseEnd - phaseStart) / totalDuration) * 100;
    
    return { left: Math.max(0, left), width: Math.max(0.5, width) };
  };

  const formatDate = (date: Date) => {
    return `${date.getDate()}/${MONTHS[date.getMonth()]}`;
  };

  if (phases.length === 0) {
    return (
      <div className={cn("w-full bg-muted rounded", heightClass, className)}>
        <div className="h-full bg-gray-300 rounded opacity-50" />
      </div>
    );
  }

  return (
    <div className={cn("w-full bg-muted rounded relative", heightClass, className)}>
      {sortedPhases.map((phase) => {
        const config = PHASE_CONFIG[phase.type];
        const { left, width } = getPhasePosition(phase);

        // Milestone (Go-Live) rendering
        if (phase.isMilestone) {
          return (
            <Tooltip key={phase.id}>
              <TooltipTrigger asChild>
                <div
                  className="absolute top-1/2 -translate-y-1/2 z-10 cursor-pointer"
                  style={{ left: `${left}%` }}
                >
                  <Diamond 
                    className={cn(
                      "w-4 h-4 fill-red-500 text-red-600 drop-shadow-sm",
                      height === 'sm' && "w-3 h-3",
                      height === 'lg' && "w-5 h-5"
                    )} 
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <p className="font-bold text-red-500">{config.icon} {config.label}</p>
                  <p>{formatDate(phase.startDate)}</p>
                  {phase.name && <p className="text-muted-foreground">{phase.name}</p>}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        }

        // Regular phase bar
        return (
          <Tooltip key={phase.id}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "absolute h-full cursor-pointer transition-opacity hover:opacity-90",
                  config.color,
                  left === 0 && "rounded-l",
                  left + width >= 99.5 && "rounded-r"
                )}
                style={{ 
                  left: `${left}%`, 
                  width: `${width}%`,
                }}
              >
                {showLabels && width > 10 && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium truncate px-1">
                    {config.label}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <p className="font-medium">{config.icon} {phase.name || config.label}</p>
                <p>{formatDate(phase.startDate)} - {formatDate(phase.endDate)}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

// Component to show phase legend
export function GanttLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {Object.entries(PHASE_CONFIG).map(([key, config]) => (
        <div key={key} className="flex items-center gap-1.5">
          {key === 'go-live' ? (
            <Diamond className="w-3 h-3 fill-red-500 text-red-600" />
          ) : (
            <div className={cn("w-3 h-3 rounded-sm", config.color)} />
          )}
          <span className="text-muted-foreground">{config.label}</span>
        </div>
      ))}
    </div>
  );
}

// Component for mini month-based phase indicator (for timeline grid)
interface PhaseIndicatorProps {
  phases: ProjectPhase[];
  month: number;
  year: number;
}

export function PhaseIndicator({ phases, month, year }: PhaseIndicatorProps) {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  // Find which phase(s) overlap with this month
  const activePhases = phases.filter(phase => {
    return phase.startDate <= monthEnd && phase.endDate >= monthStart;
  });

  if (activePhases.length === 0) {
    return null;
  }

  // Check for milestone in this month
  const milestone = activePhases.find(p => p.isMilestone);
  if (milestone) {
    const config = PHASE_CONFIG[milestone.type];
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Diamond className="w-4 h-4 fill-red-500/30 text-red-500/50" />
      </div>
    );
  }

  // Get dominant phase (the one with most overlap)
  const dominantPhase = activePhases.reduce((best, phase) => {
    const overlapStart = Math.max(phase.startDate.getTime(), monthStart.getTime());
    const overlapEnd = Math.min(phase.endDate.getTime(), monthEnd.getTime());
    const overlap = overlapEnd - overlapStart;
    
    if (!best || overlap > best.overlap) {
      return { phase, overlap };
    }
    return best;
  }, null as { phase: ProjectPhase; overlap: number } | null);

  if (!dominantPhase) return null;

  const config = PHASE_CONFIG[dominantPhase.phase.type];
  
  return (
    <div className={cn(
      "absolute inset-0 opacity-20 pointer-events-none",
      config.bgColor
    )} />
  );
}

// Helper to get phase for a specific month
export function getPhaseForMonth(phases: ProjectPhase[], month: number, year: number): ProjectPhase | null {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  const activePhases = phases.filter(phase => {
    return phase.startDate <= monthEnd && phase.endDate >= monthStart;
  });

  if (activePhases.length === 0) return null;

  // Return milestone if exists, otherwise the dominant phase
  const milestone = activePhases.find(p => p.isMilestone);
  if (milestone) return milestone;

  return activePhases.reduce((best, phase) => {
    const overlapStart = Math.max(phase.startDate.getTime(), monthStart.getTime());
    const overlapEnd = Math.min(phase.endDate.getTime(), monthEnd.getTime());
    const overlap = overlapEnd - overlapStart;
    
    if (!best.phase || overlap > best.overlap) {
      return { phase, overlap };
    }
    return best;
  }, { phase: null as ProjectPhase | null, overlap: 0 }).phase;
}

// Check if a date is near a Go-Live milestone (within X days)
export function isNearGoLive(phases: ProjectPhase[], date: Date, daysThreshold: number = 7): { isNear: boolean; goLiveDate?: Date } {
  const goLivePhase = phases.find(p => p.type === 'go-live' && p.isMilestone);
  
  if (!goLivePhase) {
    return { isNear: false };
  }

  const diffMs = Math.abs(goLivePhase.startDate.getTime() - date.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return {
    isNear: diffDays <= daysThreshold,
    goLiveDate: goLivePhase.startDate,
  };
}
