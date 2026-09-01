import useSWR from 'swr';
import { api } from '@/lib/api';
import { Finding } from '@/types';

export function useFindings(repositoryId: string) {
  const { data, error, isLoading, mutate } = useSWR<Finding[]>(
    repositoryId ? `/api/repositories/${repositoryId}/findings` : null,
    () => api.getFindings(repositoryId)
  );

  return {
    findings: data || [],
    isLoading,
    isError: error,
    mutate
  };
}
