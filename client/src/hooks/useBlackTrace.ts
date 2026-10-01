import { invokeLearning } from "@/lib/external-supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type BlackTraceProgress = { completedStages: number[]; currentStage: number; accessLevel: string; completed: boolean };

export function useBlackTraceProgress(enabled = true) {
  return useQuery({ queryKey: ["black-trace-progress"], queryFn: () => invokeLearning<BlackTraceProgress>("blackTraceProgress"), enabled, retry: false });
}

export type BlackTraceSurface = { stage: number; token: string | null };

/** Fetches only the current node's trace. A failure (guest, or a learning function without the
 *  surface action) leaves the token null, which keeps the pre-rotation trace in place. */
export function useBlackTraceSurface(stage: number, enabled: boolean) {
  return useQuery({
    queryKey: ["black-trace-surface", stage],
    queryFn: () => invokeLearning<BlackTraceSurface>("blackTraceSurface", { stage }),
    enabled: enabled && Number.isInteger(stage),
    retry: false,
  });
}

export function useBlackTraceSubmit(options?: { onSuccess?: (result: any) => void; onError?: (error: unknown) => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { stage: number; flag: string; hintCount: number }) => invokeLearning<any>("blackTraceSubmit", input),
    onSuccess: async result => { await queryClient.invalidateQueries({ queryKey: ["black-trace-progress"] }); options?.onSuccess?.(result); },
    onError: options?.onError,
  });
}
