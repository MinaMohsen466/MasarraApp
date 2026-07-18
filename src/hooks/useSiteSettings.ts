import { useQuery } from '@tanstack/react-query';
import { fetchSiteSettings, SiteSettings } from '../services/api';
import { API_URL } from '../config/api.config';

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

const fetchAboutSettings = async () => {
  const response = await fetch(`${API_URL}/settings/about`);
  if (!response.ok) throw new Error('Failed to fetch about settings');
  return response.json();
};

const fetchTermsSettings = async () => {
  const response = await fetch(`${API_URL}/settings/terms`);
  if (!response.ok) throw new Error('Failed to fetch terms settings');
  return response.json();
};

const fetchPrivacySettings = async () => {
  const response = await fetch(`${API_URL}/settings/privacy`);
  if (!response.ok) throw new Error('Failed to fetch privacy settings');
  return response.json();
};

const fetchRefundSettings = async () => {
  const response = await fetch(`${API_URL}/settings/refund`);
  if (!response.ok) throw new Error('Failed to fetch refund settings');
  return response.json();
};

export const useAboutSettings = () => {
  return useQuery({
    queryKey: ['aboutSettings'],
    queryFn: fetchAboutSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes fresh time
    gcTime: 15 * 60 * 1000, // 15 minutes cache retention
  });
};

export const useTermsSettings = () => {
  return useQuery({
    queryKey: ['termsSettings'],
    queryFn: fetchTermsSettings,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

export const usePrivacySettings = () => {
  return useQuery({
    queryKey: ['privacySettings'],
    queryFn: fetchPrivacySettings,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

export const useRefundSettings = () => {
  return useQuery({
    queryKey: ['refundSettings'],
    queryFn: fetchRefundSettings,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};
