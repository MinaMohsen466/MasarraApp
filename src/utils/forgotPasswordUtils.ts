import { API_URL } from '../config/api.config';

export const sendForgotPasswordCode = async (email: string) => {
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    // Safely parse response
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      if (!response.ok) {
        return {
          success: false,
          error: responseText || 'Failed to send reset code',
        };
      }
      return { success: true, userId: null };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Failed to send reset code',
      };
    }

    return {
      success: true,
      userId: data.userId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
};

export const resetPasswordWithCode = async (
  userId: string,
  resetCode: string,
  newPassword: string,
) => {
  try {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        resetCode,
        newPassword,
      }),
    });

    // Safely parse response
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      if (!response.ok) {
        return {
          success: false,
          error: responseText || 'Failed to reset password',
        };
      }
      return { success: true };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Failed to reset password',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
};
