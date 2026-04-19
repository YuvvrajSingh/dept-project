"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Role = "ADMIN" | "TEACHER" | "STUDENT" | "TIMETABLE_INCHARGE";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<Role>("STUDENT");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const identifier = (form.elements.namedItem("identifier") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const isStudent = activeRole === "STUDENT";
    const endpoint = isStudent ? "/api/auth/student-login" : "/api/auth/login";
    
    // The main admin/teacher login expects { email, password }
    // The student login expects { rollNumber, password }
    const body = isStudent 
      ? { rollNumber: identifier, password }
      : { email: identifier, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        setError(typeof data.message === "string" ? data.message : "Sign-in failed");
        return;
      }
      
      // Redirect based on role
      if (isStudent) {
        router.replace("/student-portal");
      } else {
        const role = data.user?.role;
        router.replace(role === "TEACHER" ? "/teacher-portal" : "/dashboard");
      }
      router.refresh();

    } catch {
      setError("Could not reach the server. Is the API running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Role Toggles ── */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { id: "ADMIN", label: "Admin" },
          { id: "TEACHER", label: "Teacher" },
          { id: "STUDENT", label: "Student" },
          { id: "TIMETABLE_INCHARGE", label: "TI 🔒", disabled: true },
        ].map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => !r.disabled && setActiveRole(r.id as Role)}
            disabled={r.disabled}
            className={`
              px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors shrink-0
              ${activeRole === r.id
                ? "bg-on-surface text-white architectural-shadow"
                : r.disabled
                  ? "bg-surface-container-low text-on-surface-variant/40 cursor-not-allowed border border-outline-variant/30"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-variant border border-transparent"}
            `}
            title={r.disabled ? "Coming soon" : undefined}
          >
            {r.label}
          </button>
        ))}
      </div>

      <form className="space-y-8" onSubmit={onSubmit}>
        {error ? (
          <p className="text-sm text-red-600 font-medium" role="alert">
            {error}
          </p>
        ) : null}

        <div className="space-y-2">
          <label
            className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant block"
            htmlFor="identifier"
          >
            {activeRole === "STUDENT" ? "Roll Number" : "Academic Email"}
          </label>
          <input
            className="w-full bg-surface-container-low border-b-2 border-outline-variant/20 focus:ring-0 focus:border-secondary transition-colors py-3 text-on-surface placeholder:text-outline/50 outline-none"
            id="identifier"
            name="identifier"
            placeholder={activeRole === "STUDENT" ? "e.g. 21UCSE1001" : "hod.cse@university.edu"}
            type={activeRole === "STUDENT" ? "text" : "email"}
            autoComplete={activeRole === "STUDENT" ? "username" : "email"}
            required
            disabled={loading}
            suppressHydrationWarning
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label
              className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant block"
              htmlFor="password"
            >
              Password
            </label>
            <span className="text-[10px] font-bold text-outline uppercase tracking-tighter">
              Forgot password — contact admin
            </span>
          </div>
          <input
            className="w-full bg-surface-container-low border-b-2 border-outline-variant/20 focus:ring-0 focus:border-secondary transition-colors py-3 text-on-surface placeholder:text-outline/50 outline-none"
            id="password"
            name="password"
            placeholder="••••••••••••"
            type="password"
            autoComplete="current-password"
            required
            disabled={loading}
            suppressHydrationWarning
          />
        </div>

        <button
          className="w-full litho-gradient text-white font-bold py-4 rounded-lg architectural-shadow hover:-translate-y-px active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
          type="submit"
          disabled={loading}
        >
          <span>{loading ? "SIGNING IN..." : "ACCESS PORTAL"}</span>
          <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </form>
    </div>
  );
}
