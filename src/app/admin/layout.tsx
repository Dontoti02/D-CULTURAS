
'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/admin-sidebar';
import AdminHeader from '@/components/admin-header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <AdminSidebar isOpen={isSidebarOpen} onOpenChange={setIsSidebarOpen} />
      <div className="flex flex-col flex-1">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="flex-1 overflow-auto py-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
