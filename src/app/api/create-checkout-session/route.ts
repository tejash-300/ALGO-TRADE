import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabaseClient";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-02-24.acacia",
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const id = body?.id as string; // Supabase User ID
        const email = body?.email as string;

        async function getOrCreateCustomer(email: string) {
            const customer = await stripe.customers.create({
                email,
                name: "Test User",
            });
            return customer.id;
        }

        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "subscription",
            billing_address_collection: "required",
            customer: await getOrCreateCustomer(email),
            line_items: [
                {
                    price: "price_1QMlb5SIknxXJXTlDgHeCpjv",
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}&user_id=${id}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
        });

        return NextResponse.json({ sessionId: stripeSession.id });
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        return NextResponse.json({ error: "Error creating checkout session" }, { status: 500 });
    }
}