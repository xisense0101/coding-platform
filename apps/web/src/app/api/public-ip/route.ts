import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch("https://api.ipify.org?format=json", { cache: 'no-store' });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching public IP:", error);
    return NextResponse.json(
      { error: "Failed to fetch public IP" },
      { status: 500 }
    );
  }
}
