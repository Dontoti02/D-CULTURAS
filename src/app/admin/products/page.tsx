
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Product } from '@/lib/types';
import Image from 'next/image';
import { MoreHorizontal, PlusCircle, Loader2, Upload, Star } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs, deleteDoc, doc, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
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
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
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
    
    const handleDeleteProduct = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, "products", productToDelete.id));
            toast({ title: "Producto Eliminado", description: `El producto "${productToDelete.name}" ha sido eliminado.` });
            setProductToDelete(null);
            await fetchProducts();
        } catch (error) {
            console.error("Error deleting product: ", error);
            toast({ title: "Error", description: "No se pudo eliminar el producto.", variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) {
                    toast({ title: "Archivo Vacío", description: "El archivo de Excel no contiene filas.", variant: "destructive" });
                    return;
                }

                const batch = writeBatch(db);
                let productsAdded = 0;

                json.forEach((row: any) => {
                    if (!row.name || !row.price || !row.cost || !row.stock || !row.category) {
                        console.warn("Fila omitida por datos faltantes:", row);
                        return; // Omitir filas sin datos esenciales
                    }
                    const newProductRef = doc(collection(db, 'products'));
                    const newProduct: Omit<Product, 'id' | 'rating' | 'ratingSum' | 'ratingCount'> = {
                        name: row.name,
                        description: row.description || '',
                        price: parseFloat(row.price),
                        cost: parseFloat(row.cost),
                        stock: parseInt(row.stock, 10),
                        category: row.category,
                        images: [], // Las imágenes se suben después
                        sizes: row.sizes ? (row.sizes as string).split(',').map(s => s.trim() as any) : ['S', 'M', 'L'],
                        colors: row.colors ? (row.colors as string).split(',').map(c => {
                            const [name, hex] = c.split(':');
                            return { name: name.trim(), hex: hex.trim() };
                        }) : [],
                        createdAt: serverTimestamp() as any,
                        ratingSum: 0,
                        ratingCount: 0,
                    };
                    batch.set(newProductRef, newProduct);
                    productsAdded++;
                });

                await batch.commit();
                toast({
                    title: "Importación Exitosa",
                    description: `Se han agregado ${productsAdded} productos nuevos.`,
                });
                await fetchProducts(); // Refrescar la lista de productos
            } catch (error) {
                console.error("Error al procesar el archivo Excel: ", error);
                toast({ title: "Error de Importación", description: "Hubo un problema al leer o guardar los datos del archivo.", variant: "destructive" });
            } finally {
                setIsUploading(false);
                // Reset file input
                if(fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsArrayBuffer(file);
    };


    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Productos</CardTitle>
                    <div className="flex items-center gap-2">
                         <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".xlsx, .xls"
                        />
                        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Importar desde Excel
                        </Button>
                        <Button asChild size="sm" className="gap-1">
                            <Link href="/admin/products/new">
                                <PlusCircle className="h-4 w-4" />
                                Agregar Producto
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden w-[100px] sm:table-cell">
                                    <span className="sr-only">Imagen</span>
                                </TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead className="hidden md:table-cell">Precio</TableHead>
                                <TableHead className="hidden md:table-cell">Costo</TableHead>
                                <TableHead className="hidden md:table-cell">Stock</TableHead>
                                <TableHead className="hidden md:table-cell">Calificación</TableHead>
                                <TableHead>
                                    <span className="sr-only">Acciones</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => {
                                const avgRating = product.ratingCount > 0 ? (product.ratingSum / product.ratingCount) : 0;
                                return (
                                <TableRow key={product.id}>
                                    <TableCell className="hidden sm:table-cell">
                                        {product.images && product.images.length > 0 ? (
                                            <Image
                                                alt={product.name}
                                                className="aspect-square rounded-md object-cover"
                                                height="64"
                                                src={product.images[0]}
                                                width="64"
                                                data-ai-hint="imagen producto"
                                            />
                                        ) : (
                                            <div className="aspect-square w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                                                <span className="text-xs text-muted-foreground">Sin img.</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{product.category}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">S/ {product.price.toFixed(2)}</TableCell>
                                    <TableCell className="hidden md:table-cell">S/ {product.cost?.toFixed(2) ?? 'N/A'}</TableCell>
                                    <TableCell className="hidden md:table-cell">{product.stock}</TableCell>
                                     <TableCell className="hidden md:table-cell">
                                        <div className="flex items-center gap-1">
                                            <Star className={cn("w-4 h-4", avgRating > 0 ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                                            <span className="font-semibold">{avgRating.toFixed(1)}</span>
                                            <span className="text-xs text-muted-foreground">({product.ratingCount})</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Alternar menú</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/products/edit/${product.id}`}>Editar</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => setProductToDelete(product)} className="text-destructive">
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el producto
                        <span className="font-semibold"> {productToDelete?.name} </span>
                        de la base de datos.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProduct} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting ? <Loader2 className="animate-spin" /> : "Eliminar"}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

    