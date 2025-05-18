"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Stock {
	id: number;
	stock_symbol: string;
}

interface User {
	id: string;
	profilePicture?: string;
}

const Dashboard = () => {
  const [watchlist, setWatchlist] = useState<Stock[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [currentSymbol, setCurrentSymbol] = useState<string | null>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
      const fetchUserAndWatchlist = async () => {
        // Fetch authenticated user
        const { data: session, error: sessionError } =
          await supabase.auth.getSession();
        if (sessionError || !session?.session?.user) {
          console.error("User not authenticated");
          return;
        }
  
        const userId = session.session.user.id;
        setUser({
          id: userId,
          profilePicture: "/default-avatar.png", // Replace with user profile fetch if needed
        });
  
        // Fetch user's watchlist from Supabase
        const { data: watchlistData, error } = await supabase
          .from("watchlist")
          .select("id, stock_symbol")
          .eq("user_id", userId);
  
        if (error) console.error("Error fetching watchlist:", error);
        else setWatchlist(watchlistData);
      };
  
      fetchUserAndWatchlist();
    }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [watchlist]);

  useEffect(() => {
    if (!currentSymbol) return;

    // Remove old widget before creating a new one
    if (widgetRef.current) {
      widgetRef.current.remove();
    }

    widgetRef.current = new (window as any).TradingView.widget({
      container_id: "chartContainer",
      width: "100%",
      height: "400",
      symbol: currentSymbol,
      interval: "D",
      timezone: "exchange",
      theme: "Dark",
      style: "1",
      locale: "en",
      toolbar_bg: "#2E2E2E",
      enable_publishing: false,
      allow_symbol_change: true,
      hideideas: true,
      studies: ["SuperTrend"],
      autosize: true,
    });

  }, [currentSymbol]);

  return (
    <div className="flex">


      {/* Main Content */}
      <div className="flex-1 p-5 bg-gray-900 min-h-screen mt-[-35px]">
        <p className="text-gray-300 mb-5">Select a stock from your watchlist to view its chart.</p>

        <div className="mb-5">
          <label htmlFor="stockSymbol" className="block text-gray-300 mb-2">Select Stock:</label>
          <select
            id="stockSymbol"
            className="p-2 bg-gray-700 text-white border border-gray-600 rounded"
            onChange={(e) => setCurrentSymbol(e.target.value)}
            value={currentSymbol || ""}
          >
            <option value="">--Select Stock--</option>
            {watchlist.map((stock) => (
              <option key={stock.id} value={stock.stock_symbol}>{stock.stock_symbol}</option>
            ))}
          </select>
        </div>

        <div className="bg-black p-5 rounded">
          <div id="chartContainer" className="h-96"></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;