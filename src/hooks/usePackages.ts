import { useQuery } from '@tanstack/react-query';
import { API_URL } from '../config/api.config';

export const usePackages = () => {
  return useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/packages`);
      if (!response.ok) {
        throw new Error('Failed to fetch packages');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useVendorPackages = (vendorId: string) => {
  return useQuery({
    queryKey: ['packages', 'vendor', vendorId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/packages/vendor/${vendorId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch vendor packages');
      }
      return response.json();
    },
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000,
  });
};

export const usePackageDetails = (packageId: string) => {
  return useQuery({
    queryKey: ['package', packageId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/packages/${packageId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch package details');
      }
      return response.json();
    },
    enabled: !!packageId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
