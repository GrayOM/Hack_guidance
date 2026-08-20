import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { isValidAccountPassword, updateSupabasePassword, usePlatformAuth } from "@/hooks/usePlatformAuth";
import { ConsoleNav } from "@/components/ConsoleNav";

export default function PasswordRecovery() {
  const { isAuthenticated, passwordRecovery, clearPasswordRecovery } = usePlatformAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmation) return setStatus("새 비밀번호가 서로 일치하지 않습니다.");
    setSubmitting(true);
    const result = await updateSupabasePassword({ password });
    setSubmitting(false);
    if (result === "updated") {
      clearPasswordRecovery();
      setPassword("");
      setConfirmation("");
      setStatus("새 비밀번호가 설정되었습니다. 이제 새 비밀번호로 로그인할 수 있습니다.");
      return;
    }
    setStatus(result === "invalid" ? "비밀번호는 8~72자로 입력해 주세요." : "비밀번호를 변경하지 못했습니다. 재설정 링크를 다시 요청해 주세요.");
  };

  return <div className="hacknet-shell min-h-screen bg-[#060b0d] text-[#e7f2ef]"><ConsoleNav /><main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-xl place-items-center px-4 py-12"><section className="hnet-panel w-full border border-[#315057] p-6 sm:p-8"><KeyRound className="h-7 w-7 text-teal-300" /><p className="mt-5 font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">PASSWORD RECOVERY</p><h1 className="mt-3 text-2xl font-semibold text-white">새 비밀번호 설정</h1><p className="mt-3 text-sm leading-6 text-slate-400">이메일의 재설정 링크로 인증한 뒤에만 새 비밀번호를 저장할 수 있습니다.</p>{!isAuthenticated && !passwordRecovery ? <p role="alert" className="mt-6 border-l-2 border-amber-200 bg-amber-200/[0.06] px-3 py-2 text-sm leading-6 text-amber-100">유효한 재설정 링크가 필요합니다. 로그인 창에서 비밀번호 재설정 이메일을 다시 요청해 주세요.</p> : <form onSubmit={submit} className="mt-7 space-y-4"><label className="block"><span className="font-mono-ui text-[10px] tracking-[.12em] text-slate-500">NEW PASSWORD</span><input type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={password} onChange={event => setPassword(event.target.value)} placeholder="8~72자" className="mt-2 h-11 w-full border border-[#31545a] bg-[#071013] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-teal-300" /></label><label className="block"><span className="font-mono-ui text-[10px] tracking-[.12em] text-slate-500">CONFIRM PASSWORD</span><input type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="새 비밀번호 다시 입력" className="mt-2 h-11 w-full border border-[#31545a] bg-[#071013] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-teal-300" /></label>{status ? <p role="status" className={`border-l-2 px-3 py-2 text-xs leading-5 ${status.includes("설정되었습니다") ? "border-teal-300 bg-teal-300/[0.06] text-teal-100" : "border-amber-200 bg-amber-200/[0.06] text-amber-100"}`}>{status}</p> : null}<button type="submit" disabled={submitting || !isValidAccountPassword(password)} className="inline-flex w-full items-center justify-center gap-2 bg-teal-300 px-4 py-3 text-sm font-semibold text-[#082023] transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-60"><ShieldCheck className="h-4 w-4" />{submitting ? "저장 중" : "새 비밀번호 저장"}</button></form>}</section></main></div>;
}
