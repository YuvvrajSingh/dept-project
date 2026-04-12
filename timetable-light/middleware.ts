import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    console.warn(
      "JWT_SECRET is not set; redirecting to /login. Set JWT_SECRET to match the API.",
    );
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

  try {
    const key = new TextEncoder().encode(secret);
    await jwtVerify(token, key, { algorithms: ["HS256"] });
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
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
  ],
};
