import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

const SESSION_COOKIE = "chitty_session";

export async function POST() {
  clearSession();
  
  const response = NextResponse.json({ success: true });
  // Set cookie with expired date to ensure it's cleared on client side
  response.cookies.set(SESSION_COOKIE, "", {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  
  return response;
}

