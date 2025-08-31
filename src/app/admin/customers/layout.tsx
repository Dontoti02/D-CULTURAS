
'use client'

import useAdminAuth from "@/hooks/use-admin-auth";

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAdminAuth('customers');
  return <>{children}</>;
}
