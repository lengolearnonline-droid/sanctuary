// supabase/functions/validate-license/index.ts
// Deploy: supabase functions deploy validate-license

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { licenseKey, machineId } = await req.json();

    if (!licenseKey || !machineId) {
      return new Response(
        JSON.stringify({ valid: false, reason: "missing_params" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Find the license key + subscription
    const { data: keyRow, error: keyError } = await supabase
      .from("sanctuary_license_keys")
      .select(`
        id,
        max_activations,
        subscription_id,
        sanctuary_subscriptions (
          plan,
          status,
          current_period_end
        )
      `)
      .eq("license_key", licenseKey)
      .maybeSingle();

    if (keyError || !keyRow) {
      return new Response(
        JSON.stringify({ valid: false, reason: "not_found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sub = (keyRow as any).sanctuary_subscriptions;

    // 2. Check subscription status
    if (!sub || sub.status === "cancelled") {
      return new Response(
        JSON.stringify({ valid: false, reason: "cancelled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const expiresAt = new Date(sub.current_period_end);
    const now = new Date();

    if (expiresAt < now && sub.status !== "trial") {
      // Update status to expired
      await supabase
        .from("sanctuary_subscriptions")
        .update({ status: "expired" })
        .eq("id", keyRow.subscription_id);

      return new Response(
        JSON.stringify({ valid: false, reason: "expired" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For trial — also check expiry
    if (sub.status === "trial" && expiresAt < now) {
      await supabase
        .from("sanctuary_subscriptions")
        .update({ status: "expired" })
        .eq("id", keyRow.subscription_id);

      return new Response(
        JSON.stringify({ valid: false, reason: "expired" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check machine activations
    const { data: activations } = await supabase
      .from("sanctuary_activations")
      .select("id, machine_id")
      .eq("license_key_id", keyRow.id);

    const existingMachine = (activations ?? []).find((a: any) => a.machine_id === machineId);
    const activationCount = (activations ?? []).length;

    if (!existingMachine && activationCount >= keyRow.max_activations) {
      return new Response(
        JSON.stringify({
          valid: false,
          reason: "machine_limit",
          maxActivations: keyRow.max_activations,
          currentActivations: activationCount,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Register this machine if new
    if (!existingMachine) {
      await supabase.from("sanctuary_activations").insert({
        license_key_id: keyRow.id,
        machine_id: machineId,
        activated_at: now.toISOString(),
        last_validated_at: now.toISOString(),
      });
    } else {
      // Update last validated timestamp
      await supabase
        .from("sanctuary_activations")
        .update({ last_validated_at: now.toISOString() })
        .eq("license_key_id", keyRow.id)
        .eq("machine_id", machineId);
    }

    // 5. Calculate days left
    const msLeft = expiresAt.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

    return new Response(
      JSON.stringify({
        valid: true,
        plan: sub.plan,
        status: sub.status,
        daysLeft,
        expiresAt: sub.current_period_end,
        maxActivations: keyRow.max_activations,
        currentActivations: (activations?.length ?? 0) + (existingMachine ? 0 : 1),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("validate-license error:", err);
    return new Response(
      JSON.stringify({ valid: false, reason: "error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
