"use client";

export default function ConflictBanner({ message, type, onGoToAssignments }) {
  if (!message) return null;

  const isConflict = type === "conflict";

  return (
    <div
      className={`mb-4 p-4 border-2 ${
        isConflict
          ? "border-destructive bg-destructive/10"
          : "border-warning bg-warning/10"
      }`}
    >
      <div className={`text-xs font-mono font-bold uppercase tracking-wider ${
        isConflict ? "text-destructive" : "text-warning-foreground"
      }`}>
        {isConflict ? "◼ CONFLICT DETECTED" : "◼ PREREQUISITE MISSING"}
      </div>
      <div className={`text-xs font-mono mt-1 ${
        isConflict ? "text-destructive" : "text-foreground"
      }`}>
        {message}
      </div>
      {type === "prerequisite" && onGoToAssignments && (
        <button
          type="button"
          onClick={onGoToAssignments}
          className="mt-2 border-2 border-foreground px-3 py-1.5 text-[10px] font-mono tracking-wider font-bold hover:bg-accent transition-colors uppercase"
        >
          GO TO ASSIGNMENTS
        </button>
      )}
    </div>
  );
}
