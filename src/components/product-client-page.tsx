
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { type Product, type Comment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Star, Minus, Plus, ShoppingCart, Loader2, MessageSquare } from 'lucide-react';
import ProductCard from './product-card';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { collection, getDocs, limit, query, where, orderBy, doc, runTransaction, writeBatch, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { useRouter } from 'next/navigation';
import ImagePreviewModal from './image-preview-modal';
import { Card, CardContent } from './ui/card';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProductClientPageProps {
  product: Product;
}

const SOL_TO_USD_RATE = 3.85;

export default function ProductClientPage({ product: initialProduct }: ProductClientPageProps) {
  const [product, setProduct] = useState(initialProduct);
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  
  // Rating state
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [loadingPurchaseStatus, setLoadingPurchaseStatus] = useState(true);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const { addToCart, cartItems } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const avgRating = product.ratingCount > 0 ? (product.ratingSum / product.ratingCount) : 0;

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
        const commentsRef = collection(db, `products/${product.id}/comments`);
        const q = query(commentsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const commentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
        setComments(commentsData);
    } catch (error) {
        console.error("Error fetching comments: ", error);
    } finally {
        setLoadingComments(false);
    }
  };
  
  useEffect(() => {
    fetchComments();
  }, [product.id]);

  useEffect(() => {
    // Check if the user has purchased this product
    const checkPurchaseStatus = async () => {
        if (!user) {
            setLoadingPurchaseStatus(false);
            return;
        }
        
        // 1. Check if user has rated this product
        const ratingDocRef = doc(db, `products/${product.id}/ratings`, user.uid);
        const ratingDocSnap = await getDocs(collection(db, `products/${product.id}/ratings`));
        const userRatingDoc = ratingDocSnap.docs.find(doc => doc.id === user.uid);
        if (userRatingDoc) {
            setHasRated(true);
        }

        // 2. Check if user has purchased this product
        const ordersRef = collection(db, 'orders');
        const q = query(
            ordersRef,
            where('customerId', '==', user.uid),
            where('status', '==', 'Entregado')
        );
        const querySnapshot = await getDocs(q);
        const purchased = querySnapshot.docs.some(doc => 
            doc.data().items.some((item: any) => item.productId === product.id)
        );
        
        setHasPurchased(purchased);
        setLoadingPurchaseStatus(false);
    };

    checkPurchaseStatus();
  }, [user, product.id]);

   useEffect(() => {
    const fetchRecommendations = async () => {
      if (!product.category) return;
      setLoadingRecommendations(true);
      try {
        const productsRef = collection(db, 'products');
        const q = query(
            productsRef,
            where('category', '==', product.category),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        const querySnapshot = await getDocs(q);
        const recs = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Product))
            .filter(p => p.id !== product.id) // Excluir el producto actual
            .slice(0, 4); // Tomar los primeros 4 después de filtrar
        setRecommendedProducts(recs);
      } catch (error) {
        console.error("Error fetching recommendations: ", error);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, [product.id, product.category]);

  const handleRatingSubmit = async (rating: number) => {
    if (!user || isSubmittingRating || hasRated || !hasPurchased) return;
    
    setIsSubmittingRating(true);

    try {
        await runTransaction(db, async (transaction) => {
            const productRef = doc(db, 'products', product.id);
            const ratingRef = doc(db, `products/${product.id}/ratings`, user.uid);

            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists()) {
                throw new Error("El producto no existe.");
            }

            const currentProductData = productDoc.data();
            const newRatingCount = (currentProductData.ratingCount || 0) + 1;
            const newRatingSum = (currentProductData.ratingSum || 0) + rating;

            transaction.update(productRef, {
                ratingSum: newRatingSum,
                ratingCount: newRatingCount
            });
            
            transaction.set(ratingRef, {
                rating,
                createdAt: new Date(),
            });

             // Optimistically update local state
            setProduct(prev => ({
                ...prev,
                ratingSum: newRatingSum,
                ratingCount: newRatingCount,
            }));
            setHasRated(true);

        });

        toast({
            title: '¡Gracias por tu opinión!',
            description: `Has calificado este producto con ${rating} estrellas.`,
        });

    } catch (error) {
        console.error("Error al enviar la calificación:", error);
        toast({
            title: 'Error',
            description: 'No se pudo guardar tu calificación. Inténtalo de nuevo.',
            variant: 'destructive',
        });
    } finally {
        setIsSubmittingRating(false);
    }
};

 const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
        const commentsRef = collection(db, `products/${product.id}/comments`);
        await addDoc(commentsRef, {
            customerId: user.uid,
            customerName: `${user.firstName} ${user.lastName}`,
            customerPhotoURL: user.photoURL || '',
            comment: newComment,
            createdAt: serverTimestamp(),
        });
        
        toast({
            title: 'Comentario Publicado',
            description: 'Gracias por compartir tu opinión.',
        });
        setNewComment('');
        await fetchComments(); // Refresh comments list

    } catch (error) {
        console.error("Error al publicar comentario:", error);
        toast({ title: "Error", description: "No se pudo publicar tu comentario.", variant: "destructive" });
    } finally {
        setIsSubmittingComment(false);
    }
 };


  const handleAddToCart = () => {
    if (!user) {
        setShowAuthDialog(true);
        return;
    }

    const itemInCart = cartItems.find(
      (item) => item.id === product.id && item.size === selectedSize
    );
    const currentQuantityInCart = itemInCart ? itemInCart.quantity : 0;
    
    if (currentQuantityInCart + quantity > product.stock) {
      toast({
        title: 'Stock Insuficiente',
        description: `No puedes añadir más unidades de "${product.name}". Solo quedan ${product.stock} disponibles y ya tienes ${currentQuantityInCart} en tu carrito.`,
        variant: 'destructive',
      });
      return;
    }

    addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity,
        size: selectedSize,
    });
    toast({
        title: '¡Añadido al carrito!',
        description: `${product.name} ha sido añadido a tu carrito.`,
    })
  }

  const priceInUsd = (product.price / SOL_TO_USD_RATE).toFixed(2);
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;


  return (
    <>
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Galería de Imágenes */}
          <div className="grid gap-4">
            <button 
                onClick={() => setShowImagePreview(true)} 
                className="relative aspect-square overflow-hidden rounded-lg group cursor-zoom-in"
            >
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint="imagen del producto"
              />
               <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-semibold">Ver más grande</span>
                </div>
            </button>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-md transition-all',
                    selectedImage === img ? 'ring-2 ring-primary ring-offset-2' : 'hover:opacity-80'
                  )}
                >
                  <Image
                    src={img}
                    alt={`${product.name} miniatura ${index + 1}`}
                    fill
                    className="object-cover"
                    data-ai-hint="miniatura imagen producto"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Detalles del Producto */}
          <div className="grid gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold">{product.name}</h1>
              <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn('w-5 h-5', i < avgRating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50')} />
                      ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{avgRating.toFixed(1)} ({product.ratingCount} opiniones)</p>
                  <Separator orientation="vertical" className="h-4" />
                   {isOutOfStock ? (
                      <span className="text-sm font-semibold text-destructive">Agotado</span>
                  ) : isLowStock ? (
                      <span className="text-sm font-semibold text-yellow-600">Bajo Stock ({product.stock} disponibles)</span>
                  ) : (
                      <span className="text-sm text-primary">En Stock</span>
                  )}
              </div>
            </div>
            <p className="text-muted-foreground">{product.description}</p>

             {/* Rating Section */}
            <Card>
                <CardContent className="p-4">
                    {loadingPurchaseStatus ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verificando tu compra...</span>
                        </div>
                    ) : hasRated ? (
                         <div className="text-center">
                            <h4 className="font-semibold">¡Gracias por tu opinión!</h4>
                            <p className="text-sm text-muted-foreground">Ya has calificado este producto.</p>
                        </div>
                    ) : hasPurchased ? (
                        <div className="text-center space-y-2">
                           <h4 className="font-semibold">¿Te gustó el producto? ¡Califícalo!</h4>
                           <div 
                                className="flex justify-center gap-1"
                                onMouseLeave={() => setHoverRating(0)}
                           >
                               {[1, 2, 3, 4, 5].map((star) => (
                                   <button 
                                       key={star}
                                       onClick={() => handleRatingSubmit(star)}
                                       onMouseEnter={() => setHoverRating(star)}
                                       disabled={isSubmittingRating}
                                   >
                                       <Star className={cn('w-7 h-7 transition-colors', (hoverRating || Math.floor(avgRating)) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50')} />
                                   </button>
                               ))}
                           </div>
                        </div>
                    ) : (
                        <p className="text-center text-sm text-muted-foreground">
                            Debes haber comprado este producto para poder calificarlo.
                        </p>
                    )}
                </CardContent>
            </Card>


            <div>
              <p className="text-4xl font-bold text-primary">S/ {product.price.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Precio referencial: ${priceInUsd} USD</p>
            </div>

            <div className="grid gap-4">
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <Label className="font-semibold text-lg">Talla</Label>
                  <RadioGroup value={selectedSize} onValueChange={setSelectedSize} className="flex gap-2 mt-2">
                    {product.sizes.map((size) => (
                        <Label
                            key={size}
                            htmlFor={`size-${size}`}
                            className={cn("border rounded-md px-4 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground", {
                                "bg-primary text-primary-foreground": selectedSize === size,
                                "opacity-50 cursor-not-allowed": isOutOfStock,
                            })}
                        >
                            <RadioGroupItem value={size} id={`size-${size}`} className="sr-only" disabled={isOutOfStock} />
                            {size}
                        </Label>
                    ))}
                  </RadioGroup>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 border rounded-md">
                  <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={isOutOfStock}>
                      <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold">{quantity}</span>
                  <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)} disabled={quantity >= product.stock || isOutOfStock}>
                      <Plus className="h-4 w-4" />
                  </Button>
              </div>
              <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={isOutOfStock}>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {isOutOfStock ? 'Agotado' : 'Añadir al Carrito'}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Comments Section */}
        <div className="mt-16 pt-8">
             <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MessageSquare />
                Opiniones de Clientes ({comments.length})
            </h2>
            <Separator className="mb-8" />
            <div className="grid md:grid-cols-2 gap-8">
                {/* Comment Form */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Deja tu comentario</h3>
                    {hasPurchased ? (
                        <form onSubmit={handleCommentSubmit} className="space-y-4">
                            <Textarea 
                                placeholder="Comparte tu experiencia con este producto..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                disabled={isSubmittingComment}
                                rows={4}
                            />
                            <Button type="submit" disabled={isSubmittingComment || !newComment.trim()}>
                                {isSubmittingComment && <Loader2 className="mr-2 animate-spin" />}
                                Publicar Comentario
                            </Button>
                        </form>
                    ) : (
                         <p className="text-sm text-muted-foreground">
                            Debes haber comprado este producto para poder dejar un comentario.
                        </p>
                    )}
                </div>
                {/* Comments List */}
                 <div className="space-y-6">
                    {loadingComments ? (
                         <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Cargando comentarios...</span>
                        </div>
                    ) : comments.length > 0 ? (
                        comments.map(comment => (
                            <div key={comment.id} className="flex gap-4">
                                <Avatar>
                                    <AvatarImage src={comment.customerPhotoURL} />
                                    <AvatarFallback>
                                        {comment.customerName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{comment.customerName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(comment.createdAt.toDate(), 'dd MMM, yyyy', { locale: es })}
                                        </p>
                                    </div>
                                    <p className="text-muted-foreground mt-1">{comment.comment}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">Sé el primero en dejar un comentario para este producto.</p>
                    )}
                 </div>
            </div>
        </div>


        {/* Recomendaciones */}
        <div className="mt-16 pt-8">
          <h2 className="text-2xl font-bold mb-6">También te podría gustar</h2>
          <Separator className="mb-8" />
          {loadingRecommendations ? (
            <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin" />
              </div>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {recommendedProducts.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
          )}
        </div>

        <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¡Un momento!</AlertDialogTitle>
              <AlertDialogDescription>
                Para añadir productos a tu carrito, necesitas tener una cuenta. Por favor, inicia sesión o regístrate.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => router.push('/signup')}>Registrarse</AlertDialogAction>
              <AlertDialogAction onClick={() => router.push('/login')}>Iniciar Sesión</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
      
      <ImagePreviewModal 
        isOpen={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        imageUrl={selectedImage}
        imageAlt={product.name}
      />
    </>
  );
}
