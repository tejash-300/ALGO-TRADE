"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";

export default function SignupPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [emailSent, setEmailSent] = useState(false);

	const handleSignup = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		const { error } = await supabase.auth.signUp({ email, password });

		if (error) {
			setError(error.message);
		} else {
			setEmailSent(true);
		}
		setLoading(false);
	};

	const handleGoogleSignup = async () => {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: "google",
		});

		if (error) {
			setError(error.message);
		}
	};

	return (
		<div className="h-screen flex items-center justify-center bg-primary text-white">
			<div className="w-full max-w-md p-6 space-y-6 bg-secondary rounded-lg shadow-lg">
				<h2 className="text-3xl font-bold text-center">Sign Up</h2>

				{error && <p className="text-red-500 text-center">{error}</p>}

				{emailSent ? (
					<div className="text-center space-y-4">
						<p className="text-green-400">
							✅ We have sent a confirmation email to{" "}
							<b>{email}</b>. Please check your inbox and verify
							your account.
						</p>
						<p className="text-gray-300">
							After verifying, you can log in.
						</p>
						<Link href="/sign-in">
							<button className="w-full p-3 bg-[#1E293B] cursor-pointer rounded-lg hover:bg-indigo-600 transition">
								Go to Login
							</button>
						</Link>
					</div>
				) : (
					<div>
						<form className="space-y-4" onSubmit={handleSignup}>
							<input
								type="email"
								placeholder="Email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="w-full p-3 bg-gray-700 rounded-lg outline-none"
							/>
							<input
								type="password"
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="w-full p-3 bg-gray-700 rounded-lg outline-none"
							/>
							<button
								type="submit"
								disabled={loading}
								className="w-full p-3 bg-[#1E293B] cursor-pointer rounded-lg hover:bg-indigo-600 transition"
							>
								{loading ? "Signing up..." : "Sign Up"}
							</button>
							<button
								onClick={handleGoogleSignup}
								className="w-full p-3 bg-gray-800 rounded-lg flex items-center cursor-pointer justify-center gap-2 hover:bg-gray-700 transition"
							>
								<span className="text-white flex items-center gap-2">
									{" "}
									<FcGoogle /> Login with Google
								</span>
							</button>
						</form>
						<p className="text-center">
							Already have an account?{" "}
							<Link
								href="/sign-in"
								className="text-accent hover:underline"
							>
								Login
							</Link>
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
