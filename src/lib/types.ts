

import { Timestamp } from "firebase/firestore";

export type Category = 'Ropa' | 'Accesorios' | 'Hogar' | 'Calzado' | 'Carteras';
export type RopaSubcategory = 'Bebés' | 'Casual' | 'Sport' | 'Ejecutiva' | 'Artesanal';
export type HogarSubcategory = 'Fundas' | 'Cojines';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  cost?: number; 
  images: string[];
  category: Category;
  subcategory?: RopaSubcategory | HogarSubcategory | string; 
  sizes: ('XS' | 'S' | 'M' | 'L' | 'XL' | 'Única' | string)[];
  ratingSum: number; 
  ratingCount: number; 
  stock: number;
  createdAt?: Timestamp;
};

export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    gender: 'Damas' | 'Caballeros';
    photoURL?: string;
    createdAt: Timestamp;
    status: 'active' | 'inactive';
    shippingAddress?: {
        address: string;
        city: string;
        department: string;
        zip: string;
    };
}

export type AdminPermission = 'dashboard' | 'products' | 'inventory' | 'orders' | 'customers' | 'promotions' | 'finance' | 'closing' | 'assistant' | 'settings' | 'users' | 'billing';

export const ALL_PERMISSIONS: Record<AdminPermission, string> = {
  dashboard: 'Panel Principal',
  products: 'Productos',
  inventory: 'Inventario',
  orders: 'Pedidos',
  customers: 'Clientes',
  promotions: 'Promociones',
  finance: 'Finanzas',
  closing: 'Cierre Anual',
  assistant: 'Asistente IA',
  settings: 'Ajustes de Perfil',
  users: 'Gestionar Usuarios',
  billing: 'Facturación'
};


export interface Admin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  rol: 'admin' | 'subadmin';
  status: 'active' | 'inactive';
  photoURL?: string;
  createdAt: Timestamp;
  permissions: {
    [key in AdminPermission]?: boolean;
  };
}

export interface OrderItem {
    productId: string;
    name: string;
    image: string;
    price: number;
    cost?: number;
    quantity: number;
    size: string;
}

export interface Order {
    id:string;
    customerId: string;
    customerName: string;
    items: OrderItem[];
    total: number;
    subtotal: number;
    couponDiscount: number;
    couponCode: string | null;
    couponId: string | null;
    status: 'Procesando' | 'Enviado' | 'Entregado' | 'Cancelado' | 'Reportado';
    shippingAddress: {
        address: string;
        city: string;
        department: string;
        zip: string;
    },
    createdAt: Timestamp;
    deliveredAt?: Timestamp;
    returnedItems?: {
        items: OrderItem[];
        requestedAt: Timestamp;
    }
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  code: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'active' | 'inactive' | 'scheduled';
  imageUrl?: string;
  createdAt: Timestamp;
  usedCount?: number;
}

export interface Comment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhotoURL?: string;
  comment: string;
  createdAt: Timestamp;
}
    

    
