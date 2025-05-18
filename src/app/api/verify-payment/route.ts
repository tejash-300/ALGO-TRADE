import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-02-24.acacia",
});

// Initialize Supabase Admin Client (Don't expose service_role_key on the frontend!)
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
});

export async function POST(req: Request) {
    try {
        const { session_id, user_id } = await req.json();

        if (!session_id || !user_id) {
            return NextResponse.json({ error: "Missing session_id or user_id" }, { status: 400 });
        }

        // Retrieve session details from Stripe
        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status === "paid") {
            console.log("Updating subscription for user:", user_id);
            
            try {
                // First update the user_metadata via auth API (keeping this for compatibility)
                const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
                    user_metadata: { is_subscribed: true },
                });

                if (error) {
                    console.error("Supabase Metadata Update Error:", error);
                    return NextResponse.json({ error: "Failed to update subscription metadata" }, { status: 500 });
                }
                
                // Update the actual column in auth.users table using raw SQL
                const { data: sqlData, error: sqlError } = await supabaseAdmin.rpc(
                    'update_subscription_status',
                    { p_user_id: user_id }
                );

                if (sqlError) {
                    console.error("SQL Update Error:", sqlError);
                    return NextResponse.json({ error: "Failed to update is_subscribed column" }, { status: 500 });
                }
                
                console.log("Successfully updated is_subscribed column for user:", user_id);
                
                return NextResponse.json({ success: true });
            } catch (err) {
                console.error("Error in update process:", err);
                return NextResponse.json({ error: "Internal server error during update" }, { status: 500 });
            }
        }

        return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    } catch (error) {
        console.error("Error verifying payment:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}