/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL, User, parseJsonResponse } from './apiUtils';

export interface LoginResponse {
  token: string;
  user: User;
  message: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'customer' | 'vendor';
}

export interface SignupResponse {
  message: string;
  userId: string;
  requiresVerification: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

/**
 * Login user
 */
export const login = async (data: LoginData): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await parseJsonResponse(response);

    if (!response.ok) {
      // If server indicates verification required, throw an Error with extra properties
      if (response.status === 403 && responseData?.requiresVerification) {
        const e: any = new Error(responseData.error || 'Email not verified');
        e.requiresVerification = true;
        e.userId = responseData.userId;
        throw e;
      }
      throw new Error(responseData?.error || 'Login failed');
    }

    return responseData as LoginResponse;
  } catch (error) {
    // If this is a verification-required error we avoid logging to console
    if ((error as any)?.requiresVerification) {
      throw error;
    }
    throw error;
  }
};

/**
 * Fetch current user data from server
 * Useful to refresh user data and bypass local cache
 */
export const fetchCurrentUser = async (token: string): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user data');
    }

    const responseData = await response.json();
    return responseData.user;
  } catch (error) {
    throw error;
  }
};

/**
 * Signup user
 */
export const signup = async (data: SignupData): Promise<SignupResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(responseData?.error || 'Signup failed');
    }

    return responseData as SignupResponse;
  } catch (error) {
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  token: string,
  updates: Partial<User>,
): Promise<{ user: User; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Profile update failed');
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    throw error;
  }
};

/**
 * Update user profile with image
 */
export const updateUserProfileWithImage = async (
  token: string,
  name: string,
  phone: string,
  imageUri?: string,
  removeProfilePicture?: boolean,
): Promise<{ user: User; message: string }> => {
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('phone', phone);

    if (removeProfilePicture) {
      formData.append('removeProfilePicture', 'true');
    } else if (imageUri) {
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('profilePicture', {
        uri: imageUri,
        name: filename,
        type,
      } as any);
    }

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const responseData = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(responseData?.error || 'Profile update failed');
    }

    return responseData;
  } catch (error) {
    throw error;
  }
};

/**
 * Change user password
 */
export const changePassword = async (
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    // Get response text first to safely parse
    const responseText = await response.text();

    // Try to parse as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      // If response is not JSON, create error object from text
      if (!response.ok) {
        throw new Error(responseText || 'Password change failed');
      }
      return { message: responseText || 'Password changed successfully' };
    }

    if (!response.ok) {
      throw new Error(
        responseData.error || responseData.message || 'Password change failed',
      );
    }

    return responseData;
  } catch (error) {
    throw error;
  }
};
