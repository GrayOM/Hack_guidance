// Responses are reflected back only to origins on this list. "*" let any site call these
// endpoints with a visitor's bearer token, so the production origin is the default and local
// development ports are kept so a dev build still reaches the same project.
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? Deno.env.get("ALLOWED_ORIGIN") ?? "https://grayom.github.io,http://localhost:5173,http://localhost:3000")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

function corsHeadersFor(request: Request, methods: string) {
  const origin = request.headers.get("Origin") ?? "";
  // An unlisted origin receives the canonical one, which the browser then rejects.
  const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": methods,
    Vary: "Origin",
  };
}

function responseWriter(cors: Record<string, string>) {
  return (body: unknown, init: ResponseInit = {}) =>
    new Response(JSON.stringify(body), {
      ...init,
      headers: { ...cors, "Content-Type": "application/json; charset=utf-8", ...(init.headers ?? {}) },
    });
}

Deno.serve(request => {
  const corsHeaders = corsHeadersFor(request, "GET, OPTIONS");
  const response = responseWriter(corsHeaders);
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "GET") return response({ error: "Method not allowed" }, { status: 405 });
  const url = new URL(request.url);
  // The channel answers by mode, not by node number. Keying on the number meant that reordering
  // the operation silently broke every remote node until this function was redeployed in step with
  // it; a mode names the surface being exercised and does not move when the curriculum does.
  const stage = url.searchParams.get("stage") ?? "";
  const mode = url.searchParams.get("mode");

  if (mode === "response") return response({ status: "closed", message: "connection refused", trace: "FLAG{the_server_did_answer}" });
  if (mode === "redirect") {
    // The gateway hands this function an http:// request URL, so url.origin would emit a
    // mixed-content Location that the browser blocks on the https:// site.
    const destination = `https://${url.host}/functions/v1/hg-black-trace?stage=${encodeURIComponent(stage)}&mode=archive&access=FLAG%7Bfollow_the_location%7D`;
    return new Response(null, { status: 302, headers: { ...corsHeaders, Location: destination } });
  }
  if (mode === "archive") return response({ status: "not_found", message: "RECORD NOT FOUND" });
  if (mode === "header") return response({ status: "online", message: "no data" }, { headers: { "X-Trace-Note": "FLAG{headers_can_whisper}" } });
  if (mode === "vault") return response({ status: "partial", fragment: "one_key}" });
  return response({ error: "Unknown trace channel" }, { status: 404 });
});
