import type { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Login | DEPT // TIMETABLE",
  description: "Portal access for the Department Timetable Management System.",
};

export default function LoginPage() {
  const currentYear = new Date().getFullYear();

  return (
    <main className="grow flex items-center justify-center p-6 pb-16 relative overflow-hidden min-h-screen bg-background">
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
        <div className="lg:col-span-7 bg-primary-container p-12 lg:p-20 flex flex-col justify-between text-white relative min-h-125">
          {/* Background image overlay */}
          <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
          </div>

          <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-widest uppercase text-white">
              DEPT // TIMETABLE
            </h1>
            <p className="mt-4 text-on-primary-container font-medium tracking-tight text-lg">
              Department Scheduling System
            </p>
          </div>

          <div className="relative z-10">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-secondary-fixed-dim">schedule</span>
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
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tighter text-on-surface mb-2">Portal Access</h2>
            <p className="text-on-surface-variant text-sm font-medium">
              Enter your credentials to manage department schedules.
            </p>
          </div>

          <LoginForm />

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px grow bg-surface-variant" />
            <span className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">
              Authorized Personnel Only
            </span>
            <div className="h-px grow bg-surface-variant" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-8 text-center z-10">
        <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.3em]">
          © {currentYear} DEPT // TIMETABLE • INSTITUTIONAL ACADEMIC RESOURCE • V2.4.0
        </p>
      </footer>
    </main>
  );
}
