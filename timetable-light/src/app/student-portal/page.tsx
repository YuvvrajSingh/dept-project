"use client";

import { useEffect, useState } from "react";

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/student-me")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => setProfile(data.student ?? data))
      .catch(() => {})
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

  if (!profile) return <div>Failed to load profile.</div>;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">Welcome, {profile.name}</h1>
        <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mt-2 border-b border-outline-variant/20 pb-4 inline-block">
          {profile.batch || "-"} • {profile.classSection?.branch || "Unassigned"}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] p-8 shadow-sm">
          <div className="mb-6">
             <div className="w-16 h-16 bg-primary-container text-on-primary-container rounded-2xl flex items-center justify-center font-black text-2xl uppercase shadow-inner">
               {profile.name?.charAt(0)}
             </div>
          </div>
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Roll Number</span>
              <p className="text-lg font-bold text-on-surface">{profile.rollNumber}</p>
            </div>
            <div>
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Email</span>
              <p className="text-lg font-bold text-on-surface">{profile.email || "Not Provided"}</p>
            </div>
          </div>
        </div>

        {/* Action / Notification Card */}
        <div className="bg-primary-container text-on-primary-container border border-primary/20 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10">
            <span className="material-symbols-outlined text-[150px]">campaign</span>
          </div>
          <div className="relative z-10">
            <h2 className="text-xl font-black uppercase tracking-tight mb-2">Portal Active</h2>
            <p className="text-sm font-medium max-w-xs">
               Your academic records, attendance history, and exam results are synchronized with the central department database.
            </p>

            <div className="mt-8">
              <a href="/student-portal/attendance" className="inline-flex items-center gap-2 bg-on-primary-container text-primary-container font-black px-6 py-3 rounded-xl uppercase text-xs tracking-widest hover:scale-95 transition-transform">
                View Attendance
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
