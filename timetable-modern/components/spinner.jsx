"use client";

export default function Spinner({ size = "md" }) {
  if (size === "sm") {
    return (
      <div
        className="w-4 h-4 border-2 border-foreground border-t-accent"
        style={{ animation: "spin 0.8s linear infinite", borderRadius: "50%" }}
      />
    );
  }

  return (
    <div className="w-full min-h-[200px] flex flex-col items-center justify-center gap-4">
      {/* Spinner container */}
      <div className="relative">
        <div
          className="w-10 h-10 border-2 border-foreground/15 border-t-accent"
          style={{ animation: "spin 0.8s linear infinite", borderRadius: "50%" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-accent" style={{ animation: "pulse-glow 1.5s ease infinite" }} />
        </div>
      </div>
      <div className="space-y-1 text-center">
        <span className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground/50 uppercase block">
          LOADING SYSTEM
        </span>
        <span className="text-[8px] font-mono tracking-[0.2em] text-muted-foreground/30 uppercase block">
          PLEASE STAND BY
          <span style={{ animation: "blink 1s step-end infinite" }}>...</span>
        </span>
      </div>
    </div>
  );
}
