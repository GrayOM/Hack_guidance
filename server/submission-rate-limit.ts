const MAX_SUBMISSIONS_PER_WINDOW = 12;
const WINDOW_MS = 60_000;

type SubmissionWindow = { timestamps: number[] };
const submissionWindows = new Map<number, SubmissionWindow>();

export function checkSubmissionRateLimit(userId: number, now = Date.now()) {
  const window = submissionWindows.get(userId) ?? { timestamps: [] };
  window.timestamps = window.timestamps.filter(timestamp => now - timestamp < WINDOW_MS);

  if (window.timestamps.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    const retryAfterSeconds = Math.max(1, Math.ceil((WINDOW_MS - (now - window.timestamps[0])) / 1000));
    submissionWindows.set(userId, window);
    return { allowed: false, retryAfterSeconds } as const;
  }

  window.timestamps.push(now);
  submissionWindows.set(userId, window);
  return { allowed: true, retryAfterSeconds: 0 } as const;
}

export function clearSubmissionRateLimitForTest() {
  submissionWindows.clear();
}
