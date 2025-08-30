
'use client';

import Link from 'next/link';
import { 
    ShoppingCart, User, Search, Menu, LogOut, UserCircle, Settings, HelpCircle, ShoppingBag, 
    ChevronDown, Sparkles, TrendingUp, Star, Percent, BookOpen, Diamond, Shirt, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/cart-context';
import { Badge } from './ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef } from 'react';
import { Product } from '@/lib/types';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';

const navLinks = [
  { href: '/?filter=new', label: 'Lo nuevo', icon: Sparkles },
  { href: '/?filter=bestsellers', label: 'Más vendidos', icon: TrendingUp },
  { href: '/?filter=top-rated', label: '5 estrellas', icon: Star },
  { href: '/?filter=sale', label: 'Rebajas', icon: Percent },
];

const categoryIcons: { [key: string]: React.ElementType } = {
    'Conjuntos': ShoppingBag,
    'Vestidos': Diamond,
    'Faldas': BookOpen,
    'Blusas': Shirt,
    'Ternos': Briefcase,
    'Camisas': Shirt,
    'Pantalones': UserCircle,
    'Corbatas': UserCircle,
    'default': ShoppingBag,
};


export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount } = useCart();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [categories, setCategories] = useState<{ damas: string[], caballeros: string[] }>({ damas: [], caballeros: [] });
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      setLoadingCategories(true);
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      
      setAllProducts(productsData);

      const damasCategories = new Set<string>();
      const caballerosCategories = new Set<string>();

      productsData.forEach(product => {
        if (product.gender === 'Damas') {
          damasCategories.add(product.category);
        } else if (product.gender === 'Caballeros') {
          caballerosCategories.add(product.category);
        }
      });
      
      setCategories({
          damas: Array.from(damasCategories),
          caballeros: Array.from(caballerosCategories)
      });
      setLoadingCategories(false);
    };
    fetchProductsAndCategories();
  }, []);


  useEffect(() => {
    if (searchQuery.length > 1) {
      const results = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5); // Limitar a 5 sugerencias
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allProducts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchRef]);


  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: "Sesión cerrada", description: "Has cerrado sesión exitosamente." });
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  };

  const handleSuggestionClick = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
  };


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="mr-6 flex items-center gap-2">
          <Image src="/logo.svg" alt="StylesUP! Logo" width={120} height={30} />
        </Link>

        <nav className="hidden gap-4 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary',
                pathname === link.href ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary px-3">
                        Categorías
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                     <DropdownMenuGroup>
                        <DropdownMenuLabel>Damas</DropdownMenuLabel>
                        <DropdownMenuSeparator/>
                        {categories.damas.map(cat => {
                            const Icon = categoryIcons[cat] || categoryIcons.default;
                            return (
                                <DropdownMenuItem key={cat} asChild>
                                    <Link href={`/?category=${cat}`}>
                                        <Icon className="mr-2 h-4 w-4"/>
                                        <span>{cat}</span>
                                    </Link>
                                </DropdownMenuItem>
                            )
                        })}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator/>
                    <DropdownMenuGroup>
                        <DropdownMenuLabel>Caballeros</DropdownMenuLabel>
                         <DropdownMenuSeparator/>
                        {categories.caballeros.map(cat => {
                           const Icon = categoryIcons[cat] || categoryIcons.default;
                           return (
                                <DropdownMenuItem key={cat} asChild>
                                    <Link href={`/?category=${cat}`}>
                                        <Icon className="mr-2 h-4 w-4"/>
                                        <span>{cat}</span>
                                    </Link>
                                </DropdownMenuItem>
                           )
                        })}
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden md:block" ref={searchRef}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Buscar productos..." 
              className="pl-8 sm:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
            />
            {isSearchFocused && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-card border rounded-md shadow-lg z-10">
                    <ul>
                        {searchResults.map(product => (
                            <li key={product.id}>
                                <Link href={`/product/${product.id}`} className="flex items-center gap-4 p-2 hover:bg-muted" onClick={handleSuggestionClick}>
                                    <Image src={product.images[0]} alt={product.name} width={40} height={50} className="object-cover rounded-md" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{product.name}</p>
                                        <p className="text-xs text-primary">S/ {product.price.toFixed(2)}</p>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
          </div>

            <Link href="/faq" passHref>
                <Button variant="ghost" size="icon" aria-label="Ayuda">
                    <HelpCircle className="h-5 w-5" />
                    <span className="sr-only">Ayuda</span>
                </Button>
            </Link>

          {user && (
            <Link href="/profile/cart" passHref>
                <Button variant="ghost" size="icon" aria-label="Carrito de Compras" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{cartCount}</Badge>
                  )}
                  <span className="sr-only">Carrito de Compras</span>
                </Button>
            </Link>
          )}
          
          {loading ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} alt="Foto de perfil" />
                    <AvatarFallback>
                      {(user.firstName || user.email)?.charAt(0).toUpperCase()}
                      {user.lastName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.photoURL || undefined} alt="Foto de perfil" />
                            <AvatarFallback>
                                {(user.firstName || user.email)?.charAt(0).toUpperCase()}
                                {user.lastName?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.firstName ? `${user.firstName} ${user.lastName}` : (user.displayName || 'Usuario')}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                            </p>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile">
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>Mi Perfil</span>
                    </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href="/profile/orders">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        <span>Mis Pedidos</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
                <Button variant="ghost" size="icon" aria-label="Cuenta de Usuario">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Cuenta de Usuario</span>
                </Button>
            </Link>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú de navegación</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>StylesUP!</SheetTitle>
              </SheetHeader>
              <nav className="grid gap-4 text-base font-medium mt-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground"
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
                 <div className="grid gap-2">
                    <h3 className="font-semibold px-3">Categorías</h3>
                    <div className="grid gap-2 pl-6">
                        <h4 className="font-semibold text-sm text-muted-foreground">Damas</h4>
                        {categories.damas.map(cat => {
                            const Icon = categoryIcons[cat] || categoryIcons.default;
                            return (
                                <Link key={cat} href={`/?category=${cat}`} className="flex items-center gap-3 text-muted-foreground hover:text-foreground text-sm">
                                    <Icon className="h-4 w-4"/>
                                    {cat}
                                </Link>
                            )
                        })}
                         <h4 className="font-semibold text-sm text-muted-foreground mt-2">Caballeros</h4>
                        {categories.caballeros.map(cat => {
                           const Icon = categoryIcons[cat] || categoryIcons.default;
                           return (
                                <Link key={cat} href={`/?category=${cat}`} className="flex items-center gap-3 text-muted-foreground hover:text-foreground text-sm">
                                    <Icon className="h-4 w-4"/>
                                    {cat}
                                </Link>
                           )
                        })}
                    </div>
                 </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
