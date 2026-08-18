import { useEffect, useState } from "react";
import { CheckCircle2, Radio } from "lucide-react";
import { SIGNAL_LOCK_DURATION_MS } from "@/lib/signal-feedback";

export function SignalLockOverlay({ active, nodeId }: { active: boolean; nodeId: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timeout = window.setTimeout(() => setVisible(false), SIGNAL_LOCK_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [active]);

  if (!visible) return null;

  return (
    <div className="signal-lock" role="status" aria-live="polite">
      <div className="signal-lock__frame">
        <div className="signal-lock__scan" />
        <div className="signal-lock__icon"><CheckCircle2 className="h-7 w-7" /></div>
        <div>
          <p className="font-mono-ui text-[10px] tracking-[0.2em] text-teal-200">SIGNAL LOCKED // NODE {String(nodeId).padStart(2, "0")}</p>
          <p className="mt-1 text-sm font-semibold text-white">해결 기록을 안전하게 저장했습니다.</p>
        </div>
        <Radio className="signal-lock__radio h-4 w-4" />
      </div>
    </div>
  );
}
