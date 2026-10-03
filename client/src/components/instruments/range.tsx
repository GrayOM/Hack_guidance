import { useState } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import { callRange, type RangeReply } from "@/lib/external-supabase";
import type { InstrumentProps } from "./types";

/**
 * The practice range console: chapter five's instrument, and the first one the operator types into.
 *
 * Every node before this one was solved by reading something the browser was already holding. These
 * five are solved by changing what gets sent, so the console is a small request builder: the fields
 * it shows are the parameters the mock application takes, and the reply is printed verbatim,
 * status line and body, because on these nodes the refusal is what the operator has to read.
 *
 * The fields are deliberately pre-filled with the ordinary, correct values. Nothing here says what
 * to put in them instead -- the field kit hints at the shape of the question and the operator has
 * to make the connection, which is the whole exercise.
 */

type Field = { name: string; label: string; initial: string; note: string; placeholder?: string; long?: boolean; numeric?: boolean };
type Action = {
  label: string;
  send: (values: Record<string, string>) => Parameters<typeof callRange>;
  /** Fills a field from the reply, so a two-step node does not make the operator copy by hand. */
  captures?: { field: string; from: string };
  /** How many copies of the request go out at once, read from a field. One unless named. */
  parallelField?: string;
};
type ConsoleConfig = { title: string; endpoint: string; fields: Field[]; actions: Action[]; resettable?: boolean };

const consoles: Record<string, ConsoleConfig> = {
  "someone-elses-order": {
    title: "ORDER LOOKUP",
    endpoint: "GET /orders?id=",
    fields: [{ name: "id", label: "order_id", initial: "1041", note: "내 주문 번호" }],
    actions: [{ label: "FETCH ORDER", send: values => ["order", { query: { id: values.id } }] }],
  },
  "role-in-the-token": {
    title: "TOKEN ISSUER / VAULT",
    endpoint: "GET /vault  (X-Range-Token)",
    fields: [{ name: "token", label: "x_range_token", initial: "", note: "발급받은 토큰이 여기 들어갑니다", placeholder: "header.payload.signature", long: true }],
    actions: [
      { label: "REQUEST TOKEN", send: () => ["issue", {}], captures: { field: "token", from: "token" } },
      { label: "OPEN VAULT", send: values => ["vault", { headers: { "x-range-token": values.token } }] },
    ],
  },
  "up-one-level": {
    title: "DOCUMENT READER",
    endpoint: "GET /docs?name=",
    fields: [{ name: "name", label: "name", initial: "manual.txt", note: "공개 폴더의 파일 이름", long: true }],
    actions: [{ label: "FETCH DOCUMENT", send: values => ["doc", { query: { name: values.name } }] }],
  },
  "twice-at-once": {
    title: "COUPON SERVICE",
    endpoint: "POST /coupon/apply",
    fields: [{ name: "parallel", label: "requests_at_once", initial: "1", note: "한 번에 내보낼 요청 수", numeric: true }],
    actions: [{ label: "APPLY COUPON", send: () => ["coupon", { method: "POST", body: {} }], parallelField: "parallel" }],
    resettable: true,
  },
  "negative-quantity": {
    title: "CHECKOUT",
    endpoint: "POST /checkout  (unit 12,000 / credit 50,000)",
    fields: [{ name: "quantity", label: "quantity", initial: "1", note: "주문 수량", numeric: true }],
    actions: [{ label: "SUBMIT ORDER", send: values => ["checkout", { method: "POST", body: { quantity: Number(values.quantity) } }] }],
  },
};

/** The reply the operator reads: the status line, then the body as it arrived. */
export function rangeReplyLines(reply: RangeReply, label: string) {
  const status = `${reply.status} ${reply.status < 300 ? "OK" : reply.status < 500 ? "REFUSED" : "ERROR"}`;
  const marker = reply.status < 300 ? ">" : "[!]";
  return [`> ${label}`, `${marker} ${status}`, ...formatBody(reply.raw)];
}

/** One field per line. A single-line JSON blob is unreadable in a narrow console column. */
function formatBody(raw: string) {
  if (!raw) return ["> (빈 응답)"];
  try {
    return JSON.stringify(JSON.parse(raw), null, 2).split("\n").map(line => `  ${line}`);
  } catch {
    return [`  ${raw.slice(0, 400)}`];
  }
}

