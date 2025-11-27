import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, updateUserProfileWithImage, changePassword as apiChangePassword, API_BASE_URL } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (name: string, phone: string, profilePicture?: string) => Promise<void>;
  changeUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode; onLogout?: () => void }> = ({ children, onLogout }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data on app start
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');
      
      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        
        // Ensure userId is saved for cart (in case of old sessions)
        if (userData._id || userData.id) {
          const userId = userData._id || userData.id;
          await AsyncStorage.setItem('userId', userId);
        }
        
        console.log('✅ User data loaded from storage');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User, authToken: string) => {
    try {
      await AsyncStorage.setItem('userToken', authToken);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      // Save userId for user-specific cart
      if (userData._id) {
        await AsyncStorage.setItem('userId', userData._id);
        console.log('✅ UserId saved for cart:', userData._id);
      }
      setToken(authToken);
      setUser(userData);
      console.log('✅ User logged in and data saved');
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Import clearUserCart to clear cart data completely
      const { clearUserCart } = require('../services/cart');
      // Import clearWishlist to clear wishlist data
      const { clearWishlist } = require('../services/wishlist');
      
      // Clear user cart data first (before clearing user session)
      await clearUserCart();
      
      // Clear wishlist data
      await clearWishlist();
      
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('userId');
      setToken(null);
      setUser(null);
      
      console.log('✅ User logged out and data cleared');
      // call optional onLogout callback (e.g. to navigate to home)
      try {
        if (onLogout) onLogout();
      } catch (err) {
        console.warn('onLogout callback threw:', err);
      }
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw error;
    }
  };

  const updateUserProfile = async (name: string, phone: string, profilePicture?: string) => {
    try {
      if (!user || !token) {
        throw new Error('No user logged in');
      }

      // Call the API to update profile on the server
      const response = await updateUserProfileWithImage(token, name, phone, profilePicture);

      // Update with the returned user data from server
      const updatedUser = response.user;

      // Save to AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      
      // Update state
      setUser(updatedUser);
      
      console.log('✅ User profile updated');
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const changeUserPassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!token) {
        throw new Error('No user logged in');
      }

      // Call the API to change password
      await apiChangePassword(token, currentPassword, newPassword);
      
      console.log('✅ Password changed successfully');

      // After changing password, log out locally so user must re-authenticate
      try {
        // Attempt to call server logout to clear any refresh cookie
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch (err: any) {
        // non-fatal: server logout may fail if running on a different host in dev
        console.warn('Server logout call failed (non-fatal):', err?.message || err);
      }

      // Clear client state
      const { clearCartCache } = require('../services/cart');
      const { clearWishlist } = require('../services/wishlist');
      
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setToken(null);
      setUser(null);
      
      // Clear cart cache
      clearCartCache();
      
      // Clear wishlist
      await clearWishlist();
      
      console.log('✅ Logged out after password change');
      // navigate to home if provided
      try {
        if (onLogout) onLogout();
      } catch (err) {
        console.warn('onLogout callback threw:', err);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    isLoggedIn: !!user && !!token,
    login,
    logout,
    updateUserProfile,
    changeUserPassword,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
