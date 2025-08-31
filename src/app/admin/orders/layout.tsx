
'use client'

import useAdminAuth from "@/hooks/use-admin-auth";

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAdminAuth('orders');
  return <>{children}</>;
}
