"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
const stripePromise = loadStripe("pk_test_51OyVtPSIknxXJXTl65FFYA1KHh6KRfhEvqqjot2lGILRdKN8zFDxULTrOUwW72mkkqMsbaNZDUSyWUlKAbJN6mMH00GOpQJ3IE"); // Replace with your Stripe Publishable Key

export default function PricingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        const { data: userSession, error: sessionError } =
                  await supabase.auth.getSession();
                if (!userSession) return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
                // get email from user session
                const email = userSession.session?.user?.email as string;
        setLoading(true);
        const stripe = await stripePromise;
            const { sessionId } = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, id: userSession.session?.user?.id }),
            }).then((res) => res.json());

            await stripe?.redirectToCheckout({ sessionId });
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-4">
            <h1 className="text-4xl font-bold text-white mb-8">Choose Your Plan</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free Plan */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                    <h2 className="text-2xl font-semibold text-white">🚀 Free Plan</h2>
                    <p className="text-gray-400 mt-2">Perfect for beginners</p>
                    <ul className="mt-4 space-y-2 text-gray-300">
                        <li>✅ 3 Total Watchlist Stocks</li>
                        <li>✅ 3 Strategies</li>
                        <li>✅ 3 Total Bots</li>
                    </ul>
                    <button 
                        disabled
                        className="mt-6 w-full px-4 py-2 bg-gray-600 text-gray-300 cursor-not-allowed rounded-lg"
                    >
                        Current Plan
                    </button>
                </div>

                {/* Basic Plan */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center border-2 border-indigo-500">
                    <h2 className="text-2xl font-semibold text-white">🔥 Basic Plan</h2>
                    <p className="text-gray-400 mt-2">Unlock full power</p>
                    <ul className="mt-4 space-y-2 text-gray-300">
                        <li>✅ Unlimited Watchlist Stocks</li>
                        <li>✅ Unlimited Strategies</li>
                        <li>✅ Unlimited Bots</li>
                    </ul>
                    <button 
                        onClick={handleCheckout}
                        disabled={loading}
                        className="mt-6 cursor-pointer w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                    >
                        {loading ? "Redirecting..." : "Subscribe for ₹10.00/mo"}
                    </button>
                </div>
            </div>
        </div>
    );
}