import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

const ADMIN_ROUTES = [
  "/dashboard",
  "/master-data",
  "/timetable-builder",
  "/timetable-views",
  "/settings",
  "/assignments",
];

const TEACHER_ROUTES = ["/teacher-portal"];

function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    console.warn("JWT_SECRET is not set; redirecting to /login.");
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    redirect.cookies.set(SESSION_COOKIE_NAME, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return redirect;
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let role: string;
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    role = payload.role as string;
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Teachers must not access admin routes → send them to their portal
  if (role === "TEACHER" && startsWithAny(pathname, ADMIN_ROUTES)) {
    return NextResponse.redirect(new URL("/teacher-portal", request.url));
  }

  // Admins must not access the teacher portal → send them to dashboard
  if (role === "ADMIN" && startsWithAny(pathname, TEACHER_ROUTES)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/master-data",
    "/master-data/:path*",
    "/timetable-builder",
    "/timetable-builder/:path*",
    "/timetable-views",
    "/timetable-views/:path*",
    "/settings",
    "/settings/:path*",
    "/assignments",
    "/assignments/:path*",
    "/teacher-portal",
    "/teacher-portal/:path*",
  ],
};

