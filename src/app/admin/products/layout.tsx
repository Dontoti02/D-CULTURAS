
'use client'

import useAdminAuth from "@/hooks/use-admin-auth";

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAdminAuth('products');
  return <>{children}</>;
}
