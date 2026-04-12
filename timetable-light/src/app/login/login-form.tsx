"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof body.message === "string" ? body.message : "Sign-in failed");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server. Is the API running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      {error ? (
        <p className="text-sm text-red-600 font-medium" role="alert">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <label
          className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant block"
          htmlFor="email"
        >
          Academic Email
        </label>
        <input
          className="w-full bg-surface-container-low border-none border-b-2 border-outline-variant/20 focus:ring-0 focus:border-secondary transition-colors py-3 text-on-surface placeholder:text-outline/50 outline-none"
          id="email"
          name="email"
          placeholder="hod.cse@university.edu"
          type="email"
          autoComplete="email"
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
          className="w-full bg-surface-container-low border-none border-b-2 border-outline-variant/20 focus:ring-0 focus:border-secondary transition-colors py-3 text-on-surface placeholder:text-outline/50 outline-none"
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

      <div className="flex items-center gap-3 py-2">
        <input
          className="w-4 h-4 rounded-sm border-outline-variant text-secondary focus:ring-secondary"
          id="remember"
          type="checkbox"
          disabled
          title="Session length is controlled by the server"
        />
        <label className="text-xs font-medium text-on-surface-variant" htmlFor="remember">
          Maintain active session (server-controlled)
        </label>
      </div>

      <button
        className="w-full litho-gradient text-white font-bold py-4 rounded-lg architectural-shadow hover:translate-y-[-1px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
        type="submit"
        disabled={loading}
      >
        <span>{loading ? "SIGNING IN…" : "ESTABLISH SESSION"}</span>
        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
          arrow_forward
        </span>
      </button>
    </form>
  );
}
