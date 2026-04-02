import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | DEPT // TIMETABLE",
  description: "Portal access for the Department Timetable Management System.",
};

export default function LoginPage() {
  return (
    <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden min-h-screen bg-background">
      {/* Dot grid background */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, #111c2d 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Login card */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-0 architectural-shadow rounded-xl overflow-hidden z-10">
        {/* Left panel — brand */}
        <div className="lg:col-span-7 bg-primary-container p-12 lg:p-20 flex flex-col justify-between text-white relative min-h-[500px]">
          {/* Background image overlay */}
          <div className="absolute inset-0 z-0 opacity-20">
            <div
              className="w-full h-full"
              style={{
                background: "linear-gradient(135deg, #111c2d 0%, #1e293b 50%, #0f172a 100%)",
              }}
            />
          </div>

          <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-[0.1em] uppercase text-white">
              DEPT // TIMETABLE
            </h1>
            <p className="mt-4 text-on-primary-container font-medium tracking-tight text-lg">
              Department Scheduling System
            </p>
          </div>

          <div className="relative z-10 mt-20">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-secondary-fixed-dim">architecture</span>
                <div>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                    Architectural Ledger
                  </h3>
                  <p className="text-on-primary-container text-sm leading-relaxed max-w-xs">
                    Precision-engineered scheduling for elite academic environments.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-secondary-fixed-dim">grid_view</span>
                <div>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                    Tonal Depth
                  </h3>
                  <p className="text-on-primary-container text-sm leading-relaxed max-w-xs">
                    Visual clarity through sophisticated surface layering and hierarchy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="lg:col-span-5 bg-surface-container-lowest p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-2xl font-bold tracking-tighter text-on-surface mb-2">Portal Access</h2>
            <p className="text-on-surface-variant text-sm font-medium">
              Enter your credentials to manage department schedules.
            </p>
          </div>

          <form className="space-y-8" onSubmit={undefined}>
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
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label
                  className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant block"
                  htmlFor="password"
                >
                  Access Token
                </label>
                <a className="text-[10px] font-bold text-secondary uppercase tracking-tighter hover:underline" href="#">
                  Forgot?
                </a>
              </div>
              <input
                className="w-full bg-surface-container-low border-none border-b-2 border-outline-variant/20 focus:ring-0 focus:border-secondary transition-colors py-3 text-on-surface placeholder:text-outline/50 outline-none"
                id="password"
                name="password"
                placeholder="••••••••••••"
                type="password"
              />
            </div>

            <div className="flex items-center gap-3 py-2">
              <input
                className="w-4 h-4 rounded-sm border-outline-variant text-secondary focus:ring-secondary"
                id="remember"
                type="checkbox"
              />
              <label className="text-xs font-medium text-on-surface-variant" htmlFor="remember">
                Maintain active session
              </label>
            </div>

            <Link href="/dashboard">
              <button
                className="w-full litho-gradient text-white font-bold py-4 rounded-lg architectural-shadow hover:translate-y-[-1px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                type="button"
              >
                <span>ESTABLISH SESSION</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </Link>
          </form>

          <div className="mt-12 flex items-center gap-4">
            <div className="h-[1px] flex-grow bg-surface-variant" />
            <span className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">
              Authorized Personnel Only
            </span>
            <div className="h-[1px] flex-grow bg-surface-variant" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-8 text-center z-10">
        <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.3em]">
          © 2024 DEPT // TIMETABLE • INSTITUTIONAL ACADEMIC RESOURCE • V2.4.0
        </p>
      </footer>
    </main>
  );
}
