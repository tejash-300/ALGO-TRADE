import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { bot_id } = await req.json();

    // Check if bot exists in the database
    const { data: bot, error } = await supabase
      .from("bots")
      .select("*")
      .eq("id", bot_id)
      .single();

    if (error || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    // Stop the bot in the trading automation system
    await fetch("https://algotrading-saas.onrender.com/stop-bot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bot_id }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "An unknown error occurred" },
      { status: 500 }
    );
  }
}
