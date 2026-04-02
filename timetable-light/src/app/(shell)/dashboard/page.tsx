"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { teacherApi, subjectApi, classApi, roomApi, labApi } from "@/lib/api";

interface Stats {
  teachers: number;
  subjects: number;
  classes: number;
  rooms: number;
  labs: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ teachers: 0, subjects: 0, classes: 0, rooms: 0, labs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [teachers, subjects, classes, rooms, labs] = await Promise.all([
          teacherApi.list().catch(() => []),
          subjectApi.list().catch(() => []),
          classApi.list().catch(() => []),
          roomApi.list().catch(() => []),
          labApi.list().catch(() => []),
        ]);
        setStats({
          teachers: teachers.length,
          subjects: subjects.length,
          classes: classes.length,
          rooms: rooms.length,
          labs: labs.length,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = [
    { label: "Teachers", value: stats.teachers, icon: "person", color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Subjects", value: stats.subjects, icon: "menu_book", color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Classes", value: stats.classes, icon: "groups", color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Rooms", value: stats.rooms, icon: "meeting_room", color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Labs", value: stats.labs, icon: "biotech", color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  const quickActions = [
    { href: "/master-data", icon: "database", title: "Master Data", desc: "Configure foundational entities and resources.", primary: false },
    { href: "/assignments", icon: "assignment_ind", title: "Assignments", desc: "Map teachers to subjects and class sections.", primary: false },
    { href: "/timetable-builder", icon: "architecture", title: "Build Timetable", desc: "Launch the architectural generator engine.", primary: true },
    { href: "/timetable-views", icon: "grid_view", title: "View Matrices", desc: "Review conflict-free academic schedules.", primary: false },
  ];

  return (
    <>
      {/* Summary Stats */}
      <section className="mb-10">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4 opacity-70">
          Department Overview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`material-symbols-outlined ${card.color} p-2 ${card.bg} rounded-lg`}>
                  {card.icon}
                </span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter opacity-40">
                  Live
                </span>
              </div>
              <p className="text-3xl font-black text-on-surface tracking-tighter">
                {loading ? "—" : card.value}
              </p>
              <p className="text-sm font-semibold text-on-surface-variant mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Strategic Control */}
      <section className="mb-10">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4 opacity-70">
          Strategic Control
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <div
                className={`group relative overflow-hidden p-8 rounded-xl cursor-pointer transition-colors duration-300 ${
                  action.primary
                    ? "bg-secondary text-white hover:shadow-xl hover:shadow-secondary/20"
                    : "bg-surface-container-highest hover:bg-secondary"
                }`}
              >
                <div className="z-10 relative">
                  <span
                    className={`material-symbols-outlined mb-6 text-3xl transition-colors ${
                      action.primary ? "" : "text-on-surface group-hover:text-white"
                    }`}
                  >
                    {action.icon}
                  </span>
                  <h4
                    className={`text-lg font-bold mb-2 transition-colors ${
                      action.primary ? "" : "text-on-surface group-hover:text-white"
                    }`}
                  >
                    {action.title}
                  </h4>
                  <p
                    className={`text-sm transition-colors ${
                      action.primary ? "text-white/80" : "text-on-surface-variant group-hover:text-white/80"
                    }`}
                  >
                    {action.desc}
                  </p>
                </div>
                {action.primary && (
                  <div className="absolute bottom-4 right-4 opacity-20">
                    <span className="material-symbols-outlined text-6xl">bolt</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Analytics Row */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Scheduling Efficiency */}
        <div className="flex-grow bg-surface-container-low rounded-xl p-8 border border-outline-variant/10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-on-surface">Scheduling Efficiency</h3>
              <p className="text-sm text-on-surface-variant">Real-time optimization metrics</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary/10">
              <span className="material-symbols-outlined text-secondary">trending_up</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: "Resource Utilization", pct: 82, status: "Optimal Range", width: "w-4/5" },
              { label: "Teacher Distribution", pct: null, status: "Sigma 0.4", width: "w-[65%]", text: "Balanced" },
              { label: "Room Allocation", pct: null, status: "Critical: Lab 2", width: "w-[92%]", text: "High Demand" },
            ].map((m) => (
              <div key={m.label}>
                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  {m.label}
                </div>
                <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
                  <div className={`h-full bg-secondary ${m.width} rounded-full`} />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs font-bold text-on-surface">{m.pct ? `${m.pct}%` : m.text}</span>
                  <span className="text-[10px] text-on-surface-variant">{m.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conflict Monitor */}
        <div className="w-full lg:w-80 bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10">
          <h3 className="text-sm font-bold text-on-surface mb-4">Conflict Monitor</h3>
          <div className="space-y-4">
            {[
              { color: "bg-error", title: "Overlap Detected", desc: "Room 304 | TUE 10:00 AM" },
              { color: "bg-green-500", title: "Resolved", desc: "Teacher Dr. Smith Gap Fix" },
              { color: "bg-secondary", title: "Constraint Applied", desc: "Zero-Gap Rule for Lab sessions" },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className={`mt-1 h-2 w-2 rounded-full ${item.color} shrink-0`} />
                <div>
                  <p className="text-xs font-bold text-on-surface">{item.title}</p>
                  <p className="text-[10px] text-on-surface-variant">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-[10px] font-bold uppercase tracking-widest text-secondary hover:bg-secondary/5 border border-secondary/20 rounded transition-colors">
            View Full Logs
          </button>
        </div>
      </div>

      {/* Status footer */}
      <footer className="mt-8 h-10 bg-surface-container-low px-8 flex items-center justify-between border-t border-outline-variant/5 -mx-8 -mb-8 rounded-b-xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Engine: Active</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">verified_user</span>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Conflicts: Monitored</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Sync: Live</span>
          <span className="material-symbols-outlined text-[14px] text-secondary animate-pulse">sync</span>
        </div>
      </footer>
    </>
  );
}
