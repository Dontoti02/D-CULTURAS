
'use client'

import useAdminAuth from "@/hooks/use-admin-auth";

export default function AiAssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAdminAuth('assistant');
  return <>{children}</>;
}
