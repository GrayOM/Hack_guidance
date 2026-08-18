export const SIGNAL_LOCK_DURATION_MS = 1_800;

export function shouldStartSignalLock(previouslyCorrect: boolean, isCorrect: boolean) {
  return !previouslyCorrect && isCorrect;
}
