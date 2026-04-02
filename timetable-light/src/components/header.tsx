"use client";

import { usePathname } from "next/navigation";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/master-data": "Master Data Warehouse",
  "/assignments": "Assignments // DEPT TIMETABLE",
  "/timetable-builder": "CSE DEPT TIMETABLE",
  "/timetable-views": "Timetable Views",
};

export default function Header() {
  const pathname = usePathname();
  const title = routeTitles[pathname ?? ""] ?? "DEPT // TIMETABLE";

  return (
    <header className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-xl flex items-center justify-between px-8 h-16 shadow-sm border-b border-slate-200/10">
      <div className="flex items-baseline gap-4">
        <h2 className="text-xl font-bold tracking-tighter text-on-surface">{title}</h2>
        <div className="flex gap-2">
          <span className="px-2 py-0.5 bg-primary-container text-on-secondary text-[10px] font-bold uppercase rounded">
            CSE
          </span>
          <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-bold uppercase rounded">
            HOD
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="hidden md:flex items-center bg-surface-container-high px-3 py-1.5 rounded-lg border border-outline-variant/10">
          <span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 text-sm w-48 placeholder:text-on-surface-variant/50 outline-none ml-2"
            placeholder="Search records..."
            type="text"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-600 hover:text-indigo-500 transition-all hover:translate-y-[-1px]">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 text-slate-600 hover:text-indigo-500 transition-all hover:translate-y-[-1px]">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="h-8 w-8 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/20 ml-2 flex items-center justify-center text-xs font-bold text-on-surface-variant">
            HD
          </div>
        </div>
      </div>
    </header>
  );
}
