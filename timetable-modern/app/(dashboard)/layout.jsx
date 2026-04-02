"use client";

import AppSidebar from "@/components/app-sidebar";
import HeaderBar from "@/components/header-bar";
import Toast from "@/components/toast";
import { ToastProvider, useToast } from "@/lib/toast-context";

function DashboardLayoutInner({ children }) {
  const { toast, dismissToast } = useToast();

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <div className="flex-1 ml-[220px] flex flex-col">
        <HeaderBar />
        <main className="flex-1 p-8 grid-bg noise-bg relative">
          {children}
        </main>
      </div>
      <Toast
        message={toast.message}
        type={toast.type}
        onDismiss={dismissToast}
      />
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <ToastProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </ToastProvider>
  );
}
