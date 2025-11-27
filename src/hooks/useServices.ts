import { useQuery } from '@tanstack/react-query';
import { fetchServices, Service } from '../services/servicesApi';

/**
 * Custom hook to fetch services using React Query
 */
export const useServices = () => {
  return useQuery<Service[], Error>({
    queryKey: ['services'],
    queryFn: fetchServices,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
