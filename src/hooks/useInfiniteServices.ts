import { useInfiniteQuery } from '@tanstack/react-query';
import {
    fetchServicesWithPagination,
    ServiceFilters,
    Service,
    PaginatedServicesResponse,
} from '../services/servicesApi';

const PAGE_SIZE = 20;

/**
 * Custom hook to fetch services with infinite scroll pagination
 */
export const useInfiniteServices = (
    filters: Omit<ServiceFilters, 'page' | 'limit'> = {},
) => {
    return useInfiniteQuery<PaginatedServicesResponse, Error>({
        queryKey: ['services', 'infinite', filters],
        queryFn: async ({ pageParam = 1 }) => {
            return fetchServicesWithPagination({
                ...filters,
                page: pageParam as number,
                limit: PAGE_SIZE,
            });
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.currentPage < lastPage.pages) {
                return lastPage.currentPage + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });
};

/**
 * Helper to flatten paginated services data into a single array
 */
export const flattenServices = (
    data: { pages: PaginatedServicesResponse[] } | undefined,
): Service[] => {
    return data?.pages.flatMap((page) => page.services) || [];
};
