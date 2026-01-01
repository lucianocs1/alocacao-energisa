import { useState } from 'react';
import { useTeam } from '@/contexts/TeamContext';
import { useCoordinatorDashboard } from '@/hooks/useAzureWorkItems';
import { MONTHS, DEMAND_STATUS_CONFIG } from '@/types/planner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Target,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function CoordinatorDashboardPage() {
  const { selectedTeam } = useTeam();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { 
    data: dashboardData, 
    isLoading, 
    refetch,
    isFetching 
  } = useCoordinatorDashboard(selectedMonth, selectedYear);

  if (!selectedTeam) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Selecione uma equipe na sidebar</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 fade-in overflow-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Painel do Coordenador
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o previsto vs realizado da sua equipe
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Período */}
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, idx) => (
                <SelectItem key={idx} value={idx.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Team Badge */}
      <div className="flex items-center gap-2">
        <div className={cn("w-3 h-3 rounded-full", selectedTeam.color)} />
        <span className="font-medium">{selectedTeam.name}</span>
        <Badge variant="outline" className="ml-2">
          {dashboardData?.employees.length || 0} colaboradores
        </Badge>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : dashboardData ? (
        <>
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                MVP - Dados de horas trabalhadas simulados
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                As horas <strong>planejadas</strong> são reais (vindas das alocações). As horas <strong>trabalhadas</strong> 
                são simuladas para demonstração. Futuramente serão integradas com o Azure DevOps.
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Capacidade Total"
              value={`${dashboardData.summary.totalCapacity}h`}
              icon={Users}
              description="Horas disponíveis no mês"
            />
            <SummaryCard
              title="Horas Planejadas"
              value={`${dashboardData.summary.totalPlanned}h`}
              icon={Target}
              description="Total alocado em demandas"
            />
            <SummaryCard
              title="Horas Trabalhadas"
              value={`${dashboardData.summary.totalWorked}h`}
              icon={Clock}
              description="Apontadas (simulado - futuro: Azure)"
              trend={dashboardData.summary.totalWorked >= dashboardData.summary.totalPlanned}
            />
            <SummaryCard
              title="Utilização"
              value={`${dashboardData.summary.utilizationPercent}%`}
              icon={BarChart3}
              description="Trabalhado / Planejado"
              progress={dashboardData.summary.utilizationPercent}
            />
          </div>

          {/* Employees Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Colaboradores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {dashboardData.employees.map((employee) => (
                  <AccordionItem key={employee.employeeId} value={employee.employeeId}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {employee.employeeName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{employee.employeeName}</p>
                            <p className="text-xs text-muted-foreground">
                              {employee.totalWorkedHours}h trabalhadas de {employee.totalPlannedHours}h planejadas
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <UtilizationBadge percent={employee.utilizationPercent} />
                          <div className="w-24">
                            <Progress 
                              value={Math.min(employee.utilizationPercent, 100)} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2 pl-11">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Demanda</TableHead>
                              <TableHead>Projeto</TableHead>
                              <TableHead className="text-right">Planejado</TableHead>
                              <TableHead className="text-right">Trabalhado</TableHead>
                              <TableHead className="text-right">Variação</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {employee.byDemand.map((demand) => (
                              <TableRow key={demand.demandId}>
                                <TableCell className="font-medium">
                                  {demand.demandName}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {demand.projectName}
                                </TableCell>
                                <TableCell className="text-right">
                                  {demand.plannedHours}h
                                </TableCell>
                                <TableCell className="text-right">
                                  {demand.workedHours}h
                                </TableCell>
                                <TableCell className="text-right">
                                  <VarianceBadge variance={demand.variance} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Demands Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Demandas da Equipe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Demanda</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Planejado</TableHead>
                    <TableHead className="text-right">Trabalhado</TableHead>
                    <TableHead className="text-right">Progresso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.demands.map((demand) => {
                    const progress = demand.totalPlanned > 0
                      ? Math.round((demand.totalWorked / demand.totalPlanned) * 100)
                      : 0;
                    const statusConfig = DEMAND_STATUS_CONFIG[demand.status];

                    return (
                      <TableRow key={demand.demandId}>
                        <TableCell className="font-medium">
                          {demand.demandName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {demand.projectName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <span>{statusConfig.icon}</span>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {demand.totalPlanned}h
                        </TableCell>
                        <TableCell className="text-right">
                          {demand.totalWorked}h
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={progress} className="w-16 h-2" />
                            <span className="text-sm w-10">{progress}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum dado disponível para o período selecionado.
        </div>
      )}
    </div>
  );
}

// Component: Summary Card
function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  progress,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  trend?: boolean;
  progress?: number;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            progress !== undefined 
              ? progress >= 80 
                ? "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
                : progress >= 50
                  ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400"
                  : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
              : trend !== undefined
                ? trend 
                  ? "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
                  : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                : "bg-primary/10 text-primary"
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {progress !== undefined && (
          <Progress value={progress} className="mt-3 h-1.5" />
        )}
      </CardContent>
    </Card>
  );
}

// Component: Utilization Badge
function UtilizationBadge({ percent }: { percent: number }) {
  if (percent >= 90) {
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        {percent}%
      </Badge>
    );
  }
  if (percent >= 70) {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">
        {percent}%
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
      <AlertCircle className="h-3 w-3 mr-1" />
      {percent}%
    </Badge>
  );
}

// Component: Variance Badge
function VarianceBadge({ variance }: { variance: number }) {
  if (variance >= 0) {
    return (
      <span className="inline-flex items-center text-green-600 dark:text-green-400">
        <TrendingUp className="h-3 w-3 mr-1" />
        +{variance}h
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-red-600 dark:text-red-400">
      <TrendingDown className="h-3 w-3 mr-1" />
      {variance}h
    </span>
  );
}

// Component: Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
