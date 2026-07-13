/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, checkTimeSlotAvailability } from './api';
import { getSecureToken } from '../utils/secureStorage';
import { clearDatePickerCacheForService } from '../components/DatePickerModal/DatePickerModal';

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
  totalPrice?: number; // Total price including custom option additions
  quantity: number;
  selectedDate: Date | string;
  selectedTime: string;
  customInputs?: Array<
    | {
        label: string;
        value: string | number;
        price?: number;
        labelAr?: string;
        valueAr?: string | number;
      }
    | Array<{
        label: string;
        value: string | number;
        price?: number;
        labelAr?: string;
        valueAr?: string | number;
      }>
  >;
  moreInfo?: string;
  timeSlot: { start: string | Date; end: string | Date };
  availabilityStatus?: 'available_now' | 'pending_confirmation';
  maxBookingsPerSlot?: number; // -1 for unlimited, 1 (or other number) for limited
  isPackage?: boolean; // true if this is a package
  mainServiceId?: string; // For packages: ID of the main limited service to check availability
  packageName?: string; // Package name in English
  packageNameAr?: string; // Package name in Arabic
  deliveryFee?: number; // Delivery fee from service
  originalPriceBeforeDiscount?: number; // Price before discount
  originalTotalPriceBeforeDiscount?: number; // Total price before discount including options
  addressRequired?: boolean; // If delivery address is required for this service
};

// In-memory cache to avoid reading from AsyncStorage repeatedly
let cartCache: CartItem[] | null = null;
let cacheUserId: string | null = null;

// Event listeners for cart changes
type CartChangeListener = () => void;
const cartChangeListeners: Set<CartChangeListener> = new Set();

export function subscribeToCartChanges(
  listener: CartChangeListener,
): () => void {
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
    } catch {
      // Error handling for cart change listener
    }
  });
}

