"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { teacherApi, subjectApi, classApi, roomApi, labApi, dashboardApi } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Stats {
  teachers: number;
  subjects: number;
  classes: number;
  rooms: number;
  labs: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ teachers: 0, subjects: 0, classes: 0, rooms: 0, labs: 0 });
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Drilldown state
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const [teachers, subjects, classes, rooms, labs, dashMetrics] = await Promise.all([
          teacherApi.list().catch(() => []),
          subjectApi.list().catch(() => []),
          classApi.list().catch(() => []),
          roomApi.list().catch(() => []),
          labApi.list().catch(() => []),
          dashboardApi.getMetrics().catch(() => null)
        ]);
        setStats({
          teachers: teachers.length,
          subjects: subjects.length,
          classes: classes.length,
          rooms: rooms.length,
          labs: labs.length,
        });
        setMetrics(dashMetrics);
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
      <div className="flex flex-col xl:flex-row gap-8 mb-10">
        <div className="flex-1 bg-surface-container-low rounded-xl p-8 border border-outline-variant/10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-on-surface">Scheduling Efficiency</h3>
              <p className="text-sm text-on-surface-variant">Class Timetable Completion Progress</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary/10">
              <span className="material-symbols-outlined text-secondary">trending_up</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {loading ? <div className="h-24 animate-pulse bg-surface-container-highest rounded-lg w-full" /> : metrics?.progress?.map((p: any) => (
              <div key={p.classSectionId}>
                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex justify-between">
                  <span>{p.name}</span>
                  <span className="text-on-surface">{p.percentage}%</span>
                </div>
                <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${p.percentage}%` }} />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-on-surface-variant">{p.scheduled} / {p.required} Configured Periods</span>
                </div>
              </div>
            ))}
            {(!loading && (!metrics?.progress || metrics.progress.length === 0)) && (
               <p className="text-sm text-on-surface-variant">No classes created yet.</p>
            )}
          </div>
        </div>

        <div className="xl:w-96 bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10 h-full">
          <h3 className="text-sm font-bold text-on-surface mb-4 border-b border-outline-variant/10 pb-4 flex justify-between items-center">
             Live Audit Monitor
             <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
          </h3>
          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
            {loading ? <p className="text-xs text-on-surface-variant animate-pulse">Loading logs...</p> : metrics?.auditFeed?.map((log: any) => (
              <div 
                key={log.id} 
                className="flex gap-3 p-2 hover:bg-surface-container-high rounded cursor-pointer transition-colors"
                onClick={() => {
                   if (log.classSectionId) router.push(`/timetable-builder?classSectionId=${log.classSectionId}`);
                }}
              >
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${log.type === "CONFLICT DETECTED" ? "bg-error" : "bg-indigo-500"}`} />
                <div>
                  <p className={`text-xs font-bold ${log.type === "CONFLICT DETECTED" ? "text-error" : "text-on-surface"}`}>{log.type}</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">{log.message}</p>
                  <span className="text-[8px] text-on-surface-variant/70 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
            {(!loading && (!metrics?.auditFeed || metrics.auditFeed.length === 0)) && (
               <p className="text-xs text-on-surface-variant">System is stable. No conflicts monitored today.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Visual Analytics Row */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        <div className="flex-1 bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10">
          <h3 className="text-sm font-bold text-on-surface mb-6">Faculty Workload Distribution</h3>
          <div className="h-64">
             {loading ? <div className="w-full h-full animate-pulse bg-surface-container-low rounded-lg" /> : (
                <div style={{ width: '100%', height: '256px' }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={400} minHeight={250}>
                    <BarChart data={metrics?.workload || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <XAxis dataKey="abbreviation" tick={{ fontSize: 11, fill: 'var(--on-surface-variant)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--on-surface-variant)' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Bar 
                        dataKey="hours" 
                        radius={[4, 4, 0, 0]} 
                        onClick={(data) => {
                          if (data.payload?.teacherId) router.push(`/timetable-views?teacherId=${data.payload.teacherId}`);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                         {(metrics?.workload || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.hours > 18 ? '#ef4444' : entry.hours < 8 ? '#f59e0b' : '#6366f1'} />
                         ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             )}
          </div>
        </div>

        <div className="flex-1 bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 flex flex-col relative">
          <h3 className="text-sm font-bold text-on-surface mb-6">Room Utilization Matrix</h3>
          <div className="w-full relative flex-1 flex flex-col">
             {loading ? <div className="w-full h-full animate-pulse bg-surface-container-low rounded-lg" /> : (
                <div className="grid grid-cols-7 gap-1 h-full">
                  <div className="text-[9px] font-bold text-on-surface-variant text-center p-2"></div>
                  {[1,2,3,4,5,6].map(s => <div key={s} className="text-[10px] font-bold text-on-surface-variant text-center py-2">S {s}</div>)}
                  
                  {["MON", "TUE", "WED", "THU", "FRI", "SAT"].map((dayName, dIndex) => (
                     <div key={dayName} className="contents">
                        <div className="text-[10px] font-bold text-on-surface-variant flex items-center justify-center pr-2">{dayName}</div>
                        {[1,2,3,4,5,6].map(s => {
                           const cell = metrics?.heatmap?.find((h: any) => h.day === dIndex + 1 && h.slot === s);
                           const pct = cell?.percentage || 0;
                           let bgColor = "bg-surface-container-high hover:bg-surface-container-highest";
                           let textCol = "text-on-surface";
                           if (pct > 90) { bgColor = "bg-error/20 hover:bg-error/30"; textCol = "text-error font-bold"; }
                           else if (pct > 50) { bgColor = "bg-warning/20 hover:bg-warning/30"; textCol = "text-warning font-bold"; }
                           else if (pct > 0) { bgColor = "bg-indigo-100 hover:bg-indigo-200"; textCol = "text-indigo-700 font-bold"; }

                           return (
                              <div 
                                key={`${dIndex}-${s}`} 
                                className={`h-8 rounded-md flex items-center justify-center text-[10px] cursor-pointer transition-colors ${bgColor} ${textCol}`}
                                onClick={() => setSelectedHeatmapCell(cell)}
                              >
                                 {pct}%
                              </div>
                           )
                        })}
                     </div>
                  ))}
                </div>
             )}
          </div>
          
          {selectedHeatmapCell && (
            <div className="absolute inset-0 bg-surface-container-lowest/95 backdrop-blur-sm z-10 rounded-xl p-8 flex flex-col border border-outline-variant/20 shadow-lg">
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h4 className="text-sm font-bold text-on-surface">Available Rooms</h4>
                   <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Day {selectedHeatmapCell.day} | Slot {selectedHeatmapCell.slot}</p>
                 </div>
                 <button onClick={() => setSelectedHeatmapCell(null)} className="h-6 w-6 rounded-full bg-surface-container-highest flex items-center justify-center hover:bg-error/10 hover:text-error transition-colors">
                   <span className="material-symbols-outlined text-[14px]">close</span>
                 </button>
               </div>
               <div className="flex-1 overflow-y-auto">
                 {selectedHeatmapCell.freeRooms?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                       {selectedHeatmapCell.freeRooms.map((roomName: string) => (
                          <span key={roomName} className="px-3 py-1 bg-green-500/10 text-green-700 rounded-lg text-xs font-bold border border-green-500/20">
                             {roomName}
                          </span>
                       ))}
                    </div>
                 ) : (
                    <p className="text-xs text-on-surface-variant italic">No free rooms available for this slot.</p>
                 )}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Status footer */}
      <footer className="mt-8 h-10 bg-surface-container-low px-8 flex items-center justify-between border-t border-outline-variant/5 -mx-8 -mb-8 rounded-b-xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">System Offline? Oh no wait, it's Live!</span>
          </div>
        </div>
      </footer>
    </>
  );
}
