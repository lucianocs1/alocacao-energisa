import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CapacityBarProps {
  utilized: number;
  total: number;
  blocked?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function CapacityBar({ 
  utilized, 
  total, 
  blocked = 0, 
  showLabel = true,
  size = 'md' 
}: CapacityBarProps) {
  const available = Math.max(0, total - blocked);
  const percentage = available > 0 ? Math.round((utilized / available) * 100) : 0;
  const displayPercentage = Math.min(percentage, 100);
  const excessPercentage = percentage > 100 ? percentage - 100 : 0;
  
  const getCapacityColor = () => {
    if (percentage >= 100) return 'capacity-overloaded';
    if (percentage >= 75) return 'capacity-optimal';
    return 'capacity-available';
  };

  const getCapacityLabel = () => {
    if (percentage >= 100) return 'Sobrecarregado';
    if (percentage >= 75) return 'Ideal';
    return 'Disponível';
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="w-full">
          <div 
            className={cn(
              "w-full bg-muted rounded-full overflow-hidden relative",
              size === 'sm' ? 'h-1.5' : 'h-2'
            )}
          >
            {/* Blocked section (vacation + fixed) */}
            {blocked > 0 && (
              <div 
                className="absolute right-0 h-full capacity-blocked"
                style={{ width: `${Math.min((blocked / total) * 100, 100)}%` }}
              />
            )}
            {/* Utilized section */}
            <div 
              className={cn("h-full transition-all duration-500 relative z-10", getCapacityColor())}
              style={{ width: `${(displayPercentage / 100) * ((total - blocked) / total) * 100}%` }}
            />
          </div>
          {showLabel && (
            <div className="flex justify-between mt-1 text-xs">
              <span className="text-muted-foreground">
                {utilized}h / {available}h
              </span>
              <span className={cn(
                "font-medium",
                percentage >= 100 ? 'text-destructive' : 
                percentage >= 75 ? 'text-warning' : 'text-success'
              )}>
                {percentage}%
                {excessPercentage > 0 && (
                  <span className="text-destructive ml-1">(+{excessPercentage}%)</span>
                )}
              </span>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
          <p className="font-medium">{getCapacityLabel()}</p>
          <p className="text-muted-foreground">
            {utilized}h alocadas de {available}h disponíveis
          </p>
          {blocked > 0 && (
            <p className="text-muted-foreground">
              {blocked}h bloqueadas (férias/fixo)
            </p>
          )}
          {excessPercentage > 0 && (
            <p className="text-destructive">
              {Math.round((excessPercentage / 100) * available)}h em hora extra/banco
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
