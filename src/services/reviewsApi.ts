import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL } from './api';

export interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  service: string;
  vendor: {
    _id: string;
    name: string;
  };
  rating: number;
  comment: string;
  vendorReply?: {
    text: string;
    createdAt: string;
  };
  isVerifiedPurchase: boolean;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface ReviewsResponse {
  reviews: Review[];
  stats: ReviewStats;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalReviews: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Get reviews for a service
export async function getServiceReviews(
  serviceId: string,
  page: number = 1,
  limit: number = 10,
): Promise<ReviewsResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/reviews/service/${serviceId}?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch reviews');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Create a new review
export async function createReview(
  serviceId: string,
  rating: number,
  comment: string,
  bookingId?: string,
): Promise<Review> {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      throw new Error('Authentication required');
    }

    // Validate serviceId
    if (!serviceId || serviceId === 'undefined') {
      throw new Error('Invalid service ID');
    }

    const url = `${API_BASE_URL}/reviews/service/${serviceId}`;
    console.log('[createReview] Sending to URL:', url);
    console.log('[createReview] Data:', { rating, comment: comment.substring(0, 50), bookingId });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        rating,
        comment,
        bookingId,
      }),
    });

    console.log('[createReview] Response status:', response.status);

    // Check content type before parsing
    const contentType = response.headers.get('content-type');
    console.log('[createReview] Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      // Try to get the text to see what was returned
      const text = await response.text();
      console.log('[createReview] Non-JSON response:', text.substring(0, 200));
      throw new Error('Server error - please try again later');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to create review');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
}

// Check if user already reviewed a service
export async function checkUserReviewedService(
  serviceId: string,
): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      return false;
    }

    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      return false;
    }

    const reviewsResponse = await getServiceReviews(serviceId, 1, 100);

    return reviewsResponse.reviews.some(review => review.user._id === userId);
  } catch (error) {
    return false;
  }
}
