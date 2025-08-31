
'use client'

import useAdminAuth from "@/hooks/use-admin-auth";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAdminAuth('settings');
  return <>{children}</>;
}
