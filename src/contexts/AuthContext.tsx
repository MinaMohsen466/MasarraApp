import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  updateUserProfileWithImage,
  changePassword as apiChangePassword,
  API_BASE_URL,
} from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (
    name: string,
    phone: string,
    profilePicture?: string,
    removeProfilePicture?: boolean,
  ) => Promise<void>;
  changeUserPassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{
  children: ReactNode;
  onLogout?: () => void;
}> = ({ children, onLogout }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data on app start
  useEffect(() => {
    loadUserData();
  }, []);

  const refreshUser = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      if (!storedToken) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });
      
      if (response.ok) {
        const freshUserData = await response.json();
        await AsyncStorage.setItem('userData', JSON.stringify(freshUserData));
        // Create a new object to ensure React detects the change
        setUser({ ...freshUserData });
      }
    } catch (error) {
      console.log('❌ Error refreshing user:', error);
    }
  };

  const loadUserData = async () => {
    try {
      console.log('📱 Loading user data from AsyncStorage...');
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');

      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        console.log('📦 Cached user data loaded:', {
          name: userData.name,
          profilePicture: userData.profilePicture
        });
        
        // First set cached data for quick load
        setToken(storedToken);
        setUser(userData);

        // Ensure userId is saved for cart (in case of old sessions)
        if (userData._id || userData.id) {
          const userId = userData._id || userData.id;
          await AsyncStorage.setItem('userId', userId);
        }
        
        // Then fetch fresh user data from server to sync
        console.log('🔄 Refreshing user data from server...');
        await refreshUser();
      } else {
        console.log('❌ No cached user data found');
      }
    } catch (error) {
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
      }
      setToken(authToken);
      setUser(userData);
    } catch (error) {
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

      // call optional onLogout callback (e.g. to navigate to home)
      try {
        if (onLogout) onLogout();
      } catch (err) {
      }
    } catch (error) {
      throw error;
    }
  };

  const updateUserProfile = async (
    name: string,
    phone: string,
    profilePicture?: string,
    removeProfilePicture?: boolean,
  ) => {
    try {
      if (!user || !token) {
        throw new Error('No user logged in');
      }

      // Call the API to update profile on the server
      const response = await updateUserProfileWithImage(
        token,
        name,
        phone,
        profilePicture,
        removeProfilePicture,
      );

      // Update with the returned user data from server
      const updatedUser = response.user;

      // Save to AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));

      // Update state - create new object to ensure React detects the change
      setUser({ ...updatedUser });

    } catch (error) {
      throw error;
    }
  };

  const changeUserPassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    try {
      if (!token) {
        throw new Error('No user logged in');
      }

      // Call the API to change password
      await apiChangePassword(token, currentPassword, newPassword);


      // After changing password, log out locally so user must re-authenticate
      try {
        // Attempt to call server logout to clear any refresh cookie
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch (err: any) {
        // non-fatal: server logout may fail if running on a different host in dev
        // Silent error handling
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

      // navigate to home if provided
      try {
        if (onLogout) onLogout();
      } catch (err) {
      }
    } catch (error) {
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
    refreshUser,
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
