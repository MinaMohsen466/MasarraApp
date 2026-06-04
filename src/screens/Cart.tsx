import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import Svg, { Path, Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  getCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  CartItem,
  checkCartAvailability,
  createBookingsFromCart,
} from '../services/cart';
import { getServiceImageUrl } from '../services/servicesApi';
import { styles } from './cartStyles';
import PaymentReceiptModal from '../components/PaymentReceiptModal/PaymentReceiptModal';
import AddressSelection from '../components/AddressSelection/AddressSelection';
import { CustomAlert } from '../components/CustomAlert';
import { validateCoupon, Coupon } from '../services/couponApi';
import { API_URL } from '../config/api.config';
import PaymentWebView from '../components/PaymentWebView';
import {
  sendPayment,
  getActiveSuppliers,
  calculateSupplierShares,
  Supplier,
} from '../services/paymentApi';

interface CartProps {
  onBack?: () => void;
  onViewDetails?: (serviceId: string) => void;
  onViewPackageDetails?: (packageId: string) => void;
  onNavigate?: (route: string) => void;
}

const Cart: React.FC<CartProps> = ({
  onNavigate,
}) => {
  const { isRTL, t } = useLanguage();
  const { user, isLoggedIn, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  // Swipe-to-delete animated values
  const swipeAnims = useRef<{[key: string]: Animated.Value}>({}).current;
  const [showInfo, setShowInfo] = useState<{[key: string]: boolean}>({});
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [showAddressSelection, setShowAddressSelection] = useState(false);
  const [userToken, setUserToken] = useState<string>('');
  // Custom Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<
    Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>
  >([]);
  // Payment state
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [createdBookingIds, setCreatedBookingIds] = useState<string[]>([]);
  const [successfullyBookedItemIds, setSuccessfullyBookedItemIds] = useState<
    string[]
  >([]);
  const [successReceiptData, setSuccessReceiptData] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState('');

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
      const oldItemNames = oldItems
        .map(item => (isRTL && item.nameAr ? item.nameAr : item.name))
        .join(', ');

      const message = t('oldBookingsMessage')
        .replace('{count}', oldItems.length.toString())
        .replace('{items}', oldItemNames);

      setAlertTitle(t('oldBookingsAlert'));
      setAlertMessage(message);
      setAlertButtons([{ text: t('ok'), style: 'default' }]);
      setAlertVisible(true);
    }
  };

  // Use AuthContext as single source of truth for user data
  React.useEffect(() => {
    // set token from context (used for checkout calls)
    setUserToken(token || '');
    // Reset image error when user changes
    setImageError(false);
  }, [isLoggedIn, user, token]);

  // Load cart on mount and when cart changes (only if logged in)
  React.useEffect(() => {
    if (isLoggedIn) {
      loadCart();
    } else {
      setCartItems([]);
      setLoading(false);
    }
  }, [isLoggedIn]);

  // Fetch suppliers for commission calculation when cart items change
  React.useEffect(() => {
    const fetchSuppliers = async () => {
      if (cartItems.length === 0) return;

      try {
        const response = await getActiveSuppliers();
        if (response.success && response.data) {
          setSuppliers(response.data);
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        // Continue without suppliers - payment will work but without commission tracking
      }
    };

    if (isLoggedIn && cartItems.length > 0) {
      fetchSuppliers();
    }
  }, [isLoggedIn, cartItems.length]);



  // Helper to convert /public/ paths to full URLs (same as EditProfile and UserProfile)
  const getImageUri = (uri: string | null | undefined) => {
    if (!uri) return null;

    // If it's already a full URL (like S3), return as is
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }

    // If it's a local file URI, return as is
    if (uri.startsWith('file://') || uri.startsWith('content://')) {
      return uri;
    }

    // If it's a server path (starts with /public), prepend the base URL
    if (uri.startsWith('/public')) {
      return `${API_URL.replace('/api', '')}${uri}`;
    }

    return uri;
  };

  const handleUserIconPress = () => {
    if (onNavigate) {
      onNavigate(isLoggedIn ? 'profile' : 'auth');
    }
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('home');
    }
  };



  // Swipe-to-delete helpers
  const getSwipeAnim = useCallback((itemId: string) => {
    if (!swipeAnims[itemId]) {
      swipeAnims[itemId] = new Animated.Value(0);
    }
    return swipeAnims[itemId];
  }, [swipeAnims]);

  const resetSwipe = useCallback((itemId: string) => {
    const translateX = getSwipeAnim(itemId);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [getSwipeAnim]);

  const confirmAndDelete = useCallback((itemId: string) => {
    // Snap to revealed position first
    const translateX = getSwipeAnim(itemId);
    Animated.spring(translateX, {
      toValue: isRTL ? 80 : -80,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();

    // Show confirmation dialog
    const buttons = [
      {
        text: t('remove'),
        style: 'destructive' as const,
        onPress: async () => {
          // Animate card off-screen then delete
          Animated.timing(translateX, {
            toValue: isRTL ? 500 : -500,
            duration: 200,
            useNativeDriver: true,
          }).start(async () => {
            await removeFromCart(itemId);
            await loadCart();
            delete swipeAnims[itemId];
            if (panResponders.current[itemId]) {
              delete panResponders.current[itemId];
            }
          });
        },
      },
      {
        text: t('cancel'),
        style: 'cancel' as const,
        onPress: () => {
          // Reset card position
          resetSwipe(itemId);
        },
      },
    ];
    setAlertTitle(t('confirmDelete'));
    setAlertMessage(t('removeItemMessage'));
    setAlertButtons(isRTL ? buttons : buttons.reverse());
    setAlertVisible(true);
  }, [isRTL, getSwipeAnim, resetSwipe, t, swipeAnims]);

  const createPanResponder = useCallback((itemId: string) => {
    const translateX = getSwipeAnim(itemId);
    const REVEAL_THRESHOLD = 50;
    const DELETE_THRESHOLD = 150;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderMove: (_, gestureState) => {
        if (isRTL) {
          if (gestureState.dx > 0) {
            translateX.setValue(gestureState.dx);
          } else {
            translateX.setValue(Math.max(gestureState.dx, 0));
          }
        } else {
          if (gestureState.dx < 0) {
            translateX.setValue(gestureState.dx);
          } else {
            translateX.setValue(Math.min(gestureState.dx, 0));
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const absX = Math.abs(gestureState.dx);
        // Full swipe → show confirmation
        if (absX > DELETE_THRESHOLD) {
          confirmAndDelete(itemId);
          return;
        }
        // Partial swipe → reveal/hide delete button
        const targetOpen = isRTL
          ? gestureState.dx > REVEAL_THRESHOLD ? 80 : 0
          : gestureState.dx < -REVEAL_THRESHOLD ? -80 : 0;
        Animated.spring(translateX, {
          toValue: targetOpen,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();
      },
    });
  }, [isRTL, getSwipeAnim, confirmAndDelete]);

  const panResponders = useRef<{[key: string]: ReturnType<typeof PanResponder.create>}>({});
  const getPanResponder = useCallback((itemId: string) => {
    if (!panResponders.current[itemId]) {
      panResponders.current[itemId] = createPanResponder(itemId);
    }
    return panResponders.current[itemId];
  }, [createPanResponder]);

  const handleInfoPress = useCallback((itemId: string) => {
    setShowInfo(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  }, []);

  const handleAddAddress = () => {
    setShowAddressSelection(false);
    if (onNavigate) {
      onNavigate('addresses');
    }
  };

  const handleCheckout = async () => {
    try {
      setIsProcessingCheckout(true);

      const { available, unavailableItems } = await checkCartAvailability();

      if (!available) {
        setIsProcessingCheckout(false);
        const errorItems = unavailableItems
          .map(({ item, reason }) => {
            const itemName = isRTL ? item.nameAr || item.name : item.name;
            return `� ${itemName} (${item.selectedTime})\n  ${reason}`;
          })
          .join('\n\n');

        const message = t('unavailableItemsMessage').replace(
          '{items}',
          errorItems,
        );
        setAlertTitle(t('someItemsUnavailable'));
        setAlertMessage(message);
        setAlertButtons([{ text: t('ok'), style: 'default' }]);
        setAlertVisible(true);
        return;
      }

      setIsProcessingCheckout(false);
      setShowAddressSelection(true);
    } catch (error) {
      setIsProcessingCheckout(false);
      setAlertTitle(t('error'));
      setAlertMessage(t('errorProcessingOrder'));
      setAlertButtons([{ text: t('ok'), style: 'default' }]);
      setAlertVisible(true);
    }
  };

  const handleAddressSelected = async (address: any) => {
    try {
      setShowAddressSelection(false);
      setIsProcessingCheckout(true);

      // Build address parts array
      const addressParts = [address.street];
      if (address.houseNumber) {
        addressParts.push(
          isRTL
            ? `${isRTL ? 'منزل' : 'House'} ${address.houseNumber}`
            : `House ${address.houseNumber}`,
        );
      }
      if (address.floorNumber) {
        addressParts.push(
          isRTL
            ? `${isRTL ? 'طابق' : 'Floor'} ${address.floorNumber}`
            : `Floor ${address.floorNumber}`,
        );
      }
      addressParts.push(address.city);

      const fullAddress = addressParts.join(', ');

      // Prepare coupon data if applied
      const couponData =
        appliedCoupon && couponDiscount > 0
          ? {
            code: appliedCoupon.code,
            discountAmount: couponDiscount,
            originalPrice: calculateTotalBeforeDiscount(),
            deductFrom: appliedCoupon.deductFrom || 'vendor',
          }
          : undefined;

      // Step 1: Create ONE booking for all items (payment status will be 'pending')
      const deliveryCharges = calculateDeliveryCharges();
      const { errors, bookings } = await createBookingsFromCart(
        fullAddress,
        couponData,
        deliveryCharges,
      );

      // Check if booking creation failed
      if (bookings.length === 0 && errors.length > 0) {
        setIsProcessingCheckout(false);

        const errorItems = errors
          .map(({ item, error }) => {
            const itemName = isRTL ? item.nameAr || item.name : item.name;
            return `• ${itemName}\n  ${error}`;
          })
          .join('\n\n');

        // Check if error is about pending payment
        const hasPendingPaymentError = errors.some(
          ({ error }) =>
            error &&
            typeof error === 'string' &&
            error.toLowerCase().includes('pending payment'),
        );

        let message;
        if (hasPendingPaymentError) {
          message = isRTL
            ? 'لديك حجز نشط بدفع معلق لإحدى هذه الخدمات. يرجى إكمال الدفع أو إلغاء الطلب من سجل الطلبات قبل إنشاء حجز جديد.'
            : 'You have an active booking with pending payment for one of these services. Please complete payment or cancel the order from Order History before creating a new booking.';
        } else {
          message = t('failedToCreateBookings').replace('{items}', errorItems);
        }

        setAlertTitle(t('bookingError'));
        setAlertMessage(message);
        setAlertButtons([{ text: t('ok'), style: 'default' }]);
        setAlertVisible(true);
        return;
      }

      // We now have exactly ONE booking
      const booking = bookings[0];
      const bookingId = booking._id || booking.id;

      console.log('Created booking:', {
        id: bookingId,
        requiresPaymentNow: booking._requiresPaymentNow,
        hasItemsNeedingConfirmation: booking._hasItemsNeedingConfirmation,
      });

      setCreatedBookingIds([bookingId]);

      // Get the cart items that were successfully booked
      const successfullyBookedItemIds: string[] = booking._cartItemIds || [];
      setSuccessfullyBookedItemIds(successfullyBookedItemIds);

      // Step 2: Check if payment is required
      // Payment is required ONLY if NO items need vendor confirmation
      if (!booking._requiresPaymentNow) {
        // Items need vendor confirmation - don't pay now
        await clearCart();
        setCartItems([]);
        setIsProcessingCheckout(false);

        setAlertTitle(isRTL ? 'تم إنشاء الحجز' : 'Booking Created');
        setAlertMessage(
          isRTL
            ? 'تم إنشاء حجزك بنجاح. سيتم إشعارك عندما يؤكد مقدم الخدمة الحجز ويمكنك الدفع.'
            : 'Your booking has been created successfully. You will be notified when the vendor confirms and you can proceed with payment.',
        );
        setAlertButtons([
          {
            text: isRTL ? 'الذهاب للطلبات' : 'Go to Orders',
            style: 'default',
            onPress: async () => {
              // Save flag to indicate OrderHistory should be opened
              await AsyncStorage.setItem('openOrderHistory', '1');
              if (onNavigate) {
                onNavigate('profile');
              }
            },
          },
          { text: t('ok'), style: 'cancel' },
        ]);
        setAlertVisible(true);
        return;
      }

      // Step 3: Calculate total amount for payment
      const successfullyBookedItems = cartItems.filter(item =>
        successfullyBookedItemIds.includes(item._id),
      );

      // Calculate total for items
      const payableSubTotal = successfullyBookedItems.reduce((total, item) => {
        const itemTotal = item.totalPrice ?? item.price * item.quantity;
        return total + itemTotal;
      }, 0);

      // Calculate delivery charges
      const payableDeliveryCharges = successfullyBookedItems.reduce(
        (total, item) => {
          if (item.maxBookingsPerSlot === -1) {
            return total + (item.deliveryFee ?? 0);
          }
          return total;
        },
        0,
      );

      // Total = subtotal + delivery - discount
      const payableTotal =
        payableSubTotal + payableDeliveryCharges - couponDiscount;

      // Round to 3 decimal places
      const totalAmount = parseFloat(Math.max(0, payableTotal).toFixed(3));

      console.log('[handleAddressSelected] Payment calculation:', {
        payableSubTotal,
        payableDeliveryCharges,
        couponDiscount,
        payableTotal,
        totalAmount,
      });

      // If total is 0 or less, skip payment
      if (totalAmount <= 0) {
        await clearCart();
        setCartItems([]);
        setIsProcessingCheckout(false);
        setShowSuccessScreen(true);
        return;
      }

      // Step 4: Prepare invoice items
      const invoiceItems = successfullyBookedItems.map(item => {
        const itemTotal = item.totalPrice ?? item.price * item.quantity;
        const unitPrice = itemTotal / item.quantity;
        return {
          ItemName: isRTL && item.nameAr ? item.nameAr : item.name,
          Quantity: item.quantity,
          UnitPrice: parseFloat(unitPrice.toFixed(3)),
        };
      });

      // Add delivery charges as a separate line item if there are any
      if (payableDeliveryCharges > 0) {
        invoiceItems.push({
          ItemName: isRTL ? 'رسوم التوصيل' : 'Delivery Charges',
          Quantity: 1,
          UnitPrice: parseFloat(payableDeliveryCharges.toFixed(3)),
        });
      }

      // Step 5: Calculate supplier shares for commission tracking
      const supplierShares =
        suppliers.length > 0
          ? calculateSupplierShares(
            successfullyBookedItems.map(item => ({
              vendorId: item.vendorId,
              totalPrice: item.totalPrice || item.price,
              price: item.price,
              quantity: item.quantity,
            })),
            suppliers,
          )
          : undefined;

      // Step 6: Prepare customer info for payment
      const customerName = user?.name || 'Customer';
      const customerEmail = user?.email || '';
      const customerMobile =
        user?.phone?.replace(/^\+965/, '').replace(/\s/g, '') || '';

      // Validate: MyFatoorah requires either email or mobile
      if (!customerEmail && !customerMobile) {
        throw new Error(
          t('emailOrPhoneRequired') ||
          'Email or phone number is required for payment',
        );
      }

      console.log('Payment data:', {
        bookingId,
        invoiceValue: totalAmount,
        customerName,
        customerEmail,
        customerMobile,
        invoiceItems: invoiceItems.length,
        suppliers: supplierShares?.length || 0,
      });

      // Step 7: Send payment link
      const paymentResponse = await sendPayment({
        bookingId,
        invoiceValue: totalAmount,
        customerName,
        customerEmail,
        customerMobile,
        mobileCountryCode: '965',
        displayCurrencyIso: 'KWD',
        language: isRTL ? 'ar' : 'en',
        customerAddress: {
          Block: '',
          Street: address.street || '',
          HouseBuildingNo: address.houseNumber || '',
          AddressInstructions: address.floorNumber
            ? `Floor: ${address.floorNumber}`
            : '',
        },
        invoiceItems,
        suppliers: supplierShares,
        notificationOption: 'LNK',
      });

      console.log('Payment response:', paymentResponse);

      if (!paymentResponse.success || !paymentResponse.data) {
        throw new Error(
          paymentResponse.message || 'Failed to create payment link',
        );
      }

      setIsProcessingCheckout(false);

      // Step 8: Open payment URL in browser
      const payUrl = paymentResponse.data.invoiceURL;
      if (payUrl) {
        setPaymentUrl(payUrl);
        setShowPaymentWebView(true);
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setIsProcessingCheckout(false);
      setAlertTitle(t('error'));
      setAlertMessage(error.message || t('errorCreatingBookings'));
      setAlertButtons([{ text: t('ok'), style: 'default' }]);
      setAlertVisible(true);
    }
  };

  // Handle payment success from WebView
  const handlePaymentSuccess = async () => {
    setShowPaymentWebView(false);

    // Save receipt data BEFORE removing items from cart
    const successfullyBookedItems = cartItems.filter(item =>
      successfullyBookedItemIds.includes(item._id),
    );
    const amount = successfullyBookedItems.reduce((total, item) => total + (item.totalPrice ?? item.price * item.quantity), 0) + calculateDeliveryCharges() - couponDiscount;

    setSuccessReceiptData({
      status: 'success',
      bookingId: createdBookingIds[0] || '',
      amount: parseFloat(Math.max(0, amount).toFixed(3)) || 0,
      currency: 'KWD',
      services: successfullyBookedItems.length > 0 ? successfullyBookedItems.map(item => ({
        name: isRTL ? (item.nameAr || item.name) : item.name,
        quantity: item.quantity,
        total: item.totalPrice ?? item.price * item.quantity
      })) : [{ name: isRTL ? 'الطلب الخاص بك' : 'Your Order', quantity: 1, total: 0 }],
      paidAt: new Date()
    });

    // Remove only the successfully booked items from cart
    if (successfullyBookedItemIds.length > 0) {
      for (const itemId of successfullyBookedItemIds) {
        try {
          await removeFromCart(itemId);
        } catch (error) {
          console.error('Error removing item from cart:', itemId, error);
        }
      }
      // Reload cart to get remaining items
      const remainingItems = await getCart();
      setCartItems(remainingItems);
      setSuccessfullyBookedItemIds([]);
    } else {
      // Fallback: clear entire cart if no specific items tracked
      await clearCart();
      setCartItems([]);
    }

    setShowSuccessScreen(true);
  };

  // Handle payment error from WebView
  const handlePaymentError = (error: string) => {
    setShowPaymentWebView(false);
    setAlertTitle(t('paymentError') || 'Payment Error');
    setAlertMessage(
      error || t('paymentFailed') || 'Payment failed. Please try again.',
    );
    setAlertButtons([{ text: t('ok'), style: 'default' }]);
    setAlertVisible(true);
  };

  // Handle payment WebView close
  const handlePaymentClose = async () => {
    setShowPaymentWebView(false);

    // Cancel the booking that was created since payment was not completed
    console.log('handlePaymentClose - createdBookingIds:', createdBookingIds);
    console.log('handlePaymentClose - userToken exists:', !!userToken);

    if (createdBookingIds && createdBookingIds.length > 0 && userToken) {
      try {
        for (const bookingId of createdBookingIds) {
          console.log('Attempting to cancel booking:', bookingId);

          // Cancel the booking (this changes booking.status to 'cancelled')
          const cancelResponse = await fetch(
            `${API_URL}/bookings/${bookingId}/cancel`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${userToken}`,
                'Content-Type': 'application/json',
              },
            },
          );

          if (cancelResponse.ok) {
            const cancelData = await cancelResponse.json();
            console.log(
              'Booking cancelled successfully:',
              bookingId,
              cancelData,
            );
          } else {
            console.log('Cancel booking failed:', cancelResponse.status);
          }
        }
      } catch (error) {
        console.error('Error cancelling bookings:', error);
      }
      // Clear the booking IDs
      setCreatedBookingIds([]);
    } else {
      console.log('No bookings to cancel or no token');
    }

    // Don't clear cart - user might want to try again
    setAlertTitle(t('paymentCancelled') || 'Payment Cancelled');
    setAlertMessage(
      t('paymentCancelledMessage') ||
      'Payment was cancelled. Your cart items are still saved.',
    );
    setAlertButtons([{ text: t('ok'), style: 'default' }]);
    setAlertVisible(true);
  };

  const calculateSubTotal = () => {
    return cartItems.reduce((total, item) => {
      if (
        !item.availabilityStatus ||
        item.availabilityStatus === 'available_now'
      ) {
        // item.totalPrice already includes quantity (calculated as: (basePrice + options) * quantity)
        // item.price is the base price per unit, so we multiply by quantity
        const itemTotal = item.totalPrice ?? item.price * item.quantity;
        return total + itemTotal;
      }
      return total;
    }, 0);
  };

  const calculateDeliveryCharges = () => {
    // Calculate delivery charges for EACH cart item that requires delivery
    // Each item with maxBookingsPerSlot === -1 gets its deliveryFee from database
    let totalDelivery = 0;
    cartItems.forEach(item => {
      if (
        (!item.availabilityStatus ||
          item.availabilityStatus === 'available_now') &&
        item.maxBookingsPerSlot === -1
      ) {
        totalDelivery += item.deliveryFee || 0;
      }
    });
    return totalDelivery;
  };

  const calculateTotalBeforeDiscount = () => {
    return calculateSubTotal() + calculateDeliveryCharges();
  };

  const calculateTotalAfterDiscount = () => {
    const total = calculateTotalBeforeDiscount();
    return Math.max(0, total - couponDiscount);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError(
        isRTL ? 'الرجاء إدخال رمز الخصم' : 'Please enter coupon code',
      );
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError('');
    setCouponMessage('');

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token || !user?._id) {
        setCouponError(
          isRTL ? 'الرجاء تسجيل الدخول أولاً' : 'Please login first',
        );
        setIsApplyingCoupon(false);
        return;
      }

      const cartItemsData = cartItems
        .filter(
          item =>
            !item.availabilityStatus ||
            item.availabilityStatus === 'available_now',
        )
        .map(item => ({
          serviceId: item.serviceId,
          vendorId: item.vendorId,
        }));

      const total = calculateTotalBeforeDiscount();

      const result = await validateCoupon(
        couponCode.trim(),
        total,
        user._id,
        cartItemsData,
        token,
      );

      if (
        result.valid &&
        result.coupon &&
        result.discountAmount !== undefined
      ) {
        setAppliedCoupon(result.coupon);
        setCouponDiscount(result.discountAmount);
        setCouponMessage(
          isRTL
            ? `تم تطبيق الخصم بنجاح! توفير ${result.coupon.discountType === 'percentage'
              ? result.coupon.discountValue + '%'
              : result.coupon.discountValue + ' د.ك'
            }`
            : `Coupon applied successfully! Discount ${result.coupon.discountType === 'percentage'
              ? result.coupon.discountValue + '%'
              : 'KD ' + result.coupon.discountValue
            }`,
        );
      } else {
        setCouponError(
          result.message || (isRTL ? 'كوبون غير صحيح' : 'Invalid coupon'),
        );
      }
    } catch (error) {
      setCouponError(isRTL ? 'خطأ في تطبيق الكوبون' : 'Error applying coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    setCouponMessage('');
    setCouponError('');
  };

  // If success screen should be shown
  if (showSuccessScreen && successReceiptData) {
    return (
      <PaymentReceiptModal
        visible={showSuccessScreen}
        receiptData={successReceiptData}
        onClose={() => {
          setShowSuccessScreen(false);
          setSuccessReceiptData(null);
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
        <StatusBar
          backgroundColor={colors.background}
          barStyle="dark-content"
          translucent={false}
        />
        {/* Header */}
        <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? (insets.top > 0 ? insets.top : 8) + 8 : insets.top + 8 }]}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.6}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d={isRTL ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
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
              {t('myCart')}
            </Text>
          </View>

          {/* Right - Profile Button */}
          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleUserIconPress}
            activeOpacity={0.6}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                stroke={colors.primary}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle
                cx="12"
                cy="7"
                r="4"
                stroke={colors.primary}
                strokeWidth={2.2}
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
            {t('pleaseLoginToViewCart')}
          </Text>
          <TouchableOpacity
            style={[styles.checkoutButton, { marginTop: 20, width: 200 }]}
            onPress={() => onNavigate && onNavigate('auth')}
          >
            <Text style={styles.checkoutButtonText}>{t('login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isAnyInfoOpen = Object.values(showInfo).some(val => val);

  return (
    <View style={styles.container}>
      {isAnyInfoOpen && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 90,
            backgroundColor: 'transparent',
          }}
          activeOpacity={1}
          onPress={() => setShowInfo({})}
        />
      )}
      <StatusBar
        backgroundColor={colors.background}
        barStyle="dark-content"
        translucent={false}
      />
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL, { paddingTop: Platform.OS === 'android' ? (insets.top > 0 ? insets.top : 8) + 8 : insets.top + 8 }]}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.6}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
          >
            <Path
              d={isRTL ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
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
            {t('myCart')}
          </Text>
        </View>

        {/* Right - Profile Button */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={handleUserIconPress}
          activeOpacity={0.6}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          {isLoggedIn && user?.profilePicture && !imageError ? (
            <Image
              source={{ uri: getImageUri(user.profilePicture) || undefined }}
              style={styles.profileIcon}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                stroke={colors.primary}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle
                cx="12"
                cy="7"
                r="4"
                stroke={colors.primary}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>{t('loading')}</Text>
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyTopSection}>
            <View style={styles.emptyBasketWrapper}>
              <Svg width={180} height={180} viewBox="0 0 100 100">
                {/* Floating premium design shapes */}
                {/* Gold Star */}
                <Path d="M 25 24 L 26.5 27 L 29.5 27 L 27 29 L 28 32 L 25 30.5 L 22 32 L 23 29 L 20.5 27 L 23.5 27 Z" fill="#b89753" opacity={0.85} />
                
                {/* Gold Circle */}
                <Circle cx="80" cy="28" r="3.5" stroke="#b89753" strokeWidth={1.5} fill="none" opacity={0.85} />
                
                {/* Teal Cross */}
                <Line x1="14" y1="52" x2="20" y2="52" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" />
                <Line x1="17" y1="49" x2="17" y2="55" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" />
                
                {/* Shopping Bag Handle */}
                <Path d="M 38 38 C 38 22, 62 22, 62 38" stroke={colors.primaryDark} strokeWidth={2.8} strokeLinecap="round" fill="none" />
                
                {/* Shopping Bag Body */}
                <Rect x="27" y="38" width="46" height="42" rx="6" stroke={colors.primaryDark} strokeWidth={2.8} fill={colors.backgroundCard} />
                
                {/* Geometric lines on shopping bag */}
                <Path d="M 37 54 L 63 54" stroke={colors.primary} strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />
                <Path d="M 43 62 L 57 62" stroke={colors.primary} strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />

                {/* Overlapping Badge (representing 0 items in cart) */}
                <Circle cx="73" cy="74" r="13" stroke={colors.primaryDark} strokeWidth={2.5} fill={colors.background} />
                <Circle cx="73" cy="74" r="13" stroke={colors.primary} strokeWidth={1.2} strokeDasharray="3,2" fill="none" />
                <SvgText x="73" y="78.5" fontSize="12" fontWeight="bold" fill={colors.primaryDark} textAnchor="middle">0</SvgText>
              </Svg>
            </View>
          </View>

          {/* Curved Transition Wave */}
          <View style={styles.curveContainer}>
            <Svg height="60" width="100%" viewBox="0 0 375 60" preserveAspectRatio="none" style={styles.curveSvg}>
              <Path d="M0 60 Q 187.5 10 375 60 L 375 60 L 0 60 Z" fill={colors.primary} />
            </Svg>
          </View>

          <View style={styles.emptyBottomSection}>
            <Text style={styles.emptyTitle}>
              {isRTL ? 'سلتك فارغة' : 'Your Cart is Empty'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isRTL 
                ? 'اكتشف خدماتنا وباقاتنا المميزة لجعل مناسبتك فريدة ومميزة.' 
                : "Explore our premium services and packages to make your occasion special."}
            </Text>

            <TouchableOpacity
              style={styles.emptyCtaButton}
              onPress={() => onNavigate && onNavigate('home')}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyCtaText}>
                {isRTL ? 'اكتشف الخدمات' : 'EXPLORE SERVICES'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            {cartItems.map(item => {
              const now = new Date();
              const isItemOld = item.timeSlot?.start
                ? new Date(item.timeSlot.start) < now
                : item.selectedDate &&
                new Date(item.selectedDate).toDateString() <
                now.toDateString();

              const panHandler = getPanResponder(item._id);
              const translateX = getSwipeAnim(item._id);
              return (
                <View key={item._id} style={[styles.swipeCardWrapper, { zIndex: showInfo[item._id] ? 999 : 1 }]}>
                  {/* Delete button behind the card - full height */}
                  <TouchableOpacity
                    style={[styles.swipeDeleteBehind, isRTL && styles.swipeDeleteBehindRTL]}
                    onPress={() => confirmAndDelete(item._id)}
                    activeOpacity={0.7}
                  >
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </TouchableOpacity>
                  <Animated.View
                    style={[styles.cartCard, { marginBottom: 0, transform: [{ translateX }] }]}
                    {...panHandler.panHandlers}
                  >
                  {/* Old Booking Warning Badge */}
                  {isItemOld && (
                    <View
                      style={[
                        styles.oldBookingBadge,
                        isRTL
                          ? styles.oldBookingBadgeRTL
                          : styles.oldBookingBadgeLTR,
                      ]}
                    >
                      <Text style={styles.oldBookingText}>
                        {t('pastTimeWarning')}
                      </Text>
                    </View>
                  )}

                  {/* Item Header with Image, Title, and info button */}
                  <View
                    style={[styles.itemHeader, isRTL && styles.itemHeaderRTL]}
                  >
                    {item.image && (
                      <Image
                        source={{ uri: getServiceImageUrl(item.image) }}
                        style={[styles.itemImage, isRTL && styles.itemImageRTL]}
                        resizeMode="cover"
                      />
                    )}
                    <View
                      style={[
                        styles.itemHeaderText,
                        isRTL && styles.itemHeaderTextRTL,
                      ]}
                    >
                      <Text
                        style={[styles.itemName, isRTL && styles.itemNameRTL]}
                      >
                        {isRTL && item.nameAr ? item.nameAr : item.name}
                      </Text>
                      {item.vendorName && (
                        <Text
                          style={[
                            styles.vendorName,
                            isRTL && styles.vendorNameRTL,
                          ]}
                        >
                          {item.vendorName}
                        </Text>
                      )}

                      {/* Selected Options / Custom Inputs */}
                      {item.customInputs && item.customInputs.length > 0 && (
                        <View
                          style={[
                            styles.optionsContainer,
                            isRTL && styles.optionsContainerRTL,
                          ]}
                        >
                          {item.customInputs.map((input, index) => {
                            const renderOptionDetail = (
                              opt: {
                                label: string;
                                labelAr?: string;
                                value: string | number;
                                valueAr?: string | number;
                                price?: number;
                              },
                              optKey: string | number,
                            ) => {
                              const hasPrice = typeof opt.price === 'number' && opt.price > 0;
                              return (
                                <View
                                  key={optKey}
                                  style={[
                                    styles.optionRow,
                                    isRTL && styles.optionRowRTL,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.optionBullet,
                                      isRTL && styles.optionBulletRTL,
                                    ]}
                                  >
                                    •
                                  </Text>
                                  <Text
                                    style={[
                                      styles.optionText,
                                      isRTL && styles.optionTextRTL,
                                    ]}
                                  >
                                    <Text style={styles.optionLabel}>
                                      {isRTL && opt.labelAr ? opt.labelAr : opt.label}:{' '}
                                    </Text>
                                    <Text style={styles.optionValue}>
                                      {isRTL && opt.valueAr ? opt.valueAr : opt.value}
                                    </Text>
                                    {hasPrice && (
                                      <Text style={styles.optionPrice}>
                                        {` (+${opt.price?.toFixed(3)} ${isRTL ? 'د.ك' : 'KD'
                                          })`}
                                      </Text>
                                    )}
                                  </Text>
                                </View>
                              );
                            };

                            if (Array.isArray(input)) {
                              return input.map((opt, subIndex) =>
                                renderOptionDetail(opt, `${index}-${subIndex}`),
                              );
                            } else if (input && input.label) {
                              return renderOptionDetail(input, index);
                            }
                            return null;
                          })}
                        </View>
                      )}
                    </View>

                    {/* Quantity Selector - Rendered on the opposite end next to the header info */}
                    {item.maxBookingsPerSlot === -1 && (
                      <View
                        style={{
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                          alignItems: 'center',
                          alignSelf: 'center',
                          marginLeft: isRTL ? 0 : 12,
                          marginRight: isRTL ? 12 : 0,
                          gap: 6,
                        }}
                      >
                        <TouchableOpacity
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 4,
                            backgroundColor: colors.primary,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                          onPress={async () => {
                            if (item.quantity > 1) {
                              try {
                                const updatedCart =
                                  await updateCartItemQuantity(
                                    item._id,
                                    item.quantity - 1,
                                  );
                                if (updatedCart) {
                                  setCartItems([...updatedCart]);
                                }
                              } catch (error) {
                                console.error(
                                  'Error updating quantity:',
                                  error,
                                );
                              }
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={{
                              color: colors.textWhite,
                              fontSize: 12,
                              fontWeight: 'bold',
                              lineHeight: 16,
                            }}
                          >
                            -
                          </Text>
                        </TouchableOpacity>

                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: colors.textDark,
                            minWidth: 18,
                            textAlign: 'center',
                          }}
                        >
                          {item.quantity}
                        </Text>

                        <TouchableOpacity
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 4,
                            backgroundColor: colors.primary,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                          onPress={async () => {
                            try {
                              const updatedCart =
                                await updateCartItemQuantity(
                                  item._id,
                                  item.quantity + 1,
                                );
                              if (updatedCart) {
                                setCartItems([...updatedCart]);
                              }
                            } catch (error) {
                              console.error(
                                'Error updating quantity:',
                                error,
                              );
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={{
                              color: colors.textWhite,
                              fontSize: 12,
                              fontWeight: 'bold',
                              lineHeight: 16,
                            }}
                          >
                            +
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {/* Info button */}
                    <TouchableOpacity
                      style={{
                        paddingLeft: isRTL ? 0 : 8,
                        paddingRight: isRTL ? 8 : 0,
                        alignSelf: 'flex-start',
                        marginTop: 2,
                      }}
                      onPress={() => handleInfoPress(item._id)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                          stroke={colors.primary}
                          strokeWidth={2}
                        />
                        <Path
                          d="M12 16v-4"
                          stroke={colors.primary}
                          strokeWidth={2}
                          strokeLinecap="round"
                        />
                        <Path
                          d="M12 8h.01"
                          stroke={colors.primary}
                          strokeWidth={2}
                          strokeLinecap="round"
                        />
                      </Svg>
                    </TouchableOpacity>
                  </View>

                  {/* Inline Info Section */}
                  {showInfo[item._id] && (
                    <View style={[styles.infoDropdown, isRTL && styles.infoDropdownRTL]}>
                      <Text style={[styles.infoDropdownTitle, isRTL && styles.infoDropdownTitleRTL]}>
                        {isRTL ? 'بيانات الخدمة' : 'Service Details'}
                      </Text>

                      <View style={[styles.infoDropdownRow, isRTL && styles.infoDropdownRowRTL]}>
                        <Text style={[styles.infoDropdownLabel, isRTL && styles.infoDropdownLabelRTL]}>
                          {isRTL ? 'الاسم:' : 'Name:'}
                        </Text>
                        <Text style={[styles.infoDropdownValue, isRTL && styles.infoDropdownValueRTL]}>
                          {isRTL && item.nameAr ? item.nameAr : item.name}
                        </Text>
                      </View>

                      {item.vendorName ? (
                        <View style={[styles.infoDropdownRow, isRTL && styles.infoDropdownRowRTL]}>
                          <Text style={[styles.infoDropdownLabel, isRTL && styles.infoDropdownLabelRTL]}>
                            {isRTL ? 'المورد:' : 'Vendor:'}
                          </Text>
                          <Text style={[styles.infoDropdownValue, isRTL && styles.infoDropdownValueRTL]}>
                            {item.vendorName}
                          </Text>
                        </View>
                      ) : null}

                      <View style={[styles.infoDropdownRow, isRTL && styles.infoDropdownRowRTL]}>
                        <Text style={[styles.infoDropdownLabel, isRTL && styles.infoDropdownLabelRTL]}>
                          {isRTL ? 'التاريخ:' : 'Date:'}
                        </Text>
                        <Text style={[styles.infoDropdownValue, isRTL && styles.infoDropdownValueRTL]}>
                          {item.selectedDate
                            ? new Date(item.selectedDate).toLocaleDateString(
                                isRTL ? 'ar-KW' : 'en-US',
                                { day: '2-digit', month: '2-digit', year: 'numeric' }
                              )
                            : '-'}
                        </Text>
                      </View>

                      <View style={[styles.infoDropdownRow, isRTL && styles.infoDropdownRowRTL]}>
                        <Text style={[styles.infoDropdownLabel, isRTL && styles.infoDropdownLabelRTL]}>
                          {isRTL ? 'الوقت:' : 'Time:'}
                        </Text>
                        <Text style={[styles.infoDropdownValue, isRTL && styles.infoDropdownValueRTL]}>
                          {item.selectedTime || '-'}
                        </Text>
                      </View>

                      <View style={[styles.infoDropdownRow, isRTL && styles.infoDropdownRowRTL]}>
                        <Text style={[styles.infoDropdownLabel, isRTL && styles.infoDropdownLabelRTL]}>
                          {isRTL ? 'آلية الحجز:' : 'Booking Type:'}
                        </Text>
                        <Text style={[styles.infoDropdownValue, isRTL && styles.infoDropdownValueRTL]}>
                          {item.availabilityStatus === 'pending_confirmation'
                            ? (isRTL ? 'يتطلب موافقة المورد' : 'Requires vendor confirmation')
                            : (isRTL ? 'تأكيد تلقائي فوري' : 'Instant automatic booking')}
                        </Text>
                      </View>

                      <View style={[styles.infoDropdownRow, isRTL && styles.infoDropdownRowRTL]}>
                        <Text style={[styles.infoDropdownLabel, isRTL && styles.infoDropdownLabelRTL]}>
                          {isRTL ? 'السعر الأساسي:' : 'Base Price:'}
                        </Text>
                        <Text style={[styles.infoDropdownValue, isRTL && styles.infoDropdownValueRTL]}>
                          {item.price.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                        </Text>
                      </View>

                      {item.moreInfo ? (
                        <View style={[styles.infoDropdownRow, isRTL && styles.infoDropdownRowRTL]}>
                          <Text style={[styles.infoDropdownLabel, isRTL && styles.infoDropdownLabelRTL]}>
                            {isRTL ? 'ملاحظات الحجز:' : 'Booking Notes:'}
                          </Text>
                          <Text style={[styles.infoDropdownValue, isRTL && styles.infoDropdownValueRTL]}>
                            {item.moreInfo}
                          </Text>
                        </View>
                      ) : null}

                      {item.customInputs && item.customInputs.length > 0 && (
                        <View style={{ marginTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(0, 161, 156, 0.1)', paddingTop: 4 }}>
                          <Text style={[styles.infoDropdownTitle, isRTL && styles.infoDropdownTitleRTL, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 4, fontSize: 11 }]}>
                            {isRTL ? 'الخيارات الإضافية:' : 'Additional Options:'}
                          </Text>
                          {item.customInputs.map((input, index) => {
                            const renderInputDetail = (
                              opt: {
                                label: string;
                                labelAr?: string;
                                value: string | number;
                                valueAr?: string | number;
                                price?: number;
                              },
                              optKey: string | number,
                            ) => {
                              const label = isRTL && opt.labelAr ? opt.labelAr : opt.label;
                              const value = isRTL && opt.valueAr ? opt.valueAr : opt.value;
                              const priceText = opt.price && opt.price > 0 
                                ? ` (+${opt.price.toFixed(3)} ${isRTL ? 'د.ك' : 'KD'})` 
                                : '';
                              return (
                                <View key={optKey} style={[styles.infoDropdownRow, isRTL && styles.infoDropdownRowRTL, { marginBottom: 3 }]}>
                                  <Text style={[styles.infoDropdownLabel, isRTL && styles.infoDropdownLabelRTL, { width: 90 }]}>
                                    {label}:
                                  </Text>
                                  <Text style={[styles.infoDropdownValue, isRTL && styles.infoDropdownValueRTL]}>
                                    {value}{priceText}
                                  </Text>
                                </View>
                              );
                            };

                            if (Array.isArray(input)) {
                              return input.map((opt, subIndex) => opt && renderInputDetail(opt, `${index}-${subIndex}`));
                            } else if (input && input.label) {
                              return renderInputDetail(input, index);
                            }
                            return null;
                          })}
                        </View>
                      )}
                    </View>
                  )}

                   {/* Date and Time */}
                  <View
                    style={[
                      styles.dateTimeSection,
                      isRTL && styles.dateTimeSectionRTL,
                    ]}
                  >
                    <View
                      style={[
                        styles.dateTimeRow,
                        isRTL && styles.dateTimeRowRTL,
                      ]}
                    >
                      {isRTL && (
                        <Text style={styles.dateTimeText}>
                          {item.selectedDate
                            ? new Date(item.selectedDate).toLocaleDateString(
                              isRTL ? 'ar-KW' : 'en-US',
                              {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              },
                            )
                            : '-'}
                        </Text>
                      )}
                      <Svg
                        width={16}
                        height={16}
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <Path
                          d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                          stroke={colors.primary}
                          strokeWidth={1.8}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                      {!isRTL && (
                        <Text style={styles.dateTimeText}>
                          {item.selectedDate
                            ? new Date(item.selectedDate).toLocaleDateString(
                              isRTL ? 'ar-KW' : 'en-US',
                              {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              },
                            )
                            : '-'}
                        </Text>
                      )}
                    </View>

                    <View
                      style={[
                        styles.dateTimeRow,
                        isRTL && styles.dateTimeRowRTL,
                      ]}
                    >
                      {isRTL && (
                        <Text style={styles.dateTimeText}>
                          {item.selectedTime || '-'}
                        </Text>
                      )}
                      <Svg
                        width={16}
                        height={16}
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <Path
                          d="M12 7v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          stroke={colors.primary}
                          strokeWidth={1.8}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                      {!isRTL && (
                        <Text style={styles.dateTimeText}>
                          {item.selectedTime || '-'}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Amount and Delivery */}
                  <View style={styles.priceSection}>
                    {/* Unit Price Row - Show only for items with quantity support and quantity > 1 */}
                    {item.maxBookingsPerSlot === -1 && item.quantity > 1 && (
                      <View
                        style={[
                          styles.priceRow,
                          isRTL && styles.priceRowRTL,
                        ]}
                      >
                        <Text
                          style={[
                            styles.priceLabel,
                            { fontSize: 11, color: colors.textSecondary },
                          ]}
                        >
                          {isRTL ? 'سعر الوحدة' : 'Unit Price'}
                        </Text>
                        <Text
                          style={[
                            styles.priceValue,
                            { fontSize: 12, color: colors.textSecondary },
                          ]}
                        >
                          {item.price.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                        </Text>
                      </View>
                    )}

                    {/* Total Amount Row */}
                    <View
                      style={[
                        styles.priceRow,
                        isRTL && styles.priceRowRTL,
                      ]}
                    >
                      <Text style={styles.priceLabel}>{t('amount')}</Text>
                      <View
                        style={{
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={styles.priceValue}>
                          {(
                            item.totalPrice ?? item.price * item.quantity
                          ).toFixed(3)}{' '}
                          {isRTL ? 'د.ك' : 'KD'}
                        </Text>
                        {item.availabilityStatus ===
                          'pending_confirmation' && (
                            <Text
                              style={{
                                fontSize: 10,
                                color: '#FF9800',
                                marginLeft: isRTL ? 0 : 6,
                                marginRight: isRTL ? 6 : 0,
                              }}
                            >
                              ({t('afterConfirmation')})
                            </Text>
                          )}
                      </View>
                    </View>

                    {/* Delivery Charges Row */}
                    <View
                      style={[
                        styles.priceRow,
                        isRTL && styles.priceRowRTL,
                      ]}
                    >
                      <Text style={styles.priceLabel}>
                        {t('deliveryCharges')}
                      </Text>
                      {item.availabilityStatus ===
                        'pending_confirmation' ? (
                        <Text
                          style={[
                            styles.deliveryChargeValue,
                            { color: colors.textSecondary, fontSize: 12 },
                          ]}
                        >
                          {t('afterConfirmation')}
                        </Text>
                      ) : item.maxBookingsPerSlot === -1 ? (
                        <Text style={styles.deliveryChargeValue}>
                          {(item.deliveryFee ?? 0).toFixed(3)}{' '}
                          {isRTL ? 'د.ك' : 'KD'}
                        </Text>
                      ) : (
                        <Text style={styles.deliveryChargeValue}>
                          {(0).toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                        </Text>
                      )}
                    </View>
                  </View>


                </Animated.View>
                </View>
              );
            })}
          </ScrollView>

          <View
            style={[
              styles.bottomSummary,
              {
                bottom: 0,
                paddingBottom: (insets.bottom ?? 0) + 10,
              },
            ]}
          >
            {/* Coupon Section */}
            <View style={styles.couponContainer}>
              <View style={styles.couponInputRow}>
                <TextInput
                  style={[styles.couponInput, isRTL && styles.couponInputRTL]}
                  placeholder={isRTL ? 'أدخل كود الخصم' : 'Enter coupon code'}
                  placeholderTextColor={colors.textSecondary}
                  value={couponCode}
                  onChangeText={text => {
                    setCouponCode(text.toUpperCase());
                    setCouponError('');
                    setCouponMessage('');
                  }}
                  editable={!appliedCoupon}
                  autoCapitalize="characters"
                />

                {/* Status Icon */}
                {(couponMessage || couponError) && (
                  <View
                    style={[
                      styles.couponStatusIcon,
                      isRTL && styles.couponStatusIconRTL,
                    ]}
                  >
                    <Text
                      style={
                        couponMessage ? styles.successIcon : styles.errorIcon
                      }
                    >
                      {couponMessage ? '?' : '?'}
                    </Text>
                  </View>
                )}

                {appliedCoupon ? (
                  <TouchableOpacity
                    style={styles.removeCouponButton}
                    onPress={handleRemoveCoupon}
                  >
                    <Text style={styles.removeButtonText}>
                      {isRTL ? 'إزالة' : 'Remove'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.applyButton,
                      (isApplyingCoupon || !couponCode.trim()) &&
                      styles.applyButtonDisabled,
                    ]}
                    onPress={handleApplyCoupon}
                    disabled={isApplyingCoupon || !couponCode.trim()}
                  >
                    {isApplyingCoupon ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.textWhite}
                      />
                    ) : (
                      <Text style={styles.applyButtonText}>
                        {isRTL ? 'تطبيق' : 'Apply'}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Totals */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('subTotal')}</Text>
              <Text style={styles.summaryValue}>
                {calculateSubTotal().toFixed(3)}
                {isRTL ? 'د.ك' : 'KD'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {t('totalDeliveryCharges')}
              </Text>
              <Text style={styles.summaryValueGreen}>
                {calculateDeliveryCharges().toFixed(3)} {isRTL ? ' د.ك ' : 'KD'}
              </Text>
            </View>

            {appliedCoupon && couponDiscount > 0 && (
              <View style={styles.discountRow}>
                <Text style={styles.discountLabel}>
                  {isRTL ? 'خصم' : 'Discount'} ({appliedCoupon.code})
                </Text>
                <Text style={styles.discountValue}>
                  - {isRTL ? ' د.ك ' : 'KD'} {couponDiscount.toFixed(3)}
                </Text>
              </View>
            )}

            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={styles.summaryLabelTotal}>{t('totalAmount')}</Text>
              <Text style={styles.summaryValueTotal}>
                {calculateTotalAfterDiscount().toFixed(3)}
                {isRTL ? ' د.ك ' : 'KD'}{' '}
              </Text>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={[
                styles.checkoutButton,
                isProcessingCheckout && styles.checkoutButtonDisabled,
              ]}
              onPress={handleCheckout}
              disabled={isProcessingCheckout}
            >
              {isProcessingCheckout ? (
                <ActivityIndicator color={colors.textWhite} />
              ) : (
                <Text style={styles.checkoutButtonText}>{t('checkout')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueShoppingButton}
              onPress={() => onNavigate && onNavigate('home')}
              disabled={isProcessingCheckout}
            >
              <Text style={styles.continueShoppingButtonText}>
                {t('continueShopping')}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}



      {/* Address Selection Modal */}
      <AddressSelection
        visible={showAddressSelection}
        onClose={() => setShowAddressSelection(false)}
        onSelectAddress={handleAddressSelected}
        onAddAddress={handleAddAddress}
        token={userToken}
      />

      {/* Payment WebView Modal */}
      <PaymentWebView
        visible={showPaymentWebView}
        paymentUrl={paymentUrl}
        onClose={handlePaymentClose}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};

export default Cart;
