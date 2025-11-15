import type { Metadata } from 'next'
import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { CustomSidebar } from "@/components/custom-sidebar";
import { Toaster } from "sonner";

/**
 * Dashboard Layout
 *
 * Server Component layout for all dashboard pages.
 * Enables instant navigation between pages.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <CustomSidebar>
        <AppSidebar />
      </CustomSidebar>
      <main className="flex-1 overflow-auto">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
