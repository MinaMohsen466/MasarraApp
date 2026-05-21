import { useQuery } from '@tanstack/react-query';
import { ActiveCoupon, fetchActiveCouponsFromBanner } from '../services/couponApi';

export const useActiveCoupons = () => {
  return useQuery<ActiveCoupon[], Error>({
    queryKey: ['activeCoupons'],
    queryFn: fetchActiveCouponsFromBanner,
    staleTime: 2 * 60 * 1000,
  });
};
