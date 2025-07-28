
import { notFound } from 'next/navigation';
import ProductClientPage from '@/components/product-client-page';
import type { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/lib/types';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const docRef = doc(db, 'products', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return {
      title: 'Producto no encontrado',
    };
  }

  const product = { id: docSnap.id, ...docSnap.data() } as Product;

  return {
    title: `${product.name} - StylesUP!`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const docRef = doc(db, 'products', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    notFound();
  }

  const product = { id: docSnap.id, ...docSnap.data() } as Product;

  // Firestore Timestamps need to be converted to be serializable for client components
  const serializedProduct = {
    ...product,
    createdAt: product.createdAt?.toDate().toISOString() || null,
  };


  return <ProductClientPage product={serializedProduct as any} />;
}
