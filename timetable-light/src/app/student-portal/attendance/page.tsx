"use client";

import { useEffect, useState } from "react";

export default function StudentAttendancePage() {
  const [profile, setProfile] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pipeline to fetch profile then fetch attendance
    fetch("/api/auth/student-me")
      .then((res) => {
        if (!res.ok) throw new Error("Failed profile fetch");
        return res.json();
      })
      .then((studentData) => {
        const student = studentData.student ?? studentData;
        setProfile(student);
        return fetch(`/api/attendance/student/${student.rollNumber}`);
      })
      .then((res) => {
        if (!res.ok) throw new Error("Failed attendance fetch");
        return res.json();
      })
      .then((data) => setAttendanceData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-surface-variant/50 w-1/4 rounded"></div>
        <div className="h-32 bg-surface-variant/50 w-full rounded-2xl"></div>
      </div>
    );
  }

  if (!attendanceData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-4">cloud_off</span>
        <h2 className="text-xl font-black text-on-surface uppercase pb-2">Data Source Offline</h2>
        <p className="text-sm text-on-surface-variant">Could not load attendance records. Please try again later.</p>
      </div>
    );
  }

  const { stats, attendance } = attendanceData;
  const overallTotal = stats.reduce((s: number, a: any) => s + a.total, 0);
  const overallPresent = stats.reduce((s: number, a: any) => s + a.present, 0);
  const overallPct = overallTotal ? Math.round((overallPresent / overallTotal) * 100) : 0;
  const isDefaulter = overallPct < 75 && overallTotal > 0;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">Attendance Ledger</h1>
        <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mt-2 border-b border-outline-variant/20 pb-4 inline-block">
          {profile?.batch} • Validated Server Data
        </p>
      </header>

      {/* Aggregate Overview Card */}
      <div className={`p-8 rounded-[2rem] shadow-sm relative overflow-hidden transition-colors ${
        isDefaulter 
          ? "bg-error-container text-on-error-container border border-error/30" 
          : "bg-surface-container-low border border-outline-variant/30 text-on-surface"
      }`}>
        <div className="flex items-center gap-6 relative z-10">
           <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black border-4 shadow-sm ${
             isDefaulter ? "bg-error text-on-error border-error-container" : "bg-primary text-on-primary border-primary-container"
           }`}>
             {overallPct}%
           </div>
           <div>
             <h3 className="text-xl font-black uppercase tracking-tight">Aggregate Compliance</h3>
             <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">
               {overallPresent} / {overallTotal} Presence Confirmed
             </p>
           </div>
        </div>
        {isDefaulter && (
          <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
            <span className="material-symbols-outlined text-[100px]">warning</span>
          </div>
        )}
      </div>

      {/* Breakdowns */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-on-surface-variant px-2">Subject Breakdown</h3>
        {stats.length === 0 ? (
          <div className="p-10 border border-dashed border-outline-variant/40 rounded-2xl text-center">
            <p className="text-on-surface-variant text-sm font-medium">No recorded subject modules available in ledger.</p>
          </div>
        ) : stats.map((stat: any, i: number) => {
          const pct = Math.round((stat.present / stat.total) * 100);
          const needsAttention = pct < 75;
          return (
            <div key={i} className={`p-6 rounded-2xl border transition-colors ${
              needsAttention ? "bg-error/5 border-error/20" : "bg-surface-container-lowest border-outline-variant/20 hover:border-outline-variant/50"
            }`}>
              <div className="flex justify-between items-center">
                 <div>
                    <h4 className="font-bold text-on-surface">{stat.subject?.name || "Unknown Module"}</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mt-1">
                      {stat.subject?.code} • {stat.subject?.type}
                    </p>
                 </div>
                 <div className="text-right">
                    <div className={`text-2xl font-black leading-none ${needsAttention ? "text-error" : "text-primary"}`}>{pct}%</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mt-1">
                      {stat.present} / {stat.total}
                    </div>
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
