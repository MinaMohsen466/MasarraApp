import { useQuery } from '@tanstack/react-query';
import { fetchSiteSettings, SiteSettings } from '../services/api';

/**
 * Custom hook to fetch site settings using React Query
 */
export const useSiteSettings = () => {
  return useQuery<SiteSettings, Error>({
    queryKey: ['siteSettings'],
    queryFn: fetchSiteSettings,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds (reduced for faster updates)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window/app regains focus
  });
};
