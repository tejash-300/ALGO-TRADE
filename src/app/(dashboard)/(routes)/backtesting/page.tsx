"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Strategy = {
    id: number;
    name: string;
};

interface Stock {
	id: number;
	stock_symbol: string;
}

type BacktestResult = {
    Date: string;
    Close: number;
    SMA_Short: number;
    SMA_Long: number;
    Signal: number;
};

export default function BacktestPage() {
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [selectedStrategy, setSelectedStrategy] = useState<number | null>(null);
    const [selectedStock, setSelectedStock] = useState<string | null>(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchStrategies() {
            const { data, error } = await supabase.from("py_strategies").select("id, name");
            if (!error && data) {
                setStrategies(data);
            }
        }

        async function fetchStocks() {
            const { data: session, error: sessionError } =
				await supabase.auth.getSession();
			if (sessionError || !session?.session?.user) {
				console.error("User not authenticated");
				return;
			}
            const userId = session.session.user.id;
            const { data: watchlistData, error } = await supabase
				.from("watchlist")
				.select("id, stock_symbol")
				.eq("user_id", userId);

			if (error) console.error("Error fetching watchlist:", error);
			else setStocks(watchlistData);
        }

        fetchStrategies();
        fetchStocks();
    }, []);

    const runBacktest = async () => {
        if (!selectedStrategy || !selectedStock || !startDate || !endDate) {
            alert("Please select a strategy, stock, and date range.");
            return;
        }

        setLoading(true);

        const res = await fetch("/api/backtest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                strategy_id: selectedStrategy,
                stock_symbol: selectedStock,
                start_date: startDate,
                end_date: endDate,
            }),
        });

        const data = await res.json();
        console.log(data);
        setLoading(false);

        if (data.success) {
            setBacktestResults(data.results);
        } else {
            alert(`Error: ${data.error}`);
        }
    };

    return (
        <div className="min-h-screen text-gray-100 mt-[-35px] bg-gray-900 p-6">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-blue-500 mb-6">📈 Backtest Strategy</h1>

                {/* Strategy Selection */}
                <div className="mb-4">
                    <label className="block text-gray-400 mb-1">Select Strategy</label>
                    <select
                        className="w-full bg-gray-800 text-white p-2 rounded-md"
                        onChange={(e) => setSelectedStrategy(Number(e.target.value))}
                        value={selectedStrategy || ""}
                    >
                        <option value="">-- Choose Strategy --</option>
                        {strategies.map((strategy) => (
                            <option key={strategy.id} value={strategy.id}>
                                {strategy.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Stock Selection */}
                <div className="mb-4">
                    <label className="block text-gray-400 mb-1">Select Stock</label>
                    <select
                        className="w-full bg-gray-800 text-white p-2 rounded-md"
                        onChange={(e) => setSelectedStock(e.target.value)}
                        value={selectedStock || ""}
                    >
                        <option value="">-- Choose Stock --</option>
                        {stocks.map((stock) => (
                            <option key={stock.stock_symbol} value={stock.stock_symbol}>
                                {stock.stock_symbol} ({stock.stock_symbol})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Date Pickers */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-gray-400 mb-1">Start Date</label>
                        <input
                            type="date"
                            className="w-full bg-gray-800 text-white p-2 rounded-md"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-1">End Date</label>
                        <input
                            type="date"
                            className="w-full bg-gray-800 text-white p-2 rounded-md"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Backtest Button */}
                <button
                    onClick={runBacktest}
                    className="w-full bg-blue-600 cursor-pointer hover:bg-blue-700 text-white py-2 rounded-md text-lg"
                    disabled={loading}
                >
                    {loading ? "🔄 Running Backtest..." : "🚀 Run Backtest"}
                </button>

                {/* Backtest Results Table */}
                {backtestResults.length > 0 && (
                    <div className="mt-6 bg-gray-800 p-4 rounded-md">
                        <h2 className="text-xl font-semibold text-blue-400 mb-3">📊 Backtest Results</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-700">
                                <thead>
                                    <tr className="bg-gray-700 text-gray-300">
                                        <th className="border p-2">Date</th>
                                        <th className="border p-2">Close Price</th>
                                        <th className="border p-2">Signal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {backtestResults.map((result, index) => (
                                        <tr key={index} className="border-b border-gray-700">
                                            <td className="border p-2">
                                                {new Date(result.Date).toLocaleString("en-IN", {
                                                    timeZone: "Asia/Kolkata",
                                                    year: "numeric",
                                                    month: "2-digit",
                                                    day: "2-digit",
                                                })}
                                            </td>
                                            <td className="border p-2">{result.Close !== undefined && result.Close !== null 
                                                ? result.Close.toFixed(2) 
                                                : 'N/A'}</td>
                                            <td className="border p-2">
                                                {result.Signal === 1 ? "🟢 Buy" : result.Signal === -1 ? "🔴 Sell" : "⚪ Hold"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
