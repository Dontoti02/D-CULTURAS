
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Product } from '@/lib/types';
import Image from 'next/image';
import { MoreHorizontal, PlusCircle, Loader2, Upload, Star, HelpCircle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { collection, getDocs, deleteDoc, doc, addDoc, serverTimestamp, writeBatch, query, orderBy } from 'firebase/firestore';
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
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 10;
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "products"), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
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
    
    const handleDeleteSelectedProducts = async () => {
        setIsDeleting(true);
        try {
            const batch = writeBatch(db);
            selectedProducts.forEach(id => {
                const productRef = doc(db, 'products', id);
                batch.delete(productRef);
            });
            await batch.commit();

            toast({ title: "Productos Eliminados", description: `Se han eliminado ${selectedProducts.length} productos.` });
            setSelectedProducts([]); // Clear selection
            await fetchProducts();
        } catch (error) {
            console.error("Error deleting selected products: ", error);
            toast({ title: "Error", description: "No se pudieron eliminar los productos seleccionados.", variant: "destructive" });
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
                    if (!row.name || !row.price || !row.cost || !row.stock || !row.gender || !row.category) {
                        console.warn("Fila omitida por datos faltantes:", row);
                        return; // Omitir filas sin datos esenciales
                    }
                    const newProductRef = doc(collection(db, 'products'));
                    const newProduct: Omit<Product, 'id' | 'rating' | 'ratingSum' | 'ratingCount' | 'createdAt'> = {
                        name: row.name,
                        description: row.description || '',
                        price: parseFloat(row.price),
                        cost: parseFloat(row.cost),
                        stock: parseInt(row.stock, 10),
                        gender: row.gender,
                        category: row.category,
                        images: [], // Las imágenes se suben después
                        sizes: row.sizes ? (row.sizes as string).split(',').map(s => s.trim() as any) : ['S', 'M', 'L'],
                        ratingSum: 0,
                        ratingCount: 0,
                        createdAt: serverTimestamp() as any,
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

    const handleDownloadTemplate = () => {
        const headers = ["name", "description", "price", "cost", "stock", "gender", "category", "sizes"];
        const exampleData = [{
            name: "Camisa de Lino Azul",
            description: "Camisa fresca y ligera, ideal para el verano.",
            price: 120.50,
            cost: 45.00,
            stock: 50,
            gender: "Caballeros",
            category: "Camisas",
            sizes: "S, M, L, XL"
        }];

        const worksheet = XLSX.utils.json_to_sheet(exampleData, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");

        // Ajustar anchos de columna
        const colWidths = [
            { wch: 30 }, // name
            { wch: 50 }, // description
            { wch: 10 }, // price
            { wch: 10 }, // cost
            { wch: 10 }, // stock
            { wch: 15 }, // gender
            { wch: 15 }, // category
            { wch: 20 }, // sizes
        ];
        worksheet["!cols"] = colWidths;
        
        XLSX.writeFile(workbook, "plantilla_productos.xlsx");
    };

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;

    const currentProducts = useMemo(() => {
        return products.slice(indexOfFirstProduct, indexOfLastProduct);
    }, [products, indexOfFirstProduct, indexOfLastProduct]);

    const totalPages = Math.ceil(products.length / productsPerPage);

    const handleSelectProduct = (productId: string, isSelected: boolean) => {
        if (isSelected) {
            setSelectedProducts(prev => [...prev, productId]);
        } else {
            setSelectedProducts(prev => prev.filter(id => id !== productId));
        }
    };
    
    const handleSelectAll = (isSelected: boolean) => {
        if (isSelected) {
            setSelectedProducts(currentProducts.map(p => p.id));
        } else {
            setSelectedProducts([]);
        }
    };

    const isAllSelected = currentProducts.length > 0 && selectedProducts.length === currentProducts.length;

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
                    <div>
                        <CardTitle>Productos</CardTitle>
                         {selectedProducts.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {selectedProducts.length} de {products.length} productos seleccionados.
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                         <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".xlsx, .xls"
                        />
                        {selectedProducts.length > 0 ? (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                     <Button size="sm" variant="destructive" disabled={isDeleting}>
                                        <Trash2 className="mr-2 h-4 w-4"/>
                                        Eliminar ({selectedProducts.length})
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                           Esta acción no se puede deshacer. Se eliminarán permanentemente {selectedProducts.length} productos.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteSelectedProducts} className="bg-destructive hover:bg-destructive/90">
                                            {isDeleting ? <Loader2 className="animate-spin" /> : "Confirmar Eliminación"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : (
                           <>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button size="icon" variant="ghost" onClick={handleDownloadTemplate}>
                                                <HelpCircle className="h-5 w-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Descargar plantilla de Excel</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

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
                           </>
                        )}

                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                     <Checkbox
                                        checked={isAllSelected}
                                        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                                        aria-label="Seleccionar todo"
                                    />
                                </TableHead>
                                <TableHead className="hidden w-[100px] sm:table-cell">
                                    <span className="sr-only">Imagen</span>
                                </TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Género</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead className="hidden md:table-cell">Precio</TableHead>
                                <TableHead className="hidden md:table-cell">Stock</TableHead>
                                <TableHead className="hidden md:table-cell">Calificación</TableHead>
                                <TableHead>
                                    <span className="sr-only">Acciones</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentProducts.map((product) => {
                                const avgRating = product.ratingCount > 0 ? (product.ratingSum / product.ratingCount) : 0;
                                return (
                                <TableRow key={product.id} data-state={selectedProducts.includes(product.id) && "selected"}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedProducts.includes(product.id)}
                                            onCheckedChange={(checked) => handleSelectProduct(product.id, Boolean(checked))}
                                            aria-label={`Seleccionar ${product.name}`}
                                        />
                                    </TableCell>
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
                                        <Badge variant="outline">{product.gender}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{product.category}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">S/ {product.price.toFixed(2)}</TableCell>
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
                <CardFooter>
                    <div className="text-xs text-muted-foreground">
                        Mostrando <strong>{Math.min(indexOfFirstProduct + 1, products.length)}-{Math.min(indexOfLastProduct, products.length)}</strong> de <strong>{products.length}</strong> productos
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
