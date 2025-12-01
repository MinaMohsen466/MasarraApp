import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, checkTimeSlotAvailability } from './api';

const CART_STORAGE_PREFIX = '@masarra_cart_';

export type CartItem = {
  _id: string;
  serviceId: string;
  vendorId: string;
  name: string;
  nameAr?: string;
  vendorName?: string;
  image?: string;
  price: number;
  quantity: number;
  selectedDate: Date | string;
  selectedTime: string;
  customInputs?: Array<{ label: string; value: string | number; price?: number }>;
  moreInfo?: string;
  timeSlot: { start: string | Date; end: string | Date };
  availabilityStatus?: 'available_now' | 'pending_confirmation';
  maxBookingsPerSlot?: number; // -1 for unlimited, 1 (or other number) for limited
};

// In-memory cache to avoid reading from AsyncStorage repeatedly
let cartCache: CartItem[] | null = null;
let cacheUserId: string | null = null;

// Event listeners for cart changes
type CartChangeListener = () => void;
const cartChangeListeners: Set<CartChangeListener> = new Set();

export function subscribeToCartChanges(listener: CartChangeListener): () => void {
  cartChangeListeners.add(listener);
  // Return unsubscribe function
  return () => {
    cartChangeListeners.delete(listener);
  };
}

function notifyCartChange(): void {
  cartChangeListeners.forEach(listener => {
    try {
      listener();
    } catch (error) {
      // Error handling for cart change listener
    }
  });
}

// Helper to get auth token
async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch (e) {
    return null;
  }
}

// Helper to get user ID from token (simplified - extracts from JWT or storage)
async function getUserId(): Promise<string> {
  try {
    const userId = await AsyncStorage.getItem('userId');
    if (userId) {
      return userId;
    }
    
    // Try to get from userData as fallback
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        const id = parsed._id || parsed.id;
        if (id) {
          // Cache the userId for next time
          await AsyncStorage.setItem('userId', id);
          return id;
        }
      } catch (parseError) {
        // Failed to parse userData
      }
    }
    
    // If no userId found and user is not logged in, use 'guest' as fallback
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      // User is not logged in - this is expected, use guest silently
      return 'guest';
    }
    
    // User appears to be logged in but no userId found - this is unexpected
    return 'guest';
  } catch (e) {
    return 'guest';
  }
}

// Get cart storage key for current user
async function getCartStorageKey(): Promise<string> {
  const userId = await getUserId();
  return `${CART_STORAGE_PREFIX}${userId}`;
}

// Get cart from local storage (specific to current user)
export async function getCart(): Promise<CartItem[]> {
  try {
    // Check if user is logged in
    const token = await getAuthToken();
    if (!token) {
      return [];
    }
    
    const userId = await getUserId();
    
    // If cache exists and is for the same user, return it
    if (cartCache !== null && cacheUserId === userId) {
      // Silently return cached cart - no need to log every time
      return cartCache;
    }
    
    // Otherwise, load from storage
    const storageKey = await getCartStorageKey();
    const cartData = await AsyncStorage.getItem(storageKey);
    if (!cartData) {
      cartCache = [];
      cacheUserId = userId;
      return [];
    }
    const items: CartItem[] = JSON.parse(cartData);
    
    // Update cache
    cartCache = items;
    cacheUserId = userId;
    
    return items;
  } catch (e) {
    return [];
  }
}

// Save cart to local storage (specific to current user)
async function saveCart(items: CartItem[]): Promise<void> {
  try {
    const userId = await getUserId();
    const storageKey = await getCartStorageKey();
    await AsyncStorage.setItem(storageKey, JSON.stringify(items));
    
    // Update cache
    cartCache = items;
    cacheUserId = userId;
    
    // Notify all listeners that cart has changed
    notifyCartChange();
  } catch (e) {
    throw new Error('Failed to save cart');
  }
}

// Add item to cart (local storage only)
export async function addToCart(item: CartItem): Promise<CartItem[]> {
  try {
    // Check if user is logged in
    const token = await getAuthToken();
    if (!token) {
      throw new Error('User must be logged in to add items to cart');
    }
    
    // Ensure required fields are present
    if (!item.serviceId || !item.selectedDate || !item.selectedTime) {
      throw new Error('Service ID, date, and time are required');
    }

    if (!item.timeSlot || !item.timeSlot.start || !item.timeSlot.end) {
      throw new Error('Time slot is required');
    }

    // Generate unique ID for the cart item
    const cartId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const cartItem: CartItem = {
      ...item,
      _id: cartId,
      quantity: item.quantity || 1
    };

    // Get existing cart
    const currentCart = await getCart();
    
    // Check if same service, date, and time already exists
    const existingItemIndex = currentCart.findIndex(
      existingItem =>
        existingItem.serviceId === item.serviceId &&
        existingItem.selectedDate === item.selectedDate &&
        existingItem.selectedTime === item.selectedTime
    );

    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      currentCart[existingItemIndex].quantity += cartItem.quantity;
    } else {
      // Add new item
      currentCart.push(cartItem);
    }

    await saveCart(currentCart);
    return currentCart;
  } catch (e) {
    throw e;
  }
}

