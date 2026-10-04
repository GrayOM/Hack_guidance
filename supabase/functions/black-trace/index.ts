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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range, x-client-role",
    "Access-Control-Expose-Headers": "ETag, Content-Range, X-Ack-Note, X-Allowed-Note, X-Trace-Note",
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
  const url = new URL(request.url);
  const corsHeaders = corsHeadersFor(request, "GET, POST, OPTIONS");
  const response = responseWriter(corsHeaders);
  if (request.method === "OPTIONS" && url.searchParams.get("mode") !== "preflight") {
    return new Response(null, { headers: corsHeaders });
  }
  if (!["GET", "POST", "OPTIONS"].includes(request.method)) return response({ error: "Method not allowed" }, { status: 405 });
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

  // The bridge into chapter three. The mechanism is the header node's -- the trace rides a response
  // header and the body carries nothing -- so the only new thing the operator has to do is send the
  // request themselves instead of watching the page send one. One new idea per node.
  if (mode === "firsthand") {
    return response({ status: "online", body: "empty", note: "the answer did not travel in here" },
      { headers: { "X-Trace-Note": "FLAG{you_sent_that_one}" } });
  }

  // Chapter three: the operator stops watching requests and starts making them. Each of these
  // answers only when the request itself is shaped the way the node is about, so reading the
  // response is no longer enough.
  if (mode === "method") {
    if (request.method !== "POST") return response({ status: "method_not_allowed", allow: "POST" }, { status: 405, headers: { Allow: "POST, OPTIONS" } });
    return response({ status: "accepted", trace: "FLAG{the_verb_was_the_lock}" });
  }
  if (mode === "cookie") {
    // The attribute carries it, not the value: a session's protections are declared on the wire.
    return response({ status: "issued", session: "sid-7f21" }, {
      headers: { "Set-Cookie": `issuer_note=FLAG%7Bthe_flag_rode_the_cookie%7D; Path=/; Max-Age=600; SameSite=Lax` },
    });
  }
  if (mode === "role") {
    const claimed = (request.headers.get("x-client-role") ?? "").toLowerCase();
    if (claimed !== "operator") return response({ status: "ok", view: "public summary only", requires: "x-client-role" });
    return response({ status: "ok", view: "operator view", trace: "FLAG{it_believed_what_you_claimed}" });
  }
  if (mode === "referer") {
    // The referrer a page may declare is limited to its own origin, which is all this needs.
    const from = request.headers.get("referer") ?? "";
    if (!from.includes("partner-portal")) return response({ status: "forbidden", message: "internal referral required" }, { status: 403 });
    return response({ status: "ok", trace: "FLAG{it_trusted_where_you_came_from}" });
  }
  if (mode === "etag") {
    // A validator built from the content is a validator that describes the content.
    return response({ status: "ok", size: 2048 }, { headers: { ETag: '"FLAG{the_validator_remembered}"' } });
  }
  if (mode === "range") {
    if (!request.headers.get("range")) return response({ status: "ok", message: "full transfer refused", hint: "partial transfer supported" }, { headers: { "Accept-Ranges": "bytes" } });
    return new Response("FLAG{you_asked_for_a_piece}", {
      status: 206,
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8", "Content-Range": "bytes 0-25/2048" },
    });
  }
  if (mode === "preflight") {
    // The question the browser asks before the question, and what the answer admits to.
    return new Response(null, {
      status: 204,
      headers: { ...corsHeaders, "Access-Control-Allow-Methods": "GET, POST, PURGE", "Access-Control-Allow-Headers": "content-type, x-dispatch-note", "X-Allowed-Note": "FLAG{the_question_before_the_question}" },
    });
  }
  if (mode === "ack") {
    return new Response(null, { status: 204, headers: { ...corsHeaders, "X-Ack-Note": "FLAG{no_body_still_speaks}" } });
  }
  if (mode === "export") {
    // Declared as plain text, so the browser prints the document instead of rendering it.
    return new Response(`<report><row id="1"/><note>FLAG{declared_as_the_wrong_thing}</note></report>`, {
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  if (mode === "dispatch") {
    return response({ status: "staged", next: `?stage=${encodeURIComponent(stage)}&mode=dispatch-leg&ticket=7f21` });
  }
  if (mode === "dispatch-leg") {
    if (url.searchParams.get("ticket") !== "7f21") return response({ status: "no_ticket" }, { status: 404 });
    return response({ status: "ok", trace: "FLAG{the_first_answer_was_a_map}" });
  }
  return response({ error: "Unknown trace channel" }, { status: 404 });
});
