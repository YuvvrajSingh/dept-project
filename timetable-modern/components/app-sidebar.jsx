"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Database,
  Link2,
  ClipboardList,
  CalendarCog,
  Eye,
  LogOut,
  Zap,
  Terminal,
} from "lucide-react";

const navGroups = [
  {
    label: "OPERATIONS",
    items: [
      { path: "/", label: "DASHBOARD", icon: LayoutDashboard },
      { path: "/master", label: "MASTER DATA", icon: Database },
      { path: "/assignments", label: "ASSIGNMENTS", icon: Link2 },
      { path: "/assignment-overview", label: "OVERVIEW", icon: ClipboardList },
    ],
  },
  {
    label: "SCHEDULING",
    items: [
      { path: "/builder", label: "BUILDER", icon: CalendarCog },
      { path: "/views", label: "VIEWS", icon: Eye },
    ],
  },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-[240px] bg-sidebar flex flex-col z-50 overflow-hidden sidebar-scanline">
      {/* Decorative vertical accent line */}
      <div className="absolute top-0 right-0 w-[2px] h-full bg-sidebar-border" />
      <div className="absolute top-0 right-0 w-[2px] h-24 bg-sidebar-primary" />

      {/* Brand */}
      <div className="p-5 pb-6 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sidebar-primary flex items-center justify-center">
            <Zap size={16} className="text-sidebar-primary-foreground" />
          </div>
          <div>
            <div className="font-heading text-xl font-extrabold tracking-tighter text-sidebar-foreground uppercase leading-none">
              DEPT<span className="text-sidebar-primary">//</span>TT
            </div>
          </div>
        </div>
        <motion.div
          className="h-[2px] bg-sidebar-primary mt-3"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: "left" }}
        />
        <div className="flex items-center gap-2 mt-2">
          <div
            className="w-1.5 h-1.5 bg-chart-4"
            style={{ animation: "pulse-glow 2s ease infinite" }}
          />
          <span className="text-[8px] font-mono tracking-[0.3em] text-sidebar-foreground/30 uppercase">
            SYS.ONLINE — v2.0.1
          </span>
        </div>
      </div>

      {/* Scrolling ticker */}
      <div className="h-6 bg-sidebar-accent border-y border-sidebar-border overflow-hidden flex items-center relative">
        <div
          className="flex items-center gap-8 text-[8px] font-mono tracking-[0.2em] text-sidebar-foreground/20 uppercase whitespace-nowrap"
          style={{
            animation: "marquee 20s linear infinite",
          }}
        >
          <span>◼ DEPT TIMETABLE SYS</span>
          <span>◼ ALL MODULES ACTIVE</span>
          <span>◼ SCHEDULING ENGINE READY</span>
          <span>◼ DATA INTEGRITY: OK</span>
          <span>◼ DEPT TIMETABLE SYS</span>
          <span>◼ ALL MODULES ACTIVE</span>
          <span>◼ SCHEDULING ENGINE READY</span>
          <span>◼ DATA INTEGRITY: OK</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + gi * 0.1, duration: 0.4 }}
          >
            <div className="flex items-center gap-2 px-3 mb-2">
              <span className="text-[8px] font-mono tracking-[0.35em] text-sidebar-foreground/25 uppercase">
                {group.label}
              </span>
              <div className="flex-1 h-px bg-sidebar-border" />
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.path === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.path);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`relative flex items-center gap-3 h-9 px-3 font-mono text-[10px] tracking-[0.15em] transition-all duration-200 group ${
                      isActive
                        ? "text-sidebar-primary bg-sidebar-primary/8 font-bold"
                        : "text-sidebar-foreground/45 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                    }`}
                  >
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          className="absolute left-0 top-0 bottom-0 w-[3px] bg-sidebar-primary"
                          layoutId="activeIndicator"
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          exit={{ scaleY: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}
                    </AnimatePresence>
                    <Icon
                      size={13}
                      strokeWidth={isActive ? 2.5 : 1.5}
                      className="shrink-0"
                    />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        className="ml-auto w-1 h-1 bg-sidebar-primary"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        ))}
      </nav>

      {/* Terminal-style footer */}
      <div className="p-3 space-y-2">
        {/* Fake terminal line */}
        <div className="px-3 py-2 bg-sidebar-accent/50 border border-sidebar-border">
          <div className="flex items-center gap-1.5">
            <Terminal size={9} className="text-sidebar-primary/50" />
            <span className="text-[8px] font-mono tracking-[0.15em] text-sidebar-foreground/25">
              dept-admin@sys
              <span style={{ animation: "blink 1s step-end infinite" }}>_</span>
            </span>
          </div>
        </div>

        {/* User card */}
        <div className="p-3 bg-sidebar-accent border border-sidebar-border relative corner-bracket">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sidebar-primary flex items-center justify-center relative">
              <span className="text-sidebar-primary-foreground font-heading text-xs font-bold">
                A
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono text-sidebar-foreground tracking-[0.15em] font-bold truncate">
                ADMIN
              </div>
              <div className="text-[8px] font-mono text-sidebar-foreground/30 tracking-[0.2em]">
                ROOT.ACCESS
              </div>
            </div>
          </div>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-2 py-1.5 mt-3 text-[9px] font-mono tracking-[0.2em] text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all duration-200 border border-sidebar-border hover:border-destructive"
          >
            <LogOut size={9} />
            SIGN OUT
          </button>
        </div>
      </div>
    </aside>
  );
}
