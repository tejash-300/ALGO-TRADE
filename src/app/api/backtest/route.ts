import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { strategy_id, stock_symbol, start_date, end_date } = await req.json();

    const res = await fetch("https://algotrading-saas.onrender.com/backtest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategy_id, stock_symbol, start_date, end_date }),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ success: false, error: `Failed to backtest::${error}` }, { status: 500 });
  }
}
