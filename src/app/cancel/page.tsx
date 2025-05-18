"use client";

import { useRouter } from "next/navigation";

export default function CancelPage() {
    const router = useRouter();

    return (
        <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="text-center space-y-6 bg-gray-800 p-8 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-red-400">❌ Payment Cancelled</h1>
                <p className="text-gray-300">Your payment was not completed.</p>
                <button
                    onClick={() => router.push("/pricing")}
                    className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}