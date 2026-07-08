/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL } from './apiUtils';

/**
 * Fetch addresses for the authenticated user
 */
export const fetchAddresses = async (token: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/addresses`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch addresses');
    }

    const responseData = await response.json();
    return responseData.data || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new address for the authenticated user
 */
export const createAddress = async (
  token: string,
  address: {
    name: string;
    street: string;
    block?: string;
    lane?: string;
    houseNumber?: string;
    floorNumber?: string;
    apartmentNumber?: string;
    city: string;
    isDefault?: boolean;
  },
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/addresses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(address),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create address');
    }

    const responseData = await response.json();
    return responseData.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing address
 */
export const updateAddress = async (
  token: string,
  addressId: string,
  address: {
    name: string;
    street: string;
    block?: string;
    lane?: string;
    houseNumber?: string;
    floorNumber?: string;
    apartmentNumber?: string;
    city: string;
    isDefault?: boolean;
  },
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(address),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update address');
    }

    const responseData = await response.json();
    return responseData.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete an address
 */
export const deleteAddress = async (token: string, addressId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete address');
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    throw error;
  }
};

/**
 * Set an address as default
 */
export const setDefaultAddress = async (token: string, addressId: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/addresses/${addressId}/default`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to set default address');
    }

    const responseData = await response.json();
    return responseData.data;
  } catch (error) {
    throw error;
  }
};
