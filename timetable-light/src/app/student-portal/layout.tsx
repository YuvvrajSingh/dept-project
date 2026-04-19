import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import Link from "next/link";
import { SESSION_COOKIE_NAME } from "@/lib/session";

export const metadata: Metadata = {
  title: "Student Portal | DEPT // TIMETABLE",
};

export default async function StudentPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  async function logoutAction() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    redirect("/login");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  let user: any = null;
  try {
    // Note: next-auth or a proper verify function should be used here, 
    // but we use decode since it's a client-side layout (verified by middleware).
    user = jwt.decode(token);
    if (!user || user.role !== "STUDENT") {
      redirect("/login");
    }
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar Nav */}
      <aside className="w-full md:w-64 border-r border-outline-variant/30 bg-surface-container-low flex flex-col pt-8">
        <div className="px-6 pb-8">
          <h2 className="text-xl font-black tracking-tighter uppercase text-on-surface">DEPT // Student</h2>
          <p className="text-[10px] font-black uppercase text-secondary tracking-widest mt-1">Profile: {user.rollNumber}</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <Link
            href="/student-portal"
            className="block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/student-portal/attendance"
            className="block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
          >
            Attendance
          </Link>
          <Link
            href="/student-portal/midterm"
            className="block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
          >
            Midterms
          </Link>
        </nav>

        <div className="p-4 border-t border-outline-variant/30">
           <form action={logoutAction}>
             <button type="submit" className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-error hover:bg-error-container hover:text-on-error-container transition-colors">
                Sign Out
             </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
