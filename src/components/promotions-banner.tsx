
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
import Image from 'next/image';
import CountdownTimer from './countdown-timer';

export default function PromotionsBanner() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const q = query(collection(db, 'promotions'), orderBy('createdAt', 'desc'));
        
        const querySnapshot = await getDocs(q);
        const now = new Date();
        
        const promotionsData = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Promotion))
          .filter(promo => {
              const startDate = promo.startDate.toDate();
              const endDate = promo.endDate.toDate();
              return promo.status === 'active' && startDate <= now && endDate >= now;
          });

        setPromotions(promotionsData);
      } catch (error) {
        console.error("Error fetching promotions: ", error);
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
    return null; 
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
                  <Card className="bg-card border-border overflow-hidden">
                    <div className="grid md:grid-cols-2">
                        <div className="relative aspect-video md:aspect-auto">
                           {promo.imageUrl && (
                             <Image
                                src={promo.imageUrl}
                                alt={promo.name}
                                fill
                                className="object-cover"
                                data-ai-hint="imagen promocion"
                             />
                           )}
                        </div>
                        <CardContent className="flex flex-col items-center justify-center p-6 gap-4 text-center">
                          <Gift className="h-10 w-10 text-primary" />
                          <div className="flex-grow">
                              <h3 className="text-xl font-bold text-primary">{promo.name}</h3>
                              <p className="text-muted-foreground">{promo.description}</p>
                          </div>
                          <CountdownTimer endDate={promo.endDate.toDate()} />
                          <div className="flex items-center gap-2">
                                <p className="font-mono text-lg border-2 border-dashed border-primary/50 bg-background rounded-md px-4 py-2">
                                    {promo.code}
                                </p>
                                <Button onClick={() => handleCopyCode(promo.code)}>
                                    Copiar
                                </Button>
                          </div>
                        </CardContent>
                    </div>
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
