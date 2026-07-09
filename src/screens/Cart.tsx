/* eslint-disable react-native/no-inline-styles */
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
  Modal,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
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
import PaymentReceiptModal, { ReceiptData } from '../components/PaymentReceiptModal/PaymentReceiptModal';
import AddressSelection from '../components/AddressSelection/AddressSelection';
import { CustomAlert } from '../components/CustomAlert';
import { validateCoupon, Coupon } from '../services/couponApi';
import { API_URL } from '../config/api.config';
import PaymentWebView from '../components/PaymentWebView';
import Terms from '../components/Terms';
import RefundPolicy from '../components/RefundPolicy';
import { CartLoginPrompt } from '../components/Cart/CartLoginPrompt';
import { EmptyCartView } from '../components/Cart/EmptyCartView';
import {
  sendPayment,
  getActiveSuppliers,
  calculateSupplierShares,
  Supplier,
} from '../services/paymentApi';

interface Address {
  _id: string;
  name: string;
  street: string;
  block?: string;
  lane?: string;
  houseNumber?: string;
  floorNumber?: string;
  apartmentNumber?: string;
  city: string;
  isDefault?: boolean;
}

interface CartProps {
  onBack?: () => void;
  onViewDetails?: (serviceId: string) => void;
  onViewPackageDetails?: (packageId: string) => void;
  onNavigate?: (route: string) => void;
  onEditService?: (serviceId: string, cartItemId: string) => void;
  onEditPackage?: (packageId: string, cartItemId: string) => void;
}

