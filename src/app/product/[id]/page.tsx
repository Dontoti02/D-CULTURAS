import { products } from '@/lib/data';
import { notFound } from 'next/navigation';
import ProductClientPage from '@/components/product-client-page';
import type { Metadata } from 'next';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = products.find((p) => p.id === params.id);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: `${product.name} - stylesUP!`,
    description: product.description,
  };
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = products.find((p) => p.id === params.id);

  if (!product) {
    notFound();
  }

  return <ProductClientPage product={product} />;
}
