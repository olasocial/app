// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This code runs on Supabase Edge Functions (Deno runtime)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Only POST is accepted." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Token de verificación humana no proporcionado o inválido.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const secretKey =
      Deno.env.get("CLOUDFLARE_TURNSTILE_SECRET_KEY") ||
      Deno.env.get("TURNSTILE_SECRET_KEY") ||
      "1x0000000000000000000000000000000AA"; // Cloudflare official testing secret for dev/staging

    const clientIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for");

    // Prepare form data for Cloudflare siteverify
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token.trim());
    if (clientIp) {
      formData.append("remoteip", clientIp.split(",")[0].trim());
    }

    const siteverifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    const cloudflareResp = await fetch(siteverifyUrl, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!cloudflareResp.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Error de comunicación con el servicio de verificación humana.",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const verificationData = await cloudflareResp.json();

    if (verificationData.success === true) {
      return new Response(
        JSON.stringify({
          success: true,
          challenge_ts: verificationData.challenge_ts,
          hostname: verificationData.hostname,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "La verificación humana no pudo ser comprobada. Inténtalo nuevamente.",
          error_codes: verificationData["error-codes"],
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error interno al verificar humanidad.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
