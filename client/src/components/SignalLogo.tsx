/**
 * Design reminder — Signal Room Console: a precise, compact mark rather than a gaming emblem.
 */
export function SignalLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/manus-storage/hg-logo_a87e870d.png"
      alt="Hack Guidance signal mark"
      className={`object-contain ${className}`}
    />
  );
}