const Cart: React.FC<CartProps> = ({
  onNavigate,
  onEditService,
  onEditPackage,
}) => {
  const { isRTL, t } = useLanguage();
  const { user, isLoggedIn, token } = useAuth();
  const { addNotification } = useNotification();
  const insets = useSafeAreaInsets();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  // Swipe-to-delete animated values
  const swipeAnims = useRef<{ [key: string]: Animated.Value }>({}).current;
  const [showInfo, setShowInfo] = useState<{ [key: string]: boolean }>({});
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
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
  const [successReceiptData, setSuccessReceiptData] = useState<ReceiptData | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState('');

  const loadCart = useCallback(async () => {
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
        } catch {
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
          const hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);

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
  }, [isRTL, t]);

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
  }, [isLoggedIn, loadCart]);

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
      return `${API_URL}${uri}`;
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
  const getSwipeAnim = useCallback(
    (itemId: string) => {
      if (!swipeAnims[itemId]) {
        swipeAnims[itemId] = new Animated.Value(0);
      }
      return swipeAnims[itemId];
    },
    [swipeAnims],
  );

  const resetSwipe = useCallback(
    (itemId: string) => {
      const translateX = getSwipeAnim(itemId);
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    },
    [getSwipeAnim],
  );

  const confirmAndDelete = useCallback(
    (itemId: string) => {
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
    },
    [isRTL, getSwipeAnim, resetSwipe, t, swipeAnims, loadCart],
  );

  const createPanResponder = useCallback(
    (itemId: string) => {
      const translateX = getSwipeAnim(itemId);
      const REVEAL_THRESHOLD = 50;
      return PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return (
            Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20
          );
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
          // If swiped beyond REVEAL_THRESHOLD, trigger delete confirmation
          if (absX > REVEAL_THRESHOLD) {
            confirmAndDelete(itemId);
          }
          // Always snap the card back to the 0 position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        },
      });
    },
    [isRTL, getSwipeAnim, confirmAndDelete],
  );

  const panResponders = useRef<{
    [key: string]: ReturnType<typeof PanResponder.create>;
  }>({});
  const getPanResponder = useCallback(
    (itemId: string) => {
      if (!panResponders.current[itemId]) {
        panResponders.current[itemId] = createPanResponder(itemId);
      }
      return panResponders.current[itemId];
    },
    [createPanResponder],
  );

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

      // Check if any item in the cart requires a delivery address
      const requiresAddress = cartItems.some(item => item.addressRequired);

      if (requiresAddress) {
        setShowAddressSelection(true);
      } else {
        // If no items require address, proceed with a dummy address structure
        handleAddressSelected({
          _id: 'no-address',
          name: 'No Address Required',
          street: isRTL ? 'خدمة موقعية (لا تتطلب عنوان)' : 'Venue/Hall (No delivery address required)',
          city: '',
          houseNumber: '',
          floorNumber: '',
          apartmentNumber: '',
          isDefault: false,
        });
      }
    } catch {
      setIsProcessingCheckout(false);
      setAlertTitle(t('error'));
      setAlertMessage(t('errorProcessingOrder'));
      setAlertButtons([{ text: t('ok'), style: 'default' }]);
      setAlertVisible(true);
    }
  };

  const handleAddressSelected = async (address: Address) => {
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



      setCreatedBookingIds([bookingId]);

      // Get the cart items that were successfully booked
      const bookedItemIds: string[] = booking._cartItemIds || [];
      setSuccessfullyBookedItemIds(bookedItemIds);

      // Step 2: Check if payment is required
      // Payment is required ONLY if NO items need vendor confirmation
      if (!booking._requiresPaymentNow) {
        // Items need vendor confirmation - don't pay now
        await clearCart();
        setCartItems([]);
        setIsProcessingCheckout(false);

        addNotification({
          title: 'تم إنشاء الحجز بنجاح',
          titleEn: 'Booking Created Successfully',
          message: 'تم إنشاء حجزك بنجاح وهو بانتظار موافقة مقدم الخدمة.',
          messageEn:
            'Your booking has been created successfully and is awaiting vendor confirmation.',
          type: 'booking_created',
          bookingId: bookingId,
        }).catch(err =>
          console.error('Failed to add booking created notification:', err),
        );

        setAlertTitle(isRTL ? 'بانتظار موافقة الفيندور' : 'Awaiting Vendor Confirmation');
        setAlertMessage(
          isRTL
            ? 'تم تقديم طلب الحجز بنجاح وهو الآن بانتظار موافقة الفيندور (مقدم الخدمة). سيتم إشعارك فور تأكيده لتتمكن من إتمام الدفع.'
            : 'Your booking request has been submitted successfully and is now awaiting vendor confirmation. You will be notified once confirmed to complete payment.',
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
        bookedItemIds.includes(item._id),
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
    } catch (error) {
      console.error('Checkout error:', error);
      setIsProcessingCheckout(false);
      setAlertTitle(t('error'));
      const errorMessage = error instanceof Error ? error.message : t('errorCreatingBookings');
      setAlertMessage(errorMessage);
      setAlertButtons([{ text: t('ok'), style: 'default' }]);
      setAlertVisible(true);
    }
  };

  // Helper to generate success receipt data
  const generateSuccessReceiptData = (bookingId: string, itemIds: string[]): ReceiptData => {
    const successfullyBookedItems = cartItems.filter(item =>
      itemIds.includes(item._id),
    );
    const amount =
      successfullyBookedItems.reduce(
        (total, item) =>
          total + (item.totalPrice ?? item.price * item.quantity),
        0,
      ) +
      calculateDeliveryCharges() -
      couponDiscount;

    return {
      status: 'success',
      bookingId: bookingId,
      amount: parseFloat(Math.max(0, amount).toFixed(3)) || 0,
      currency: 'KWD',
      services:
        successfullyBookedItems.length > 0
          ? successfullyBookedItems.map(item => ({
              name: isRTL ? item.nameAr || item.name : item.name,
              quantity: item.quantity,
              total: item.totalPrice ?? item.price * item.quantity,
            }))
          : [
              {
                name: isRTL ? 'الطلب الخاص بك' : 'Your Order',
                quantity: 1,
                total: 0,
              },
            ],
      paidAt: new Date(),
    };
  };

  // Helper to clear successfully booked items from cart
  const clearSuccessfullyBookedItems = async (itemIds: string[]) => {
    if (itemIds.length > 0) {
      for (const itemId of itemIds) {
        try {
          await removeFromCart(itemId);
        } catch (error) {
          console.error('Error removing item from cart:', itemId, error);
        }
      }
      const remainingItems = await getCart();
      setCartItems(remainingItems);
      setSuccessfullyBookedItemIds([]);
    } else {
      await clearCart();
      setCartItems([]);
    }
  };

  // Handle payment success from WebView
  const handlePaymentSuccess = async () => {
    setShowPaymentWebView(false);

    // Save receipt data BEFORE removing items from cart
    const receipt = generateSuccessReceiptData(createdBookingIds[0] || '', successfullyBookedItemIds);
    setSuccessReceiptData(receipt);

    // Remove only the successfully booked items from cart
    await clearSuccessfullyBookedItems(successfullyBookedItemIds);

    addNotification({
      title: 'تم دفع الحجز بنجاح',
      titleEn: 'Booking Paid Successfully',
      message: 'تم تأكيد دفع حجزك بنجاح! حجزك مؤكد الآن.',
      messageEn:
        'Your booking payment was confirmed successfully! Your booking is now confirmed.',
      type: 'booking_payment_confirmed',
      bookingId: createdBookingIds[0] || '',
    }).catch(err =>
      console.error('Failed to add booking paid notification:', err),
    );

    setShowSuccessScreen(true);
  };

  // Helper to delete unpaid bookings created during this checkout session
  const deleteCreatedBookings = async () => {


    if (createdBookingIds && createdBookingIds.length > 0 && userToken) {
      try {
        for (const bookingId of createdBookingIds) {


          // 1. Fetch current booking status from server to prevent race conditions
          const checkResponse = await fetch(
            `${API_URL}/bookings/${bookingId}`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${userToken}`,
                'Content-Type': 'application/json',
              },
            },
          );

          if (checkResponse.ok) {
            const bookingData = await checkResponse.json();


            // If the booking is already paid or completed, do NOT delete it.
            // Instead, transition the user to the success screen!
            if (
              bookingData &&
              (bookingData.paymentStatus === 'paid' ||
                bookingData.status === 'completed')
            ) {


              // Transition to success screen
              const receipt = generateSuccessReceiptData(bookingId, successfullyBookedItemIds);
              setSuccessReceiptData(receipt);

              // Clear only the successfully booked items from cart
              await clearSuccessfullyBookedItems(successfullyBookedItemIds);

              setShowSuccessScreen(true);
              setCreatedBookingIds([]);
              return true; // Indicating success screen was shown
            }
          }

          // 2. If it is not paid/confirmed, proceed with deleting the booking

          const deleteResponse = await fetch(
            `${API_URL}/bookings/${bookingId}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${userToken}`,
                'Content-Type': 'application/json',
              },
            },
          );

          if (deleteResponse.ok) {
            await deleteResponse.json();
          }
        }
      } catch (error) {
        console.error('Error during booking status check/deletion:', error);
      }
      // Clear the booking IDs
      setCreatedBookingIds([]);
    } else {

    }
    return false; // Indicating booking was deleted or skipped
  };

  // Handle payment error from WebView
  const handlePaymentError = async (error: string) => {
    setShowPaymentWebView(false);

    // Attempt deletion; if it redirects to success screen, skip error alert
    const wasSuccessful = await deleteCreatedBookings();
    if (wasSuccessful) return;

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

    // Attempt deletion; if it redirects to success screen, skip cancellation alert
    const wasSuccessful = await deleteCreatedBookings();
    if (wasSuccessful) return;

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

  const calculateOriginalSubTotal = () => {
    return cartItems.reduce((total, item) => {
      if (
        !item.availabilityStatus ||
        item.availabilityStatus === 'available_now'
      ) {
        const itemOriginalTotal = item.originalTotalPriceBeforeDiscount
          ? item.originalTotalPriceBeforeDiscount * item.quantity
          : (item.totalPrice ?? item.price * item.quantity);
        return total + itemOriginalTotal;
      }
      return total;
    }, 0);
  };

  const calculateDeliveryCharges = () => {
    // Calculate delivery charges for EACH cart item that requires delivery
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
      const storedToken = await AsyncStorage.getItem('userToken');
      if (!storedToken || !user?._id) {
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
        storedToken,
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
            ? `تم تطبيق الخصم بنجاح! توفير ${
                result.coupon.discountType === 'percentage'
                  ? result.coupon.discountValue + '%'
                  : result.coupon.discountValue + ' د.ك'
              }`
            : `Coupon applied successfully! Discount ${
                result.coupon.discountType === 'percentage'
                  ? result.coupon.discountValue + '%'
                  : 'KD ' + result.coupon.discountValue
              }`,
        );
      } else {
        setCouponError(
          result.message || (isRTL ? 'كوبون غير صحيح' : 'Invalid coupon'),
        );
      }
    } catch {
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
      <CartLoginPrompt
        isRTL={isRTL}
        t={t}
        insets={insets}
        handleBack={handleBack}
        onNavigate={onNavigate}
      />
    );
  }

  // If user is logged in, but cart is empty, show empty cart page
  if (isLoggedIn && !loading && cartItems.length === 0) {
    return (
      <EmptyCartView
        isRTL={isRTL}
        t={t}
        insets={insets}
        handleBack={handleBack}
        handleUserIconPress={handleUserIconPress}
        onNavigate={onNavigate}
        user={user}
        imageError={imageError}
        setImageError={setImageError}
        getImageUri={getImageUri}
      />
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
        backgroundColor="#00a19c"
        barStyle="light-content"
        translucent={false}
      />
      {/* Header */}
      <View
        style={[
          styles.header,
          isRTL && styles.headerRTL,
          {
            paddingTop:
              Platform.OS === 'android'
                ? (insets.top > 0 ? insets.top : 8) + 8
                : insets.top + 8,
          },
        ]}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.6}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d={isRTL ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
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
      ) : (
        <>
          <ScrollView
            style={[styles.scrollView, { zIndex: isAnyInfoOpen ? 1 : 0 }]}
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
              const swipeOpacity = translateX.interpolate({
                inputRange: isRTL ? [0, 5, 20] : [-20, -5, 0],
                outputRange: isRTL ? [0, 0, 1] : [1, 0, 0],
                extrapolate: 'clamp',
              });
              return (
                <View
                  key={item._id}
                  style={[
                    styles.swipeCardWrapper,
                    { zIndex: showInfo[item._id] ? 999 : 1 },
                  ]}
                >
                  {/* Delete indicator behind the card - revealed only during swipe */}
                  <Animated.View
                    style={[
                      styles.swipeDeleteBehind,
                      isRTL && styles.swipeDeleteBehindRTL,
                      { opacity: swipeOpacity },
                    ]}
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
                  </Animated.View>
                  <Animated.View
                    style={[
                      styles.cartCard,
                      { marginBottom: 0, transform: [{ translateX }] },
                    ]}
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
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            if (item.isPackage) {
                              onEditPackage &&
                                onEditPackage(item.serviceId, item._id);
                            } else {
                              onEditService &&
                                onEditService(item.serviceId, item._id);
                            }
                          }}
                        >
                          <Image
                            source={{ uri: getServiceImageUrl(item.image) }}
                            style={[
                              styles.itemImage,
                              isRTL && styles.itemImageRTL,
                            ]}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[
                          styles.itemHeaderText,
                          isRTL && styles.itemHeaderTextRTL,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                          if (item.isPackage) {
                            onEditPackage &&
                              onEditPackage(item.serviceId, item._id);
                          } else {
                            onEditService &&
                              onEditService(item.serviceId, item._id);
                          }
                        }}
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
                      </TouchableOpacity>

                      {/* Controls Group: Quantity, Delete, Info */}
                      <View
                        style={{
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                          alignItems: 'center',
                          gap: 10,
                          alignSelf: 'center',
                        }}
                      >
                        {/* Quantity Selector */}
                        {item.maxBookingsPerSlot === -1 && (
                          <View
                            style={{
                              flexDirection: isRTL ? 'row-reverse' : 'row',
                              alignItems: 'center',
                              backgroundColor: '#EBF5F4',
                              borderRadius: 16,
                              padding: 3,
                              gap: 8,
                              borderWidth: 1,
                              borderColor: 'rgba(0, 161, 156, 0.08)',
                            }}
                          >
                            <TouchableOpacity
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: '#FFFFFF',
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 1,
                                elevation: 1,
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
                                  color: colors.primary,
                                  fontSize: 14,
                                  fontWeight: 'bold',
                                  lineHeight: 18,
                                }}
                              >
                                -
                              </Text>
                            </TouchableOpacity>

                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: '700',
                                color: colors.primaryDark,
                                minWidth: 16,
                                textAlign: 'center',
                              }}
                            >
                              {item.quantity}
                            </Text>

                            <TouchableOpacity
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: colors.primary,
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 1,
                                elevation: 1,
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
                                  fontSize: 14,
                                  fontWeight: 'bold',
                                  lineHeight: 18,
                                }}
                              >
                                +
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        {/* Delete button */}
                        <TouchableOpacity
                          style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                          onPress={() => confirmAndDelete(item._id)}
                          activeOpacity={0.6}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Svg
                            width={22}
                            height={22}
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <Path
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              stroke="#FF3B30"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </Svg>
                        </TouchableOpacity>
                        {/* Info button */}
                        <TouchableOpacity
                          style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                          onPress={() => handleInfoPress(item._id)}
                          activeOpacity={0.6}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Svg
                            width={22}
                            height={22}
                            viewBox="0 0 24 24"
                            fill="none"
                          >
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
                    </View>

                    {/* Selected Options / Custom Inputs */}
                    {item.customInputs && item.customInputs.length > 0 && (
                      <View
                        style={[
                          styles.optionsContainer,
                          isRTL && styles.optionsContainerRTL,
                          {
                            marginBottom: 8,
                            paddingLeft: isRTL ? 4 : item.image ? 57 : 4,
                            paddingRight: isRTL ? (item.image ? 57 : 4) : 4,
                          },
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
                            const hasPrice =
                              typeof opt.price === 'number' && opt.price > 0;
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
                                    {isRTL && opt.labelAr
                                      ? opt.labelAr
                                      : opt.label}
                                    :{' '}
                                  </Text>
                                  <Text style={styles.optionValue}>
                                    {isRTL && opt.valueAr
                                      ? opt.valueAr
                                      : opt.value}
                                  </Text>
                                  {hasPrice && (
                                    <Text style={styles.optionPrice}>
                                      {` (+${opt.price?.toFixed(3)} ${
                                        isRTL ? 'د.ك' : 'KD'
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

                    {/* Inline Info Section */}
                    {showInfo[item._id] && (
                      <View
                        style={[
                          styles.infoDropdown,
                          isRTL && styles.infoDropdownRTL,
                        ]}
                      >
                        <Text
                          style={[
                            styles.infoDropdownTitle,
                            isRTL && styles.infoDropdownTitleRTL,
                          ]}
                        >
                          {isRTL ? 'بيانات الخدمة' : 'Service Details'}
                        </Text>

                        <View
                          style={[
                            styles.infoDropdownRow,
                            isRTL && styles.infoDropdownRowRTL,
                          ]}
                        >
                          <Text
                            style={[
                              styles.infoDropdownLabel,
                              isRTL && styles.infoDropdownLabelRTL,
                            ]}
                          >
                            {isRTL ? 'الاسم:' : 'Name:'}
                          </Text>
                          <Text
                            style={[
                              styles.infoDropdownValue,
                              isRTL && styles.infoDropdownValueRTL,
                            ]}
                          >
                            {isRTL && item.nameAr ? item.nameAr : item.name}
                          </Text>
                        </View>

                        {item.vendorName ? (
                          <View
                            style={[
                              styles.infoDropdownRow,
                              isRTL && styles.infoDropdownRowRTL,
                            ]}
                          >
                            <Text
                              style={[
                                styles.infoDropdownLabel,
                                isRTL && styles.infoDropdownLabelRTL,
                              ]}
                            >
                              {isRTL ? 'المورد:' : 'Vendor:'}
                            </Text>
                            <Text
                              style={[
                                styles.infoDropdownValue,
                                isRTL && styles.infoDropdownValueRTL,
                              ]}
                            >
                              {item.vendorName}
                            </Text>
                          </View>
                        ) : null}

                        <View
                          style={[
                            styles.infoDropdownRow,
                            isRTL && styles.infoDropdownRowRTL,
                          ]}
                        >
                          <Text
                            style={[
                              styles.infoDropdownLabel,
                              isRTL && styles.infoDropdownLabelRTL,
                            ]}
                          >
                            {isRTL ? 'التاريخ:' : 'Date:'}
                          </Text>
                          <Text
                            style={[
                              styles.infoDropdownValue,
                              isRTL && styles.infoDropdownValueRTL,
                            ]}
                          >
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
                        </View>

                        <View
                          style={[
                            styles.infoDropdownRow,
                            isRTL && styles.infoDropdownRowRTL,
                          ]}
                        >
                          <Text
                            style={[
                              styles.infoDropdownLabel,
                              isRTL && styles.infoDropdownLabelRTL,
                            ]}
                          >
                            {isRTL ? 'الوقت:' : 'Time:'}
                          </Text>
                          <Text
                            style={[
                              styles.infoDropdownValue,
                              isRTL && styles.infoDropdownValueRTL,
                            ]}
                          >
                            {item.selectedTime || '-'}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.infoDropdownRow,
                            isRTL && styles.infoDropdownRowRTL,
                          ]}
                        >
                          <Text
                            style={[
                              styles.infoDropdownLabel,
                              isRTL && styles.infoDropdownLabelRTL,
                            ]}
                          >
                            {isRTL ? 'آلية الحجز:' : 'Booking Type:'}
                          </Text>
                          <Text
                            style={[
                              styles.infoDropdownValue,
                              isRTL && styles.infoDropdownValueRTL,
                            ]}
                          >
                            {item.availabilityStatus === 'pending_confirmation'
                              ? isRTL
                                ? 'يتطلب موافقة المورد'
                                : 'Requires vendor confirmation'
                              : isRTL
                              ? 'تأكيد تلقائي فوري'
                              : 'Instant automatic booking'}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.infoDropdownRow,
                            isRTL && styles.infoDropdownRowRTL,
                          ]}
                        >
                          <Text
                            style={[
                              styles.infoDropdownLabel,
                              isRTL && styles.infoDropdownLabelRTL,
                            ]}
                          >
                            {isRTL ? 'السعر الأساسي:' : 'Base Price:'}
                          </Text>
                          <Text
                            style={[
                              styles.infoDropdownValue,
                              isRTL && styles.infoDropdownValueRTL,
                            ]}
                          >
                            {item.price.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                          </Text>
                        </View>

                        {item.moreInfo ? (
                          <View
                            style={[
                              styles.infoDropdownRow,
                              isRTL && styles.infoDropdownRowRTL,
                            ]}
                          >
                            <Text
                              style={[
                                styles.infoDropdownLabel,
                                isRTL && styles.infoDropdownLabelRTL,
                              ]}
                            >
                              {isRTL ? 'ملاحظات الحجز:' : 'Booking Notes:'}
                            </Text>
                            <Text
                              style={[
                                styles.infoDropdownValue,
                                isRTL && styles.infoDropdownValueRTL,
                              ]}
                            >
                              {item.moreInfo}
                            </Text>
                          </View>
                        ) : null}

                        {item.customInputs && item.customInputs.length > 0 && (
                          <View
                            style={{
                              marginTop: 4,
                              borderTopWidth: 1,
                              borderTopColor: 'rgba(0, 161, 156, 0.1)',
                              paddingTop: 4,
                            }}
                          >
                            <Text
                              style={[
                                styles.infoDropdownTitle,
                                isRTL && styles.infoDropdownTitleRTL,
                                {
                                  borderBottomWidth: 0,
                                  paddingBottom: 0,
                                  marginBottom: 4,
                                  fontSize: 11,
                                },
                              ]}
                            >
                              {isRTL
                                ? 'الخيارات الإضافية:'
                                : 'Additional Options:'}
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
                                const label =
                                  isRTL && opt.labelAr
                                    ? opt.labelAr
                                    : opt.label;
                                const value =
                                  isRTL && opt.valueAr
                                    ? opt.valueAr
                                    : opt.value;
                                const priceText =
                                  opt.price && opt.price > 0
                                    ? ` (+${opt.price.toFixed(3)} ${
                                        isRTL ? 'د.ك' : 'KD'
                                      })`
                                    : '';
                                return (
                                  <View
                                    key={optKey}
                                    style={[
                                      styles.infoDropdownRow,
                                      isRTL && styles.infoDropdownRowRTL,
                                      { marginBottom: 4 },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.infoDropdownLabel,
                                        isRTL && styles.infoDropdownLabelRTL,
                                      ]}
                                    >
                                      {label}:
                                    </Text>
                                    <Text
                                      style={[
                                        styles.infoDropdownValue,
                                        isRTL && styles.infoDropdownValueRTL,
                                      ]}
                                    >
                                      {value}
                                      {priceText !== '' && (
                                        <Text style={styles.optionPrice}>
                                          {' '}
                                          {priceText}
                                        </Text>
                                      )}
                                    </Text>
                                  </View>
                                );
                              };

                              if (Array.isArray(input)) {
                                return input.map(
                                  (opt, subIndex) =>
                                    opt &&
                                    renderInputDetail(
                                      opt,
                                      `${index}-${subIndex}`,
                                    ),
                                );
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
                          style={[styles.priceRow, isRTL && styles.priceRowRTL]}
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
                        style={[styles.priceRow, isRTL && styles.priceRowRTL]}
                      >
                        <Text style={styles.priceLabel}>{t('amount')}</Text>
                        <View
                          style={{
                            flexDirection: isRTL ? 'row-reverse' : 'row',
                            alignItems: 'center',
                          }}
                        >
                          {(() => {
                            const itemOriginalTotal = item.originalTotalPriceBeforeDiscount
                              ? item.originalTotalPriceBeforeDiscount * item.quantity
                              : null;
                            const hasDiscount = itemOriginalTotal && itemOriginalTotal > (item.totalPrice ?? item.price * item.quantity);
                            if (hasDiscount) {
                              return (
                                <Text
                                  style={{
                                    fontSize: 13,
                                    textDecorationLine: 'line-through',
                                    color: colors.textSecondary || '#757575',
                                    marginHorizontal: 6,
                                  }}
                                >
                                  {itemOriginalTotal.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                                </Text>
                              );
                            }
                            return null;
                          })()}
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
                        style={[styles.priceRow, isRTL && styles.priceRowRTL]}
                      >
                        <Text style={styles.priceLabel}>
                          {t('deliveryCharges')}
                        </Text>
                        {item.availabilityStatus === 'pending_confirmation' ? (
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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {(() => {
                  const originalSubTotal = calculateOriginalSubTotal();
                  const currentSubTotal = calculateSubTotal();
                  if (originalSubTotal - currentSubTotal > 0.005) {
                    return (
                      <Text
                        style={[
                          styles.summaryValue,
                          {
                            textDecorationLine: 'line-through',
                            color: colors.textSecondary || '#757575',
                            marginRight: isRTL ? 0 : 8,
                            marginLeft: isRTL ? 8 : 0,
                            fontSize: 13,
                          },
                        ]}
                      >
                        {originalSubTotal.toFixed(3)}
                        {isRTL ? ' د.ك' : ' KD'}
                      </Text>
                    );
                  }
                  return null;
                })()}
                <Text style={styles.summaryValue}>
                  {calculateSubTotal().toFixed(3)}
                  {isRTL ? 'د.ك' : 'KD'}
                </Text>
              </View>
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
                  {isRTL ? 'خصم الكوبون' : 'Coupon Discount'} ({appliedCoupon.code})
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

            {/* Terms & Conditions Checkbox */}
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                marginBottom: 14,
                paddingHorizontal: 4,
                gap: 10,
              }}
            >
              {/* Checkbox square — toggles acceptance */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setTermsAccepted(prev => !prev)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: termsAccepted ? colors.primary : '#aaa',
                  backgroundColor: termsAccepted
                    ? colors.primary
                    : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {termsAccepted && (
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: '700',
                      lineHeight: 12,
                    }}
                  >
                    ✓
                  </Text>
                )}
              </TouchableOpacity>

              {/* Text with clickable link */}
              <View
                style={{
                  flex: 1,
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: '#666',
                    lineHeight: 15,
                  }}
                >
                  {isRTL ? 'أوافق على ' : 'I agree to '}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowTermsModal(true)}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.primary,
                      fontWeight: '700',
                      lineHeight: 15,
                      textDecorationLine: 'underline',
                    }}
                  >
                    {isRTL ? 'الشروط' : 'Terms & Conditions'}
                  </Text>
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 11,
                    color: '#666',
                    lineHeight: 15,
                  }}
                >
                  {isRTL ? ' و ' : ' & '}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowRefundModal(true)}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.primary,
                      fontWeight: '700',
                      lineHeight: 15,
                      textDecorationLine: 'underline',
                    }}
                  >
                    {isRTL ? 'سياسة الاسترجاع' : 'Refund Policy'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={[
                styles.checkoutButton,
                (isProcessingCheckout || !termsAccepted) &&
                  styles.checkoutButtonDisabled,
              ]}
              onPress={handleCheckout}
              disabled={isProcessingCheckout || !termsAccepted}
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

      {/* Terms & Conditions Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={false}
        statusBarTranslucent={true}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <Terms onBack={() => setShowTermsModal(false)} />
      </Modal>

      {/* Refund Policy Modal */}
      <Modal
        visible={showRefundModal}
        animationType="slide"
        transparent={false}
        statusBarTranslucent={true}
        onRequestClose={() => setShowRefundModal(false)}
      >
        <RefundPolicy onBack={() => setShowRefundModal(false)} />
      </Modal>
    </View>
  );
};

export default Cart;
