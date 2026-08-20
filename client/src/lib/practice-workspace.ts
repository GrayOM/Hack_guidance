export type PracticeTrack = "surface" | "request" | "input" | "access" | "report";

export const practiceTrackForNode = (id: number): PracticeTrack | null => {
  if (id >= 1 && id <= 10) return "surface";
  if (id >= 11 && id <= 20) return "request";
  if (id >= 21 && id <= 30) return "input";
  if (id >= 31 && id <= 40) return "access";
  if (id >= 41 && id <= 50) return "report";
  return null;
};
