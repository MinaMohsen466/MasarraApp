import { useQuery } from '@tanstack/react-query';
import { fetchVendors, Vendor } from '../services/vendorsApi';

export const useVendors = () => {
  return useQuery<Vendor[], Error>({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
