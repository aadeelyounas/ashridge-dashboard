/**
 * Proxy auth — run as an API route instead of middleware (better for serverless/Vercel)
 * Protects /dashboard routes with Basic Auth
 */

const PROXY_USER = process.env.PROXY_USER || "admin";
const PROXY_PASS = process.env.PROXY_PASS || "changeme";

export function authHeader(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const decoded = Buffer.from(raw.replace("Basic ", ""), "base64").toString();
    const [user, pass] = decoded.split(":");
    return user === PROXY_USER && pass === PROXY_PASS;
  } catch {
    return false;
  }
}

export function proxyAuth(req: Request): Response | null {
  const auth = req.headers.get("authorization");
  if (!authHeader(auth)) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="restricted"' },
    });
  }
  return null;
}
