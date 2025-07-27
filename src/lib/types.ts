import { Timestamp } from "firebase/firestore";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: 'Caballeros' | 'Damas';
  sizes: ('XS' | 'S' | 'M' | 'L' | 'XL')[];
  colors: { name: string, hex: string }[];
  rating: number;
  stock: number;
  createdAt?: Timestamp;
};
