/** The previous problem catalogue was removed. New exercises will be designed from a clean slate. */
export type ProblemStatus = "available" | "locked" | "complete";

export type LabProblem = {
  id: number;
  level: number;
  title: string;
  shortTitle: string;
  category: string;
  difficulty: "Foundation" | "Core" | "Practice" | "Final";
  duration: string;
  goal: string;
  observation: string[];
  hints: string[];
  outcome: string;
  source?: "existing";
};

export const levels: Array<{ id: number; title: string; label: string; description: string; categories: string[]; range: string }> = [];
export const problems: LabProblem[] = [];
export const getUniqueProblems = () => [] as LabProblem[];
export const filterProblemDirectory = (_filters: { sector?: number | "all"; query?: string } = {}) => [] as LabProblem[];
export const getProblem = (_id: number): LabProblem | undefined => undefined;
