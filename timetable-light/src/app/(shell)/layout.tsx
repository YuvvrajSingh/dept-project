"use client";

import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { AcademicYearProvider } from "@/contexts/academic-year-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AcademicYearProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-64 min-h-screen flex flex-col">
          <Header />
          <div className="p-8 flex-1">{children}</div>
        </main>
      </div>
    </AcademicYearProvider>
  );
}
