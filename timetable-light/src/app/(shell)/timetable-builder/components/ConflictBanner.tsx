import React from "react";
import Link from "next/link";

interface ConflictBannerProps {
  message: string;
  type: "conflict" | "prerequisite";
}

export function ConflictBanner({ message, type }: ConflictBannerProps) {
  if (!message) return null;

  return (
    <div className={`mb-6 p-4 border-2 ${
      type === "conflict" 
        ? "bg-destructive/10 border-destructive" 
        : "bg-warning/10 border-warning"
    }`}>
      <div className={`text-xs font-mono font-bold uppercase ${
        type === "conflict" ? "text-destructive" : "text-warning"
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-lg">
            {type === "conflict" ? "error" : "warning"}
          </span>
          <span>{type === "conflict" ? "Scheduling Conflict" : "Prerequisite Missing"}</span>
        </div>
        <p className="tracking-wider mt-1">{message}</p>
        
        {type === "prerequisite" && (
          <Link 
            href="/assignments" 
            className="inline-flex items-center gap-2 border-2 border-current px-3 py-2 mt-4 text-[10px] font-mono tracking-wider font-bold hover:bg-warning hover:text-warning-foreground transition-colors"
          >
            Go to Assignments Mapping
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        )}
      </div>
    </div>
  );
}
