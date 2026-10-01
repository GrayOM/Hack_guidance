import { invokeLearning } from "@/lib/external-supabase";
import { useMutation, useQuery } from "@tanstack/react-query";

type QueryOptions = { enabled?: boolean; retry?: boolean; refetchInterval?: number; refetchOnWindowFocus?: boolean };
type MutationOptions = { onSuccess?: (result: any) => void; onError?: (error: unknown) => void };

const externalQuery = <T>(key: string, action: string, payload: Record<string, unknown> = {}, options?: QueryOptions) => useQuery({
  queryKey: ["hg-external", key, payload],
  queryFn: () => invokeLearning<T>(action, payload),
  enabled: options?.enabled ?? true,
  retry: options?.retry,
  refetchInterval: options?.refetchInterval,
  refetchOnWindowFocus: options?.refetchOnWindowFocus,
});

export function useLearningRecords(options?: QueryOptions): any {
  const response = externalQuery<{ records: unknown[] }>("records", "records", {}, options);
  return { ...response, data: Array.isArray(response.data?.records) ? response.data.records : [] };
}

export function useLearningRanking(options?: QueryOptions): any {
  const response = externalQuery<{ ranking: unknown[] }>("ranking", "ranking", {}, options);
  return { ...response, data: response.data?.ranking };
}

export function useVerifyCertificate(certificateCode: string, options?: QueryOptions): any {
  const response = externalQuery<{ certificate: unknown }>("certificate", "verifyCertificate", { certificateCode }, options);
  return { ...response, data: response.data?.certificate ?? null };
}

export function useIssueCertificate(options?: MutationOptions): any {
  return useMutation({ mutationFn: () => invokeLearning("issueCertificate"), ...options });
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

export function useUpdateDisplayName(options?: MutationOptions): any {
  return useMutation({ mutationFn: (input: { displayName: string }) => invokeLearning("updateDisplayName", input), ...options });
}
