import { useEffect, useState } from "react";
import { Activity, BadgeCheck, KeyRound, Save, ShieldCheck, UserRound } from "lucide-react";
import { startPlatformLogin, isValidDisplayName, usePlatformAuth } from "@/hooks/usePlatformAuth";
import { useAccountProfile, useDisplayNameAvailability, useUpdateDisplayName } from "@/hooks/useLearningApi";
import { ConsoleNav } from "@/components/ConsoleNav";

export default function MyPage() {
  const { isAuthenticated, user, refresh } = usePlatformAuth();
  const profile = useAccountProfile({ enabled: isAuthenticated, retry: false });
  const [displayName, setDisplayName] = useState("");
  const availability = useDisplayNameAvailability(displayName, {
    enabled: isAuthenticated && isValidDisplayName(displayName),
    retry: false,
  });
  const updateDisplayName = useUpdateDisplayName({
    onSuccess: async () => {
      await profile.refetch();
      await refresh();
    },
  });

  useEffect(() => {
    if (profile.data?.profile?.displayName) setDisplayName(profile.data.profile.displayName);
  }, [profile.data?.profile?.displayName]);

  if (!isAuthenticated) {
    return <div className="hacknet-shell min-h-screen bg-[#060b0d] text-slate-100"><ConsoleNav /><main className="grid place-items-center p-6 pt-28 text-center"><div className="max-w-md"><UserRound className="mx-auto h-8 w-8 text-teal-300" /><p className="mt-5 font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">OPERATOR PROFILE</p><h1 className="mt-3 text-2xl font-semibold">마이페이지는 로그인 후 이용할 수 있습니다.</h1><p className="mt-3 text-sm leading-6 text-slate-400">공개명과 학습 요약을 확인하고, 공개 랭킹에 표시할 이름을 직접 수정할 수 있습니다.</p><button onClick={startPlatformLogin} className="mt-6 bg-teal-300 px-4 py-2.5 text-sm font-semibold text-[#092024]">로그인하여 마이페이지 열기</button></div></main></div>;
  }

  const account = profile.data?.profile;
  const summary = profile.data?.summary;
  const originalName = account?.displayName ?? "";
  const nameChanged = displayName.trim() !== originalName;
  const invalidName = displayName.length > 0 && !isValidDisplayName(displayName);
  const unavailable = nameChanged && availability.data?.available === false;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nameChanged || invalidName || unavailable) return;
    updateDisplayName.mutate({ displayName: displayName.trim() });
  };

  return <div className="hacknet-shell min-h-screen bg-[#060b0d] text-[#e7f2ef]"><ConsoleNav /><main className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><p className="font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">OPERATOR PROFILE / ACCOUNT CONTROL</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">마이페이지</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">이메일과 공개명, 현재 학습 상태를 확인합니다. 공개명은 공개 랭킹과 수료 공개 검증에 표시됩니다.</p>
    <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="hnet-panel border border-[#315057] p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center border border-teal-300/35 bg-teal-300/[0.06] text-teal-200"><UserRound className="h-5 w-5" /></span><div><p className="font-mono-ui text-[10px] tracking-[0.16em] text-teal-300">PUBLIC IDENTITY</p><h2 className="mt-1 text-lg font-semibold text-white">공개명 설정</h2></div></div>
        {profile.isLoading ? <p className="mt-8 text-sm text-slate-400">프로필을 불러오는 중입니다.</p> : <form onSubmit={submit} className="mt-7"><label className="block"><span className="font-mono-ui text-[10px] tracking-[.12em] text-slate-500">PUBLIC NAME</span><input value={displayName} onChange={event => setDisplayName(event.target.value)} minLength={2} maxLength={24} className="mt-2 h-11 w-full border border-[#31545a] bg-[#071013] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-teal-300" /></label><div className="mt-2 min-h-5 text-xs leading-5">{invalidName ? <p className="text-amber-200">공개명은 2~24자의 한글·영문·숫자·공백·밑줄·하이픈만 사용할 수 있습니다.</p> : unavailable ? <p className="text-rose-300">이미 사용 중인 공개명입니다. 다른 이름을 입력해 주세요.</p> : nameChanged && availability.isFetching ? <p className="text-slate-500">공개명 사용 가능 여부를 확인하는 중입니다.</p> : nameChanged && availability.data?.available ? <p className="text-teal-200">사용 가능한 공개명입니다.</p> : <p className="text-slate-500">공개명은 대소문자를 구분하지 않고 한 번만 사용할 수 있습니다.</p>}</div><button type="submit" disabled={!nameChanged || invalidName || unavailable || availability.isFetching || updateDisplayName.isPending} className="mt-5 inline-flex items-center gap-2 bg-teal-300 px-4 py-2.5 text-sm font-semibold text-[#082023] transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" />{updateDisplayName.isPending ? "저장 중" : "공개명 저장"}</button>{updateDisplayName.isError ? <p role="alert" className="mt-3 text-xs text-rose-300">공개명을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.</p> : null}</form>}</section>
      <aside className="space-y-5"><section className="hnet-panel border border-[#315057] p-5"><p className="font-mono-ui text-[10px] tracking-[0.16em] text-teal-300">ACCOUNT</p><div className="mt-4 space-y-4"><div><p className="font-mono-ui text-[9px] tracking-[.12em] text-slate-600">EMAIL ADDRESS</p><p className="mt-1 break-all text-sm text-slate-200">{user?.email ?? "-"}</p></div><div><p className="font-mono-ui text-[9px] tracking-[.12em] text-slate-600">PUBLIC NAME</p><p className="mt-1 text-sm text-teal-100">{account?.displayName ?? "불러오는 중"}</p></div><div className="border-t border-[#294247] pt-4 text-xs leading-5 text-slate-400"><KeyRound className="mr-1.5 inline h-3.5 w-3.5 text-teal-300" />비밀번호 변경은 로그인 창의 재설정 링크를 이용합니다.</div></div></section>
        <section className="hnet-panel border border-[#315057] p-5"><p className="font-mono-ui text-[10px] tracking-[0.16em] text-teal-300">OPERATION SUMMARY</p><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="border border-[#294247] bg-[#071013] px-2 py-3"><Activity className="mx-auto h-3.5 w-3.5 text-teal-300" /><p className="mt-2 font-mono-ui text-sm text-slate-100">{summary?.solvedCount ?? 0}/10</p><p className="mt-1 text-[10px] text-slate-500">회수</p></div><div className="border border-[#294247] bg-[#071013] px-2 py-3"><ShieldCheck className="mx-auto h-3.5 w-3.5 text-teal-300" /><p className="mt-2 font-mono-ui text-sm text-slate-100">BLACK TRACE</p><p className="mt-1 text-[10px] text-slate-500">작전</p></div><div className="border border-[#294247] bg-[#071013] px-2 py-3"><BadgeCheck className="mx-auto h-3.5 w-3.5 text-teal-300" /><p className="mt-2 font-mono-ui text-sm text-slate-100">{(summary?.solvedCount ?? 0) === 10 ? "COMPLETE" : "ACTIVE"}</p><p className="mt-1 text-[10px] text-slate-500">상태</p></div></div></section></aside></div></main></div>;
}
