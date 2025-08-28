
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Archive, BookOpen, Loader2, RotateCcw } from 'lucide-react';
import { performAnnualClosing, AnnualClosingInput } from '@/ai/flows/annual-closing-flow';
import { revertAnnualClosing } from '@/ai/flows/revert-annual-closing-flow';
import { getRevertCount, decrementRevertCount } from '@/ai/flows/revert-counter-flow';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

interface ArchivedYear {
    id: string;
    createdAt: Date;
    orderCount: number;
    customerCount: number;
    promotionCount: number;
    adminCount: number;
}

export default function AnnualClosingPage() {
  const { toast } = useToast();
  const [isClosing, setIsClosing] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [confirmationText, setConfirmationText] = useState('');
  const [revertConfirmationText, setRevertConfirmationText] = useState('');
  const [yearToRevert, setYearToRevert] = useState<string | null>(null);
  const [archivedYears, setArchivedYears] = useState<ArchivedYear[]>([]);
  const [loadingArchives, setLoadingArchives] = useState(true);
  const [revertCount, setRevertCount] = useState(0);

  const availableYears = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  ).map(String);
  
  const fetchRevertCount = async () => {
    try {
        const count = await getRevertCount();
        setRevertCount(count);
    } catch (error) {
        console.error("Error fetching revert count:", error);
        toast({ title: "Error", description: "No se pudo obtener el contador de reversiones.", variant: "destructive" });
    }
  };

  const fetchArchivedYears = async () => {
    setLoadingArchives(true);
    try {
        const q = query(collection(db, 'annualClosings'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => {
            const docData = doc.data();
            return {
                id: doc.id,
                createdAt: docData.createdAt.toDate(),
                orderCount: docData.orders?.length || 0,
                customerCount: docData.customers?.length || 0,
                promotionCount: docData.promotions?.length || 0,
                adminCount: docData.admin?.length || 0,
            }
        });
        setArchivedYears(data);
    } catch (error) {
        console.error("Error fetching archives:", error);
        toast({ title: "Error", description: "No se pudieron cargar los archivos de cierre.", variant: "destructive" });
    } finally {
        setLoadingArchives(false);
    }
  };

  useEffect(() => {
    fetchArchivedYears();
    fetchRevertCount();
  }, []);

  const handleAnnualClosing = async () => {
    if (confirmationText !== 'CIERRE') {
      toast({
        title: 'Confirmación incorrecta',
        description: 'Debes escribir "CIERRE" para confirmar esta acción.',
        variant: 'destructive',
      });
      return;
    }

    setIsClosing(true);
    try {
      const input: AnnualClosingInput = { year: parseInt(selectedYear, 10) };
      const result = await performAnnualClosing(input);
      
      toast({
        title: '¡Cierre Anual Exitoso!',
        description: `Se han archivado ${result.archivedCount} documentos del año ${selectedYear}. Los datos han sido reseteados.`,
        duration: 7000,
      });

      setConfirmationText('');
      await fetchArchivedYears();

    } catch (error: any) {
      console.error('Error durante el cierre anual:', error);
      toast({
        title: 'Error en el Cierre Anual',
        description: error.message || 'Ocurrió un error inesperado.',
        variant: 'destructive',
        duration: 7000,
      });
    } finally {
      setIsClosing(false);
    }
  };

  const handleRevert = async () => {
    if (!yearToRevert || revertConfirmationText !== 'REVERTIR') {
        toast({
            title: 'Confirmación incorrecta',
            description: 'Debes escribir "REVERTIR" para confirmar.',
            variant: 'destructive',
        });
        return;
    }
    
    setIsReverting(true);
    try {
        await revertAnnualClosing({ year: parseInt(yearToRevert, 10) });
        await decrementRevertCount();

        toast({
            title: '¡Reversión Exitosa!',
            description: `Los datos del año ${yearToRevert} han sido restaurados.`,
            duration: 7000,
        });

        setYearToRevert(null);
        setRevertConfirmationText('');
        await fetchArchivedYears();
        await fetchRevertCount();

    } catch (error: any) {
        console.error('Error durante la reversión:', error);
        toast({
            title: 'Error en la Reversión',
            description: error.message || 'Ocurrió un error inesperado.',
            variant: 'destructive',
            duration: 7000,
        });
    } finally {
        setIsReverting(false);
    }
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Cierre Anual</h1>
        <p className="text-muted-foreground">
          Archiva los datos de un año completo para empezar de cero.
        </p>
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Realizar Cierre Anual</CardTitle>
          <CardDescription>
            Selecciona un año para archivar y eliminar sus datos asociados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>¡Acción Irreversible!</AlertTitle>
            <AlertDescription>
              Este proceso archivará y luego **eliminará permanentemente** todos los
              pedidos, clientes y promociones del año seleccionado. Los productos
              no se verán afectados. Asegúrate de que deseas continuar.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col sm:flex-row items-end gap-4">
             <div className="grid gap-2 w-full sm:w-auto">
                <Label htmlFor="year-select">Año a Cerrar</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger id="year-select" className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Seleccionar año" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableYears.map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
             </div>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto">
                        <Archive className="mr-2 h-4 w-4" />
                        Iniciar Cierre Anual de {selectedYear}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción es irreversible. Se archivarán y eliminarán todos los datos (excepto productos) del año <strong>{selectedYear}</strong>. Para confirmar, escribe "CIERRE" en el campo de abajo.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Label htmlFor="confirmation">Escribe "CIERRE" para confirmar</Label>
                    <Input
                        id="confirmation"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        placeholder="CIERRE"
                        disabled={isClosing}
                        autoFocus
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isClosing}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                    onClick={handleAnnualClosing}
                    disabled={isClosing || confirmationText !== 'CIERRE'}
                    className="bg-destructive hover:bg-destructive/90"
                    >
                    {isClosing ? <Loader2 className="animate-spin" /> : "Confirmar y Cerrar Año"}
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
            <div>
                <CardTitle>Historial de Cierres</CardTitle>
                <CardDescription>Consulta los datos de cierres anuales realizados anteriormente.</CardDescription>
            </div>
            <div className="text-right">
                <p className="font-bold text-lg text-destructive">{revertCount}</p>
                <p className="text-xs text-muted-foreground">Reversiones restantes</p>
            </div>
        </CardHeader>
        <CardContent>
            {loadingArchives ? (
                 <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : archivedYears.length > 0 ? (
                <div className="space-y-4">
                    {archivedYears.map(archive => (
                        <div key={archive.id} className="border p-4 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <BookOpen className="h-8 w-8 text-primary"/>
                                <div>
                                    <p className="font-bold text-lg">Cierre del Año {archive.id}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Archivado el {archive.createdAt.toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right text-sm">
                                    <p>{archive.orderCount} pedidos</p>
                                    <p>{archive.customerCount} clientes</p>
                                    <p>{archive.promotionCount} promociones</p>
                                    <p>{archive.adminCount} admins</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setYearToRevert(archive.id)} disabled={revertCount <= 0 || isReverting}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Revertir
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Aún no se han realizado cierres anuales.</p>
            )}
        </CardContent>
      </Card>
      
      <AlertDialog open={!!yearToRevert} onOpenChange={(open) => !open && setYearToRevert(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Revertir Cierre de {yearToRevert}</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción restaurará TODOS los datos del año {yearToRevert} y consumirá 1 de tus {revertCount} intentos de reversión. Esta acción es irreversible. Para confirmar, escribe "REVERTIR".
                </AlertDialogDescription>
            </AlertDialogHeader>
             <div className="py-4">
                <Label htmlFor="revert-confirmation">Escribe "REVERTIR" para confirmar</Label>
                <Input
                    id="revert-confirmation"
                    value={revertConfirmationText}
                    onChange={(e) => setRevertConfirmationText(e.target.value)}
                    placeholder="REVERTIR"
                    disabled={isReverting}
                    autoFocus
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isReverting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleRevert} disabled={isReverting || revertConfirmationText !== 'REVERTIR'}>
                     {isReverting ? <Loader2 className="animate-spin" /> : "Confirmar y Revertir"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
