"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getTeachers } from "@/lib/api/teachers";
import { getSubjects } from "@/lib/api/subjects";
import { getClasses } from "@/lib/api/classes";
import { getRooms } from "@/lib/api/rooms";
import { getLabs } from "@/lib/api/labs";
import { useToast } from "@/lib/toast-context";
import PageShell from "@/components/page-shell";
import StatCard from "@/components/stat-card";
import Spinner from "@/components/spinner";
import {
  Users, BookOpen, GraduationCap, DoorOpen, FlaskConical,
  Database, Link2, CalendarCog, Eye, ArrowUpRight,
} from "lucide-react";

const cards = [
  { key: "teachers", label: "TEACHERS", icon: Users },
  { key: "subjects", label: "SUBJECTS", icon: BookOpen },
  { key: "classes", label: "CLASSES", icon: GraduationCap },
  { key: "rooms", label: "ROOMS", icon: DoorOpen },
  { key: "labs", label: "LABS", icon: FlaskConical },
];

const quickActions = [
  { label: "MASTER DATA", path: "/master", icon: Database, desc: "MANAGE ENTITIES" },
  { label: "ASSIGNMENTS", path: "/assignments", icon: Link2, desc: "MAP SUBJECTS" },
  { label: "BUILD TIMETABLE", path: "/builder", icon: CalendarCog, desc: "SCHEDULE ENTRIES" },
  { label: "VIEW MATRICES", path: "/views", icon: Eye, desc: "READ-ONLY OVERVIEW" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    teachers: 0, subjects: 0, classes: 0, rooms: 0, labs: 0,
  });

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [teachers, subjects, classes, rooms, labs] = await Promise.all([
          getTeachers(), getSubjects(), getClasses(), getRooms(), getLabs(),
        ]);
        if (!active) return;
        setCounts({
          teachers: teachers.length,
          subjects: subjects.length,
          classes: classes.length,
          rooms: rooms.length,
          labs: labs.length,
        });
      } catch (err) {
        if (active) showToast(err.message, "error");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [showToast]);

  if (loading) return <Spinner />;

  return (
    <PageShell title="DASHBOARD" subtitle="SYSTEM OVERVIEW — ALL MODULES ACTIVE">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card, index) => (
          <StatCard
            key={card.key}
            label={card.label}
            count={counts[card.key]}
            icon={card.icon}
            index={index}
            onClick={() => router.push("/master")}
          />
        ))}
      </div>

      {/* Quick Actions section */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[9px] font-mono tracking-[0.3em] text-muted-foreground/50 uppercase">
            QUICK ACTIONS
          </span>
          <div className="flex-1 h-px bg-foreground/8" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.path}
                type="button"
                onClick={() => router.push(action.path)}
                className="group relative border border-foreground/10 hover:border-foreground/40 p-4 text-left transition-all duration-300 bg-card/50 hover:bg-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.05, duration: 0.3 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <Icon
                    size={16}
                    strokeWidth={1.5}
                    className="text-muted-foreground group-hover:text-foreground transition-colors"
                  />
                  <ArrowUpRight
                    size={12}
                    className="text-muted-foreground/30 group-hover:text-accent transition-colors group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transform duration-200"
                  />
                </div>
                <div className="text-[11px] font-mono tracking-[0.15em] font-bold uppercase group-hover:text-foreground transition-colors">
                  {action.label}
                </div>
                <div className="text-[8px] font-mono tracking-[0.2em] text-muted-foreground/40 mt-1 uppercase">
                  {action.desc}
                </div>
                {/* Hover underline */}
                <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-[2px] bg-accent transition-all duration-500" />
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* System info footer */}
      <motion.div
        className="mt-8 border-t border-foreground/5 pt-4 flex flex-wrap items-center gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        {[
          { label: "ENGINE", value: "ACTIVE" },
          { label: "CONFLICTS", value: "MONITORED" },
          { label: "SYNC", value: "LIVE" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-1 h-1 bg-success" />
            <span className="text-[8px] font-mono tracking-[0.25em] text-muted-foreground/30 uppercase">
              {item.label}: {item.value}
            </span>
          </div>
        ))}
      </motion.div>
    </PageShell>
  );
}
