import type React from "react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PagesHeader } from "@/components/features/dashboard/header";

export default function MainRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('[MAIN-ROUTES-LAYOUT] Layout do administrador carregado')
  
  return (
    <ProtectedRoute requiredUserType={["administrador"]}>
      <div className="min-h-screen bg-background flex">
        <SidebarProvider>
          <Sidebar />
          <main className="flex-1">
            <PagesHeader />
            {children}
          </main>
        </SidebarProvider>
      </div>
    </ProtectedRoute>
  );
}
