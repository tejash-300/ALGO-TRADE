"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) setError(error.message);
    setLoading(false);
    window.location.href = "/dashboard";
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });

    if (error) setError(error.message);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-primary text-white">
      <div className="w-full max-w-md p-6 space-y-6 bg-secondary rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center">Login</h2>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <form className="space-y-4" onSubmit={handleLogin}>
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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <button
          onClick={handleGoogleLogin}
          className="w-full p-3 bg-gray-800 rounded-lg flex items-center cursor-pointer justify-center gap-2 hover:bg-gray-700 transition"
        >
          <span className="text-white flex items-center gap-2"> <FcGoogle /> Login with Google</span>
        </button>

        <p className="text-center">
          Don't have an account?{" "}
          <Link href="/sign-up" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}