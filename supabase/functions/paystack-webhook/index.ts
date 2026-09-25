// supabase/functions/paystack-webhook/index.ts
// Deploy: supabase functions deploy paystack-webhook --no-verify-jwt
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Use native node crypto to avoid external dependency issues
import crypto from "node:crypto";

serve(async (req) => {
  try {
    const signature = req.headers.get("x-paystack-signature");
    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    const payload = await req.text();
    const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
    
    if (!secret) {
      console.error("Missing PAYSTACK_SECRET_KEY env var");
      return new Response("Server error", { status: 500 });
    }

    // Verify Paystack HMAC signature
    const hash = crypto.createHmac("sha512", secret).update(payload).digest("hex");
    if (hash !== signature) {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(payload);
    
    // Only process successful charges
    if (event.event === "charge.success") {
      const { customer, plan: paystackPlanId, status } = event.data;
      const email = customer.email;
      const fullName = (customer.first_name || "") + " " + (customer.last_name || "");

      // Default to "monthly" if the plan ID isn't mapped, to prevent breaking
      let planTier = "monthly";
      if (paystackPlanId === Deno.env.get("PAYSTACK_ANNUAL_PLAN_ID")) {
        planTier = "annual";
      } else if (paystackPlanId === Deno.env.get("PAYSTACK_CHURCH_PLAN_ID")) {
        planTier = "church";
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Upsert Subscription
      const daysToAdd = planTier === "annual" ? 365 : 30;
      const periodEnd = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

      const { data: sub, error: subError } = await supabase
        .from("sanctuary_subscriptions")
        .upsert({
          email: email.toLowerCase().trim(),
          full_name: fullName.trim() || email,
          plan: planTier,
          status: "active",
          current_period_end: periodEnd,
        }, { onConflict: "email" })
        .select("id")
        .single();

      if (subError || !sub) {
        console.error("Failed to upsert subscription:", subError);
        return new Response("Failed to save subscription", { status: 500 });
      }

      // Check if they already have a license key
      const { data: existingKey } = await supabase
        .from("sanctuary_license_keys")
        .select("license_key")
        .eq("subscription_id", sub.id)
        .maybeSingle();

      let licenseKey = existingKey?.license_key;

      if (!licenseKey) {
        const { data: newKey, error: keyError } = await supabase.rpc("generate_license_key");
        if (keyError || !newKey) throw new Error("Failed to generate key");
        
        licenseKey = newKey;
        const maxActivations = planTier === "church" ? 3 : 1;

        const { error: insertError } = await supabase.from("sanctuary_license_keys").insert({
          subscription_id: sub.id,
          license_key: licenseKey,
          max_activations: maxActivations,
        });

        if (insertError) throw insertError;
      }

      // --- EMAIL LOGIC ---
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY) {
        const emailHtml = `
          <div style="font-family: sans-serif; color: #111827; max-width: 600px; margin: 0 auto;">
            <h2>Thank you for subscribing to Sanctuary!</h2>
            <p>Hi ${fullName},</p>
            <p>Your subscription is now active. Here is your official license key:</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 1px; text-align: center; margin: 24px 0;">
              ${licenseKey}
            </div>
            <p><strong>Next steps:</strong></p>
            <ol>
              <li>Download the Sanctuary app from our website.</li>
              <li>Install and open the app on your Windows computer.</li>
              <li>Copy and paste your license key above to activate your plan.</li>
            </ol>
            <p>If you have any questions or need help, just reply to this email!</p>
            <br/>
            <p>Blessings,<br/>The EcclesiaSync Team</p>
          </div>
        `;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: "Sanctuary Support <Support@ecclesiasync.com>",
            to: [email],
            subject: "Your Sanctuary License Key",
            html: emailHtml
          })
        }).catch(err => console.error("Resend error:", err));
      } else {
        console.warn("RESEND_API_KEY is not set. Skipping email delivery.");
      }
      // --- END EMAIL LOGIC ---

    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Webhook Error", { status: 400 });
  }
});
