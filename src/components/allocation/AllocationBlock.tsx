import { cn } from '@/lib/utils';
import { Project } from '@/types/planner';
import { X, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AllocationBlockProps {
  project: Project;
  hours: number;
  isCrossTeam?: boolean;
  onRemove?: () => void;
}

export function AllocationBlock({ project, hours, isCrossTeam, onRemove }: AllocationBlockProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={cn(
            "allocation-block group relative",
            isCrossTeam && "ring-2 ring-purple-500/50"
          )}
          style={{ backgroundColor: project.color }}
        >
          <span className="text-primary-foreground truncate">{hours}h</span>
          {isCrossTeam && (
            <ExternalLink className="w-2.5 h-2.5 text-primary-foreground/70 ml-1" />
          )}
          <span className="text-primary-foreground/70 ml-1 truncate hidden sm:inline">
            {project.code}
          </span>
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className={cn(
                "absolute -top-1 -right-1 w-4 h-4 rounded-full",
                "bg-background border border-border shadow-sm",
                "flex items-center justify-center",
                "opacity-0 group-hover:opacity-100 transition-opacity",
                "hover:bg-destructive hover:border-destructive hover:text-destructive-foreground"
              )}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{project.name}</p>
        <p className="text-xs text-muted-foreground">{hours}h alocadas</p>
        {isCrossTeam && <p className="text-xs text-purple-400">Recurso externo</p>}
      </TooltipContent>
    </Tooltip>
  );
}
