
'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Product } from '@/lib/types';
import Image from 'next/image';
import { Loader2, PackagePlus, Minus, Plus, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc, writeBatch, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [adjustment, setAdjustment] = useState(0);
    const { toast } = useToast();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 10;

    const getStockStatus = (stock: number): { text: string; variant: 'default' | 'secondary' | 'destructive'; priority: number } => {
        if (stock <= 0) {
            return { text: 'Sin Stock', variant: 'destructive', priority: 1 };
        }
        if (stock <= 5) {
            return { text: 'Stock Bajo', variant: 'secondary', priority: 2 };
        }
        return { text: 'En Stock', variant: 'default', priority: 3 };
    };

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        // Sort by stock status priority, then by stock quantity
        productsData.sort((a, b) => {
            const statusA = getStockStatus(a.stock);
            const statusB = getStockStatus(b.stock);
            if (statusA.priority !== statusB.priority) {
                return statusA.priority - statusB.priority;
            }
            return a.stock - b.stock;
        });
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products: ", error);
        toast({ title: "Error", description: "No se pudieron cargar los productos.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchProducts();
    }, []);

    const openAdjustmentModal = (product: Product) => {
        setSelectedProduct(product);
        setAdjustment(0);
    }
    
    const handleStockAdjustment = async () => {
        if (!selectedProduct || adjustment === 0) return;
        
        setIsUpdating(true);
        try {
            const productRef = doc(db, "products", selectedProduct.id);
            const newStock = selectedProduct.stock + adjustment;

            if (newStock < 0) {
                toast({ title: "Error", description: "El stock no puede ser negativo.", variant: "destructive" });
                return;
            }
            
            await updateDoc(productRef, {
                stock: increment(adjustment)
            });

            toast({ 
                title: "Stock Actualizado", 
                description: `El stock de "${selectedProduct.name}" se ha actualizado correctamente.` 
            });

            await fetchProducts(); // Refetch products
            setSelectedProduct(null); // Close modal
        } catch (error) {
            console.error("Error adjusting stock: ", error);
            toast({ title: "Error", description: "No se pudo ajustar el stock.", variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredProducts = useMemo(() => {
      return products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }, [products, searchQuery]);

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    
    const currentProducts = useMemo(() => {
        return filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    }, [filteredProducts, indexOfFirstProduct, indexOfLastProduct]);

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);


    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gestión de Inventario</h1>
                    <p className="text-muted-foreground">Supervisa y ajusta los niveles de stock de tus productos.</p>
                </div>
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        type="search" 
                        placeholder="Buscar por nombre..." 
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Resumen de Stock</CardTitle>
                    <CardDescription>Los productos con bajo stock o sin stock se muestran primero.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden w-[100px] sm:table-cell">
                                    Imagen
                                </TableHead>
                                <TableHead>Producto</TableHead>
                                <TableHead>Género</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Stock Actual</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentProducts.map((product) => {
                                const status = getStockStatus(product.stock);
                                return (
                                <TableRow key={product.id} className={status.variant === 'destructive' ? 'bg-destructive/10' : status.variant === 'secondary' ? 'bg-yellow-400/10' : ''}>
                                    <TableCell className="hidden sm:table-cell">
                                        <Image
                                            alt={product.name}
                                            className="aspect-square rounded-md object-cover"
                                            height="64"
                                            src={product.images[0] || 'https://placehold.co/64x64.png'}
                                            width="64"
                                            data-ai-hint="imagen producto"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{product.gender}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{product.category}</Badge>
                                    </TableCell>
                                    <TableCell className="font-semibold text-lg">{product.stock}</TableCell>
                                    <TableCell>
                                        <Badge variant={status.variant}>
                                            {status.text}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openAdjustmentModal(product)}
                                        >
                                           <PackagePlus className="mr-2 h-4 w-4"/>
                                           Ajustar Stock
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter>
                    <div className="text-xs text-muted-foreground">
                        Mostrando <strong>{Math.min(indexOfFirstProduct + 1, filteredProducts.length)}-{Math.min(indexOfLastProduct, filteredProducts.length)}</strong> de <strong>{filteredProducts.length}</strong> productos
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-sm">
                            Página {currentPage} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Siguiente
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
            <AlertDialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ajustar Stock de "{selectedProduct?.name}"</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ingresa un valor positivo para agregar stock o un valor negativo para quitar. El stock actual es 
                            <span className="font-bold"> {selectedProduct?.stock}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="adjustment" className="text-right">
                                Ajuste
                            </Label>
                            <Input
                                id="adjustment"
                                type="number"
                                value={adjustment}
                                onChange={(e) => setAdjustment(parseInt(e.target.value, 10) || 0)}
                                className="col-span-3"
                                disabled={isUpdating}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                           <div className="col-start-2 col-span-3 flex items-center gap-2">
                                <Button size="icon" variant="outline" onClick={() => setAdjustment(prev => prev - 1)} disabled={isUpdating}><Minus/></Button>
                                <Button size="sm" variant="outline" onClick={() => setAdjustment(prev => prev + 10)} disabled={isUpdating}>+10</Button>
                                <Button size="icon" variant="outline" onClick={() => setAdjustment(prev => prev + 1)} disabled={isUpdating}><Plus/></Button>
                           </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4 font-semibold">
                            <Label className="text-right">
                                Nuevo Total
                            </Label>
                            <p className="col-span-3 text-2xl">
                                { (selectedProduct?.stock ?? 0) + adjustment }
                            </p>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUpdating}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleStockAdjustment} disabled={isUpdating || adjustment === 0}>
                            {isUpdating ? <Loader2 className="animate-spin" /> : "Confirmar Ajuste"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

    