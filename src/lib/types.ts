

import { Timestamp } from "firebase/firestore";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  cost?: number; // Costo del producto para calcular la ganancia
  images: string[];
  gender: 'Damas' | 'Caballeros';
  category: 'Conjuntos' | 'Vestidos' | 'Faldas' | 'Blusas' | 'Ternos' | 'Camisas' | 'Pantalones' | 'Corbatas';
  sizes: ('XS' | 'S' | 'M' | 'L' | 'XL')[];
  ratingSum: number; // Suma de todas las calificaciones
  ratingCount: number; // Cantidad de calificaciones
  stock: number;
  createdAt?: Timestamp;
};

export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    photoURL?: string;
    createdAt: Timestamp;
    shippingAddress?: {
        address: string;
        city: string;
        department: string;
        zip: string;
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
    

    