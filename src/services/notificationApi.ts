/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL } from './apiUtils';

/**
 * Fetch notifications from the server
 */
export const fetchServerNotifications = async (
  token: string,
  page: number = 1,
  limit: number = 20,
): Promise<{
  notifications: any[];
  unreadCount: number;
  total: number;
  hasMore: boolean;
}> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/notifications?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || errorData.message || 'Failed to fetch notifications',
      );
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Mark a notification as read on the server
 */
export const markServerNotificationRead = async (
  token: string,
  notificationId: string,
): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/notifications/${notificationId}/read`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error ||
          errorData.message ||
          'Failed to mark notification as read',
      );
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Mark all notifications as read on the server
 */
export const markAllServerNotificationsRead = async (
  token: string,
): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error ||
          errorData.message ||
          'Failed to mark all notifications as read',
      );
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a notification from the server
 */
export const deleteServerNotification = async (
  token: string,
  notificationId: string,
): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/notifications/${notificationId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || errorData.message || 'Failed to delete notification',
      );
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};
