"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, Clock } from "lucide-react";
import { useEffect, useState } from "react";

const routeTitles = {
  "/": "DASHBOARD",
  "/master": "MASTER DATA",
  "/assignments": "ASSIGNMENTS",
  "/assignment-overview": "ASSIGNMENT OVERVIEW",
  "/builder": "TIMETABLE BUILDER",
  "/views": "TIMETABLE VIEWS",
};

const routeModules = {
  "/": "01",
  "/master": "02",
  "/assignments": "03",
  "/assignment-overview": "04",
  "/builder": "05",
  "/views": "06",
};

export default function HeaderBar() {
  const pathname = usePathname();
  const title = routeTitles[pathname] || "SYSTEM";
  const moduleId = routeModules[pathname] || "00";
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex items-center gap-4 px-6 h-12 border-b-2 border-foreground/10 bg-background/80 backdrop-blur-sm relative">
      {/* Left: Module + Title */}
      <div className="flex items-center gap-3">
        <motion.div
          key={pathname}
          className="bg-foreground text-background px-2 py-0.5 text-[9px] font-mono tracking-[0.2em] font-bold"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          M-{moduleId}
        </motion.div>
        <div className="w-px h-4 bg-foreground/15" />
        <motion.h2 
          key={`title-${pathname}`}
          className="font-heading text-[13px] font-bold tracking-[0.15em] uppercase"
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          {title}
        </motion.h2>
      </div>

      {/* Center: breadcrumb trail */}
      <div className="hidden md:flex items-center gap-2 text-[9px] font-mono text-muted-foreground/50 tracking-[0.2em]">
        <span>SYS</span>
        <span className="text-accent">/</span>
        <span>AUTH</span>
        <span className="text-accent">/</span>
        <span className="text-foreground/60">MODULE_{moduleId}</span>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-4">
        {/* Status */}
        <div className="hidden sm:flex items-center gap-2">
          <Activity size={10} className="text-success" />
          <span className="text-[8px] font-mono tracking-[0.2em] text-muted-foreground/50 uppercase">
            CONNECTED
          </span>
        </div>
        
        <div className="w-px h-4 bg-foreground/10" />

        {/* Clock */}
        <div className="flex items-center gap-1.5">
          <Clock size={10} className="text-muted-foreground/40" />
          <span className="text-[10px] font-mono tracking-[0.15em] text-muted-foreground/60 tabular-nums">
            {time}
          </span>
        </div>

        <div className="w-px h-4 bg-foreground/10" />

        {/* Role badges */}
        <div className="flex items-center gap-1.5">
          <span className="border border-foreground/20 text-[8px] font-mono tracking-[0.15em] font-bold uppercase px-2 py-0.5 text-muted-foreground">
            DEPT
          </span>
          <span className="bg-accent text-accent-foreground text-[8px] font-mono tracking-[0.15em] font-bold uppercase px-2 py-0.5">
            ADMIN
          </span>
        </div>
      </div>
    </header>
  );
}
