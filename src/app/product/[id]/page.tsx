import { notFound } from 'next/navigation';
import ProductClientPage from '@/components/product-client-page';
import type { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/lib/types';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const docRef = doc(db, 'products', params.id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return {
      title: 'Producto no encontrado',
    };
  }

  const product = { id: docSnap.id, ...docSnap.data() } as Product;

  return {
    title: `${product.name} - stylesUP!`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const docRef = doc(db, 'products', params.id);
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
