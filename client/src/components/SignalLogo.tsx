/**
 * Design reminder — Signal Room Console: a precise, compact mark rather than a gaming emblem.
 */
export function SignalLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label="Hack Guidance signal mark" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4h7v7H4V4Zm17 0h7v7h-7V4ZM4 21h7v7H4v-7Zm10-8h4v4h-4v-4Zm7 8h7v7h-7v-7Z" fill="currentColor" />
      <path d="M14 4h4v4h-4V4Zm0 17h4v7h-4v-7Z" fill="currentColor" opacity=".45" />
    </svg>
  );
}
