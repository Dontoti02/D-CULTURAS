
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Customer, Order, Promotion } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomerWithOrderCount extends Customer {
  orderCount: number;
}

export default function LoyalCustomersPage() {
  const [loyalCustomers, setLoyalCustomers] = useState<CustomerWithOrderCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingPromotion, setSendingPromotion] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLoyalCustomers = async () => {
      setLoading(true);
      try {
        // 1. Fetch all orders
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const orders = ordersSnapshot.docs.map(doc => doc.data() as Order);

        // 2. Count orders per customer
        const orderCounts = orders.reduce((acc, order) => {
          acc[order.customerId] = (acc[order.customerId] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        // 3. Filter customer IDs with >= 30 orders
        const loyalCustomerIds = Object.keys(orderCounts).filter(id => orderCounts[id] >= 30);
        
        if (loyalCustomerIds.length === 0) {
          setLoading(false);
          return;
        }

        // 4. Fetch details for loyal customers
        const customersSnapshot = await getDocs(collection(db, 'customers'));
        const allCustomers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));

        const loyalCustomersData = allCustomers
          .filter(customer => loyalCustomerIds.includes(customer.id))
          .map(customer => ({
            ...customer,
            orderCount: orderCounts[customer.id],
          }));

        setLoyalCustomers(loyalCustomersData);
      } catch (error) {
        console.error("Error fetching loyal customers:", error);
        toast({ title: "Error", description: "No se pudieron cargar los clientes leales.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchLoyalCustomers();
  }, [toast]);

  const handleSendPromotion = async (customer: CustomerWithOrderCount) => {
    setSendingPromotion(customer.id);
    try {
        // Check if a 50% discount already exists
        const promotionsRef = collection(db, 'promotions');
        const q = query(promotionsRef, where('customerId', '==', customer.id), where('discount', '==', 50));
        const existingPromotion = await getDocs(q);

        if (!existingPromotion.empty) {
             toast({
                title: "Promoción ya Enviada",
                description: `El cliente ${customer.firstName} ya tiene una promoción del 50% de descuento.`,
                variant: "default",
            });
            return;
        }

        const promotionData: Omit<Promotion, 'id'> = {
            customerId: customer.id,
            title: "¡Recompensa de Lealtad!",
            description: "¡Gracias por ser uno de nuestros mejores clientes! Disfruta de un 50% de descuento en tu próxima compra como agradecimiento.",
            discount: 50,
            code: `LEAL50-${customer.firstName.toUpperCase()}`,
            createdAt: serverTimestamp(),
            status: 'active'
        };

        await addDoc(collection(db, "promotions"), promotionData);

        toast({
            title: "¡Promoción Enviada!",
            description: `Se ha enviado un descuento del 50% a ${customer.firstName} ${customer.lastName}.`,
        });

    } catch (error) {
        console.error("Error sending promotion:", error);
        toast({ title: "Error", description: "No se pudo enviar la promoción.", variant: "destructive" });
    } finally {
        setSendingPromotion(null);
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes Leales</CardTitle>
        <CardDescription>
          Estos clientes han realizado 30 o más pedidos. Envíales una promoción especial de agradecimiento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loyalCustomers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No se encontraron clientes que cumplan con el criterio.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead className="text-center">N° de Pedidos</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loyalCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={customer.photoURL} alt="Avatar" />
                        <AvatarFallback>{customer.firstName.charAt(0)}{customer.lastName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{customer.firstName} {customer.lastName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell className="text-center font-bold">{customer.orderCount}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                        size="sm" 
                        onClick={() => handleSendPromotion(customer)} 
                        disabled={sendingPromotion === customer.id}
                    >
                      {sendingPromotion === customer.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Enviar 50% OFF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
