import { NextResponse, NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Priority 1: X-Forwarded-For header (standard for proxies/Vercel)
    let ip: string | null | undefined = request.headers.get("x-forwarded-for");
    
    if (ip) {
      // The first IP is the client IP, others are proxies
      ip = ip.split(',')[0].trim();
    }

    // Priority 2: X-Real-IP header
    if (!ip) {
      ip = request.headers.get("x-real-ip");
    }
    
    // Priority 3: Next.js request.ip helper
    if (!ip) {
      ip = request.ip;
    }

    // If we found a valid public IP, return it
    if (ip && ip !== '::1' && ip !== '127.0.0.1') {
      return NextResponse.json({ ip });
    }

    // Fallback: External service
    // We only use this if we are in development OR if we detected localhost.
    // In a production deployment (like Vercel), fetching from ipify would return 
    // the server's IP (e.g. AWS IP), which is incorrect for the client.
    if (process.env.NODE_ENV === 'development' || ip === '::1' || ip === '127.0.0.1') {
      const response = await fetch("https://api.ipify.org?format=json", { cache: 'no-store' });
      const data = await response.json();
      return NextResponse.json(data);
    }

    // If we can't determine IP in production, return error rather than wrong IP
    return NextResponse.json(
      { error: "Could not determine client IP" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error determining public IP:", error);
    return NextResponse.json(
      { error: "Failed to determine public IP" },
      { status: 500 }
    );
  }
}
