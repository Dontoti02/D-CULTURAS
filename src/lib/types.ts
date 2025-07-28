
import { Timestamp } from "firebase/firestore";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: 'Caballeros' | 'Damas' | 'Novedades Caballeros' | 'Novedades Damas';
  sizes: ('XS' | 'S' | 'M' | 'L' | 'XL')[];
  colors: { name: string, hex: string }[];
  rating: number;
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
}

export interface Order {
    id:string;
    customerId: string;
    customerName: string;
    items: {
        productId: string;
        name: string;
        image: string;
        price: number;
        quantity: number;
        size: string;
        color: string;
    }[];
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
