const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function response(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", ...(init.headers ?? {}) },
  });
}

Deno.serve(request => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "GET") return response({ error: "Method not allowed" }, { status: 405 });
  const url = new URL(request.url);
  const stage = Number(url.searchParams.get("stage"));
  const mode = url.searchParams.get("mode");

  if (stage === 6 && mode === "response") return response({ status: "closed", message: "connection refused", trace: "FLAG{the_server_did_answer}" });
  if (stage === 7 && mode === "redirect") {
    const destination = `${url.origin}/functions/v1/hg-black-trace?stage=7&mode=archive&access=FLAG%7Bfollow_the_location%7D`;
    return new Response(null, { status: 302, headers: { ...corsHeaders, Location: destination } });
  }
  if (stage === 7 && mode === "archive") return response({ status: "not_found", message: "RECORD NOT FOUND" });
  if (stage === 8 && mode === "header") return response({ status: "online", message: "no data" }, { headers: { "X-Trace-Note": "FLAG{headers_can_whisper}" } });
  if (stage === 10 && mode === "vault") return response({ status: "partial", fragment: "one_key}" });
  return response({ error: "Unknown trace channel" }, { status: 404 });
});
