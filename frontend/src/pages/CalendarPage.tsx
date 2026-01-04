import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Calendar as CalendarIcon, Loader2, AlertCircle, Flag, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import calendarService, { CalendarEvent, YearCalendarSummary, CreateCalendarEventRequest } from '@/services/calendarService';
import { getBrazilianNationalHolidays, getNationalHolidayHoursInYear } from '@/data/brazilianHolidays';

const EVENT_TYPES = [
  { value: 'Holiday', label: 'Feriado Municipal', color: 'bg-green-500' },
  { value: 'BridgeDay', label: 'Dia Ponte', color: 'bg-orange-500' },
  { value: 'Recess', label: 'Recesso', color: 'bg-purple-500' },
  { value: 'OptionalDay', label: 'Ponto Facultativo', color: 'bg-blue-500' },
];

const getEventTypeConfig = (type: string) => {
  return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];
};

export default function CalendarPage() {
  const { usuario } = useAuth();
  const { teams } = useTeam();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<YearCalendarSummary | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateCalendarEventRequest>({
    name: '',
    date: '',
    type: 'Holiday',
    description: '',
    isCompanyWide: true,
    departmentId: undefined,
    hoursLost: 8,
  });

  const isManager = usuario?.role === 'Gerente' || usuario?.role === 'Admin' || usuario?.role === 'Manager' || usuario?.role === '1';

  // Feriados nacionais brasileiros (calculados automaticamente)
  const nationalHolidays = useMemo(() => {
    return getBrazilianNationalHolidays(selectedYear);
  }, [selectedYear]);

  const nationalHolidaysStats = useMemo(() => {
    return getNationalHolidayHoursInYear(selectedYear);
  }, [selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await calendarService.getYearSummary(selectedYear);
      setSummary(data);
    } catch (error) {
      console.error('Erro ao carregar calendário:', error);
      toast.error('Erro ao carregar eventos do calendário');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const resetForm = () => {
    setFormData({
      name: '',
      date: '',
      type: 'Holiday',
      description: '',
      isCompanyWide: true,
      departmentId: undefined,
      hoursLost: 8,
    });
    setEditingEvent(null);
  };

  const handleOpenDialog = (event?: CalendarEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        name: event.name,
        date: event.date.split('T')[0],
        type: event.type,
        description: event.description || '',
        isCompanyWide: event.isCompanyWide,
        departmentId: event.departmentId,
        hoursLost: event.hoursLost,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingEvent) {
        await calendarService.updateEvent(editingEvent.id, formData);
        toast.success('Evento atualizado com sucesso');
      } else {
        await calendarService.createEvent(formData);
        toast.success('Evento criado com sucesso');
      }
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast.error('Erro ao salvar evento');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await calendarService.deleteEvent(id);
      toast.success('Evento removido com sucesso');
      loadData();
    } catch (error) {
      console.error('Erro ao remover evento:', error);
      toast.error('Erro ao remover evento');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Calendário Corporativo</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Gerencie feriados, dias ponte e recessos
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-24 sm:w-32 h-8 sm:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isManager && (
            <>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()} size="sm" className="sm:size-default">
                    <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Novo</span> Evento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEvent ? 'Editar Evento' : 'Novo Evento'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingEvent 
                        ? 'Atualize as informações do evento'
                        : 'Adicione um novo evento ao calendário corporativo'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Dia Ponte - Carnaval"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Data *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(v) => setFormData({ ...formData, type: v as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EVENT_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${type.color}`} />
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hoursLost">Horas perdidas</Label>
                      <Select
                        value={formData.hoursLost.toString()}
                        onValueChange={(v) => setFormData({ ...formData, hoursLost: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">4 horas (meio período)</SelectItem>
                          <SelectItem value="8">8 horas (dia inteiro)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Observações sobre o evento..."
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Toda a empresa</Label>
                        <p className="text-xs text-muted-foreground">
                          Afeta todos os departamentos
                        </p>
                      </div>
                      <Switch
                        checked={formData.isCompanyWide}
                        onCheckedChange={(checked) => setFormData({ 
                          ...formData, 
                          isCompanyWide: checked,
                          departmentId: checked ? undefined : formData.departmentId
                        })}
                      />
                    </div>

                    {!formData.isCompanyWide && (
                      <div className="space-y-2">
                        <Label>Departamento</Label>
                        <Select
                          value={formData.departmentId || ''}
                          onValueChange={(v) => setFormData({ ...formData, departmentId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o departamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map(team => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSubmit}>
                      {editingEvent ? 'Salvar' : 'Criar'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="p-3 sm:pb-2 sm:pt-6 sm:px-6">
            <CardDescription className="flex items-center gap-1 text-[10px] sm:text-sm">
              <Flag className="w-3 h-3" />
              <span className="hidden sm:inline">Feriados Nacionais</span>
              <span className="sm:hidden">Nacionais</span>
            </CardDescription>
            <CardTitle className="text-xl sm:text-3xl">{nationalHolidaysStats.totalDays}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:px-6 sm:pb-6">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">{nationalHolidaysStats.totalHours}h</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 sm:pb-2 sm:pt-6 sm:px-6">
            <CardDescription className="flex items-center gap-1 text-[10px] sm:text-sm">
              <Building2 className="w-3 h-3" />
              <span className="hidden sm:inline">Feriados Municipais</span>
              <span className="sm:hidden">Municipais</span>
            </CardDescription>
            <CardTitle className="text-xl sm:text-3xl">{summary?.totalHolidays || 0}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:px-6 sm:pb-6">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">dias</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Dias Ponte</CardDescription>
            <CardTitle className="text-3xl">{summary?.totalBridgeDays || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-xs text-muted-foreground">dias</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Recesso</CardDescription>
            <CardTitle className="text-3xl">{summary?.totalRecessDays || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-xs text-muted-foreground">dias</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ponto Facultativo</CardDescription>
            <CardTitle className="text-3xl">{summary?.totalOptionalDays || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">dias</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardDescription>Total de Horas</CardDescription>
            <CardTitle className="text-3xl">{nationalHolidaysStats.totalHours + (summary?.totalHoursLost || 0)}h</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              <span className="text-xs text-muted-foreground">não trabalhadas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Calendário de {selectedYear}
          </CardTitle>
          <CardDescription>
            Feriados nacionais são calculados automaticamente. Adicione feriados municipais e outros eventos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="national" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="national" className="gap-2">
                <Flag className="w-4 h-4" />
                Feriados Nacionais ({nationalHolidays.length})
              </TabsTrigger>
              <TabsTrigger value="custom" className="gap-2">
                <Building2 className="w-4 h-4" />
                Outros Eventos ({summary?.events.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="national">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Dia da Semana</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nationalHolidays.map((holiday, index) => {
                    const dayOfWeek = holiday.date.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                    
                    return (
                      <TableRow key={index} className={isWeekend ? 'opacity-50' : ''}>
                        <TableCell className="font-medium">
                          {holiday.date.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </TableCell>
                        <TableCell>{holiday.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            Feriado Nacional
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isWeekend ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            '8h'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isWeekend ? 'outline' : 'default'} className={isWeekend ? 'text-muted-foreground' : ''}>
                            {weekdayNames[dayOfWeek]}
                            {isWeekend && ' (não afeta)'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="custom">
              {summary?.events.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum evento adicional cadastrado para {selectedYear}</p>
                  {isManager && (
                    <p className="text-sm mt-2">
                      Clique em "Novo Evento" para adicionar feriados municipais, dias ponte ou recessos
                    </p>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead>Escopo</TableHead>
                      {isManager && <TableHead className="w-[100px]">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary?.events.map((event) => {
                      const typeConfig = getEventTypeConfig(event.type);
                      return (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">
                            {formatDate(event.date)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>{event.name}</p>
                              {event.description && (
                                <p className="text-xs text-muted-foreground">{event.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="gap-1">
                              <div className={`w-2 h-2 rounded-full ${typeConfig.color}`} />
                              {typeConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{event.hoursLost}h</TableCell>
                          <TableCell>
                            {event.isCompanyWide ? (
                              <Badge variant="outline">Toda empresa</Badge>
                            ) : (
                              <Badge variant="outline">{event.departmentName}</Badge>
                            )}
                          </TableCell>
                          {isManager && (
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDialog(event)}
                                >
                                  Editar
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-destructive">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remover evento?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja remover "{event.name}"? Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(event.id)}>
                                        Remover
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
