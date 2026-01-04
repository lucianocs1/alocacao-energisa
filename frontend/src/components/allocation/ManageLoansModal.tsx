import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeftRight, ArrowRight, ArrowLeft, RotateCcw, Calendar, User, Building2, Clock, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { loanService, LoanDto } from '@/services/loanService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ManageLoansModalProps {
  open: boolean;
  onClose: () => void;
  departmentId: string;
  departmentName: string;
  onLoanChanged: () => void;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Active':
      return <Badge variant="default">Ativo</Badge>;
    case 'Pending':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pendente</Badge>;
    case 'Returned':
      return <Badge variant="secondary">Devolvido</Badge>;
    case 'Rejected':
      return <Badge variant="destructive">Rejeitado</Badge>;
    case 'Cancelled':
      return <Badge variant="secondary">Cancelado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function LoanCard({ 
  loan, 
  type, 
  onReturn,
  onApprove,
  onReject,
  loading
}: { 
  loan: LoanDto; 
  type: 'received' | 'sent' | 'pending';
  onReturn?: (loanId: string) => void;
  onApprove?: (loanId: string) => void;
  onReject?: (loanId: string) => void;
  loading?: string;
}) {
  const isActive = loan.status === 'Active';
  const isPending = loan.status === 'Pending';
  
  return (
    <Card className={cn(
      "transition-all",
      !isActive && !isPending && "opacity-60"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base">{loan.employeeName}</CardTitle>
          </div>
          {getStatusBadge(loan.status)}
        </div>
        <CardDescription className="flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          {loan.employeeRole} • {type === 'received' ? `De: ${loan.sourceDepartmentName}` : `Para: ${loan.targetDepartmentName}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-muted-foreground gap-4 flex-wrap">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Solicitado: {format(new Date(loan.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
          </div>
          {loan.expectedEndDate && (
            <div className="flex items-center gap-1">
              <span>Previsão: {format(new Date(loan.expectedEndDate), 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
          )}
        </div>
        
        {loan.reason && (
          <p className="text-sm bg-muted/50 p-2 rounded">
            <strong>Motivo:</strong> {loan.reason}
          </p>
        )}

        {loan.requestedByUserName && (
          <p className="text-xs text-muted-foreground">
            Solicitado por: {loan.requestedByUserName}
          </p>
        )}

        {loan.actualEndDate && (
          <p className="text-sm text-muted-foreground">
            Devolvido em: {format(new Date(loan.actualEndDate), 'dd/MM/yyyy', { locale: ptBR })}
          </p>
        )}

        {/* Botão de devolver para empréstimos ativos recebidos */}
        {isActive && type === 'received' && onReturn && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => onReturn(loan.id)}
            disabled={loading === loan.id}
          >
            {loading === loan.id ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-2" />
            )}
            Devolver Recurso
          </Button>
        )}

        {/* Botões de aprovar/rejeitar para empréstimos pendentes */}
        {isPending && type === 'pending' && onApprove && onReject && (
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={() => onApprove(loan.id)}
              disabled={!!loading}
            >
              {loading === loan.id + '_approve' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Aprovar
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              className="flex-1"
              onClick={() => onReject(loan.id)}
              disabled={!!loading}
            >
              {loading === loan.id + '_reject' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              Rejeitar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ManageLoansModal({ 
  open, 
  onClose, 
  departmentId,
  departmentName,
  onLoanChanged 
}: ManageLoansModalProps) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [receivedLoans, setReceivedLoans] = useState<LoanDto[]>([]);
  const [sentLoans, setSentLoans] = useState<LoanDto[]>([]);
  const [pendingLoans, setPendingLoans] = useState<LoanDto[]>([]);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (open && departmentId) {
      loadLoans();
    }
  }, [open, departmentId]);

  // Mudar para aba de pendentes se houver pendências
  useEffect(() => {
    if (pendingLoans.length > 0) {
      setActiveTab('pending');
    } else if (receivedLoans.length > 0) {
      setActiveTab('received');
    }
  }, [pendingLoans.length, receivedLoans.length]);

  const loadLoans = async () => {
    setLoading(true);
    try {
      const [received, sent, pending] = await Promise.all([
        loanService.getLoansReceived(departmentId),
        loanService.getLoansSent(departmentId),
        loanService.getPendingLoans(departmentId)
      ]);
      setReceivedLoans(received);
      setSentLoans(sent);
      setPendingLoans(pending);
    } catch (error) {
      toast.error('Erro ao carregar empréstimos');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (loanId: string) => {
    setActionLoading(loanId);
    try {
      await loanService.returnLoan(loanId);
      toast.success('Recurso devolvido com sucesso');
      await loadLoans();
      onLoanChanged();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao devolver recurso');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (loanId: string) => {
    setActionLoading(loanId + '_approve');
    try {
      await loanService.approveLoan(loanId);
      toast.success('Empréstimo aprovado! O recurso agora está disponível para o solicitante.');
      await loadLoans();
      onLoanChanged();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao aprovar empréstimo');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (loanId: string) => {
    setActionLoading(loanId + '_reject');
    try {
      await loanService.rejectLoan(loanId);
      toast.success('Empréstimo rejeitado');
      await loadLoans();
      onLoanChanged();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao rejeitar empréstimo');
    } finally {
      setActionLoading(null);
    }
  };

  const activeReceived = receivedLoans.filter(l => l.status === 'Active');
  const activeSent = sentLoans.filter(l => l.status === 'Active');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" />
            Gerenciar Empréstimos
          </DialogTitle>
          <DialogDescription>
            Visualize e gerencie os empréstimos de recursos de <strong>{departmentName}</strong>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Pendentes</span>
                {pendingLoans.length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {pendingLoans.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="received" className="flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Recebidos</span>
                {activeReceived.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeReceived.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center gap-1">
                <ArrowRight className="w-4 h-4" />
                <span className="hidden sm:inline">Enviados</span>
                {activeSent.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeSent.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Aba de Pendentes - Solicitações aguardando aprovação */}
            <TabsContent 
              value="pending" 
              className="mt-4 overflow-y-auto"
              style={{ maxHeight: 'calc(80vh - 200px)' }}
            >
              {pendingLoans.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma solicitação pendente de aprovação</p>
                  <p className="text-xs mt-1">Quando alguém solicitar um recurso seu, aparecerá aqui</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-3">
                    Outros departamentos solicitaram empréstimo dos seus recursos:
                  </p>
                  {pendingLoans.map(loan => (
                    <LoanCard 
                      key={loan.id} 
                      loan={loan} 
                      type="pending"
                      onApprove={handleApprove}
                      onReject={handleReject}
                      loading={actionLoading || undefined}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent 
              value="received" 
              className="mt-4 overflow-y-auto"
              style={{ maxHeight: 'calc(80vh - 200px)' }}
            >
              {receivedLoans.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ArrowLeft className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Nenhum recurso emprestado para este departamento</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receivedLoans.map(loan => (
                    <LoanCard 
                      key={loan.id} 
                      loan={loan} 
                      type="received" 
                      onReturn={handleReturn}
                      loading={actionLoading || undefined}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent 
              value="sent" 
              className="mt-4 overflow-y-auto"
              style={{ maxHeight: 'calc(80vh - 200px)' }}
            >
              {sentLoans.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ArrowRight className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Nenhum recurso deste departamento foi emprestado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sentLoans.map(loan => (
                    <LoanCard 
                      key={loan.id} 
                      loan={loan} 
                      type="sent"
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
