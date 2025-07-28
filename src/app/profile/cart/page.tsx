
'use client';

import { useCart } from "@/context/cart-context";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingCart, Percent } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const SOL_TO_USD_RATE = 3.85;
const DISCOUNT_THRESHOLD = 10; // Apply discount if 10 or more items are in the cart
const DISCOUNT_PERCENTAGE = 0.50; // 50% discount

export default function CartPage() {
    const { cartItems, removeFromCart, updateQuantity, cartCount } = useCart();

    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const applyDiscount = cartCount >= DISCOUNT_THRESHOLD;
    const discountAmount = applyDiscount ? subtotal * DISCOUNT_PERCENTAGE : 0;
    const total = subtotal - discountAmount;

    return (
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <ShoppingCart className="w-6 h-6" /> Mi Carrito de Compras ({cartCount} {cartCount === 1 ? 'artículo' : 'artículos'})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {cartItems.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-muted-foreground">Tu carrito está vacío.</p>
                                <Button asChild className="mt-4">
                                    <Link href="/">Continuar Comprando</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {cartItems.map(item => (
                                    <div key={`${item.id}-${item.size}-${item.color}`} className="flex items-center gap-4">
                                        <Image src={item.image} alt={item.name} width={80} height={100} className="rounded-md object-cover" />
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{item.name}</h3>
                                            <p className="text-sm text-muted-foreground">Talla: {item.size} / Color: {item.color}</p>
                                            <p className="text-sm font-semibold text-primary">S/ {item.price.toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center gap-2 border rounded-md">
                                            <Button variant="ghost" size="icon" onClick={() => updateQuantity(`${item.id}-${item.size}-${item.color}`, item.quantity - 1)}>
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                            <Button variant="ghost" size="icon" onClick={() => updateQuantity(`${item.id}-${item.size}-${item.color}`, item.quantity + 1)}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div>
                                            <p className="font-bold">S/ {(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(`${item.id}-${item.size}-${item.color}`)}>
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen del Pedido</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-semibold">S/ {subtotal.toFixed(2)}</span>
                        </div>
                        {applyDiscount && (
                            <div className="flex justify-between text-destructive">
                                <span className="flex items-center gap-1">
                                    <Percent className="w-4 h-4" /> 
                                    Descuento por volumen (50%)
                                </span>
                                <span className="font-semibold">- S/ {discountAmount.toFixed(2)}</span>
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
                         <p className="text-xs text-muted-foreground text-center">
                            aprox. ${(total / SOL_TO_USD_RATE).toFixed(2)} USD
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full" size="lg" disabled={cartItems.length === 0}>
                            <Link href="/profile/checkout">Proceder al Pago</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
