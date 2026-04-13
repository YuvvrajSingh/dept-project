"use client";

import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { AcademicYearProvider } from "@/contexts/academic-year-context";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (active) {
            router.replace("/login");
            router.refresh();
          }
          return;
        }

        const data = await res.json();
        if (data?.user?.role === "TEACHER") {
          if (active) {
            router.replace("/teacher-portal");
          }
          return;
        }
      } catch {
        if (active) {
          router.replace("/login");
          router.refresh();
        }
        return;
      }

      if (active) {
        setCheckingSession(false);
      }
    }

    verifySession();

    return () => {
      active = false;
    };
  }, [router]);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-on-surface-variant opacity-70">
          Validating session...
        </p>
      </div>
    );
  }

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
