import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { bot_id, user_id } = await req.json();

    // Fetch bot details
    const { data: bot, error } = await supabase
      .from("bots")
      .select("*")
      .eq("id", bot_id)
      .single();

    if (error || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }
    console.log({ bot_id: bot.id, stock_symbol: bot.stock_symbol, user_id: user_id });
    // Send bot details to the trading automation system
    await fetch("https://algotrading-saas.onrender.com/start-bot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bot_id: bot.id, stock_symbol: bot.stock_symbol, user_id: user_id }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: Request){
  return NextResponse.json({ message: "Hello World" });
}