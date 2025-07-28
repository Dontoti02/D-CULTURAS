
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Promotion } from '@/lib/types';
import { Loader2, TicketPercent, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        router.push('/login');
        return;
    }

    const fetchPromotions = async () => {
      setLoading(true);
      try {
        const promotionsRef = collection(db, 'promotions');
        const q = query(
            promotionsRef, 
            where('customerId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const userPromotions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promotion));
        setPromotions(userPromotions);
      } catch (error) {
        console.error("Error fetching promotions:", error);
        toast({ title: "Error", description: "No se pudieron cargar tus promociones.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, [user, authLoading, router, toast]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
        title: "¡Código Copiado!",
        description: "El código de descuento ha sido copiado a tu portapapeles."
    });
  }

  if (loading || authLoading) {
    return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis Promociones</CardTitle>
        <CardDescription>Aquí puedes ver todos tus cupones y descuentos disponibles.</CardDescription>
      </CardHeader>
      <CardContent>
        {promotions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Actualmente no tienes ninguna promoción activa.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {promotions.map((promo) => (
                <div key={promo.id} className="border p-6 rounded-lg bg-card flex flex-col sm:flex-row items-start gap-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-full w-2 bg-primary"></div>
                    <div className="flex-shrink-0 flex flex-col items-center justify-center text-primary bg-primary/10 p-4 rounded-lg">
                        <TicketPercent className="w-8 h-8" />
                        <span className="text-3xl font-bold mt-1">{promo.discount}%</span>
                        <span className="font-semibold">DTO.</span>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                             <h3 className="text-xl font-bold">{promo.title}</h3>
                             <Badge variant={promo.status === 'active' ? 'default' : 'secondary'}>{promo.status}</Badge>
                        </div>
                        <p className="text-muted-foreground mt-2">{promo.description}</p>
                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4 bg-muted/50 p-3 rounded-md">
                            <span className="text-sm">Tu código de descuento:</span>
                            <div className="flex items-center gap-2 border border-dashed border-primary/50 bg-background rounded-md p-2">
                                <span className="font-mono font-semibold text-primary">{promo.code}</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyCode(promo.code)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                            Recibido el: {format(promo.createdAt.toDate(), 'dd/MM/yyyy')}
                        </p>
                    </div>
                </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

