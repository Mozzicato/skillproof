import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  // The page rendering this very request also needs the new id, so it is added to the forwarded cookies.
  const id = crypto.randomUUID();
  const headers = new Headers(request.headers);
  const existing = headers.get("cookie");
  headers.set("cookie", `${existing ? `${existing}; ` : ""}${SESSION_COOKIE}=${id}`);

  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && request.nextUrl.protocol === "https:",
    maxAge: THIRTY_DAYS,
    path: "/",
  });
  return response;
}

export const config = { matcher: ["/((?!_next/|favicon.ico).*)"] };
