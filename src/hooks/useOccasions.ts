import { useQuery } from '@tanstack/react-query';
import { fetchOccasions, Occasion } from '../services/api';

/**
 * Custom hook to fetch occasions using React Query
 */
export const useOccasions = () => {
  return useQuery<Occasion[], Error>({
    queryKey: ['occasions'],
    queryFn: fetchOccasions,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnMount: true, // Refetch when component mounts
  });
};
