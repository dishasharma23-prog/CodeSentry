import useSWR from 'swr';
import { api } from '@/lib/api';
import { Repository } from '@/types';

export function useRepository(id: string) {
  const { data, error, isLoading, mutate } = useSWR<Repository>(
    id ? `/api/repositories/${id}` : null,
    () => api.getRepository(id),
    {
      refreshInterval: (data) => {
        if (!data) return 0;
        // Refresh every 3 seconds if status is parsing, indexing, cloning, or pending
        if (['pending', 'cloning', 'parsing', 'indexing'].includes(data.status)) {
          return 3000;
        }
        return 0;
      }
    }
  );

  return {
    repository: data,
    isLoading,
    isError: error,
    mutate
  };
}

export function useRepositories() {
  const { data, error, isLoading, mutate } = useSWR<Repository[]>(
    '/api/repositories',
    api.getRepositories,
    {
      refreshInterval: (data) => {
        if (!data) return 0;
        const hasPending = data.some(repo => ['pending', 'cloning', 'parsing', 'indexing'].includes(repo.status));
        return hasPending ? 3000 : 0;
      }
    }
  );

  return {
    repositories: data || [],
    isLoading,
    isError: error,
    mutate
  };
}