/** Bounded before it is sent, not after: a field the operator can type into is an input like any other. */
export const parallelCount = (value: string) => Math.min(8, Math.max(1, Math.floor(Number(value)) || 1));

export function RangeConsole({ nodeKey, onLog, onBusy, onDone }: InstrumentProps) {
  const config = consoles[nodeKey];
  const [values, setValues] = useState<Record<string, string>>(
    () => Object.fromEntries(config.fields.map(field => [field.name, field.initial])));
  const [reply, setReply] = useState<RangeReply | null>(null);
  const [sending, setSending] = useState(false);

  const run = async (action: Action) => {
    if (sending) return;
    setSending(true);
    onBusy();
    const count = action.parallelField ? parallelCount(values[action.parallelField]) : 1;
    const label = count > 1 ? `${config.endpoint}  x${count}` : config.endpoint;
    onLog([`> ${label}`, "> waiting..."]);
    try {
      const [mode, options] = action.send(values);
      // Fired together rather than in sequence, because on one of these nodes that is the point.
      const replies = await Promise.all(Array.from({ length: count }, () => callRange(mode, options)));
      // The last interesting reply is the one shown: with several in flight, a refusal from the
      // first would otherwise hide the answer that came back on the second.
      const shown = replies.find(one => one.body.trace) ?? replies[replies.length - 1];
      setReply(shown);
      if (action.captures) {
        const captured = shown.body[action.captures.from];
        if (typeof captured === "string") setValues(previous => ({ ...previous, [action.captures!.field]: captured }));
      }
      onLog(count > 1
        ? [`> ${label}`, ...replies.flatMap((one, index) => rangeReplyLines(one, `reply ${index + 1}`).slice(1))]
        : rangeReplyLines(shown, label));
    } catch (error) {
      setReply(null);
      onLog([`> ${label}`, "[-] 모의 응용프로그램에 연결하지 못했습니다.", `> ${error instanceof Error ? error.message : "unknown"}`]);
    }
    setSending(false);
    onDone();
  };

  const reset = async () => {
    setSending(true);
    onLog(["> POST /coupon/reset", "> waiting..."]);
    try {
      const cleared = await callRange("reset", { method: "POST", body: {} });
      setReply(cleared);
      onLog(rangeReplyLines(cleared, "POST /coupon/reset"));
    } catch {
      onLog(["[-] 초기화에 실패했습니다."]);
    }
    setSending(false);
  };

  return <div className="bt-range">
    <p className="bt-range__title">{config.title}</p>
    <p className="bt-range__endpoint">{config.endpoint}</p>
    <div className="bt-range__fields">
      {config.fields.map(field => <label key={field.name} className={`bt-range__field${field.long ? " is-long" : ""}`}>
        <span>{field.label}</span>
        <input
          value={values[field.name]}
          onChange={event => setValues(previous => ({ ...previous, [field.name]: event.target.value }))}
          inputMode={field.numeric ? "numeric" : "text"}
          placeholder={field.placeholder ?? ""}
          spellCheck={false}
          autoComplete="off"
          aria-label={field.label}
        />
        <em>{field.note}</em>
      </label>)}
    </div>
    <div className="bt-range__actions">
      {config.actions.map(action => <button key={action.label} type="button" className="bt-action-button" disabled={sending} onClick={() => run(action)}>
        {sending ? "SENDING" : action.label} <ChevronRight size={16} />
      </button>)}
      {config.resettable
        ? <button type="button" className="bt-range__reset" disabled={sending} onClick={reset}><RotateCcw size={14} /> RESET</button>
        : null}
    </div>
    <div className={`bt-range__reply${reply ? " is-answered" : ""}`} aria-live="polite">
      {reply
        ? <>
            <span className={`bt-range__status${reply.status < 300 ? " is-ok" : " is-refused"}`}>{reply.status}</span>
            <pre>{formatBody(reply.raw).join("\n").replace(/^ {2}/gm, "")}</pre>
          </>
        : <p className="bt-range__idle">응답 대기 중 · 값을 넣고 요청을 보내면 서버가 돌려준 내용이 그대로 표시됩니다.</p>}
    </div>
  </div>;
}
