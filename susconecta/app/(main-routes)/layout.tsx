import type React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PagesHeader } from "@/components/dashboard/header";

export default function MainRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredUserType="administrador">
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
