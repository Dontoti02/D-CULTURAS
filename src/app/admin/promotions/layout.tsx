
'use client'

import useAdminAuth from "@/hooks/use-admin-auth";

export default function PromotionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAdminAuth('promotions');
  return <>{children}</>;
}