// Remove item from cart
export async function removeFromCart(cartItemId: string): Promise<CartItem[]> {
  try {
    const currentCart = await getCart();
    const updatedCart = currentCart.filter(item => item._id !== cartItemId);
    await saveCart(updatedCart);
    return updatedCart;
  } catch (e) {
    throw e;
  }
}

// Update cart item quantity
export async function updateCartItemQuantity(cartItemId: string, quantity: number): Promise<CartItem[]> {
  try {
    if (quantity <= 0) {
      return removeFromCart(cartItemId);
    }

    const currentCart = await getCart();
    const itemIndex = currentCart.findIndex(item => item._id === cartItemId);
    
    if (itemIndex !== -1) {
      currentCart[itemIndex].quantity = quantity;
      await saveCart(currentCart);
    }
    
    return currentCart;
  } catch (e) {
    throw e;
  }
}

// Clear cart (for current user)
export async function clearCart(): Promise<CartItem[]> {
  try {
    const storageKey = await getCartStorageKey();
    await AsyncStorage.removeItem(storageKey);
    
    // Clear cache
    cartCache = [];
    
    // Notify listeners
    notifyCartChange();
    
    return [];
  } catch (e) {
    throw e;
  }
}

// Clear cart cache (useful when switching users or logging out)
export function clearCartCache(): void {
  cartCache = null;
  cacheUserId = null;
}

// Clear all cart data for current user (storage + cache)
export async function clearUserCart(): Promise<void> {
  try {
    const storageKey = await getCartStorageKey();
    await AsyncStorage.removeItem(storageKey);
    cartCache = null;
    cacheUserId = null;
    notifyCartChange();
  } catch (e) {
    // Error clearing user cart
  }
}

// Get cart count
export async function getCartCount(): Promise<number> {
  const items = await getCart();
  return items.reduce((total, item) => total + item.quantity, 0);
}

// Check availability of all cart items before checkout
export async function checkCartAvailability(): Promise<{
  available: boolean;
  unavailableItems: Array<{
    item: CartItem;
    reason: string;
  }>;
}> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const cartItems = await getCart();
    const unavailableItems: Array<{ item: CartItem; reason: string }> = [];

    for (const item of cartItems) {
      try {
        // Parse selected date
        const selectedDate = new Date(item.selectedDate);
        
        // Check if date is in the past
        const now = new Date();
        if (selectedDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
          unavailableItems.push({
            item,
            reason: 'Date is in the past'
          });
          continue;
        }

        // Get available time slots from backend
        const slots = await checkTimeSlotAvailability(
          item.serviceId,
          item.vendorId,
          selectedDate,
          token
        );

        // Find the slot that matches the selected time
        const matchingSlot = slots.find(slot => slot.timeSlot === item.selectedTime);

        if (!matchingSlot) {
          unavailableItems.push({
            item,
            reason: 'Time slot no longer available'
          });
          continue;
        }

        if (!matchingSlot.available) {
          unavailableItems.push({
            item,
            reason: `Time slot fully booked (${matchingSlot.bookingsCount} bookings)`
          });
          continue;
        }

      } catch (error) {
        unavailableItems.push({
          item,
          reason: 'Error checking availability'
        });
      }
    }

    const allAvailable = unavailableItems.length === 0;

    return {
      available: allAvailable,
      unavailableItems
    };
  } catch (e) {
    throw e;
  }
}

// Create bookings from cart items in the backend
export async function createBookingsFromCart(address?: string): Promise<{
  success: boolean;
  bookings: any[];
  errors: any[];
}> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const cartItems = await getCart();
    const bookings: any[] = [];
    const errors: any[] = [];

    for (const item of cartItems) {
      try {
        // Convert customInputs from array to object format
        const customInputsObject: { [key: string]: string | number } = {};
        if (item.customInputs && Array.isArray(item.customInputs)) {
          item.customInputs.forEach(input => {
            customInputsObject[input.label] = input.value;
          });
        }
        
        const bookingData = {
          serviceId: item.serviceId,
          eventDate: item.selectedDate,
          timeSlot: {
            start: item.timeSlot.start,
            end: item.timeSlot.end
          },
          quantity: item.quantity,
          address: address || '',
          notes: '',
          customInputs: customInputsObject,
          specialRequests: item.moreInfo || ''
        };
        
        const response = await fetch(`${API_BASE_URL}/bookings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bookingData)
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          let error;
          
          if (contentType && contentType.includes('application/json')) {
            error = await response.json();
          } else {
            const text = await response.text();
            error = { message: 'Server error - received HTML instead of JSON' };
          }
          
          errors.push({
            item,
            error: error.message || 'Failed to create booking'
          });
        } else {
          const booking = await response.json();
          bookings.push(booking);
        }
      } catch (error: any) {
        errors.push({
          item,
          error: error.message || 'Network error'
        });
      }
    }

    return {
      success: errors.length === 0,
      bookings,
      errors
    };
  } catch (e) {
    throw e;
  }
}
