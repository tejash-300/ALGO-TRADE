import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const botId = searchParams.get("bot_id");
  if (!botId) {
    return NextResponse.json({ error: "Missing bot_id" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://algotrading-saas.onrender.com/logs`);

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch logs" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
