// supabase/functions/sanctuary-start-trial/index.ts
// Deploy: supabase functions deploy sanctuary-start-trial
// Called by the Electron app when a user clicks "Start Free Trial" in-app

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, fullName } = await req.json();

    if (!email || !fullName) {
      return new Response(
        JSON.stringify({ error: "Email and full name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if this email already has an active trial or subscription
    const { data: existing } = await supabase
      .from("sanctuary_subscriptions")
      .select("id, status, plan")
      .eq("email", email.toLowerCase().trim())
      .limit(1)
      .maybeSingle();

    if (existing) {
      if (existing.status === "active") {
        return new Response(
          JSON.stringify({ error: "An active subscription already exists for this email. Please enter your license key." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (existing.status === "trial") {
        // Trial already exists - return their existing key
        const { data: keyRow } = await supabase
          .from("sanctuary_license_keys")
          .select("license_key")
          .eq("subscription_id", existing.id)
          .maybeSingle();

        if (keyRow) {
          return new Response(
            JSON.stringify({ licenseKey: keyRow.license_key, existing: true }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      
      // Strict rejection: If they exist but are not active and not on a current trial, block them.
      // This prevents users from getting infinite trials by re-registering the same email.
      return new Response(
        JSON.stringify({ error: "Your free trial has already expired or your subscription was cancelled. Please purchase a license to continue." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new trial subscription (14 days)
    const periodEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data: sub, error: subError } = await supabase
      .from("sanctuary_subscriptions")
      .insert({
        email: email.toLowerCase().trim(),
        full_name: fullName.trim(),
        plan: "trial",
        status: "trial",
        current_period_end: periodEnd,
      })
      .select("id")
      .single();

    if (subError || !sub) {
      console.error("Failed to create trial:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to create trial. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate license key
    const { data: licenseKey, error: keyError } = await supabase.rpc("generate_license_key");

    if (keyError || !licenseKey) {
      console.error("Failed to generate key:", keyError);
      return new Response(
        JSON.stringify({ error: "Failed to generate license key." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert license key record
    const { error: insertError } = await supabase.from("sanctuary_license_keys").insert({
      subscription_id: sub.id,
      license_key: licenseKey,
      max_activations: 1,
    });

    if (insertError) {
      console.error("Failed to insert license key:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save license key. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- EMAIL LOGIC ---
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY) {
      const emailHtml = `
        <div style="font-family: sans-serif; color: #111827; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Sanctuary!</h2>
          <p>Hi ${fullName},</p>
          <p>Your 14-day free trial has been activated. Here is your license key:</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 1px; text-align: center; margin: 24px 0;">
            ${licenseKey}
          </div>
          <p><strong>Next steps:</strong></p>
          <ol>
            <li>Download the Sanctuary app from our website.</li>
            <li>Install and open the app on your Windows computer.</li>
            <li>Copy and paste your license key above to activate it.</li>
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
          subject: "Your Sanctuary Free Trial License Key",
          html: emailHtml
        })
      }).catch(err => console.error("Resend error:", err));
    } else {
      console.warn("RESEND_API_KEY is not set. Skipping email delivery.");
    }
    // --- END EMAIL LOGIC ---

    return new Response(
      JSON.stringify({ licenseKey, existing: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("sanctuary-start-trial error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
