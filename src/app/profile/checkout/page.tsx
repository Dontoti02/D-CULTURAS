
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, runTransaction, increment, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Loader2, CreditCard, Landmark, Percent } from 'lucide-react';
import Link from 'next/link';
import { Product } from '@/lib/types';

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { cartItems, clearCart, subtotal, total, appliedCoupon, couponDiscount } = useCart();
  
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [department, setDepartment] = useState('');
  const [zip, setZip] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user's shipping address from Firestore on component mount
  useEffect(() => {
    if (user) {
      const fetchCustomerData = async () => {
        const customerRef = doc(db, 'customers', user.uid);
        const docSnap = await getDoc(customerRef);
        if (docSnap.exists() && docSnap.data().shippingAddress) {
          const { address, city, department, zip } = docSnap.data().shippingAddress;
          setAddress(address || '');
          setCity(city || '');
          setDepartment(department || '');
          setZip(zip || '');
        }
      };
      fetchCustomerData();
    }
  }, [user]);


  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast({ title: "Error", description: "Debes iniciar sesión para realizar un pedido.", variant: 'destructive' });
        router.push('/login');
        return;
    }
    if (!address || !city || !department || !zip) {
        toast({ title: "Faltan datos", description: "Por favor, completa tu dirección de envío.", variant: 'destructive' });
        return;
    }

    setIsSubmitting(true);
    try {
        // Use a transaction to ensure atomicity
        const orderRef = await runTransaction(db, async (transaction) => {
            
            const lowStockItemsForToast: {name: string, newStock: number}[] = [];

            // 1. READ phase: Check stock and gather all necessary data
            const productChecks = await Promise.all(cartItems.map(async (item) => {
                const productRef = doc(db, 'products', item.id);
                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists()) {
                    throw new Error(`El producto ${item.name} ya no existe.`);
                }
                const productData = productDoc.data() as Product;
                if (productData.stock < item.quantity) {
                    throw new Error(`Stock insuficiente para: "${item.name}" (disponible: ${productData.stock}, pedido: ${item.quantity}). Por favor, ajusta tu carrito.`);
                }
                const newStock = productData.stock - item.quantity;
                if (newStock <= 5 && newStock > 0) {
                    lowStockItemsForToast.push({ name: productData.name, newStock });
                }
                return { productRef, quantityToDecrement: item.quantity };
            }));

            // Check coupon usage limit (Read)
            if (appliedCoupon) {
                 const usedCouponRef = doc(db, `customers/${user.uid}/usedCoupons`, appliedCoupon.id);
                 const usedCouponDoc = await transaction.get(usedCouponRef);
                 // We'll use this doc later in the write phase.
            }

            // 2. WRITE phase: If all checks pass, proceed with writes
            const newOrderRef = doc(collection(db, "orders"));
            const orderData = {
                customerId: user.uid,
                customerName: `${user.firstName} ${user.lastName}` || user.email,
                items: cartItems.map(item => ({
                    productId: item.id,
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size,
                })),
                subtotal,
                couponCode: appliedCoupon?.code || null,
                couponId: appliedCoupon?.id || null,
                couponDiscount: couponDiscount,
                total,
                status: 'Procesando',
                shippingAddress: { address, city, department, zip },
                createdAt: serverTimestamp(),
            };
            transaction.set(newOrderRef, orderData);
            
            // Save shipping address for next time
            const customerRef = doc(db, 'customers', user.uid);
            transaction.update(customerRef, { shippingAddress: { address, city, department, zip } });

            // Update stock for each product
            productChecks.forEach(({ productRef, quantityToDecrement }) => {
                transaction.update(productRef, {
                    stock: increment(-quantityToDecrement)
                });
            });

            // Update coupon usage
            if (appliedCoupon) {
                const usedCouponRef = doc(db, `customers/${user.uid}/usedCoupons`, appliedCoupon.id);
                // We use the previously read doc to decide whether to set or update
                const usedCouponDoc = await getDoc(usedCouponRef); 
                if (usedCouponDoc.exists()) {
                    transaction.update(usedCouponRef, { useCount: increment(1), lastUsed: serverTimestamp() });
                } else {
                    transaction.set(usedCouponRef, {
                        code: appliedCoupon.code,
                        useCount: 1,
                        lastUsed: serverTimestamp(),
                    });
                }
            }
            
            // This is outside the transaction, but we have the data we need.
            lowStockItemsForToast.forEach(item => {
                toast({
                   title: "Alerta de Stock Bajo",
                   description: `El stock para "${item.name}" es ahora de ${item.newStock}.`,
                   variant: "destructive"
               });
            });

            return newOrderRef;
        });

        toast({
            title: "¡Pedido Realizado!",
            description: "Tu compra ha sido procesada exitosamente.",
        });

        clearCart();
        router.push(`/profile/checkout/success?orderId=${orderRef.id}`);

    } catch (error: any) {
        console.error("Error al crear el pedido: ", error);
        toast({
            title: "Error en el Pedido",
            description: error.message || "No se pudo procesar tu pedido. Inténtalo de nuevo.",
            variant: "destructive",
            duration: 7000
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!authLoading && !user) {
     router.push('/login?redirect=/profile/checkout');
     return null;
  }

  if (cartItems.length === 0 && !isSubmitting) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tu carrito está vacío</CardTitle>
          <CardDescription>Añade productos a tu carrito antes de proceder al pago.</CardDescription>
        </CardHeader>
        <CardContent>
           <Button asChild>
                <Link href="/">Volver a la tienda</Link>
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handlePlaceOrder} className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Dirección de Envío</CardTitle>
             <CardDescription>Tu dirección se guardará para futuras compras.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" placeholder="Av. Arequipa 123" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad / Distrito</Label>
              <Input id="city" placeholder="Miraflores" value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Input id="department" placeholder="Lima" value={department} onChange={(e) => setDepartment(e.target.value)} required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="zip">Código Postal</Label>
              <Input id="zip" placeholder="15074" value={zip} onChange={(e) => setZip(e.target.value)} required />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Método de Pago</CardTitle>
            <CardDescription>Esta es una simulación. No se requiere información de pago real.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                <Label htmlFor="card" className="flex items-center gap-4 border p-4 rounded-md cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                    <RadioGroupItem value="card" id="card" />
                    <CreditCard className="w-6 h-6" />
                    <span className="font-semibold">Tarjeta de Crédito / Débito</span>
                </Label>
                <Label htmlFor="pagoefectivo" className="flex items-center gap-4 border p-4 rounded-md cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                    <RadioGroupItem value="pagoefectivo" id="pagoefectivo" />
                    <Landmark className="w-6 h-6" />
                    <span className="font-semibold">PagoEfectivo</span>
                </Label>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>
      
      <div className="md:col-span-1">
        <Card className="sticky top-24">
            <CardHeader>
                <CardTitle>Resumen de Compra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {cartItems.map(item => (
                    <div key={`${item.id}-${item.size}`} className="flex items-center gap-4 text-sm">
                        <Image src={item.image} alt={item.name} width={48} height={64} className="rounded-md object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.name}</p>
                            <p className="text-muted-foreground">Cant: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">S/ {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                ))}
                <Separator />
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">S/ {subtotal.toFixed(2)}</span>
                </div>
                 {couponDiscount > 0 && (
                    <div className="flex justify-between text-destructive">
                        <span className="flex items-center gap-1 text-sm">
                            <Percent className="w-4 h-4" /> 
                            Descuento ({appliedCoupon?.code})
                        </span>
                        <span className="font-semibold">- S/ {couponDiscount.toFixed(2)}</span>
                    </div>
                )}
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Envío</span>
                    <span className="font-semibold">Gratis</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>S/ {total.toFixed(2)}</span>
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || cartItems.length === 0}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Pagar Ahora'}
                </Button>
            </CardFooter>
        </Card>
      </div>
    </form>
  );
}

    