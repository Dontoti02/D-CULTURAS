
'use client'

import useAdminAuth from "@/hooks/use-admin-auth";

export default function AnnualClosingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAdminAuth('closing');
  return <>{children}</>;
}
