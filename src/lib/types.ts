export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: 'Men' | 'Women';
  sizes: ('XS' | 'S' | 'M' | 'L' | 'XL')[];
  colors: { name: string, hex: string }[];
  rating: number;
};
