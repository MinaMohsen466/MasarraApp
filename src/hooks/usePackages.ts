import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
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
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Pagination types
export interface Package {
  _id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  occasion: string;
  vendor: any;
  service: any;
  customPrice: number;
  additionalServices: Array<{
    service: string;
    customPrice: number;
    _id: string;
  }>;
  totalPrice: number;
  discountPrice: number;
  isActive: boolean;
  images: string[];
  rating: number;
  totalReviews: number;
  createdAt: string;
}

export interface PaginatedPackagesResponse {
  packages: Package[];
  total: number;
  pages: number;
  currentPage: number;
}

export interface PackageFilters {
  page?: number;
  limit?: number;
  occasionId?: string;
  vendorId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

const PAGE_SIZE = 20;

/**
 * Fetch packages with pagination
 */
export const fetchPackagesWithPagination = async (
  filters: PackageFilters = {},
): Promise<PaginatedPackagesResponse> => {
  const params = new URLSearchParams();

  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.occasionId) params.append('occasionId', filters.occasionId);
  if (filters.vendorId) params.append('vendorId', filters.vendorId);
  if (filters.search) params.append('search', filters.search);
  if (filters.minPrice) params.append('minPrice', String(filters.minPrice));
  if (filters.maxPrice) params.append('maxPrice', String(filters.maxPrice));

  const response = await fetch(`${API_URL}/packages?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch packages');
  }
  return response.json();
};

/**
 * Hook for infinite scroll packages
 */
export const useInfinitePackages = (
  filters: Omit<PackageFilters, 'page' | 'limit'> = {},
) => {
  return useInfiniteQuery<PaginatedPackagesResponse, Error>({
    queryKey: ['packages', 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      return fetchPackagesWithPagination({
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
 * Helper to flatten paginated packages data
 */
export const flattenPackages = (
  data: { pages: PaginatedPackagesResponse[] } | undefined,
): Package[] => {
  return data?.pages.flatMap((page) => page.packages) || [];
};
