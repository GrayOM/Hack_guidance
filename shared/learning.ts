/**
 * Challenge inventory intentionally starts empty.
 * New safe exercises will be introduced only after the replacement design is approved.
 */
export type LearningChallenge = {
  id: number;
  level: number;
  title: string;
  category: string;
  objective: string;
  evidenceLabel: string;
  evidence: string[];
  question: string;
  hints: string[];
  defense: string;
};

export const learningChallenges: LearningChallenge[] = [];
export const challengeById = (_id: number): LearningChallenge | undefined => undefined;
