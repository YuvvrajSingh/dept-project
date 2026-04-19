"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { authApi, teacherMeApi } from "@/lib/api";
import type { Teacher } from "@/lib/types";

const teacherNavItems = [
  { href: "/teacher-portal", label: "My Subjects", icon: "menu_book", exact: true },
  { href: "/teacher-portal/timetable", label: "My Timetable", icon: "calendar_view_day", exact: false },
  { href: "/teacher-portal/attendance", label: "Attendance", icon: "how_to_reg", exact: false },
  { href: "/teacher-portal/midterms", label: "Midterms", icon: "grading", exact: true },
  { href: "/teacher-portal/midterms/results", label: "Results", icon: "leaderboard", exact: false },
];

export default function TeacherPortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [checking, setChecking] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        // Verify session exists and is a teacher account
        const meRes = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (!meRes.ok) {
          if (active) { router.replace("/login"); router.refresh(); }
          return;
        }
        const meBody = await meRes.json();
        // If somehow an admin lands here, redirect them to the admin dashboard
        if (meBody.user?.role === "ADMIN") {
          if (active) { router.replace("/dashboard"); }
          return;
        }

        // Fetch the teacher's own profile
        const t = await teacherMeApi.get();
        if (active) {
          setTeacher(t);
          setChecking(false);
        }
      } catch {
        if (active) { router.replace("/login"); router.refresh(); }
      }
    }

    init();
    return () => { active = false; };
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);
    try { await authApi.logout(); } catch { /* session may already be gone */ }
    router.replace("/login");
    router.refresh();
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-on-surface-variant opacity-70">
          Validating session...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="h-16 bg-surface-container-lowest border-b border-outline-variant/10 flex items-center px-6 gap-6 fixed top-0 left-0 right-0 z-50">
        {/* Branding */}
        <div className="flex items-center gap-3 mr-6">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-sm text-white">school</span>
          </div>
          <div>
            <p className="text-xs font-black tracking-[0.12em] uppercase text-on-surface leading-none">
              DEPT // TIMETABLE
            </p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mt-0.5 leading-none">
              Teacher Portal
            </p>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="flex gap-1">
          {teacherNavItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? "bg-surface-container text-secondary"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50"
                }`}
              >
                <span className="material-symbols-outlined text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: user info + logout */}
        <div className="ml-auto flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-on-surface leading-none">{teacher?.name}</p>
            <p className="text-[10px] text-on-surface-variant mt-0.5 leading-none">
              {teacher?.abbreviation} · Faculty
            </p>
          </div>
          <span className="material-symbols-outlined text-2xl text-on-surface-variant">
            account_circle
          </span>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-error hover:bg-error/5 rounded-lg transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            {loggingOut ? "..." : "Logout"}
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 pt-16">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
