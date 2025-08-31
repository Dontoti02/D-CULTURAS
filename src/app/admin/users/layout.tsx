
'use client'

import useAdminAuth from "@/hooks/use-admin-auth";

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAdminAuth('users');
  return <>{children}</>;
}
