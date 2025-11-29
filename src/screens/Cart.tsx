import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getCart, removeFromCart, updateCartItemQuantity, clearCart, CartItem, checkCartAvailability, createBookingsFromCart } from '../services/cart';
import { getServiceImageUrl } from '../services/servicesApi';
import { getImageUrl } from '../services/api';
import { StyleSheet } from 'react-native';
import Drawer from '../components/Drawer';
import OrderSuccess from './OrderSuccess';
import AddressSelection from '../components/AddressSelection/AddressSelection';
import { API_BASE_URL } from '../config/api.config';

interface CartProps {
  onBack?: () => void;
  onViewDetails?: (serviceId: string) => void;
  onEdit?: (cartItemId: string) => void;
  onNavigate?: (route: string) => void;
}

const Cart: React.FC<CartProps> = ({ onBack, onViewDetails, onEdit, onNavigate }) => {
  const { isRTL } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string | null>(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [showAddressSelection, setShowAddressSelection] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [userToken, setUserToken] = useState<string>('');
  // measured height of the bottom summary (used to reserve scroll space)
  const [summaryHeight, setSummaryHeight] = useState<number>(300);

  const loadCart = async () => {
    const items = await getCart();
    setCartItems(items);
    setLoading(false);
    
    // Check for old/past bookings
    const now = new Date();
    const oldItems = items.filter(item => {
      // Prefer comparing by exact instant if available
      if (item.timeSlot && item.timeSlot.start) {
        try {
          const bookingInstant = new Date(item.timeSlot.start);
          return bookingInstant < now;
        } catch (e) {
          // fall through to older logic
        }
      }

      if (!item.selectedDate || !item.selectedTime) return false;

      const bookingDate = new Date(item.selectedDate);
      const isToday = bookingDate.toDateString() === now.toDateString();

      // If booking date is in the past
      if (bookingDate < now && !isToday) {
        return true;
      }

      // If booking is today, check time
      if (isToday && item.selectedTime) {
        const timeMatch = item.selectedTime.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);

          const bookingDateTime = new Date(bookingDate);
          bookingDateTime.setHours(hours, minutes, 0, 0);

          return bookingDateTime < now;
        }
      }

      return false;
    });
    
    // Alert user if there are old bookings
    if (oldItems.length > 0) {
      const oldItemNames = oldItems.map(item => 
        isRTL && item.nameAr ? item.nameAr : item.name
      ).join(', ');
      
      Alert.alert(
        isRTL ? '⚠ تنبيه: حجوزات قديمة' : '⚠ Alert: Old Bookings',
        isRTL 
          ? `لديك ${oldItems.length} حجز(حجوزات) بتاريخ قديم في السلة:\n\n${oldItemNames}\n\nالرجاء تحديث أو إزالة هذه الحجوزات.`
          : `You have ${oldItems.length} booking(s) with past date/time in your cart:\n\n${oldItemNames}\n\nPlease update or remove these bookings.`,
        [{ text: isRTL ? 'حسناً' : 'OK' }]
      );
    }
  };

  // Fetch user profile picture once on mount
  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;

        setUserToken(token);
        
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData.profilePicture) {
            setCurrentProfilePicture(userData.profilePicture);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (isLoggedIn) {
      fetchUserData();
    }
  }, [isLoggedIn]);

  // Load cart on mount and when cart changes (only if logged in)
  React.useEffect(() => {
    if (isLoggedIn) {
      loadCart();
    } else {
      setCartItems([]);
      setLoading(false);
    }
  }, [isLoggedIn]);

  const handleRemoveItem = async (id: string) => {
    Alert.alert(
      isRTL ? 'تأكيد' : 'Confirm',
      isRTL ? 'هل تريد إزالة هذا العنصر من السلة؟' : 'Remove this item from cart?',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'إزالة' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeFromCart(id);
            await loadCart();
          },
        },
      ]
    );
  };

  const handleUserIconPress = () => {
    if (onNavigate) {
      onNavigate(isLoggedIn ? 'profile' : 'auth');
    }
  };

  const handleOpenDrawer = () => {
    setIsDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerVisible(false);
  };

  const handleNavigation = (route: string) => {
    if (onNavigate) {
      onNavigate(route.toLowerCase());
    }
    handleCloseDrawer();
  };

  const handleCheckout = async () => {
    try {
      setIsProcessingCheckout(true);

      // Step 1: Check availability of all cart items
      console.log('🔍 Checking cart availability before checkout...');
      const { available, unavailableItems } = await checkCartAvailability();

      if (!available) {
        setIsProcessingCheckout(false);
        // Show error with details of unavailable items
        const errorMessage = unavailableItems
          .map(({ item, reason }) => {
            const itemName = isRTL ? (item.nameAr || item.name) : item.name;
            return `• ${itemName} (${item.selectedTime})\n  ${reason}`;
          })
          .join('\n\n');

        Alert.alert(
          isRTL ? 'بعض العناصر غير متاحة' : 'Some Items Unavailable',
          isRTL 
            ? 'بعض العناصر في سلتك لم تعد متاحة:\n\n' + errorMessage + '\n\nالرجاء إزالتها قبل المتابعة.'
            : 'Some items in your cart are no longer available:\n\n' + errorMessage + '\n\nPlease remove them before proceeding.',
          [{ text: isRTL ? 'حسناً' : 'OK' }]
        );
        return;
      }

      // Step 2: All items are available, show address selection
      console.log('✅ All items available, showing address selection...');
      setIsProcessingCheckout(false);
      setShowAddressSelection(true);

    } catch (error) {
      setIsProcessingCheckout(false);
      console.error('Error during checkout:', error);
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'حدث خطأ أثناء معالجة الطلب' : 'Error processing your order',
        [{ text: isRTL ? 'حسناً' : 'OK' }]
      );
    }
  };

  const handleAddressSelected = async (address: any) => {
    try {
      setSelectedAddress(address);
      setShowAddressSelection(false);
      setIsProcessingCheckout(true);

      // Step 3: Create bookings with selected address
      console.log('✅ Creating bookings with address:', address.name);
      console.log('📍 Full address object:', address);
      
      // Format address for backend
      const fullAddress = `${address.street}${address.houseNumber ? ', منزل ' + address.houseNumber : ''}${address.floorNumber ? ', طابق ' + address.floorNumber : ''}, ${address.city}`;
      console.log('📍 Formatted address:', fullAddress);
      
      const { success, bookings, errors } = await createBookingsFromCart(fullAddress);

      setIsProcessingCheckout(false);

      if (!success) {
        // Some bookings failed
        const errorMessage = errors
          .map(({ item, error }) => {
            const itemName = isRTL ? (item.nameAr || item.name) : item.name;
            return `• ${itemName}\n  ${error}`;
          })
          .join('\n\n');

        Alert.alert(
          isRTL ? 'خطأ في إنشاء الحجوزات' : 'Booking Error',
          isRTL 
            ? 'فشل إنشاء بعض الحجوزات:\n\n' + errorMessage
            : 'Failed to create some bookings:\n\n' + errorMessage,
          [{ text: isRTL ? 'حسناً' : 'OK' }]
        );
        return;
      }

      // Step 4: All bookings created successfully
      console.log('🎉 All bookings created successfully!');
      
      // Clear the cart
      await clearCart();
      setCartItems([]);

      // Show success screen
      setShowSuccessScreen(true);

    } catch (error) {
      setIsProcessingCheckout(false);
      console.error('Error creating bookings:', error);
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'حدث خطأ أثناء إنشاء الحجوزات' : 'Error creating bookings',
        [{ text: isRTL ? 'حسناً' : 'OK' }]
      );
    }
  };

  const calculateSubTotal = () => {
    // Only calculate price for 'available_now' items
    // 'pending_confirmation' items are free until confirmed
    return cartItems.reduce((total, item) => {
      if (!item.availabilityStatus || item.availabilityStatus === 'available_now') {
        return total + (item.price * item.quantity);
      }
      return total;
    }, 0);
  };

  const calculateDeliveryCharges = () => {
    // 5 KD delivery charge per service (not per quantity)
    // Limited services (maxBookingsPerSlot: 1) don't have delivery charges
    // Only for available_now items
    // Get unique unlimited services and charge 5 KD for each
    const uniqueUnlimitedServiceIds = new Set<string>();
    
    cartItems.forEach(item => {
      if ((!item.availabilityStatus || item.availabilityStatus === 'available_now') &&
          item.maxBookingsPerSlot === -1) {
        uniqueUnlimitedServiceIds.add(item.serviceId);
      }
    });
    
    return uniqueUnlimitedServiceIds.size * 5; // 5 KD per unique unlimited service
  };

  const calculateTotalDeliveryCharges = () => {
    return calculateDeliveryCharges();
  };

  const calculateTotalAmount = () => {
    return calculateSubTotal() + calculateDeliveryCharges();
  };

  // Calculate amounts for 'available_now' items only (items that can be paid now)
  const calculatePayNowAmount = () => {
    const availableNowSubtotal = cartItems.reduce((total, item) => {
      if (!item.availabilityStatus || item.availabilityStatus === 'available_now') {
        return total + (item.price * item.quantity);
      }
      return total;
    }, 0);
    
    const deliveryCharges = calculateDeliveryCharges();
    const totalWithDelivery = availableNowSubtotal + deliveryCharges;
    return totalWithDelivery * 0.6; // 60% upfront
  };

  // Calculate amounts for 'pending_confirmation' items + remaining 40% of 'available_now' items
  const calculatePayableAfterConfirmation = () => {
    // 40% of available_now items (including delivery charges)
    const availableNowSubtotal = cartItems.reduce((total, item) => {
      if (!item.availabilityStatus || item.availabilityStatus === 'available_now') {
        return total + (item.price * item.quantity);
      }
      return total;
    }, 0);
    
    const deliveryCharges = calculateDeliveryCharges();
    const totalWithDelivery = availableNowSubtotal + deliveryCharges;
    const availableNowRemaining = totalWithDelivery * 0.4; // 40% later

    // 100% of pending_confirmation items (paid after vendor confirms - no delivery yet)
    const pendingTotal = cartItems.reduce((total, item) => {
      if (item.availabilityStatus === 'pending_confirmation') {
        return total + (item.price * item.quantity); // price only, no delivery charge
      }
      return total;
    }, 0);

    return availableNowRemaining + pendingTotal;
  };

  // Helper to check if a cart item is old/past
  const isItemPast = (item: CartItem): boolean => {
    // Prefer exact instant comparison when available
    const now = new Date();
    if (item.timeSlot && item.timeSlot.start) {
      try {
        const bookingInstant = new Date(item.timeSlot.start);
        return bookingInstant < now;
      } catch (e) {
        // fallback to previous checks
      }
    }

    if (!item.selectedDate || !item.selectedTime) return false;

    const bookingDate = new Date(item.selectedDate);
    const isToday = bookingDate.toDateString() === now.toDateString();

    // If booking date is in the past
    if (bookingDate < now && !isToday) {
      return true;
    }

    // If booking is today, check time
    if (isToday && item.selectedTime) {
      const timeMatch = item.selectedTime.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);

        const bookingDateTime = new Date(bookingDate);
        bookingDateTime.setHours(hours, minutes, 0, 0);

        return bookingDateTime < now;
      }
    }

    return false;
  };

  // If success screen should be shown
  if (showSuccessScreen) {
    return (
      <OrderSuccess 
        onDone={() => {
          setShowSuccessScreen(false);
          if (onNavigate) {
            onNavigate('home');
          }
        }} 
      />
    );
  }

  // If user is not logged in, show login prompt
  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          {/* Menu Button - Left */}
          <TouchableOpacity 
            onPress={handleOpenDrawer} 
            style={styles.menuButton}
            activeOpacity={0.6}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
            <Svg width={38} height={38} viewBox="0 0 24 24" fill="none">
              <Path 
                d="M4 6H20M4 12H14M4 18H9" 
                stroke={colors.primary} 
                strokeWidth={2.5} 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </Svg>
          </TouchableOpacity>

          {/* Center - MY CART Text */}
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
              {isRTL ? 'سلتي' : 'MY CART'}
            </Text>
          </View>

          {/* Right - Profile Button */}
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={handleUserIconPress}
            activeOpacity={0.6}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path 
                d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" 
                stroke={colors.primary} 
                strokeWidth={2} 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Login Required Message */}
        <View style={styles.centerContent}>
          <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
            <Path 
              d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" 
              stroke={colors.primary} 
              strokeWidth={2} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </Svg>
          <Text style={[styles.emptyText, { marginTop: 20, fontSize: 18 }]}>
            {isRTL ? 'يجب تسجيل الدخول لعرض السلة' : 'Please login to view cart'}
          </Text>
          <TouchableOpacity 
            style={[styles.checkoutButton, { marginTop: 20, width: 200 }]}
            onPress={() => onNavigate && onNavigate('auth')}>
            <Text style={styles.checkoutButtonText}>
              {isRTL ? 'تسجيل الدخول' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>

        <Drawer 
          isVisible={isDrawerVisible}
          onClose={handleCloseDrawer}
          onNavigate={handleNavigation}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {/* Menu Button - Left */}
        <TouchableOpacity 
          onPress={handleOpenDrawer} 
          style={styles.menuButton}
          activeOpacity={0.6}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <Svg width={38} height={38} viewBox="0 0 24 24" fill="none">
            <Path 
              d="M4 6H20M4 12H14M4 18H9" 
              stroke={colors.primary} 
              strokeWidth={2.5} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </Svg>
        </TouchableOpacity>

        {/* Center - MY CART Text */}
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
            {isRTL ? 'سلتي' : 'MY CART'}
          </Text>
        </View>

        {/* Right - Profile Button */}
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={handleUserIconPress}
          activeOpacity={0.6}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          {isLoggedIn && currentProfilePicture ? (
            <Image 
              source={{ uri: getImageUrl(currentProfilePicture) }}
              style={styles.profileIcon}
              resizeMode="cover"
            />
          ) : (
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path 
                d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" 
                stroke={colors.primary} 
                strokeWidth={2} 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </Svg>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>{isRTL ? 'جاري التحميل...' : 'Loading...'}</Text>
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>{isRTL ? 'السلة فارغة' : 'Cart is empty'}</Text>
        </View>
      ) : (
        <>
          <ScrollView 
            style={styles.scrollView}
            // reserve space equal to measured summary height + safe area so items can scroll above it
            // this keeps all items visible and prevents the summary from covering the last item
            contentContainerStyle={{ paddingBottom: summaryHeight + (insets.bottom ?? 0) + 34 }}
            showsVerticalScrollIndicator={false}>
            {cartItems.map((item, index) => (
              <View key={item._id} style={styles.cartCard}>
                {/* Old Booking Warning Badge */}
                {isItemPast(item) && (
                  <View style={styles.oldBookingBadge}>
                    <Text style={styles.oldBookingText}>
                      {isRTL ? '⚠ وقت قديم' : '⚠ Past Time'}
                    </Text>
                  </View>
                )}

                {/* Remove Button */}
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(item._id)}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M18 6L6 18M6 6l12 12" stroke="#555" strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                </TouchableOpacity>

                {/* Item Header with Image and Title */}
                <View style={styles.itemHeader}>
                  {item.image && (
                    <Image
                      source={{ uri: getServiceImageUrl(item.image) }}
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.itemHeaderText}>
                    <Text style={[styles.itemName, isRTL && styles.itemNameRTL]}>
                      {isRTL && item.nameAr ? item.nameAr : item.name}
                    </Text>
                    {item.vendorName && (
                      <Text style={[styles.vendorName, isRTL && styles.vendorNameRTL]}>
                        {item.vendorName}
                      </Text>
                    )}
                    
                    {/* Quantity Selector - Only show for unlimited services (maxBookingsPerSlot === -1) */}
                    {item.maxBookingsPerSlot === -1 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
                        <TouchableOpacity
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            backgroundColor: colors.primary,
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                          onPress={() => {
                            if (item.quantity > 1) {
                              updateCartItemQuantity(item._id, item.quantity - 1);
                              setCartItems(cartItems.map(i => 
                                i._id === item._id ? { ...i, quantity: i.quantity - 1 } : i
                              ));
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ color: colors.textWhite, fontSize: 14, fontWeight: 'bold' }}>−</Text>
                        </TouchableOpacity>

                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textDark, minWidth: 30, textAlign: 'center' }}>
                          {item.quantity}
                        </Text>

                        <TouchableOpacity
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            backgroundColor: colors.primary,
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                          onPress={() => {
                            updateCartItemQuantity(item._id, item.quantity + 1);
                            setCartItems(cartItems.map(i => 
                              i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
                            ));
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ color: colors.textWhite, fontSize: 14, fontWeight: 'bold' }}>+</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>

                {/* Date and Time */}
                <View style={styles.dateTimeSection}>
                  <View style={styles.dateTimeRow}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text style={styles.dateTimeText}>
                      {item.selectedDate 
                        ? new Date(item.selectedDate).toLocaleDateString(isRTL ? 'ar-KW' : 'en-US', { 
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric' 
                          })
                        : '-'}
                    </Text>
                  </View>

                  <View style={styles.dateTimeRow}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 7v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text style={styles.dateTimeText}>
                      {item.selectedTime || '-'}
                    </Text>
                  </View>
                </View>

                {/* Amount and Delivery */}
                <View style={styles.priceSection}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>{isRTL ? 'المبلغ' : 'Amount'}</Text>
                    {item.availabilityStatus === 'pending_confirmation' ? (
                      <Text style={[styles.priceValue, { color: colors.textSecondary, fontSize: 12 }]}>
                        {isRTL ? 'بعد التأكيد' : 'After Confirmation'}
                      </Text>
                    ) : (
                      <Text style={styles.priceValue}>
                        {(item.price * item.quantity).toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                      </Text>
                    )}
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>{isRTL ? 'رسوم التوصيل' : 'Delivery Charges'}</Text>
                    {item.availabilityStatus === 'pending_confirmation' ? (
                      <Text style={[styles.deliveryChargeValue, { color: colors.textSecondary, fontSize: 12 }]}>
                        {isRTL ? 'بعد التأكيد' : 'After Confirmation'}
                      </Text>
                    ) : item.maxBookingsPerSlot === -1 ? (
                      // Unlimited service: show 5 KD (flat rate per service, not per quantity)
                      <Text style={styles.deliveryChargeValue}>
                        {(5).toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                      </Text>
                    ) : (
                      // Limited service: no delivery charge
                      <Text style={styles.deliveryChargeValue}>
                        {(0).toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.viewDetailsButton}
                    onPress={() => onViewDetails && onViewDetails(item.serviceId)}>
                    <Text style={styles.viewDetailsText}>
                      {isRTL ? 'عرض التفاصيل' : 'View Details'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => onEdit && onEdit(item._id)}>
                    <Text style={styles.editText}>
                      {isRTL ? 'تعديل' : 'Edit'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Bottom Payment Summary */}
          {/* place the bottom summary above the app bottom navigation (nav height ≈ 64) */}
          {/* place summary flush above bottom navigation (no extra gap) */}
          {/* add small gap (12px) between summary and bottom nav */}
          <View
            onLayout={(e) => setSummaryHeight(e.nativeEvent.layout.height)}
            style={[
              styles.bottomSummary,
              { bottom: (insets.bottom ?? 0) + 24, paddingBottom: (insets.bottom ?? 0) + 24 },
            ]}>
            {/* Totals */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{isRTL ? 'المجموع الفرعي' : 'Sub Total'}</Text>
              <Text style={styles.summaryValue}>
                {calculateSubTotal().toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{isRTL ? 'إجمالي رسوم التوصيل' : 'Total Delivery Charges'}</Text>
              <Text style={styles.summaryValueGreen}>
                {calculateTotalDeliveryCharges().toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={styles.summaryLabelTotal}>{isRTL ? 'المبلغ الإجمالي' : 'Total Amount'}</Text>
              <Text style={styles.summaryValueTotal}>
                {calculateTotalAmount().toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Payment Options */}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>{isRTL ? 'الدفع الآن' : 'Pay Now'}</Text>
              <Text style={styles.paymentValue}>
                {calculatePayNowAmount().toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
              </Text>
            </View>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabelOrange}>
                {isRTL ? 'الدفع بعد التأكيد' : 'Payable After Confirmation'}
              </Text>
              <Text style={styles.paymentValueOrange}>
                {calculatePayableAfterConfirmation().toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
              </Text>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity 
              style={[
                styles.checkoutButton,
                isProcessingCheckout && styles.checkoutButtonDisabled
              ]} 
              onPress={handleCheckout}
              disabled={isProcessingCheckout}>
              {isProcessingCheckout ? (
                <ActivityIndicator color={colors.textWhite} />
              ) : (
                <Text style={styles.checkoutButtonText}>
                  {isRTL ? 'المتابعة إلى الدفع' : 'PROCEED TO CHECKOUT'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.continueShoppingButton}
              onPress={() => onNavigate && onNavigate('home')}
              disabled={isProcessingCheckout}>
              <Text style={styles.continueShoppingButtonText}>
                {isRTL ? 'متابعة التسوق' : 'CONTINUE SHOPPING'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Drawer Navigation */}
      <Drawer 
        isVisible={isDrawerVisible}
        onClose={handleCloseDrawer}
        onNavigate={handleNavigation}
      />

      {/* Address Selection Modal */}
      <AddressSelection
        visible={showAddressSelection}
        onClose={() => setShowAddressSelection(false)}
        onSelectAddress={handleAddressSelected}
        token={userToken}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 4,
    paddingBottom: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  menuButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.backgroundLight || '#F5F5F5',
  },
  profileIcon: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  headerTitleRTL: {
    textAlign: 'right',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cartCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  oldBookingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 5,
  },
  oldBookingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemHeaderText: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  itemNameRTL: {
    textAlign: 'right',
  },
  vendorName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  vendorNameRTL: {
    textAlign: 'right',
  },
  itemQty: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  dateTimeSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontSize: 12,
    color: colors.textDark,
    fontWeight: '500',
  },
  priceSection: {
    paddingVertical: 8,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 13,
    color: colors.textDark,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  deliveryChargeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#28A745',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  viewDetailsButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '600',
  },
  editButton: {
    paddingHorizontal: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editText: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: '600',
  },
  totalsCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalRowFinal: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '500',
  },
  totalLabelFinal: {
    fontSize: 15,
    color: colors.textDark,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  totalValueGreen: {
    fontSize: 14,
    fontWeight: '700',
    color: '#28A745',
  },
  totalValueFinal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  bottomSummary: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 14,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    /* remove shadow so bottom nav appears flush */
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  summaryRowTotal: {
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textDark,
    fontWeight: '500',
  },
  summaryLabelTotal: {
    fontSize: 13,
    color: colors.textDark,
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryValueGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B383',
  },
  summaryValueTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#D0D0D0',
    marginVertical: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  paymentLabel: {
    fontSize: 12,
    color: colors.textDark,
    fontWeight: '600',
  },
  paymentValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
  },
  paymentLabelOrange: {
    fontSize: 12,
    color: '#FF8C00',
    fontWeight: '600',
  },
  paymentValueOrange: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF8C00',
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  checkoutButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
  checkoutButtonText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  continueShoppingButton: {
    backgroundColor: '#00695C',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueShoppingButtonText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default Cart;
