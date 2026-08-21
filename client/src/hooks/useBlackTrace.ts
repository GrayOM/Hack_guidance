import { invokeLearning } from "@/lib/external-supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type BlackTraceProgress = { completedStages: number[]; currentStage: number; accessLevel: string; completed: boolean };

export function useBlackTraceProgress(enabled = true) {
  return useQuery({ queryKey: ["black-trace-progress"], queryFn: () => invokeLearning<BlackTraceProgress>("blackTraceProgress"), enabled, retry: false });
}

export function useBlackTraceSubmit(options?: { onSuccess?: (result: any) => void; onError?: (error: unknown) => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { stage: number; flag: string; hintCount: number }) => invokeLearning<any>("blackTraceSubmit", input),
    onSuccess: async result => { await queryClient.invalidateQueries({ queryKey: ["black-trace-progress"] }); options?.onSuccess?.(result); },
    onError: options?.onError,
  });
}
