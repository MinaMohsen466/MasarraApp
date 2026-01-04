import { useQuery } from '@tanstack/react-query';
import { fetchVendors, Vendor } from '../services/vendorsApi';

export const useVendors = () => {
  return useQuery<Vendor[], Error>({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
    staleTime: 15 * 60 * 1000, // 15 minutes - vendors data doesn't change frequently
    cacheTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 2,
    refetchOnMount: false, // Use cached data on mount
    refetchOnWindowFocus: false,
  });
};
