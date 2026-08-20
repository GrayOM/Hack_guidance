import { trpc } from "@/lib/trpc";
import { invokeLearning, isExternalSupabaseDeployment } from "@/lib/external-supabase";
import { useMutation, useQuery } from "@tanstack/react-query";

type QueryOptions = { enabled?: boolean; retry?: boolean; refetchInterval?: number; refetchOnWindowFocus?: boolean };

const externalQuery = <T>(key: string, action: string, payload: Record<string, unknown> = {}, options?: QueryOptions) => useQuery({
  queryKey: ["hg-external", key, payload],
  queryFn: () => invokeLearning<T>(action, payload),
  enabled: options?.enabled ?? true,
  retry: options?.retry,
  refetchInterval: options?.refetchInterval,
  refetchOnWindowFocus: options?.refetchOnWindowFocus,
});

export function useLearningDashboard(options?: QueryOptions): any {
  return isExternalSupabaseDeployment
    ? externalQuery("dashboard", "dashboard", {}, options)
    : trpc.learning.dashboard.useQuery(undefined, options);
}

export function useLearningRecords(options?: QueryOptions): any {
  return isExternalSupabaseDeployment
    ? externalQuery("records", "records", {}, options)
    : trpc.learning.records.useQuery(undefined, options);
}

export function useLearningRanking(options?: QueryOptions): any {
  if (isExternalSupabaseDeployment) {
    const response = externalQuery<{ ranking: unknown[] }>("ranking", "ranking", {}, options);
    return { ...response, data: response.data?.ranking };
  }
  return trpc.learning.ranking.useQuery(undefined, options);
}

export function useVerifyCertificate(certificateCode: string, options?: QueryOptions): any {
  if (isExternalSupabaseDeployment) {
    const response = externalQuery<{ certificate: unknown }>("certificate", "verifyCertificate", { certificateCode }, options);
    return { ...response, data: response.data?.certificate ?? null };
  }
  return trpc.learning.verifyCertificate.useQuery({ certificateCode }, options);
}

export function useSubmitFlag(options?: { onSuccess?: (result: any) => void; onError?: (error: unknown) => void }): any {
  return isExternalSupabaseDeployment
    ? useMutation({ mutationFn: (input: { problemId: number; flag: string; hintCount: number }) => invokeLearning("submit", input), ...options })
    : trpc.learning.submit.useMutation(options);
}

export function useReviewDefense(options?: { onSuccess?: (result: any) => void; onError?: (error: unknown) => void }): any {
  return isExternalSupabaseDeployment
    ? useMutation({ mutationFn: (input: { problemId: number }) => invokeLearning("reviewDefense", input), ...options })
    : trpc.learning.reviewDefense.useMutation(options);
}

export function useIssueCertificate(options?: { onSuccess?: (result: any) => void; onError?: (error: unknown) => void }): any {
  return isExternalSupabaseDeployment
    ? useMutation({ mutationFn: () => invokeLearning("issueCertificate"), ...options })
    : trpc.learning.issueCertificate.useMutation(options);
}

export function useDisplayNameAvailability(displayName: string, options?: QueryOptions): any {
  const normalized = displayName.trim();
  return externalQuery<{ available: boolean; valid: boolean }>("display-name", "checkDisplayName", { displayName: normalized }, {
    ...options,
    enabled: (options?.enabled ?? true) && normalized.length >= 2,
  });
}

export function useAccountProfile(options?: QueryOptions): any {
  return externalQuery("account-profile", "profile", {}, options);
}

export function useUpdateDisplayName(options?: { onSuccess?: (result: any) => void; onError?: (error: unknown) => void }): any {
  return useMutation({ mutationFn: (input: { displayName: string }) => invokeLearning("updateDisplayName", input), ...options });
}
