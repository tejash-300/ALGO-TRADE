"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Stock {
	id: number;
	stock_symbol: string;
}

interface User {
	id: string;
	profilePicture?: string;
	isSubscribed: boolean;
}

export default function WatchlistPage() {
	const [watchlist, setWatchlist] = useState<Stock[]>([]);
	const [user, setUser] = useState<User | null>(null);
	const [stockSymbol, setStockSymbol] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [showUpgradePopup, setShowUpgradePopup] = useState(false);

	useEffect(() => {
		const fetchUserAndWatchlist = async () => {
			const { data: session, error: sessionError } =
				await supabase.auth.getSession();
			if (sessionError || !session?.session?.user) {
				console.error("User not authenticated");
				return;
			}

			const userId = session.session.user.id;
			const isSubscribed =
				session.session.user.user_metadata?.is_subscribed === true;

			setUser({
				id: userId,
				profilePicture: "/default-avatar.png",
				isSubscribed,
			});

			const { data: watchlistData, error } = await supabase
				.from("watchlist")
				.select("id, stock_symbol")
				.eq("user_id", userId);

			if (error) console.error("Error fetching watchlist:", error);
			else setWatchlist(watchlistData);
		};

		fetchUserAndWatchlist();
	}, []);

	const handleAddStock = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!stockSymbol.trim() || !user) return;

		// Restrict free users to 3 watchlist entries
		if (!user.isSubscribed && watchlist.length >= 3) {
			setShowUpgradePopup(true);
			return;
		}

		const { data, error } = await supabase
			.from("watchlist")
			.insert([
				{ user_id: user.id, stock_symbol: stockSymbol.toUpperCase() },
			])
			.select();

		if (error) {
			console.error("Error adding stock:", error);
			setMessage("❌ Failed to add stock.");
			return;
		}

		setWatchlist((prev) => [...prev, ...data]);
		setStockSymbol("");
		setMessage(`✅ ${stockSymbol.toUpperCase()} added to watchlist!`);

		setTimeout(() => setMessage(null), 3000);
	};

	const handleRemoveStock = async (id: number) => {
		const { error } = await supabase
			.from("watchlist")
			.delete()
			.eq("id", id);

		if (error) {
			console.error("Error removing stock:", error);
			setMessage("❌ Failed to remove stock.");
			return;
		}

		setWatchlist((prev) => prev.filter((stock) => stock.id !== id));
		setMessage(`🗑️ Stock removed from watchlist!`);

		setTimeout(() => setMessage(null), 3000);
	};

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				minHeight: "100vh",
				color: "#e0e0e0",
				paddingTop: "60px",
			}}
			className="bg-gray-900 mt-[-35px]"
		>
			{/* Header */}
			<div
				style={{
					position: "fixed",
					top: 0,
					width: "100%",
					padding: "15px 20px",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					zIndex: 1000,
				}}
			>
				<h1
					style={{
						fontSize: "26px",
						fontWeight: 600,
						color: "#e0e0e0",
					}}
				>
					Your Watchlist
				</h1>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "15px",
					}}
				>
					<div
						style={{
							width: "45px",
							height: "45px",
							borderRadius: "50%",
							overflow: "hidden",
							backgroundColor: "#444",
						}}
					>
						<img
							src={user?.profilePicture || "/default-avatar.png"}
							alt="Profile"
							style={{
								width: "100%",
								height: "100%",
								objectFit: "cover",
							}}
						/>
					</div>
					<Link
						href="/logout"
						style={{
							backgroundColor: "#e53935",
							color: "white",
							padding: "10px 18px",
							borderRadius: "8px",
							textDecoration: "none",
							fontWeight: "bold",
							boxShadow: "0px 4px 6px rgba(255, 82, 82, 0.3)",
						}}
					>
						Logout
					</Link>
				</div>
			</div>

			{/* Main Content */}
			<div style={{ padding: "40px 20px", flex: 1 }}>
				{/* Add Stock Form */}
				<form
					onSubmit={handleAddStock}
					style={{
						marginBottom: "20px",
						background: "#1e1e1e",
						padding: "20px",
						borderRadius: "10px",
						boxShadow: "0 0 12px rgba(33, 150, 243, 0.3)",
					}}
				>
					<label
						htmlFor="stock_symbol"
						style={{ fontSize: "16px", fontWeight: "bold" }}
					>
						Add Stock Symbol (NSE):
					</label>
					<br />
					<input
						type="text"
						id="stock_symbol"
						value={stockSymbol}
						onChange={(e) => setStockSymbol(e.target.value)}
						placeholder="E.g., RELIANCE"
						required
						style={{
							padding: "12px",
							width: "60%",
							marginBottom: "10px",
							border: "1px solid #555",
							borderRadius: "6px",
							background: "#222",
							color: "#e0e0e0",
						}}
					/>
					<br />
					<button
						type="submit"
						style={{
							backgroundColor: "#2979ff",
							color: "white",
							border: "none",
							padding: "12px 18px",
							borderRadius: "8px",
							cursor: "pointer",
							boxShadow: "0px 4px 6px rgba(41, 121, 255, 0.3)",
						}}
					>
						Add to Watchlist
					</button>
				</form>

				{/* Watchlist Table */}
				<table
					style={{
						width: "100%",
						borderCollapse: "collapse",
						background: "#1e1e1e",
						borderRadius: "10px",
						overflow: "hidden",
						boxShadow: "0 0 12px rgba(33, 150, 243, 0.3)",
					}}
				>
					<thead>
						<tr style={{ background: "#333", color: "#e0e0e0" }}>
							<th style={{ padding: "15px" }}>Stock Symbol</th>
							<th style={{ padding: "15px" }}>Actions</th>
						</tr>
					</thead>
					<tbody>
						{watchlist.map((stock) => (
							<tr
								key={stock.id}
								style={{ borderBottom: "1px solid #444" }}
							>
								<td
									style={{
										padding: "15px",
										textAlign: "center",
										fontSize: "16px",
									}}
								>
									{stock.stock_symbol}
								</td>
								<td
									style={{
										padding: "15px",
										textAlign: "center",
									}}
								>
									<button
										onClick={() =>
											handleRemoveStock(stock.id)
										}
										style={{
											backgroundColor: "#e53935",
											color: "white",
											border: "none",
											padding: "10px 15px",
											borderRadius: "6px",
											cursor: "pointer",
											boxShadow:
												"0px 4px 6px rgba(255, 82, 82, 0.3)",
										}}
									>
										Remove
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>

				{/* Upgrade Popup */}
				{showUpgradePopup && (
					<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
						<div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center relative">
							<button
								className="absolute cursor-pointer top-2 right-2 text-gray-400 hover:text-gray-200"
								onClick={() => setShowUpgradePopup(false)}
							>
								✖
							</button>
							<h2 className="text-xl font-bold text-red-400">
								🚀 Upgrade to Pro!
							</h2>
							<p className="text-gray-300 mt-2">
								The free plan allows only 3 watchlist entries.
							</p>
							<button
								onClick={() =>
									(window.location.href = "/pricing")
								}
								className="mt-4 cursor-pointer px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
							>
								View Pricing
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
