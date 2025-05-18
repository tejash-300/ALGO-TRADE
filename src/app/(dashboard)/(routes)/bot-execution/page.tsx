"use client";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

type Bot = {
	id: number;
	bot_name: string;
	strategy_id: number;
	stock_symbol: string;
	status: "active" | "inactive";
};

export default function BotsPage() {
	const [bots, setBots] = useState<Bot[]>([]);
	const [activeBotIds, setActiveBotIds] = useState<number[]>([]);
	const [logs, setLogs] = useState<{ [key: number]: string[] }>({});
	const [orders, setOrders] = useState<any[]>([]);

	useEffect(() => {
		async function fetchBots() {
			const { data: session, error: sessionError } =
				await supabase.auth.getSession();
			const { data, error } = await supabase
				.from("bots")
				.select("*")
				.eq("user_id", session?.session?.user.id)
				.eq("status", "active");
                if (!error && data) {
                    setBots(data);
                    
                    // Initialize logs for each bot
                    const initialLogs: { [key: number]: string[] } = {};
                    data.forEach((bot) => {
                        initialLogs[bot.id] = [];
                    });
                    setLogs(initialLogs);
                }
		}
		fetchBots();
	}, []);

	// Toggle activation
	const toggleBot = async (botId: number) => {
		const isActive = activeBotIds.includes(botId);

		if (isActive) {
			setActiveBotIds(activeBotIds.filter((id) => id !== botId));
			setLogs((prev) => ({
				...prev,
				[botId]: [
					`🛑 Bot ${botId} stopping...`,
					...(prev[botId] || []),
				],
			}));

			await fetch("/api/stop-bot", {
				method: "POST",
				body: JSON.stringify({ bot_id: botId }),
			});

			setLogs((prev) => ({
				...prev,
				[botId]: [`✅ Bot ${botId} stopped`, ...(prev[botId] || [])],
			}));
		} else {
			setActiveBotIds([...activeBotIds, botId]);
			setLogs((prev) => ({
				...prev,
				[botId]: [
					`🚀 Bot ${botId} starting...`,
					...(prev[botId] || []),
				],
			}));
            const { data: session, error: sessionError } =
                await supabase.auth.getSession();
			await fetch("/api/activate-bot", {
				method: "POST",
				body: JSON.stringify({ bot_id: botId, user_id: session?.session?.user.id }),
			});

			setLogs((prev) => ({
				...prev,
				[botId]: [`✅ Bot ${botId} activated`, ...(prev[botId] || [])],
			}));
		}
	};

	// Fetch orders every 5 seconds
	useEffect(() => {
		const fetchOrders = async () => {
			const { data: session, error: sessionError } =
				await supabase.auth.getSession();
			const { data, error } = await supabase
				.from("bot_orders")
				.select("*")
				.eq("user_id", session?.session?.user.id);
			if (!error && data) {
				setOrders(data);
			}
		};

		const interval = setInterval(fetchOrders, 100);
		return () => clearInterval(interval);
	}, []);

	// Fetch logs every 5 seconds
	useEffect(() => {
		const fetchLogs = async () => {
			for (const botId of activeBotIds) {
				const res = await fetch(`/api/bot-logs?bot_id=${botId}`);
				const data = await res.json();
				setLogs((prev) => ({ ...prev, [botId]: data.logs || [] }));
			}
		};

		const interval = setInterval(fetchLogs, 100);
		return () => clearInterval(interval);
	}, [activeBotIds]);

	return (
		<div className="min-h-screen text-gray-100 bg-gray-900 p-6 mt-[-35px]">
			<div className="max-w-6xl mx-auto">
				<h1 className="text-3xl font-bold text-blue-600 mb-6">
					📊 Trading Bots Dashboard
				</h1>

				{/* Bots Section */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{bots.map((bot) => (
						<div
							key={bot.id}
							className="p-6 bg-[#1c1c1c] rounded-lg shadow-lg border-l-4 border-blue-500 flex justify-between items-center"
						>
							<div>
								<h2 className="text-xl font-semibold">
									{bot.bot_name}
								</h2>
								<p className="text-gray-600">
									Stock: {bot.stock_symbol}
								</p>
							</div>
							<button
								className={`px-4 py-2 rounded-md ${
									activeBotIds.includes(bot.id)
										? "bg-red-500 text-white cursor-pointer"
										: "bg-blue-500 hover:bg-blue-600 cursor-pointer text-white"
								}`}
								onClick={() => toggleBot(bot.id)}
							>
								{activeBotIds.includes(bot.id)
									? "🛑 Stop"
									: "⚡ Activate"}
							</button>
						</div>
					))}
				</div>

				{/* Orders Section */}
				<h2 className="text-2xl font-semibold mt-8 mb-4">
					📌 Executed Orders
				</h2>
				<div className="bg-[#1c1c1c] p-4 rounded-lg shadow-lg">
					<table className="w-full border-collapse border border-gray-200">
						<thead className="bg-[#1c1c1c]">
							<tr>
								<th className="border p-2">Stock</th>
								<th className="border p-2">Price</th>
								<th className="border p-2">Action</th>
								<th className="border p-2">Bot</th>
							</tr>
						</thead>
						<tbody>
							{orders.map((order, index) => (
								<tr key={index} className="border-b">
									<td className="border p-2">
										{order.ticker}
									</td>
									<td className="border p-2">
										{order.price}
									</td>
									<td className="border p-2">{order.type}</td>
                                    <td className="border p-2">
                                        {bots.find((bot) => bot.id === order.bot_id)?.bot_name || order.bot_id}
                                    </td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Logs Section */}
				<h2 className="text-2xl font-semibold mt-8 mb-4">📜 Logs</h2>
                    <div className="bg-[#1c1c1c] p-4 rounded-lg shadow-lg max-h-64 overflow-y-auto mb-4">
                        <h3 className="text-blue-400 font-bold">Bot Logs:</h3>
                        {Object.values(logs).flat().map((log, index) => (
                            <p key={index} className="text-gray-300">
                                {log}
                            </p>
                        ))}
                    </div>
			</div>
		</div>
	);
}
