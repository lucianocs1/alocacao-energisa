import { cn } from '@/lib/utils';
import { Project } from '@/types/planner';
import { X } from 'lucide-react';

interface AllocationBlockProps {
  project: Project;
  hours: number;
  onRemove?: () => void;
}

export function AllocationBlock({ project, hours, onRemove }: AllocationBlockProps) {
  return (
    <div 
      className="allocation-block group relative"
      style={{ backgroundColor: project.color }}
    >
      <span className="text-primary-foreground truncate">{hours}h</span>
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
  );
}
