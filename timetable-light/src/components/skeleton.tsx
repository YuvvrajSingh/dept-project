"use client";

type SkeletonProps = {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
};

export function Skeleton({ className = "", variant = "rectangular" }: SkeletonProps) {
  const baseStyles = "animate-pulse bg-surface-variant/50";
  
  const variantStyles = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <Skeleton variant="circular" className="w-10 h-10" />
        <Skeleton className="w-8 h-3" />
      </div>
      <Skeleton className="w-16 h-8 mb-2" />
      <Skeleton className="w-24 h-4" />
    </div>
  );
}

export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-outline-variant/5">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-5">
          <Skeleton className="w-full h-5" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-container-highest/50">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-4">
                <Skeleton className="w-20 h-4" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonProgressBar({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex justify-between mb-2">
        <Skeleton className="w-32 h-4" />
        <Skeleton className="w-8 h-4" />
      </div>
      <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
        <Skeleton className="h-full w-1/2 rounded-full" />
      </div>
      <Skeleton className="w-40 h-3 mt-2" />
    </div>
  );
}

export function SkeletonHeatmap({ className = "" }: { className?: string }) {
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const slots = [1, 2, 3, 4, 5, 6];
  
  return (
    <div className={`grid grid-cols-7 gap-1 h-full ${className}`}>
      <div className="text-[9px] font-bold text-on-surface-variant text-center p-2"></div>
      {slots.map(s => (
        <div key={s} className="text-[10px] font-bold text-on-surface-variant text-center py-2">
          <Skeleton className="w-6 h-4 mx-auto" />
        </div>
      ))}
      {days.map((dayName, dIndex) => (
        <div key={dayName} className="contents">
          <div className="text-[10px] font-bold text-on-surface-variant flex items-center justify-center pr-2">
            <Skeleton className="w-8 h-4" />
          </div>
          {slots.map(s => (
            <Skeleton key={`${dIndex}-${s}`} className="h-8 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className = "" }: { className?: string }) {
  return (
    <div className={`h-64 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="w-40 h-6" />
        <Skeleton variant="circular" className="w-10 h-10" />
      </div>
      <Skeleton className="w-full h-48" />
    </div>
  );
}

export function SkeletonStatCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <Skeleton variant="circular" className="w-10 h-10" />
        <Skeleton className="w-8 h-3" />
      </div>
      <Skeleton className="w-12 h-8 mb-2" />
      <Skeleton className="w-20 h-4" />
    </div>
  );
}

export function SkeletonActionCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-surface-container-highest p-8 rounded-xl ${className}`}>
      <Skeleton variant="circular" className="w-10 h-10 mb-6" />
      <Skeleton className="w-32 h-6 mb-2" />
      <Skeleton className="w-48 h-4" />
    </div>
  );
}

export function SkeletonAuditItem({ className = "" }: { className?: string }) {
  return (
    <div className={`flex gap-3 p-2 ${className}`}>
      <Skeleton variant="circular" className="w-2 h-2 mt-1" />
      <div className="flex-1">
        <Skeleton className="w-24 h-4 mb-1" />
        <Skeleton className="w-40 h-3 mb-1" />
        <Skeleton className="w-16 h-2" />
      </div>
    </div>
  );
}

export function SkeletonForm({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-8 ${className}`}>
      <div className="space-y-2">
        <Skeleton className="w-24 h-3" />
        <Skeleton className="w-full h-10" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-24 h-3" />
        <Skeleton className="w-full h-10" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-24 h-3" />
        <Skeleton className="w-full h-10" />
      </div>
      <Skeleton className="w-full h-12" />
    </div>
  );
}

export function SkeletonList({ count = 5, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="w-full h-12" />
      ))}
    </div>
  );
}

export function SkeletonPage({ variant = "dashboard" }: { variant?: "dashboard" | "table" | "form" | "timetable" }) {
  if (variant === "table") {
    return (
      <div className="max-w-7xl mx-auto w-full space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <Skeleton className="w-48 h-8" />
            <Skeleton className="w-64 h-4" />
          </div>
          <Skeleton className="w-48 h-10" />
        </div>
        <div className="bg-surface-container-low rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
            <Skeleton className="w-32 h-5" />
            <Skeleton className="w-24 h-10" />
          </div>
          <SkeletonTable rows={8} columns={5} />
        </div>
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className="max-w-7xl mx-auto w-full space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <Skeleton className="w-48 h-8" />
            <Skeleton className="w-64 h-4" />
          </div>
          <Skeleton className="w-48 h-10" />
        </div>
        <div className="bg-surface-container-low rounded-xl p-10">
          <SkeletonForm />
        </div>
      </div>
    );
  }

  if (variant === "timetable") {
    return (
      <div className="max-w-7xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-32 h-10" />
        </div>
        <div className="bg-surface-container-low rounded-xl p-8">
          <SkeletonTable rows={6} columns={7} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <Skeleton className="w-32 h-4 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      </section>
      <section>
        <Skeleton className="w-32 h-4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonActionCard key={i} />
          ))}
        </div>
      </section>
      <div className="flex flex-col xl:flex-row gap-8">
        <div className="flex-1 bg-surface-container-low rounded-xl p-8">
          <SkeletonChart />
        </div>
        <div className="xl:w-96 bg-surface-container-lowest rounded-xl p-6 h-full">
          <Skeleton className="w-40 h-5 mb-4" />
          <SkeletonList count={4} />
        </div>
      </div>
    </div>
  );
}