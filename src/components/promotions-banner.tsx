
'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Promotion } from '@/lib/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Gift } from 'lucide-react';

export default function PromotionsBanner() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        // 1. Fetch all promotions, ordered by creation date
        const q = query(
          collection(db, 'promotions'),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const now = new Date();
        
        // 2. Filter promotions on the client-side
        const promotionsData = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Promotion))
          .filter(promo => {
              // Ensure the promo is active AND within the valid date range
              const startDate = promo.startDate.toDate();
              const endDate = promo.endDate.toDate();
              return promo.status === 'active' && startDate <= now && endDate >= now;
          });

        setPromotions(promotionsData);
      } catch (error) {
        console.error("Error fetching promotions: ", error);
        // Do not toast error to user for a background task
      }
    };

    fetchPromotions();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: '¡Código Copiado!',
      description: `El cupón ${code} ha sido copiado a tu portapapeles.`,
    });
  };

  if (promotions.length === 0) {
    return null; // Don't render anything if there are no active promotions
  }

  return (
    <section className="bg-muted py-8">
      <div className="container mx-auto px-4 md:px-6">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {promotions.map((promo) => (
              <CarouselItem key={promo.id}>
                <div className="p-1">
                  <Card className="bg-accent/50 border-accent">
                    <CardContent className="flex flex-col md:flex-row items-center justify-center p-6 gap-6 text-center md:text-left">
                       <div className="p-4 bg-accent rounded-full">
                         <Gift className="h-8 w-8 text-accent-foreground" />
                       </div>
                       <div className="flex-grow">
                          <h3 className="text-xl font-bold text-accent-foreground">{promo.name}</h3>
                          <p className="text-accent-foreground/90">{promo.description}</p>
                       </div>
                       <div className="flex items-center gap-2">
                            <p className="font-mono text-lg border-2 border-dashed border-accent-foreground/50 bg-background rounded-md px-4 py-2">
                                {promo.code}
                            </p>
                            <Button onClick={() => handleCopyCode(promo.code)}>
                                Copiar
                            </Button>
                       </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
}
