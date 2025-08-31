
'use client'

import useAdminAuth from "@/hooks/use-admin-auth";

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAdminAuth('billing');
  return <>{children}</>;
}