// Helper to get auth token
async function getAuthToken(): Promise<string | null> {
  try {
    return await getSecureToken();
  } catch {
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
      } catch {
        // Failed to parse userData
      }
    }

    // If no userId found and user is not logged in, use 'guest' as fallback
    const token = await getSecureToken();
    if (!token) {
      // User is not logged in - this is expected, use guest silently
      return 'guest';
    }

    // User appears to be logged in but no userId found - this is unexpected
    return 'guest';
  } catch {
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
  } catch {
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
  } catch {
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
    const cartId = `cart_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;

    const cartItem: CartItem = {
      ...item,
      _id: cartId,
      quantity: item.quantity || 1,
    };

    // Get existing cart
    const currentCart = await getCart();

    // Check if same service, date, and time already exists
    const existingItemIndex = currentCart.findIndex(
      existingItem =>
        existingItem.serviceId === item.serviceId &&
        existingItem.selectedDate === item.selectedDate &&
        existingItem.selectedTime === item.selectedTime,
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
  } catch {
    throw new Error('Failed to add to cart');
  }
}

// Remove item from cart
export async function removeFromCart(cartItemId: string): Promise<CartItem[]> {
  try {
    const currentCart = await getCart();
    const updatedCart = currentCart.filter(item => item._id !== cartItemId);
    await saveCart(updatedCart);
    return updatedCart;
  } catch {
    throw new Error('Failed to remove from cart');
  }
}

// Update cart item quantity
export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number,
): Promise<CartItem[]> {
  try {
    if (quantity <= 0) {
      return removeFromCart(cartItemId);
    }

    const currentCart = await getCart();
    const itemIndex = currentCart.findIndex(item => item._id === cartItemId);

    if (itemIndex !== -1) {
      const item = currentCart[itemIndex];

      // Recalculate totalPrice: (quantity × basePrice) + (quantity × optionsTotal)
      let optionsTotal = 0;
      if (item.customInputs && Array.isArray(item.customInputs)) {
        item.customInputs.forEach(input => {
          if (Array.isArray(input)) {
            // radio-multiple selection
            input.forEach(opt => {
              if (opt.price) optionsTotal += opt.price;
            });
          } else if (input.price) {
            // single input
            optionsTotal += input.price;
          }
        });
      }

      // Formula: quantity × (basePrice + options)
      const newTotalPrice = (item.price + optionsTotal) * quantity;

      // Create a new item object to ensure React detects the change
      currentCart[itemIndex] = {
        ...item,
        quantity: quantity,
        totalPrice: newTotalPrice,
      };

      await saveCart(currentCart);

      // Return a new array with new item references
      return currentCart.map(cartItem => ({ ...cartItem }));
    }

    return currentCart;
  } catch (e) {
    throw e;
  }
}

// Update cart item (for edit functionality)
export async function updateCartItem(
  cartItemId: string,
  updates: Partial<CartItem>,
): Promise<CartItem[]> {
  try {
    const currentCart = await getCart();
    const itemIndex = currentCart.findIndex(item => item._id === cartItemId);

    if (itemIndex !== -1) {
      currentCart[itemIndex] = {
        ...currentCart[itemIndex],
        ...updates,
      };

      await saveCart(currentCart);
      return currentCart;
    }
    return currentCart;
  } catch {
    throw new Error('Failed to update cart item');
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
  } catch {
    throw new Error('Failed to clear cart');
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
  } catch {
    // Error clearing user cart
  }
}

// Get cart count (number of unique items in cart)
export async function getCartCount(): Promise<number> {
  const items = await getCart();
  return items.length; // Return number of unique items, not sum of quantities
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

    // Check all items in PARALLEL for faster performance
    const checkPromises = cartItems.map(async item => {
      try {
        // Parse selected date
        const selectedDate = new Date(item.selectedDate);

        // Check if date is in the past
        const now = new Date();
        if (
          selectedDate <
          new Date(now.getFullYear(), now.getMonth(), now.getDate())
        ) {
          return { item, reason: 'Date is in the past' };
        }

        // For packages, check the main service availability, for regular services check the service itself
        const serviceIdToCheck =
          item.isPackage && item.mainServiceId
            ? item.mainServiceId
            : item.serviceId;

        // Get available time slots from backend
        const slots = await checkTimeSlotAvailability(
          serviceIdToCheck,
          item.vendorId,
          selectedDate,
          token,
        );

        // Find the slot that matches the selected time
        const matchingSlot = slots.find(
          slot => slot.timeSlot === item.selectedTime,
        );

        if (!matchingSlot) {
          return { item, reason: 'Time slot no longer available' };
        }

        if (!matchingSlot.available) {
          return {
            item,
            reason: `Time slot fully booked (${matchingSlot.bookingsCount} bookings)`,
          };
        }

        return null; // Item is available
      } catch {
        return { item, reason: 'Error checking availability' };
      }
    });

    // Wait for all checks to complete in parallel
    const results = await Promise.all(checkPromises);

    // Filter out null results (available items) to get only unavailable ones
    const unavailableItems = results.filter(
      (result): result is { item: CartItem; reason: string } => result !== null,
    );

    const allAvailable = unavailableItems.length === 0;

    return {
      available: allAvailable,
      unavailableItems,
    };
  } catch {
    throw new Error('Failed to check cart availability');
  }
}

// Create ONE booking from ALL cart items
// - If ANY item needs vendor confirmation (pending_confirmation) → payment is NOT required now
// - If NO items need vendor confirmation → payment is required immediately
export async function createBookingsFromCart(
  address?: string,
  couponData?: {
    code: string;
    discountAmount: number;
    originalPrice: number;
    deductFrom: string;
  },
): Promise<{
  success: boolean;
  bookings: Record<string, any>[];
  errors: { item: CartItem; error: string }[];
}> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const cartItems = await getCart();
    const bookings: Record<string, any>[] = [];
    const errors: { item: CartItem; error: string }[] = [];

    if (__DEV__) {
      console.log('[createBookingsFromCart] Cart items count:', cartItems.length);
      console.log(
        '[createBookingsFromCart] Cart items:',
        cartItems.map(i => ({
          name: i.name,
          serviceId: i.serviceId,
          availabilityStatus: i.availabilityStatus,
        })),
      );
    }

    if (cartItems.length === 0) {
      return { success: true, bookings: [], errors: [] };
    }

    // Check if ANY item requires vendor confirmation
    const hasItemsNeedingConfirmation = cartItems.some(
      item => item.availabilityStatus === 'pending_confirmation',
    );

    if (__DEV__) {
      console.log(
        '[createBookingsFromCart] Has items needing confirmation:',
        hasItemsNeedingConfirmation,
      );
    }

    // Helper function to convert customInputs to key-value object format expected by backend validator
    const convertCustomInputs = (item: CartItem) => {
      const obj: Record<string, any> = {};
      if (item.customInputs && Array.isArray(item.customInputs)) {
        item.customInputs.forEach(input => {
          const inputsList = Array.isArray(input) ? input : [input];

          inputsList.forEach(option => {
            if (!option) return;
            const { label, value } = option;

            // Check if value is formatted as "Option ×Qty" or "Option xQty"
            const menuMatch =
              typeof value === 'string' && value.match(/(.+) [×xX](\d+)/);
            if (menuMatch) {
              const itemName = menuMatch[1].trim();
              const qty = parseInt(menuMatch[2], 10) || 0;
              if (!obj[label]) {
                obj[label] = {};
              }
              if (typeof obj[label] !== 'object' || Array.isArray(obj[label])) {
                obj[label] = {};
              }
              obj[label][itemName] = qty;
            } else {
              // Handle single option, multi-select array, or text/number input
              if (label in obj) {
                if (!Array.isArray(obj[label])) {
                  obj[label] = [obj[label]];
                }
                obj[label].push(value);
              } else {
                obj[label] = value;
              }
            }
          });
        });
      }
      return obj;
    };

    // Create ONE booking for ALL cart items
    try {
      // Build services and packages arrays
      const servicesArray: Record<string, any>[] = [];
      const packagesArray: Record<string, any>[] = [];

      cartItems.forEach(item => {
        const itemDelivery = item.deliveryFee || 0;
        const itemTotal = (item.totalPrice || item.price) + itemDelivery;

        if (item.isPackage) {
          packagesArray.push({
            package: item.serviceId, // Package ID is stored in serviceId
            price: itemTotal,
            notes: item.moreInfo || '',
            _cartItemId: item._id,
            _cartItemName: item.name,
            eventDate: item.selectedDate,
            timeSlot: item.timeSlot
              ? {
                  start: item.timeSlot.start,
                  end: item.timeSlot.end,
                }
              : undefined,
          });
        } else {
          servicesArray.push({
            service: item.serviceId,
            vendor: item.vendorId,
            price: itemTotal,
            quantity: item.quantity,
            notes: item.moreInfo || '',
            customInputs: convertCustomInputs(item),
            _cartItemId: item._id,
            _cartItemName: item.name,
            eventDate: item.selectedDate,
            timeSlot: item.timeSlot
              ? {
                  start: item.timeSlot.start,
                  end: item.timeSlot.end,
                }
              : undefined,
            availabilityStatus: item.availabilityStatus || 'available_now',
          });
        }
      });

      // Calculate total price for the combined booking
      const combinedTotalPrice = cartItems.reduce((total, item) => {
        const itemDelivery = item.deliveryFee || 0;
        return total + (item.totalPrice || item.price) + itemDelivery;
      }, 0);

      // Use the first item's date/time for the booking
      const firstItem = cartItems[0];

      const bookingPayload: Record<string, any> = {
        eventDate: firstItem.selectedDate,
        eventTime: firstItem.selectedTime,
        timeSlot: {
          start: firstItem.timeSlot.start,
          end: firstItem.timeSlot.end,
        },
        address: address || '',
        notes: '',
        totalPrice: combinedTotalPrice,
        services: servicesArray.length > 0 ? servicesArray : undefined,
        packages: packagesArray.length > 0 ? packagesArray : undefined,
        // If any item needs confirmation, mark the whole booking as awaiting confirmation
        _hasItemsNeedingConfirmation: hasItemsNeedingConfirmation,
      };

      // Add coupon data if provided
      if (couponData) {
        const discountShare =
          (combinedTotalPrice / couponData.originalPrice) *
          couponData.discountAmount;
        bookingPayload.coupon = {
          code: couponData.code,
          discountAmount: discountShare,
          originalPrice: combinedTotalPrice,
          deductFrom: couponData.deductFrom,
        };
        bookingPayload.totalPrice = combinedTotalPrice - discountShare;
      }

      if (__DEV__) {
        console.log('[createBookingsFromCart] Sending booking for ALL items:', {
          itemCount: cartItems.length,
          hasItemsNeedingConfirmation,
          totalPrice: bookingPayload.totalPrice,
        });
      }

      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let error;
        if (contentType && contentType.includes('application/json')) {
          error = await response.json();
        } else {
          error = { message: 'Server error - received HTML instead of JSON' };
        }
        if (__DEV__) {
          console.log('[createBookingsFromCart] Error for booking:', error);
        }
        // Add error for each item
        cartItems.forEach(item => {
          errors.push({
            item,
            error: error.message || 'Failed to create booking',
          });
        });
      } else {
        const responseData = await response.json();
        const booking = responseData.booking || responseData;
        if (__DEV__) {
          console.log(
            '[createBookingsFromCart] Success for booking, ID:',
            booking._id,
          );
        }

        // Mark if this booking requires payment now
        // Payment is required ONLY if NO items need vendor confirmation
        booking._requiresPaymentNow = !hasItemsNeedingConfirmation;
        booking._cartItemIds = cartItems.map(i => i._id);
        booking._cartItemNames = cartItems.map(i => i.name);
        booking._hasItemsNeedingConfirmation = hasItemsNeedingConfirmation;
        bookings.push(booking);

        // Clear cache for all services
        cartItems.forEach(item => {
          clearDatePickerCacheForService(item.serviceId, item.vendorId);
        });
      }
    } catch (error: unknown) {
      const err = error as Error;
      if (__DEV__) {
        console.log(
          '[createBookingsFromCart] Exception for booking:',
          err.message,
        );
      }
      cartItems.forEach(item => {
        errors.push({ item, error: err.message || 'Network error' });
      });
    }

    if (__DEV__) {
      console.log(
        '[createBookingsFromCart] Final result - Bookings:',
        bookings.length,
        'Errors:',
        errors.length,
      );
    }

    return {
      success: errors.length === 0,
      bookings,
      errors,
    };
  } catch {
    throw new Error('Failed to create bookings from cart');
  }
}
