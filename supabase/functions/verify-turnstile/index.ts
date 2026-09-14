// Supabase Edge Function: verify-turnstile
// Validates Cloudflare Turnstile tokens server-side using Cloudflare siteverify API.

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-requested-with, accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Only POST is accepted." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Token de verificación humana no proporcionado o inválido.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const secretKey =
      // @ts-ignore: Deno global is present in Supabase Edge Runtime
      (typeof Deno !== "undefined" && Deno.env.get("CLOUDFLARE_TURNSTILE_SECRET_KEY")) ||
      // @ts-ignore: Deno global is present in Supabase Edge Runtime
      (typeof Deno !== "undefined" && Deno.env.get("TURNSTILE_SECRET_KEY")) ||
      "1x0000000000000000000000000000000AA"; // Cloudflare official testing secret for dev/staging

    const clientIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for");

    // Prepare form data for Cloudflare siteverify
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
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
          error: "Error de comunicación con el servicio de verificación humana de Cloudflare.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error interno al verificar humanidad: " + (err?.message || "Desconocido"),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

// @ts-ignore: Deno global is present in Supabase Edge Runtime
if (typeof Deno !== "undefined" && typeof Deno.serve === "function") {
  // @ts-ignore
  Deno.serve(handler);
}

export default handler;
