import { NextResponse } from "next/server";
import { createHash } from "crypto";

const PASSWORD_HASH = createHash("sha256").update("Ashridge2026!").digest("hex");

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = formData.get("password") as string;

  const submittedHash = createHash("sha256").update(password || "").digest("hex");

  if (submittedHash === PASSWORD_HASH) {
    const response = NextResponse.redirect(new URL("/", request.url), 302);
    response.cookies.set("dash_auth", "authenticated", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    return response;
  }

  return NextResponse.redirect(new URL("/login?error=1", request.url), 302);
}
