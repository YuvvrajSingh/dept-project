"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/master-data", label: "Master Data", icon: "database" },
  { href: "/assignments", label: "Assignments", icon: "assignment" },
  { href: "/timetable-builder", label: "Timetable Builder", icon: "calendar_add_on" },
  { href: "/timetable-views", label: "Timetable Views", icon: "calendar_view_day" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // Still leave the app shell; cookie may already be cleared.
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 overflow-y-auto bg-slate-100 flex flex-col py-6 px-4 z-50">
      {/* Logo */}
      <div className="mb-10 px-2">
        <h1 className="text-lg font-black tracking-[0.1em] uppercase text-slate-900">
          DEPT // TIMETABLE
        </h1>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mt-1">
          Academic Management
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 transition-colors duration-200 ${
                isActive
                  ? "text-indigo-700 font-bold border-r-4 border-indigo-700 bg-slate-200 rounded-l-lg"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="text-sm tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Card */}
      <div className="mt-auto pt-6 border-t border-slate-200/50">
        <div className="flex items-center gap-3 px-3 py-2 mb-4">
          <span className="material-symbols-outlined text-2xl text-slate-400">account_circle</span>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-900 truncate">HOD Name</p>
            <p className="text-[10px] text-slate-500 truncate">Administrator</p>
          </div>
        </div>
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-200/50 hover:bg-error/10 hover:text-error text-slate-600 rounded-lg transition-all duration-200 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
          disabled={loggingOut}
          onClick={handleLogout}
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          {loggingOut ? "Signing out…" : "Logout"}
        </button>
      </div>
    </aside>
  );
}
