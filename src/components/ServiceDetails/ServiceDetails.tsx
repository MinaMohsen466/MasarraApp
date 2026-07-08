/* eslint-disable react-native/no-inline-styles, @typescript-eslint/no-explicit-any, no-console, react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
  Share,
  Animated,
  TextInput,
  StatusBar,
  Clipboard,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Svg, { Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStyles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGlobalDate } from '../../contexts/DateContext';
import {
  getServiceImageUrl,
  fetchServiceById,
} from '../../services/servicesApi';
import {
  getImageUrl,
  checkTimeSlotAvailability,
  getUserBookings,
} from '../../services/api';
import {
  toggleWishlist,
  isWishlisted,
  WishlistItem,
} from '../../services/wishlist';
import { addToCart, updateCartItem, CartItem } from '../../services/cart';
import DatePickerModal, {
  clearDatePickerCacheForService,
} from '../DatePickerModal/DatePickerModal';
import TimePickerModal from '../TimePickerModal/TimePickerModal';
import WriteReview from '../../screens/WriteReview';
import {
  getServiceReviews,
  Review,
  ReviewStats,
  deleteReview,
  checkUserReviewedService,
} from '../../services/reviewsApi';
import { CustomAlert } from '../../screens/../components/CustomAlert/CustomAlert';

interface ServiceDetailsProps {
  serviceId: string;
  onBack?: () => void;
  onNavigate?: (route: string) => void;
  editCartItemId?: string;
}

const ServiceDetails: React.FC<ServiceDetailsProps> = ({
  serviceId,
  onBack,
  onNavigate,
  editCartItemId,
}) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const styles = createStyles(SCREEN_WIDTH);
  const { isRTL } = useLanguage();
  const { globalSelectedDate, setGlobalSelectedDate } = useGlobalDate();
  const insets = useSafeAreaInsets();
  const fixedHeight = insets.top + 56; // Increased from 46 to 56 to add vertical padding

  const isTablet = SCREEN_WIDTH >= 600;
  const backIconSize = isTablet ? 18 : 20;
  const headerIconSize = isTablet ? 16 : 18;
  const carouselHeight = isTablet ? 480 : 380;
  const threshold = carouselHeight - fixedHeight - 20;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const dotAnimations = useRef<Animated.Value[]>([]).current;
  const scrollRef = useRef<any>(null);
  const [reviewsY, setReviewsY] = useState(0);

  const scrollToReviews = () => {
    if (scrollRef.current) {
      const scrollResponder = scrollRef.current.scrollTo
        ? scrollRef.current
        : (scrollRef.current as any).getNode?.();
      if (scrollResponder && scrollResponder.scrollTo) {
        scrollResponder.scrollTo({
          y: Math.max(0, reviewsY - 80),
          animated: true,
        });
      }
    }
  };

  // Ref to track scroll position and interpolate header background & title opacity
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerBgColor = scrollY.interpolate({
    inputRange: [threshold - 60, threshold],
    outputRange: ['rgba(206, 223, 215, 0)', 'rgba(206, 223, 215, 1)'],
    extrapolate: 'clamp',
  });
  const headerBorderColor = scrollY.interpolate({
    inputRange: [threshold - 60, threshold],
    outputRange: ['rgba(44, 95, 93, 0)', 'rgba(44, 95, 93, 0.1)'],
    extrapolate: 'clamp',
  });
  const titleOpacity = scrollY.interpolate({
    inputRange: [threshold - 30, threshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Date/Time picker state - initialize with global date if available
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    globalSelectedDate || null,
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [originalDate, setOriginalDate] = useState<Date | null>(null);
  const [originalTime, setOriginalTime] = useState<string | null>(null);

  // Availability state - track if selected time slot is available
  const [isTimeSlotAvailable, setIsTimeSlotAvailable] = useState<boolean>(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Custom inputs state - stores selected option index for each custom input
  const [customInputSelections, setCustomInputSelections] = useState<{
    [key: string]: number | string | number[] | { [key: string]: number };
  }>({});
  // State to control which custom inputs are expanded
  const [expandedCustomInputs, setExpandedCustomInputs] = useState<{
    [key: string]: boolean;
  }>({});

  // Video playback state
  const [playingVideoIndex, setPlayingVideoIndex] = useState<number | null>(
    null,
  );

  // Loading state for add to cart
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDeletingReview, setIsDeletingReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [userBookingId, setUserBookingId] = useState<string | null>(null);
  const [showWriteReviewModal, setShowWriteReviewModal] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
  }>({ visible: false, title: '', message: '', buttons: [] });

  const [isSuccessState, setIsSuccessState] = useState(false);
  const [activeFullImageUrl, setActiveFullImageUrl] = useState<string | null>(
    null,
  );

  // Fetch specific service details for accurate policy data
  const { data: serviceData, isLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => fetchServiceById(serviceId),
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000,
  });

  const service = serviceData as any;
  const addToCartButtonRef = useRef<View>(null);

  // Automatically expand the first custom input by default when service loads/changes
  React.useEffect(() => {
    if (service?.customInputs && service.customInputs.length > 0) {
      const firstInput = service.customInputs[0];
      const firstInputId = firstInput._id || firstInput.label || 'input_0';
      setExpandedCustomInputs({
        [firstInputId]: true,
      });
    }
  }, [service]);

  // Helper function to check if selected date/time is in the past
  const isTimeInPast = () => {
    if (!selectedDate || !selectedTime) return false;

    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();

    if (!isToday) {
      // If it's a future date, it's not in the past
      return selectedDate < now;
    }

    // Parse the selected time (format: "HH:MM - HH:MM" or "HH:MM AM/PM - HH:MM AM/PM")
    const startTime = selectedTime.split(' - ')[0].trim();
    const timeMatch = startTime.match(/(\d{1,2}):(\d{2})/);

    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);

      const selectedDateTime = new Date(selectedDate);
      selectedDateTime.setHours(hours, minutes, 0, 0);

      return selectedDateTime < now;
    }

    return false;
  };

  // Animation function for adding to cart
  const triggerAddToCartAnimation = () => {
    // No-op because bottom navigation bar is hidden on this screen
  };

  // Load user token and userId
  React.useEffect(() => {
    const loadUserData = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');
      setUserToken(token);
      setCurrentUserId(userId);
    };
    loadUserData();
  }, []);

  // Load existing cart item for editing and pre-fill selections
  React.useEffect(() => {
    const loadCartItemForEdit = async () => {
      if (!editCartItemId) return;
      try {
        const { getCart } = require('../../services/cart');
        const cart = await getCart();
        const item = cart.find((i: any) => i._id === editCartItemId);
        if (item) {
          // Pre-fill date and time
          if (item.selectedDate) {
            const dateObj = new Date(item.selectedDate);
            setSelectedDate(dateObj);
            setOriginalDate(dateObj);
          }
          if (item.selectedTime) {
            setSelectedTime(item.selectedTime);
            setOriginalTime(item.selectedTime);
          }
          // Pre-fill custom inputs
          if (
            item.customInputs &&
            Array.isArray(item.customInputs) &&
            service?.customInputs
          ) {
            const initialSelections: any = {};
            service.customInputs.forEach((input: any) => {
              const inputId = input._id || input.label;
              const matchingInputs = item.customInputs.filter(
                (ci: any) => ci.label === input.label,
              );

              if (matchingInputs.length > 0) {
                if (input.type === 'radio-single') {
                  const val = matchingInputs[0].value;
                  const idx = input.options.indexOf(val);
                  if (idx >= 0) {
                    initialSelections[inputId] = idx;
                  }
                } else if (input.type === 'radio-multiple') {
                  const indices = matchingInputs
                    .map((ci: any) => input.options.indexOf(ci.value))
                    .filter((idx: number) => idx >= 0);
                  initialSelections[inputId] = indices;
                } else if (input.type === 'restaurant-menu') {
                  const menuSelections: { [key: string]: number } = {};
                  matchingInputs.forEach((ci: any) => {
                    const parts = String(ci.value).split(/ [×xX]/);
                    if (parts.length >= 2) {
                      const optName = parts[0].trim();
                      const qty = parseInt(parts[1].trim(), 10) || 0;
                      if (qty > 0) {
                        menuSelections[optName] = qty;
                      }
                    }
                  });
                  initialSelections[inputId] = menuSelections;
                } else if (input.type === 'text' || input.type === 'number') {
                  initialSelections[inputId] = matchingInputs[0].value;
                }
              }
            });
            setCustomInputSelections(initialSelections);
          }
        }
      } catch (err) {
        console.error('Error loading cart item for edit:', err);
      }
    };

    if (service) {
      loadCartItemForEdit();
    }
  }, [editCartItemId, service]);

  // Check if the user has purchased the service
  React.useEffect(() => {
    const checkPurchaseStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token || !serviceId) {
          setHasPurchased(false);
          setUserBookingId(null);
          return;
        }

        const bookingsData = await getUserBookings(token);

        // Find if there's any booking for this service that is confirmed/completed
        const purchaseBooking = bookingsData.find(booking => {
          return booking.services?.some(s => {
            const sId =
              typeof s.service === 'string' ? s.service : s.service?._id;
            if (sId !== serviceId) return false;

            const status = s.status || booking.status;
            return status === 'confirmed' || status === 'completed';
          });
        });

        if (purchaseBooking) {
          setHasPurchased(true);
          setUserBookingId(purchaseBooking._id);
        } else {
          setHasPurchased(false);
          setUserBookingId(null);
        }
      } catch (error) {
        console.log('Error checking purchase status:', error);
        setHasPurchased(false);
        setUserBookingId(null);
      }
    };

    checkPurchaseStatus();
  }, [serviceId, userToken]);

  // Fetch user's existing review if any
  React.useEffect(() => {
    const fetchUserReview = async () => {
      if (!serviceId || !userToken) {
        setUserReview(null);
        return;
      }
      try {
        const review = await checkUserReviewedService(serviceId);
        setUserReview(review);
      } catch (error) {
        console.log('Error checking user review status:', error);
        setUserReview(null);
      }
    };

    fetchUserReview();
  }, [serviceId, userToken]);

  // Load reviews in parallel using React Query for better caching
  const { data: reviewsData, refetch: refetchReviews } = useQuery<any>({
    queryKey: ['service-reviews', serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      return await getServiceReviews(serviceId, 1, 10);
    },
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes - shorter to allow refresh after new reviews
    gcTime: 15 * 60 * 1000, // 15 minutes cache
    refetchOnMount: 'always', // Always refetch when component mounts to show new reviews
    refetchOnWindowFocus: false,
  });

  // Update local state when reviews data changes
  useEffect(() => {
    if (reviewsData && service) {
      const vendorId =
        typeof service.vendor === 'string'
          ? service.vendor
          : service.vendor?._id;
      const customerReviews = reviewsData.reviews.filter(
        (review: any) => review.user?._id !== vendorId,
      );
      setReviews(customerReviews);

      // Adjust stats to match filtered reviews
      const vendorReviewsCount =
        reviewsData.reviews.length - customerReviews.length;
      if (vendorReviewsCount > 0 && reviewsData.stats) {
        const adjustedStats = {
          ...reviewsData.stats,
          totalRatings: Math.max(
            0,
            reviewsData.stats.totalRatings - vendorReviewsCount,
          ),
        };
        setReviewStats(adjustedStats);
      } else {
        setReviewStats(reviewsData.stats);
      }
    } else if (reviewsData) {
      setReviews(reviewsData.reviews);
      setReviewStats(reviewsData.stats);
    }
  }, [reviewsData, serviceId]);

  // Handle delete review
  const handleDeleteReview = (review: Review) => {
    setAlertConfig({
      visible: true,
      title: isRTL ? 'حذف التقييم' : 'Delete Review',
      message: isRTL
        ? 'هل أنت متأكد من حذف هذا التقييم؟ لا يمكن التراجع عن هذا الإجراء.'
        : 'Are you sure you want to delete this review? This action cannot be undone.',
      buttons: [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingReview(true);
            try {
              await deleteReview(review._id);
              // Refresh reviews after deletion
              refetchReviews();
              setAlertConfig({
                visible: true,
                title: isRTL ? 'تم الحذف' : 'Deleted',
                message: isRTL
                  ? 'تم حذف تقييمك بنجاح'
                  : 'Your review has been deleted successfully',
                buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
              });
            } catch (error: any) {
              setAlertConfig({
                visible: true,
                title: isRTL ? 'خطأ' : 'Error',
                message:
                  error.message ||
                  (isRTL ? 'فشل حذف التقييم' : 'Failed to delete review'),
                buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
              });
            } finally {
              setIsDeletingReview(false);
            }
          },
        },
      ],
    });
  };

  // ── Menu helpers ──────────────────────────────────────────
  const serviceHasMenu = (svc: any) =>
    Array.isArray(svc?.customInputs) &&
    svc.customInputs.some((i: any) => i.type === 'restaurant-menu');

  const menuItemCount = (map: any): number =>
    Object.values(map || {}).reduce(
      (sum: number, q: any) => sum + (Number(q) || 0),
      0,
    ) as number;

  const menuSurcharge = (input: any, map: any) => {
    let total = 0;
    Object.entries(map || {}).forEach(([opt, qty]: [string, any]) => {
      const idx = input.options.indexOf(opt);
      if (idx >= 0 && input.optionPrices?.[idx]) {
        total += input.optionPrices[idx] * (Number(qty) || 0);
      }
    });
    return total;
  };

  // ── Dynamic total price ───────────────────────────────────
  const calculateTotalPrice = () => {
    if (!service) return 0;
    const origPrice = Number(service.price) || 0;
    let basePrice = origPrice;
    if (service.isOnSale && (service.salePrice || service.discountPercentage)) {
      if (
        service.discountPercentage &&
        Number(service.discountPercentage) > 0
      ) {
        const pct = Number(service.discountPercentage) || 0;
        basePrice = +(origPrice * (1 - Math.min(Math.max(pct, 0), 100) / 100));
      } else if (service.salePrice && Number(service.salePrice) > 0) {
        basePrice = Number(service.salePrice);
      }
    }
    let total = basePrice;
    // Add custom input option prices
    service.customInputs?.forEach((input: any) => {
      const inputId = input._id || input.label;
      const sel = customInputSelections[inputId];
      if (input.type === 'radio-single' && typeof sel === 'number') {
        const price = Number(input.optionPrices?.[sel] ?? 0);
        if (price > 0) total += price;
      } else if (input.type === 'radio-multiple' && Array.isArray(sel)) {
        (sel as number[]).forEach((idx: number) => {
          const price = Number(input.optionPrices?.[idx] ?? 0);
          if (price > 0) total += price;
        });
      } else if (
        input.type === 'restaurant-menu' &&
        sel &&
        typeof sel === 'object' &&
        !Array.isArray(sel)
      ) {
        total += menuSurcharge(input, sel);
      }
    });
    return Math.round((total + Number.EPSILON) * 100) / 100;
  };

  const calculateOriginalTotalPrice = () => {
    if (!service) return 0;
    let total = Number(service.price) || 0;
    // Add custom input option prices
    service.customInputs?.forEach((input: any) => {
      const inputId = input._id || input.label;
      const sel = customInputSelections[inputId];
      if (input.type === 'radio-single' && typeof sel === 'number') {
        const price = Number(input.optionPrices?.[sel] ?? 0);
        if (price > 0) total += price;
      } else if (input.type === 'radio-multiple' && Array.isArray(sel)) {
        (sel as number[]).forEach((idx: number) => {
          const price = Number(input.optionPrices?.[idx] ?? 0);
          if (price > 0) total += price;
        });
      } else if (
        input.type === 'restaurant-menu' &&
        sel &&
        typeof sel === 'object' &&
        !Array.isArray(sel)
      ) {
        total += menuSurcharge(input, sel);
      }
    });
    return Math.round((total + Number.EPSILON) * 100) / 100;
  };

  const totalPrice = useMemo(
    () => calculateTotalPrice(),
    [service, customInputSelections],
  );

  // Check if a priced option has been selected (for hidePrice logic)
  const hasSelectedPricedOption = () => {
    if (!service?.customInputs) return false;
    return service.customInputs.some((input: any) => {
      const inputId = input._id || input.label;
      const sel = customInputSelections[inputId];
      if (input.type === 'radio-single' && typeof sel === 'number') {
        return Number(input.optionPrices?.[sel]) > 0;
      }
      if (
        input.type === 'radio-multiple' &&
        Array.isArray(sel) &&
        sel.length > 0
      ) {
        return (sel as number[]).some(
          (idx: number) => Number(input.optionPrices?.[idx]) > 0,
        );
      }
      if (
        input.type === 'restaurant-menu' &&
        sel &&
        typeof sel === 'object' &&
        !Array.isArray(sel)
      ) {
        return menuItemCount(sel) > 0;
      }
      return false;
    });
  };

  // ── canProceed (matches client web logic) ─────────────────
  const canProceed =
    !!selectedDate &&
    !!selectedTime &&
    !isTimeInPast() &&
    isTimeSlotAvailable &&
    !checkingAvailability &&
    !isAddingToCart &&
    (!service?.hidePrice || hasSelectedPricedOption()) &&
    (!serviceHasMenu(service) ||
      (service.customInputs || []).some(
        (i: any) =>
          i.type === 'restaurant-menu' &&
          menuItemCount(customInputSelections[i._id || i.label]) > 0,
      ));

  // Build combined media items (images + videos)
  const mediaItems = useMemo(() => {
    if (!service) return [];
    const items: Array<{ type: 'image' | 'video'; src: string }> = [];
    (service.images || []).forEach((src: string) => {
      if (src && src.trim()) items.push({ type: 'image', src: src.trim() });
    });
    (service.videos || []).forEach((src: string) => {
      if (src && src.trim()) items.push({ type: 'video', src: src.trim() });
    });
    return items;
  }, [service]);

  // Initialize dot animations for service media items
  if (mediaItems.length > 0 && dotAnimations.length !== mediaItems.length) {
    dotAnimations.length = 0;
    mediaItems.forEach(() => {
      dotAnimations.push(new Animated.Value(0));
    });
  }

  // Animate dots when currentImageIndex changes
  useEffect(() => {
    if (dotAnimations.length > 0) {
      dotAnimations.forEach((anim, index) => {
        Animated.spring(anim, {
          toValue: index === currentImageIndex ? 1 : 0,
          useNativeDriver: false,
          friction: 5,
          tension: 100,
        }).start();
      });
    }
  }, [currentImageIndex, dotAnimations.length]);

  // Auto-scroll slideshow effect for service details - paused when playing a video
  useEffect(() => {
    if (mediaItems.length > 1 && playingVideoIndex === null) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % mediaItems.length;
          flatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          return nextIndex;
        });
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval);
    }
    return undefined;
  }, [mediaItems.length, playingVideoIndex]);

  // Check availability whenever date or time changes
  React.useEffect(() => {
    const checkAvailability = async () => {
      if (!selectedDate || !selectedTime || !service) {
        setIsTimeSlotAvailable(true);
        return;
      }

      // If the selected slot is the same as the original slot we are editing,
      // consider it available to allow updating options without blocking.
      if (
        editCartItemId &&
        originalDate &&
        originalTime &&
        selectedDate.toDateString() === originalDate.toDateString() &&
        selectedTime === originalTime
      ) {
        setIsTimeSlotAvailable(true);
        return;
      }

      // Don't check if time is in the past
      if (isTimeInPast()) {
        setIsTimeSlotAvailable(false);
        return;
      }

      try {
        setCheckingAvailability(true);

        // Get slots from backend
        const slots = await checkTimeSlotAvailability(
          service._id,
          service.vendor?._id || '',
          selectedDate,
          userToken || undefined,
        );

        // Check local cart for this service and date
        const { getCart } = require('../../services/cart');
        const localCart = await getCart();

        // Compare dates properly
        const selectedDateStr = selectedDate.toDateString();
        const cartItemsForThisSlot = localCart.filter((cartItem: any) => {
          if (editCartItemId && cartItem._id === editCartItemId) {
            return false;
          }
          const cartDate =
            typeof cartItem.selectedDate === 'string'
              ? new Date(cartItem.selectedDate)
              : cartItem.selectedDate;
          const cartDateStr = cartDate.toDateString();

          return (
            cartItem.serviceId === service._id &&
            cartDateStr === selectedDateStr &&
            cartItem.selectedTime === selectedTime
          );
        });

        // Normalize function to remove extra whitespace
        const normalizeTimeSlot = (time: string) =>
          time.replace(/\s+/g, ' ').trim();

        // Find the selected time slot in the response
        const selectedSlot = slots.find((slot: any) => {
          const normalizedSlot = normalizeTimeSlot(slot.timeSlot);
          const normalizedSelected = normalizeTimeSlot(selectedTime);
          return normalizedSlot === normalizedSelected;
        });

        if (selectedSlot) {
          // If already in local cart, mark as unavailable
          if (cartItemsForThisSlot.length > 0) {
            setIsTimeSlotAvailable(false);
          } else {
            // Use backend availability
            setIsTimeSlotAvailable(selectedSlot.available);
          }
        } else {
          // If slot not found, consider it unavailable
          setIsTimeSlotAvailable(false);
        }
      } catch {
        // On error, default to available to not block user
        setIsTimeSlotAvailable(true);
      } finally {
        setCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, [
    selectedDate,
    selectedTime,
    service,
    userToken,
    editCartItemId,
    originalDate,
    originalTime,
  ]);

  // check wishlist state
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!service) return;
      const saved = await isWishlisted(service._id);
      if (mounted) setIsSaved(saved);
    })();
    return () => {
      mounted = false;
    };
  }, [service]);

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!service) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center', padding: 20 },
        ]}
      >
        <Text style={[styles.serviceName, { textAlign: 'center' }]}>
          {isRTL ? 'الخدمة غير موجودة' : 'Service not found'}
        </Text>
      </View>
    );
  }

  const displayName = isRTL ? service.nameAr : service.name;
  const displayDescription = isRTL
    ? service.descriptionAr
    : service.description;

  // Calculate discount percentage
  const hasDiscount =
    service.isOnSale &&
    ((service.salePrice &&
      service.salePrice > 0 &&
      service.salePrice < service.price) ||
      (service.discountPercentage && service.discountPercentage > 0));

  let discountPercent = 0;
  if (hasDiscount) {
    // Priority: use salePrice if available, otherwise use discountPercentage
    if (
      service.salePrice &&
      service.salePrice > 0 &&
      service.salePrice < service.price
    ) {
      discountPercent = Math.round(
        ((service.price - service.salePrice) / service.price) * 100,
      );
    } else if (service.discountPercentage && service.discountPercentage > 0) {
      discountPercent = service.discountPercentage;
    }
  }

  // Render media carousel item (images + videos)
  const renderMediaItem = ({
    item,
    index,
  }: {
    item: { type: 'image' | 'video'; src: string };
    index: number;
  }) => {
    if (item.type === 'video') {
      return (
        <View style={styles.videoSlide}>
          {playingVideoIndex === index ? (
            <WebView
              source={{
                html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <style>
                      body, html {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100%;
                        background-color: black;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        overflow: hidden;
                      }
                      video {
                        width: 100%;
                        height: calc(100% - 24px);
                        object-fit: contain;
                      }
                    </style>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                  </head>
                  <body>
                    <video src="${getServiceImageUrl(item.src)}" poster="${service.images && service.images.length > 0
                    ? getServiceImageUrl(service.images[0])
                    : ''
                  }" controls autoplay playsinline></video>
                  </body>
                  </html>
                `,
              }}
              style={styles.carouselImage}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scalesPageToFit={true}
            />
          ) : (
            <View style={{ flex: 1 }}>
              <WebView
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <style>
                        body, html {
                          margin: 0;
                          padding: 0;
                          width: 100%;
                          height: 100%;
                          background-color: black;
                          display: flex;
                          justify-content: center;
                          align-items: center;
                          overflow: hidden;
                        }
                        video {
                          width: 100%;
                          height: 100%;
                          object-fit: cover;
                          background-color: black;
                        }
                      </style>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                    </head>
                    <body>
                      <video src="${getServiceImageUrl(
                    item.src,
                  )}#t=0.1" poster="${service.images && service.images.length > 0
                      ? getServiceImageUrl(service.images[0])
                      : ''
                    }" preload="metadata" playsinline></video>
                    </body>
                    </html>
                  `,
                }}
                style={styles.carouselImage}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={true}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setPlayingVideoIndex(index)}
                style={styles.videoPlayOverlay}
              >
                <View style={styles.playButtonCircle}>
                  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M8 5v14l11-7z"
                      fill="#ffffff"
                      stroke="#ffffff"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }
    return (
      <View style={styles.imageSlide}>
        <Image
          source={{ uri: getServiceImageUrl(item.src) }}
          style={styles.carouselImage}
          resizeMode="cover"
        />
      </View>
    );
  };

  const handleToggleWishlist = async () => {
    if (!service) return;
    const img =
      service.images && service.images.length > 0
        ? getServiceImageUrl(service.images[0])
        : undefined;

    // Calculate display price for wishlist
    let displayPrice = service.price;
    if (service.isOnSale) {
      if (
        service.salePrice &&
        service.salePrice > 0 &&
        service.salePrice < service.price
      ) {
        displayPrice = service.salePrice;
      } else if (service.discountPercentage && service.discountPercentage > 0) {
        displayPrice = service.price * (1 - service.discountPercentage / 100);
      }
    }

    const item: WishlistItem = {
      _id: service._id,
      name: service.name,
      image: img,
      price: displayPrice,
    };
    await toggleWishlist(item);
    const now = await isWishlisted(service._id);
    setIsSaved(now);
  };

  const handleShare = async () => {
    if (!service) return;
    try {
      // Create service URL
      const serviceUrl = `https://masarrakw.com/services/${service._id}`;

      // Copy link to clipboard
      await Clipboard.setString(serviceUrl);

      // Build sharing message
      const serviceName = isRTL ? service.nameAr || service.name : service.name;
      const shareMessage = `${serviceName}\n${serviceUrl}`;

      const result = await Share.share({
        message: shareMessage,
      });

      if (result.action === Share.sharedAction) {
        // Share was successful
      } else if (result.action === Share.dismissedAction) {
        // Share was dismissed
      }
    } catch (error: any) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        error.message || (isRTL ? 'فشلت المشاركة' : 'Failed to share'),
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="transparent"
        barStyle="dark-content"
        translucent={true}
      />
      {/* Fixed actions bar under notch (not scrolling) */}
      <Animated.View
        style={[
          styles.fixedActionsRow,
          {
            top: 0,
            height: fixedHeight,
            paddingTop: insets.top,
            backgroundColor: headerBgColor,
            borderBottomWidth: 1,
            borderBottomColor: headerBorderColor,
          },
        ]}
      >
        {/* Left Container: Contains Share/Wishlist in RTL, Back button in LTR */}
        <View style={styles.actionsLeft}>
          {isRTL ? (
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.headerCircleButton}
                accessibilityLabel="Share"
                onPress={handleShare}
              >
                <Svg
                  width={headerIconSize}
                  height={headerIconSize}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <Path
                    d="M18 8a3 3 0 100-6 3 3 0 000 6z"
                    stroke={colors.primary}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M6 15a3 3 0 100-6 3 3 0 000 6z"
                    stroke={colors.primary}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M18 22a3 3 0 100-6 3 3 0 000 6z"
                    stroke={colors.primary}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
                    stroke={colors.primary}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.headerCircleButton}
                accessibilityLabel="Wishlist"
                onPress={handleToggleWishlist}
              >
                <Svg
                  width={headerIconSize}
                  height={headerIconSize}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <Path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    fill={isSaved ? '#E8837A' : '#7FBFB6'}
                    stroke={isSaved ? '#E8837A' : '#7FBFB6'}
                    strokeWidth={2}
                  />
                </Svg>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={onBack}
                activeOpacity={0.7}
                style={styles.headerCircleButton}
                accessibilityLabel="Back"
              >
                <Svg
                  width={backIconSize}
                  height={backIconSize}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <Path
                    d="M15 18l-6-6 6-6"
                    stroke={colors.primary}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
              <Animated.Text
                style={[
                  styles.headerTitle,
                  { marginLeft: 4, opacity: titleOpacity },
                ]}
                numberOfLines={1}
              >
                {service?.name}
              </Animated.Text>
            </>
          )}
        </View>

        {/* Right Container: Contains Back button in RTL, Wishlist/Share in LTR */}
        <View style={styles.actionsRight}>
          {isRTL ? (
            <>
              <Animated.Text
                style={[
                  styles.headerTitle,
                  { marginRight: 4, opacity: titleOpacity },
                ]}
                numberOfLines={1}
              >
                {service?.nameAr || service?.name}
              </Animated.Text>
              <TouchableOpacity
                onPress={onBack}
                activeOpacity={0.7}
                style={styles.headerCircleButton}
                accessibilityLabel="Back"
              >
                <Svg
                  width={backIconSize}
                  height={backIconSize}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <Path
                    d="M9 18l6-6-6-6"
                    stroke={colors.primary}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.headerCircleButton}
                accessibilityLabel="Wishlist"
                onPress={handleToggleWishlist}
              >
                <Svg
                  width={headerIconSize}
                  height={headerIconSize}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <Path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    fill={isSaved ? '#E8837A' : '#7FBFB6'}
                    stroke={isSaved ? '#E8837A' : '#7FBFB6'}
                    strokeWidth={2}
                  />
                </Svg>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.headerCircleButton}
                accessibilityLabel="Share"
                onPress={handleShare}
              >
                <Svg
                  width={headerIconSize}
                  height={headerIconSize}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <Path
                    d="M18 8a3 3 0 100-6 3 3 0 000 6z"
                    stroke={colors.primary}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M6 15a3 3 0 100-6 3 3 0 000 6z"
                    stroke={colors.primary}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M18 22a3 3 0 100-6 3 3 0 000 6z"
                    stroke={colors.primary}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
                    stroke={colors.primary}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: 0,
          paddingBottom:
            SCREEN_WIDTH >= 600 ? insets.bottom + 280 : insets.bottom + 180,
        }}
      >
        {/* Media Carousel (Images + Videos) */}
        {mediaItems.length > 0 ? (
          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={mediaItems}
              renderItem={renderMediaItem}
              keyExtractor={(_item, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={SCREEN_WIDTH}
              snapToAlignment="center"
              onMomentumScrollEnd={event => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                );
                setCurrentImageIndex(index);
                // Stop video when scrolling away
                if (playingVideoIndex !== null && playingVideoIndex !== index) {
                  setPlayingVideoIndex(null);
                }
              }}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
            />

            {/* Pagination Dots */}
            {mediaItems.length > 1 && (
              <View style={styles.paginationContainer}>
                {mediaItems.map((_, index) => {
                  const isActive = index === currentImageIndex;
                  const animValue =
                    dotAnimations[index] || new Animated.Value(0);

                  const width = animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 20],
                  });

                  const scale = animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  });

                  return (
                    <Animated.View
                      key={index}
                      style={[
                        styles.paginationDot,
                        isActive && styles.paginationDotActive,
                        {
                          width: width,
                          transform: [{ scale: scale }],
                        },
                      ]}
                    />
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <View
            style={[
              styles.carouselContainer,
              {
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 161, 156, 0.05)',
              },
            ]}
          >
            <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
              <Path
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                stroke={colors.primary}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text
              style={{
                marginTop: 12,
                color: colors.primary,
                fontSize: 14,
                fontWeight: '500',
              }}
            >
              {isRTL
                ? 'لا توجد صور أو فيديوهات متاحة'
                : 'No images or videos available'}
            </Text>
          </View>
        )}

        {/* Service Info Section */}
        <View style={styles.infoSection}>
          {/* Service Name */}
          <Text style={[styles.serviceName, isRTL && styles.serviceNameRTL]}>
            {displayName}
          </Text>

          {/* Vendor Name */}
          {service.vendor && (
            <Text style={[styles.vendorName, isRTL && styles.vendorNameRTL]}>
              {service.vendor.name}
            </Text>
          )}

          {/* Price Badge */}
          <View style={styles.priceBadge}>
            <View style={{ flex: 1 }}>
              {service.hidePrice ? (
                // hidePrice mode: show price only after selecting a priced option
                hasSelectedPricedOption() ? (
                  <View>
                    <Text style={styles.totalPriceLabel}>
                      {isRTL ? 'الإجمالي' : 'Total'}
                    </Text>
                    <Text style={styles.totalPriceValue}>
                      {totalPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.hidePriceText}>
                    {isRTL
                      ? 'اختر خياراً واحداً على الأقل لرؤية السعر'
                      : 'Select at least one option to see the price.'}
                  </Text>
                )
              ) : (
                <>
                  <Text style={styles.priceLabel}>
                    {isRTL ? 'السعر يبدأ من' : 'Price starts from'}
                  </Text>

                  {service.isOnSale === true &&
                    ((service.salePrice &&
                      service.salePrice > 0 &&
                      service.salePrice < service.price) ||
                      (service.discountPercentage &&
                        service.discountPercentage > 0)) ? (
                    <View style={{ gap: 4 }}>
                      {/* Sale Price (dynamic total) */}
                      <Text style={styles.priceValue}>
                        {totalPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                      </Text>

                      {/* Original Price (strikethrough) */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Text
                          style={[
                            styles.priceValue,
                            {
                              textDecorationLine: 'line-through',
                              color: '#999',
                              fontSize: 14,
                            },
                          ]}
                        >
                          {service.price.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                        </Text>
                        {discountPercent > 0 && (
                          <View
                            style={{
                              backgroundColor: colors.primary,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 10,
                            }}
                          >
                            <Text
                              style={{
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: '600',
                              }}
                            >
                              {discountPercent}% {isRTL ? 'خصم' : 'OFF'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ) : (
                    <View>
                      <Text style={styles.priceValue}>
                        {totalPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                      </Text>
                      {totalPrice !== service.price && (
                        <Text
                          style={[
                            styles.priceValue,
                            {
                              textDecorationLine: 'line-through',
                              color: '#999',
                              fontSize: 14,
                            },
                          ]}
                        >
                          {service.price.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Delivery Fee */}
                  {service.addressRequired && service.deliveryFee > 0 && (
                    <Text style={styles.deliveryFeeText}>
                      + {service.deliveryFee.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}{' '}
                      {isRTL ? 'رسوم التوصيل' : 'Delivery Fee'}
                    </Text>
                  )}
                </>
              )}
            </View>
            <TouchableOpacity
              style={styles.ratingContainer}
              onPress={scrollToReviews}
              activeOpacity={0.7}
            >
              {reviewStats ? (
                <>
                  <Text style={styles.ratingStars}>
                    {'★'.repeat(Math.round(reviewStats.averageRating))}
                    {'☆'.repeat(5 - Math.round(reviewStats.averageRating))}
                  </Text>
                  <Text style={styles.ratingText}>
                    {reviewStats.averageRating.toFixed(1)} (
                    {reviewStats.totalRatings}+)
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.ratingStars}>☆☆☆☆☆</Text>
                  <Text style={styles.ratingText}>
                    {isRTL ? 'لا توجد تقييمات' : 'No reviews yet'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text
            style={[styles.descriptionText, isRTL && styles.descriptionTextRTL]}
          >
            {displayDescription}
          </Text>

          {/* Vendor Policy Section */}
          {((service.policies && service.policies.length > 0) ||
            service.vendor?.vendorProfile?.refundPeriodHours != null) && (
              <View style={styles.policiesSection}>
                <Text
                  style={[styles.policiesTitle, isRTL && styles.policiesTitleRTL]}
                >
                  {isRTL ? 'سياسة المورد' : 'VENDOR POLICY'}
                </Text>

                {service.policies && service.policies.length > 0 && (
                  <View style={styles.policiesGrid}>
                    {service.policies.map((policyItem: any, index: number) => {
                      // Handle both old and new policy structure for backward compatibility
                      const policy = policyItem.policy || policyItem;
                      const policyName =
                        isRTL && policy.nameAr ? policy.nameAr : policy.name;

                      // Priority: customText > selectedDescription > first description
                      const hasCustomText =
                        policyItem.customText && policyItem.customText.trim();
                      const hasCustomTextAr =
                        policyItem.customTextAr && policyItem.customTextAr.trim();
                      const selectedDescription = policyItem.selectedDescriptionId
                        ? policy.descriptions?.find(
                          (desc: any) =>
                            desc._id === policyItem.selectedDescriptionId,
                        )
                        : null;

                      const description = hasCustomText
                        ? isRTL && hasCustomTextAr
                          ? policyItem.customTextAr
                          : policyItem.customText
                        : selectedDescription
                          ? isRTL && selectedDescription.textAr
                            ? selectedDescription.textAr
                            : selectedDescription.text
                          : policy.descriptions && policy.descriptions.length > 0
                            ? isRTL
                              ? policy.descriptions[0].textAr
                              : policy.descriptions[0].text
                            : isRTL && policy.descriptionAr
                              ? policy.descriptionAr
                              : policy.description || '';

                      return (
                        <View
                          key={policy._id || index}
                          style={[
                            styles.policyCard,
                            isRTL && styles.policyCardRTL,
                          ]}
                        >
                          <View
                            style={[
                              styles.policyIconContainer,
                              isRTL && styles.policyIconContainerRTL,
                            ]}
                          >
                            {policy.image ? (
                              <Image
                                source={{ uri: getImageUrl(policy.image) }}
                                style={styles.policyIcon}
                                resizeMode="contain"
                              />
                            ) : (
                              <View style={styles.policyIconPlaceholder} />
                            )}
                          </View>
                          <View style={styles.policyContent}>
                            <Text
                              style={[
                                styles.policyName,
                                isRTL && styles.policyNameRTL,
                              ]}
                            >
                              {policyName}
                            </Text>
                            {description ? (
                              <Text
                                style={[
                                  styles.policyDescription,
                                  isRTL && styles.policyDescriptionRTL,
                                ]}
                                numberOfLines={2}
                                ellipsizeMode="tail"
                              >
                                {description}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Vendor refund window policy */}
                {service.vendor?.vendorProfile?.refundPeriodHours != null && (
                  <View
                    style={{
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      marginTop:
                        service.policies && service.policies.length > 0 ? 16 : 0,
                      paddingHorizontal: 20,
                      gap: 12,
                    }}
                  >
                    <Icon name="time-outline" size={24} color={colors.primary} />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: '#0F172A',
                        flex: 1,
                        textAlign: isRTL ? 'right' : 'left',
                      }}
                    >
                      {isRTL
                        ? `استرداد كامل حتى ${(() => {
                          const h =
                            service.vendor.vendorProfile.refundPeriodHours;
                          if (h === 0) return 'أي وقت';
                          if (h < 24) return `${h} ساعة`;
                          const d = Number(
                            (h / 24).toFixed(1).replace(/\.0$/, ''),
                          );
                          return `${d} يوم`;
                        })()} قبل المناسبة`
                        : `Full refund up to ${(() => {
                          const h =
                            service.vendor.vendorProfile.refundPeriodHours;
                          if (h === 0) return 'any time';
                          if (h < 24) return `${h} hours`;
                          const d = Number(
                            (h / 24).toFixed(1).replace(/\.0$/, ''),
                          );
                          return `${d} days`;
                        })()} before the event`}
                    </Text>
                  </View>
                )}
              </View>
            )}

          {/* Booking / Availability preview under Vendor Policy */}
          <View style={styles.bookingContainer}>
            <Text
              style={[styles.bookingHeader, isRTL && styles.descriptionTextRTL]}
            >
              {isRTL ? 'اختر اليوم والوقت' : 'SELECT EVENT DAY & TIME'}
            </Text>

            <View style={styles.bookingCard}>
              <TouchableOpacity
                style={[styles.bookingRow, isRTL && styles.bookingRowRTL]}
                activeOpacity={0.8}
                onPress={() => {
                  // حذف cache البيانات القديمة قبل فتح modal التاريخ
                  if (service) {
                    clearDatePickerCacheForService(
                      service._id,
                      service.vendor?._id || '',
                    );
                  }
                  setShowDatePicker(true);
                }}
              >
                <View
                  style={[
                    styles.bookingIconWrap,
                    isRTL && styles.bookingIconWrapRTL,
                  ]}
                >
                  <View style={styles.calendarIconSmallBorder}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M7 11h10M7 7h10M7 3h10"
                        stroke={colors.primary}
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M5 21h14V7H5v14z"
                        stroke={colors.primary}
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                </View>
                <Text
                  style={[
                    styles.bookingText,
                    isRTL && styles.descriptionTextRTL,
                  ]}
                >
                  {selectedDate
                    ? selectedDate.toLocaleDateString(
                      isRTL ? 'ar-KW' : 'en-US',
                      { year: 'numeric', month: '2-digit', day: '2-digit' },
                    )
                    : isRTL
                      ? 'اختر التاريخ'
                      : 'Select Date'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.bookingRow, isRTL && styles.bookingRowRTL]}
                activeOpacity={0.8}
                onPress={() => selectedDate && setShowTimePicker(true)}
                disabled={!selectedDate}
              >
                <View
                  style={[
                    styles.bookingIconWrap,
                    isRTL && styles.bookingIconWrapRTL,
                  ]}
                >
                  <View style={styles.clockIconSmallBorder}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M12 7v6l4 2"
                        stroke={colors.primary}
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        stroke={colors.primary}
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                </View>
                <Text
                  style={[
                    styles.bookingText,
                    isRTL && styles.descriptionTextRTL,
                  ]}
                >
                  {selectedTime || (isRTL ? 'اختر الوقت' : 'Select Time')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.availabilityButton,
                  (!selectedDate ||
                    !selectedTime ||
                    isTimeInPast() ||
                    !isTimeSlotAvailable) && { opacity: 0.5 },
                ]}
                activeOpacity={0.85}
                disabled={
                  !selectedDate ||
                  !selectedTime ||
                  isTimeInPast() ||
                  !isTimeSlotAvailable
                }
              >
                <Text style={styles.availabilityButtonText}>
                  {checkingAvailability
                    ? isRTL
                      ? 'جاري التحقق...'
                      : 'Checking...'
                    : isTimeInPast()
                      ? isRTL
                        ? '⚠ وقت قديم'
                        : '⚠ Past Time'
                      : !isTimeSlotAvailable && selectedDate && selectedTime
                        ? isRTL
                          ? '✗ غير متاح'
                          : '✗ Not Available'
                        : selectedDate && selectedTime
                          ? isRTL
                            ? '✓ متاح'
                            : '✓ Available'
                          : isRTL
                            ? 'اختر التاريخ والوقت'
                            : 'Select Date & Time'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Custom Text Section */}
          {service.customInputs && service.customInputs.length > 0 && (
            <View style={styles.customTextContainer}>
              <Text
                style={[
                  styles.customTextHeader,
                  isRTL && styles.descriptionTextRTL,
                ]}
              >
                {isRTL ? 'خيارات' : 'OPTIONS'}
              </Text>

              {/* Each Custom Input as Separate Option */}
              {service.customInputs.map((input: any, _index: number) => {
                const inputId = input._id || input.label || `input_${_index}`;
                const inputLabel = isRTL ? input.labelAr : input.label;
                const inputType = input.type;
                const inputOptions = isRTL ? input.optionsAr : input.options;
                const isExpanded = expandedCustomInputs[inputId] || false;
                const selectedValue = customInputSelections[inputId];

                return (
                  <View key={inputId} style={styles.optionCardContainer}>
                    {/* Add Option Button - shows the label and toggle */}
                    <TouchableOpacity
                      style={[
                        styles.addOptionButton,
                        isRTL && styles.addOptionButtonRTL,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setExpandedCustomInputs({
                          ...expandedCustomInputs,
                          [inputId]: !isExpanded,
                        });
                      }}
                    >
                      <Text
                        style={[
                          styles.addOptionText,
                          isRTL && styles.addOptionTextRTL,
                          isRTL
                            ? { marginLeft: 0, marginRight: 12 }
                            : { marginLeft: 12, marginRight: 0 },
                        ]}
                      >
                        {inputLabel}
                      </Text>

                      {/* Group subtitle/description - shown when collapsed */}
                      {!isExpanded &&
                        (isRTL ? input.descriptionAr : input.description) ? (
                        <Text
                          style={[
                            {
                              fontSize: 11,
                              color: colors.textSecondary,
                              marginTop: 2,
                              flex: 1,
                            },
                            isRTL && { textAlign: 'right' },
                          ]}
                          numberOfLines={1}
                        >
                          {isRTL ? input.descriptionAr : input.description}
                        </Text>
                      ) : null}
                      <Svg
                        width={20}
                        height={20}
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{
                          transform: [
                            {
                              rotate: isExpanded
                                ? '90deg'
                                : isRTL
                                  ? '180deg'
                                  : '0deg',
                            },
                          ],
                        }}
                      >
                        <Path
                          d="M9 18l6-6-6-6"
                          stroke={colors.primary}
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </TouchableOpacity>

                    {/* Options Content - shown when expanded */}
                    {isExpanded && (
                      <View style={styles.optionExpandedContent}>
                        {/* Text Input */}
                        {inputType === 'text' && (
                          <TextInput
                            style={[
                              styles.textInputField,
                              isRTL && styles.textInputFieldRTL,
                            ]}
                            placeholder={
                              isRTL ? input.placeholderAr : input.placeholder
                            }
                            placeholderTextColor="#999"
                            value={(selectedValue as string) || ''}
                            onChangeText={text => {
                              setCustomInputSelections({
                                ...customInputSelections,
                                [inputId]: text,
                              });
                            }}
                            textAlign={isRTL ? 'right' : 'left'}
                          />
                        )}

                        {/* Number Input */}
                        {inputType === 'number' && (
                          <TextInput
                            style={[
                              styles.textInputField,
                              isRTL && styles.textInputFieldRTL,
                            ]}
                            placeholder={
                              isRTL ? input.placeholderAr : input.placeholder
                            }
                            placeholderTextColor="#999"
                            keyboardType="number-pad"
                            value={(selectedValue as string) || ''}
                            onChangeText={text => {
                              const num = parseInt(text, 10) || '';
                              if (
                                num === '' ||
                                (input.validation &&
                                  num >= (input.validation.min || 0) &&
                                  num <= (input.validation.max || 999))
                              ) {
                                setCustomInputSelections({
                                  ...customInputSelections,
                                  [inputId]: num as any,
                                });
                              }
                            }}
                            textAlign={isRTL ? 'right' : 'left'}
                          />
                        )}

                        {/* Radio Single or Multiple */}
                        {(inputType === 'radio-single' ||
                          inputType === 'radio-multiple') &&
                          inputOptions &&
                          inputOptions.length > 0 &&
                          inputOptions.map(
                            (option: string, optIndex: number) => {
                              // For radio-multiple, selectedValue will be an array
                              const isMultiple = inputType === 'radio-multiple';
                              const selectedArray = isMultiple
                                ? (selectedValue as number[]) || []
                                : [];
                              const isSelected = isMultiple
                                ? selectedArray.includes(optIndex)
                                : selectedValue === optIndex;
                              const price = input.optionPrices?.[optIndex] || 0;

                              return (
                                <TouchableOpacity
                                  key={optIndex}
                                  style={[
                                    styles.optionRow,
                                    isSelected && styles.optionRowSelected,
                                  ]}
                                  activeOpacity={0.7}
                                  onPress={() => {
                                    if (isMultiple) {
                                      // For radio-multiple, toggle the selection
                                      const currentArray = selectedArray;
                                      const newArray = isSelected
                                        ? currentArray.filter(
                                          idx => idx !== optIndex,
                                        )
                                        : [...currentArray, optIndex];

                                      if (newArray.length === 0) {
                                        const newSelections = {
                                          ...customInputSelections,
                                        };
                                        delete newSelections[inputId];
                                        setCustomInputSelections(newSelections);
                                      } else {
                                        setCustomInputSelections({
                                          ...customInputSelections,
                                          [inputId]: newArray,
                                        });
                                      }
                                    } else {
                                      // For radio-single, replace the selection
                                      if (isSelected) {
                                        const newSelections = {
                                          ...customInputSelections,
                                        };
                                        delete newSelections[inputId];
                                        setCustomInputSelections(newSelections);
                                      } else {
                                        setCustomInputSelections({
                                          ...customInputSelections,
                                          [inputId]: optIndex,
                                        });
                                      }
                                    }
                                  }}
                                >
                                  <View style={styles.checkboxContainer}>
                                    <View
                                      style={[
                                        styles.checkbox,
                                        isSelected && styles.checkboxSelected,
                                      ]}
                                    >
                                      {isSelected && (
                                        <Svg
                                          width={14}
                                          height={14}
                                          viewBox="0 0 24 24"
                                          fill="none"
                                        >
                                          <Path
                                            d="M20 6L9 17l-5-5"
                                            stroke={colors.textWhite}
                                            strokeWidth={2.5}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </Svg>
                                      )}
                                    </View>
                                    {input.optionImages?.[optIndex] ? (
                                      <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() =>
                                          setActiveFullImageUrl(
                                            getServiceImageUrl(
                                              input.optionImages[optIndex],
                                            ),
                                          )
                                        }
                                      >
                                        <Image
                                          source={{
                                            uri: getServiceImageUrl(
                                              input.optionImages[optIndex],
                                            ),
                                          }}
                                          style={[
                                            styles.optionImage,
                                            isRTL && styles.optionImageRTL,
                                          ]}
                                          resizeMode="cover"
                                        />
                                      </TouchableOpacity>
                                    ) : null}
                                    <View style={{ flex: 1 }}>
                                      <Text
                                        style={[
                                          styles.optionText,
                                          isSelected &&
                                          styles.optionTextSelected,
                                        ]}
                                      >
                                        {option}
                                      </Text>
                                      {/* Per-option description */}
                                      {(
                                        isRTL
                                          ? input.optionDescriptionsAr?.[
                                          optIndex
                                          ]
                                          : input.optionDescriptions?.[optIndex]
                                      ) ? (
                                        <Text
                                          style={{
                                            fontSize: 11,
                                            color: isSelected
                                              ? colors.primary
                                              : colors.textSecondary,
                                            marginTop: 1,
                                          }}
                                        >
                                          {isRTL
                                            ? input.optionDescriptionsAr[
                                            optIndex
                                            ]
                                            : input.optionDescriptions[
                                            optIndex
                                            ]}
                                        </Text>
                                      ) : null}
                                    </View>
                                  </View>
                                  <Text
                                    style={[
                                      styles.optionPrice,
                                      isSelected && styles.optionPriceSelected,
                                    ]}
                                  >
                                    +{price.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                                  </Text>
                                </TouchableOpacity>
                              );
                            },
                          )}
                      </View>
                    )}

                    {/* Restaurant Menu */}
                    {isExpanded && inputType === 'restaurant-menu' && (
                      <View style={styles.menuItemContainer}>
                        {(input.options || []).map(
                          (option: string, optIndex: number) => {
                            const labelText =
                              isRTL && input.optionsAr?.[optIndex]
                                ? input.optionsAr[optIndex]
                                : option;
                            const menuMap =
                              (customInputSelections[inputId] as {
                                [key: string]: number;
                              }) || {};
                            const qty = Number(menuMap[option]) || 0;
                            const price = input.optionPrices?.[optIndex] || 0;

                            const setMenuQty = (
                              opt: string,
                              newQty: number,
                            ) => {
                              const next = { ...menuMap };
                              if (newQty > 0) next[opt] = newQty;
                              else delete next[opt];
                              setCustomInputSelections({
                                ...customInputSelections,
                                [inputId]: next,
                              });
                            };

                            return (
                              <View
                                key={optIndex}
                                style={[
                                  styles.menuItemRow,
                                  isRTL && styles.menuItemRowRTL,
                                ]}
                              >
                                {input.optionImages?.[optIndex] ? (
                                  <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() =>
                                      setActiveFullImageUrl(
                                        getServiceImageUrl(
                                          input.optionImages[optIndex],
                                        ),
                                      )
                                    }
                                  >
                                    <Image
                                      source={{
                                        uri: getServiceImageUrl(
                                          input.optionImages[optIndex],
                                        ),
                                      }}
                                      style={[
                                        styles.menuItemImage,
                                        isRTL && styles.menuItemImageRTL,
                                      ]}
                                      resizeMode="cover"
                                    />
                                  </TouchableOpacity>
                                ) : null}
                                <View style={styles.menuItemInfo}>
                                  <Text style={styles.menuItemName}>
                                    {labelText}
                                    {price > 0 && (
                                      <Text
                                        style={{
                                          color: colors.primary,
                                          fontWeight: '600',
                                          fontSize: 13,
                                        }}
                                      >
                                        {`   +${price.toFixed(3)} ${isRTL ? 'د.ك' : 'KD'
                                          }`}
                                      </Text>
                                    )}
                                  </Text>
                                  {/* Per-option description */}
                                  {(
                                    isRTL
                                      ? input.optionDescriptionsAr?.[optIndex]
                                      : input.optionDescriptions?.[optIndex]
                                  ) ? (
                                    <Text
                                      style={[
                                        styles.menuItemPrice,
                                        {
                                          color: colors.textSecondary,
                                          fontWeight: '400',
                                          fontSize: 11,
                                        },
                                      ]}
                                    >
                                      {isRTL
                                        ? input.optionDescriptionsAr[optIndex]
                                        : input.optionDescriptions[optIndex]}
                                    </Text>
                                  ) : null}
                                </View>
                                <View style={styles.menuItemStepper}>
                                  <TouchableOpacity
                                    style={[
                                      styles.menuItemStepperButton,
                                      qty <= 0 &&
                                      styles.menuItemStepperButtonDisabled,
                                    ]}
                                    onPress={() =>
                                      setMenuQty(option, Math.max(0, qty - 1))
                                    }
                                    disabled={qty <= 0}
                                    activeOpacity={0.7}
                                  >
                                    <Text
                                      style={styles.menuItemStepperButtonText}
                                    >
                                      −
                                    </Text>
                                  </TouchableOpacity>
                                  <Text style={styles.menuItemQuantity}>
                                    {qty}
                                  </Text>
                                  <TouchableOpacity
                                    style={styles.menuItemStepperButton}
                                    onPress={() => setMenuQty(option, qty + 1)}
                                    activeOpacity={0.7}
                                  >
                                    <Text
                                      style={styles.menuItemStepperButtonText}
                                    >
                                      +
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            );
                          },
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {((reviewStats && reviewStats.totalRatings > 0) || hasPurchased) && (
            <View
              onLayout={event => {
                const { y } = event.nativeEvent.layout;
                setReviewsY(y);
              }}
              style={styles.reviewsSection}
            >
              {/* Header Row with Title */}
              <View
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                  paddingHorizontal: 2,
                }}
              >
                <Text
                  style={[
                    styles.reviewsTitle,
                    { marginBottom: 0 },
                    isRTL && styles.reviewsTitleRTL,
                  ]}
                >
                  {isRTL ? 'التقييمات' : 'Reviews'} (
                  {reviewStats?.totalRatings || 0})
                </Text>

                {/* Write/Edit Review Button (in header) */}
                {hasPurchased && (
                  <TouchableOpacity
                    style={{
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.primary,
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 8,
                      gap: 6,
                    }}
                    activeOpacity={0.8}
                    onPress={() => setShowWriteReviewModal(true)}
                  >
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                        stroke="#FFFFFF"
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                    <Text
                      style={{ fontSize: 12, fontWeight: '600', color: '#FFF' }}
                    >
                      {isRTL ? 'تقييم' : 'Review'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {reviewStats && reviewStats.totalRatings > 0 && (
                <View
                  style={{
                    backgroundColor: colors.backgroundCard,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginTop: 12,
                    overflow: 'hidden',
                  }}
                >
                  {/* Review Stats */}
                  <View
                    style={[
                      styles.reviewStatsCard,
                      {
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                        marginBottom: 0,
                        elevation: 0,
                        shadowOpacity: 0,
                        borderBottomWidth: reviews.length > 0 ? 1 : 0,
                        borderBottomColor: colors.border,
                        borderRadius: 0,
                      },
                    ]}
                  >
                    <View style={styles.averageRatingContainer}>
                      <Text style={styles.averageRatingNumber}>
                        {reviewStats.averageRating.toFixed(1)}
                      </Text>
                      <Text style={styles.averageRatingStars}>
                        {'★'.repeat(Math.round(reviewStats.averageRating))}
                        {'☆'.repeat(5 - Math.round(reviewStats.averageRating))}
                      </Text>
                      <Text style={styles.averageRatingText}>
                        {reviewStats.totalRatings} {isRTL ? 'تقييم' : 'reviews'}
                      </Text>
                    </View>

                    {/* Rating Distribution */}
                    <View style={styles.ratingDistribution}>
                      {[5, 4, 3, 2, 1].map(star => {
                        const count =
                          reviewStats.ratingDistribution[
                          star as keyof typeof reviewStats.ratingDistribution
                          ] || 0;
                        const percentage =
                          reviewStats.totalRatings > 0
                            ? (count / reviewStats.totalRatings) * 100
                            : 0;
                        return (
                          <View key={star} style={styles.distributionRow}>
                            <Text style={styles.distributionStar}>{star}★</Text>
                            <View style={styles.distributionBar}>
                              <View
                                style={[
                                  styles.distributionFill,
                                  { width: `${percentage}%` },
                                ]}
                              />
                            </View>
                            <Text style={styles.distributionCount}>
                              {count}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* Individual Reviews */}
                  {reviews.length > 0 && (
                    <View style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
                      {reviews
                        .slice(0, isReviewsExpanded ? reviews.length : 2)
                        .map((review, index) => (
                          <View
                            key={review._id}
                            style={{
                              paddingVertical: 10,
                              borderBottomWidth:
                                index <
                                  (isReviewsExpanded
                                    ? reviews.length
                                    : Math.min(reviews.length, 2)) -
                                  1
                                  ? 1
                                  : 0,
                              borderBottomColor: colors.border,
                            }}
                          >
                            <View style={styles.reviewHeader}>
                              <View style={styles.reviewUserInfo}>
                                {review.user?.profilePicture ? (
                                  <Image
                                    source={{
                                      uri: getImageUrl(
                                        review.user.profilePicture,
                                      ),
                                    }}
                                    style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: 13,
                                    }}
                                  />
                                ) : (
                                  <View
                                    style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: 13,
                                      backgroundColor: colors.primary,
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: '#FFF',
                                        fontSize: 12,
                                        fontWeight: '600',
                                      }}
                                    >
                                      {(review.user?.name || 'M')
                                        .charAt(0)
                                        .toUpperCase()}
                                    </Text>
                                  </View>
                                )}
                                <View style={{ flex: 1 }}>
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    <Text
                                      style={[
                                        styles.reviewUserName,
                                        { maxWidth: '100%' },
                                      ]}
                                      numberOfLines={1}
                                    >
                                      {review.user?.name ||
                                        (isRTL
                                          ? 'مستخدم محذوف'
                                          : 'Deleted User')}
                                    </Text>
                                  </View>
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      marginTop: 2,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        color: colors.textSecondary,
                                      }}
                                    >
                                      {new Date(
                                        review.createdAt,
                                      ).toLocaleDateString(
                                        isRTL ? 'ar-EG' : 'en-US',
                                        { month: 'short', day: 'numeric' },
                                      )}
                                    </Text>
                                    {review.isVerifiedPurchase && (
                                      <>
                                        <Text
                                          style={{
                                            fontSize: 11,
                                            color: colors.textSecondary,
                                            marginHorizontal: 4,
                                          }}
                                        >
                                          •
                                        </Text>
                                        <Text style={styles.verifiedBadge}>
                                          {isRTL ? 'موثق' : 'Verified'}
                                        </Text>
                                      </>
                                    )}
                                  </View>
                                </View>
                              </View>
                              <View
                                style={{
                                  flexDirection: isRTL ? 'row-reverse' : 'row',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                {/* Delete Button - Only show for current user's reviews */}
                                {currentUserId &&
                                  review.user?._id === currentUserId && (
                                    <TouchableOpacity
                                      style={{
                                        padding: 6,
                                        backgroundColor:
                                          'rgba(220, 53, 69, 0.08)',
                                        borderRadius: 6,
                                      }}
                                      onPress={() => handleDeleteReview(review)}
                                      disabled={isDeletingReview}
                                    >
                                      {isDeletingReview ? (
                                        <ActivityIndicator
                                          size="small"
                                          color="#e57373"
                                        />
                                      ) : (
                                        <Svg
                                          width={14}
                                          height={14}
                                          viewBox="0 0 24 24"
                                          fill="none"
                                        >
                                          <Path
                                            d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
                                            stroke="#e57373"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </Svg>
                                      )}
                                    </TouchableOpacity>
                                  )}

                                <View style={styles.reviewRating}>
                                  <Text style={styles.reviewRatingText}>
                                    {review.rating.toFixed(1)} ★
                                  </Text>
                                </View>
                              </View>
                            </View>

                            {/* Comment Section */}
                            <Text
                              style={[
                                styles.reviewComment,
                                isRTL && styles.reviewCommentRTL,
                              ]}
                            >
                              {review.comment}
                            </Text>

                            {review.vendorReply &&
                              review.vendorReply.text &&
                              review.vendorReply.text.trim() !== '' && (
                                <View style={styles.vendorReply}>
                                  <Text style={styles.vendorReplyLabel}>
                                    {isRTL ? 'رد البائع:' : 'Vendor Reply:'}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.vendorReplyText,
                                      isRTL && styles.vendorReplyTextRTL,
                                    ]}
                                    numberOfLines={2}
                                  >
                                    {review.vendorReply.text}
                                  </Text>
                                </View>
                              )}
                          </View>
                        ))}

                      {/* Show More/Less Button */}
                      {reviews.length > 2 && (
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 8,
                            paddingHorizontal: 16,
                            alignSelf: 'center',
                            marginTop: 8,
                            marginBottom: 8,
                          }}
                          activeOpacity={0.7}
                          onPress={() =>
                            setIsReviewsExpanded(!isReviewsExpanded)
                          }
                        >
                          <Text style={styles.showMoreText}>
                            {isReviewsExpanded
                              ? isRTL
                                ? 'عرض أقل'
                                : 'Show Less'
                              : isRTL
                                ? `عرض المزيد (${reviews.length - 2})`
                                : `Show More (${reviews.length - 2})`}
                          </Text>
                          <Svg
                            width={16}
                            height={16}
                            viewBox="0 0 24 24"
                            fill="none"
                            style={[
                              styles.showMoreIcon,
                              isRTL && styles.showMoreIconRTL,
                              {
                                transform: [
                                  {
                                    rotate: isReviewsExpanded
                                      ? '270deg'
                                      : '90deg',
                                  },
                                ],
                              },
                            ]}
                          >
                            <Path
                              d="M9 18l6-6-6-6"
                              stroke={colors.primary}
                              strokeWidth={2.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </Svg>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Bottom Action Buttons */}
      <View
        style={[
          styles.bottomActions,
          {
            paddingBottom:
              SCREEN_WIDTH >= 600
                ? insets.bottom + 24
                : Math.max(insets.bottom + 12, 16),
          },
        ]}
      >
        <TouchableOpacity
          ref={addToCartButtonRef}
          style={[styles.addToCartButton, !canProceed && { opacity: 0.5 }]}
          activeOpacity={0.85}
          disabled={!canProceed}
          onPress={async () => {
            if (!service) return;

            // Check if user is logged in
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
              setAlertConfig({
                visible: true,
                title: isRTL ? 'تسجيل الدخول مطلوب' : 'Login Required',
                message: isRTL
                  ? 'يجب تسجيل الدخول أولاً لإضافة خدمات إلى السلة'
                  : 'Please login first to add services to cart',
                buttons: [
                  {
                    text: isRTL ? 'تسجيل الدخول' : 'Login',
                    style: 'default',
                    onPress: () => {
                      if (onNavigate) onNavigate('auth');
                    },
                  },
                  {
                    text: isRTL ? 'إلغاء' : 'Cancel',
                    style: 'cancel',
                  },
                ],
              });
              return;
            }

            // Validate required selections
            if (!selectedDate || !selectedTime) {
              Alert.alert(
                isRTL ? 'تنبيه' : 'Alert',
                isRTL
                  ? 'الرجاء اختيار التاريخ والوقت'
                  : 'Please select date and time',
                [{ text: isRTL ? 'حسناً' : 'OK' }],
              );
              return;
            }

            // Check if time is in the past (client-side check)
            if (isTimeInPast()) {
              Alert.alert(
                isRTL ? 'تنبيه' : 'Alert',
                isRTL
                  ? 'لا يمكن حجز وقت قديم. الرجاء اختيار وقت مستقبلي.'
                  : 'Cannot book a past time. Please select a future time.',
                [{ text: isRTL ? 'حسناً' : 'OK' }],
              );
              return;
            }

            // Check if time slot is not available
            if (!isTimeSlotAvailable) {
              Alert.alert(
                isRTL ? 'تنبيه' : 'Alert',
                isRTL
                  ? 'هذا الوقت غير متاح. الرجاء اختيار وقت آخر.'
                  : 'This time slot is not available. Please select another time.',
                [{ text: isRTL ? 'حسناً' : 'OK' }],
              );
              return;
            }

            try {
              // Start loading
              setIsAddingToCart(true);

              // Parse the selected time - format is "HH:MM - HH:MM" (24-hour format)
              // Example: "09:00 - 09:30" or "14:30 - 15:00"
              const timeMatch = selectedTime.match(
                /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/,
              );
              if (!timeMatch) {
                Alert.alert(
                  isRTL ? 'خطأ' : 'Error',
                  isRTL ? 'تنسيق الوقت غير صحيح' : 'Invalid time format',
                  [{ text: isRTL ? 'حسناً' : 'OK' }],
                );
                setIsAddingToCart(false);
                return;
              }

              // Extract hours and minutes from the time slot
              const startHours = parseInt(timeMatch[1], 10);
              const startMinutes = parseInt(timeMatch[2], 10);
              const endHours = parseInt(timeMatch[3], 10);
              const endMinutes = parseInt(timeMatch[4], 10);

              // IMPORTANT: Convert Kuwait time to UTC before sending
              // User selects 09:00 Kuwait → We send 06:00 UTC to backend
              // Backend stores it as-is in DB

              // Get the date components
              const year = selectedDate.getFullYear();
              const month = selectedDate.getMonth();
              const day = selectedDate.getDate();

              // Create UTC Date objects by subtracting 3 hours (Kuwait is UTC+3)
              // Example: User selects 09:00 Kuwait
              // We create: 06:00 UTC (09:00 - 3 = 06:00)
              // Backend stores: 06:00 UTC in DB
              const slotStartUTC = Date.UTC(
                year,
                month,
                day,
                startHours - 3,
                startMinutes,
                0,
                0,
              );
              const slotEndUTC = Date.UTC(
                year,
                month,
                day,
                endHours - 3,
                endMinutes,
                0,
                0,
              );

              const slotStart = new Date(slotStartUTC);
              const slotEnd = new Date(slotEndUTC);

              // Calculate total price using the dynamic calculateTotalPrice function
              const computedTotalPrice = calculateTotalPrice();
              const basePrice = (() => {
                let bp = service.price;
                if (service.isOnSale) {
                  if (
                    service.salePrice &&
                    service.salePrice > 0 &&
                    service.salePrice < service.price
                  ) {
                    bp = service.salePrice;
                  } else if (
                    service.discountPercentage &&
                    service.discountPercentage > 0
                  ) {
                    bp = service.price * (1 - service.discountPercentage / 100);
                  }
                }
                return bp;
              })();
              const selectedCustomInputs = (
                service.customInputs?.map((input: any) => {
                  const inputId = input._id || input.label;
                  const selectedValue = customInputSelections[inputId];

                  // Handle radio buttons (single and multiple)
                  if (
                    input.type === 'radio-single' ||
                    input.type === 'radio-multiple'
                  ) {
                    // For radio-multiple, selectedValue is an array; for radio-single, it's a number
                    const isMultiple = input.type === 'radio-multiple';
                    const selectedIndices = isMultiple
                      ? (selectedValue as number[]) || []
                      : selectedValue !== undefined
                        ? [selectedValue as number]
                        : [];

                    if (selectedIndices.length > 0) {
                      const selectedOptions = selectedIndices.map(
                        (index: number) => {
                          const optionEn = input.options?.[index] || '';
                          const optionAr = input.optionsAr?.[index] || optionEn;
                          const optionPrice = Number(
                            input.optionPrices[index] ?? 0,
                          );
                          return {
                            label: String(input.label), // Always use English label for backend matching
                            labelAr: input.labelAr
                              ? String(input.labelAr)
                              : undefined,
                            value: optionEn as string | number, // Save English value
                            valueAr: optionAr as string | number, // Save Arabic value
                            price: optionPrice,
                          };
                        },
                      );

                      // Return single object for radio-single, array for radio-multiple
                      return isMultiple ? selectedOptions : selectedOptions[0];
                    }
                  }
                  // Handle restaurant-menu inputs
                  else if (
                    input.type === 'restaurant-menu' &&
                    selectedValue &&
                    typeof selectedValue === 'object' &&
                    !Array.isArray(selectedValue)
                  ) {
                    const menuMap = selectedValue as { [key: string]: number };
                    const menuEntries = Object.entries(menuMap)
                      .filter(([, qty]) => Number(qty) > 0)
                      .map(([opt, qty]) => {
                        const idx = input.options.indexOf(opt);
                        const optionAr =
                          idx >= 0 && input.optionsAr?.[idx]
                            ? input.optionsAr[idx]
                            : opt;
                        const optionPrice =
                          idx >= 0 ? Number(input.optionPrices?.[idx] ?? 0) : 0;
                        return {
                          label: String(input.label),
                          labelAr: input.labelAr
                            ? String(input.labelAr)
                            : undefined,
                          value: `${opt} ×${qty}` as string | number,
                          valueAr: `${optionAr} ×${qty}` as string | number,
                          price: optionPrice * Number(qty),
                        };
                      });
                    if (menuEntries.length > 0) return menuEntries;
                  }
                  // Handle text and number inputs
                  else if (
                    (input.type === 'text' || input.type === 'number') &&
                    selectedValue !== undefined &&
                    selectedValue !== ''
                  ) {
                    return {
                      label: String(input.label), // Always use English label for backend matching
                      labelAr: input.labelAr
                        ? String(input.labelAr)
                        : undefined,
                      value: selectedValue,
                      valueAr: selectedValue,
                      price: 0, // Text/number inputs don't have option prices
                    };
                  }

                  return null;
                }) ?? []
              )
                .flat()
                .filter(
                  (
                    v,
                  ): v is {
                    label: string;
                    value: string | number;
                    price?: number;
                  } => v !== null,
                );

              const computedOriginalTotalPrice = calculateOriginalTotalPrice();

              const cartItem: CartItem = {
                _id: `${service._id}_${Date.now()}`,
                serviceId: service._id,
                vendorId: service.vendor?._id || '',
                name: service.name,
                nameAr: service.nameAr,
                vendorName: service.vendor?.name,
                image:
                  service.images && service.images.length > 0
                    ? service.images[0]
                    : undefined,
                price: basePrice,
                totalPrice: computedTotalPrice, // Total price including custom options (dynamic)
                quantity: 1, // Default quantity is 1, user can change in Cart (for unlimited services)
                selectedDate,
                selectedTime,
                customInputs: selectedCustomInputs.filter(
                  v => v !== null && v !== undefined,
                ),
                timeSlot: {
                  start: slotStart,
                  end: slotEnd,
                },
                availabilityStatus: service.availabilityStatus,
                maxBookingsPerSlot: service.maxBookingsPerSlot, // Pass maxBookingsPerSlot to cart
                deliveryFee: service.deliveryFee || 0, // Pass delivery fee from service
                originalPriceBeforeDiscount: service.price,
                originalTotalPriceBeforeDiscount: computedOriginalTotalPrice,
              };

              if (editCartItemId) {
                // Update cart item in local storage
                await updateCartItem(editCartItemId, {
                  selectedDate,
                  selectedTime,
                  customInputs: selectedCustomInputs.filter(
                     v => v !== null && v !== undefined,
                  ),
                  totalPrice: computedTotalPrice,
                  price: basePrice,
                  timeSlot: {
                    start: slotStart,
                    end: slotEnd,
                  },
                  originalPriceBeforeDiscount: service.price,
                  originalTotalPriceBeforeDiscount: computedOriginalTotalPrice,
                });

                if (onBack) {
                  onBack();
                }
              } else {
                // Add to local storage cart
                await addToCart(cartItem);

                // Trigger success button state and reset after 2 seconds
                setIsSuccessState(true);
                setTimeout(() => {
                  setIsSuccessState(false);
                }, 2000);

                triggerAddToCartAnimation();

                // Reset date, time, and custom inputs after successful add to cart
                setSelectedDate(null);
                setSelectedTime(null);
                setCustomInputSelections({});
                setExpandedCustomInputs({});
              }

              // Success - silently added to cart, no alert
            } catch (error) {
              const err = error as Error;
              // Backend rejected the booking (time not available, etc.)
              let errorMessage = err.message || 'Failed to add to cart';

              // Parse common backend error messages
              if (errorMessage.includes('not available')) {
                errorMessage = isRTL
                  ? 'هذا الوقت غير متاح. الرجاء اختيار وقت آخر.'
                  : 'This time slot is not available. Please select another time.';
              } else if (errorMessage.includes('past')) {
                errorMessage = isRTL
                  ? 'لا يمكن حجز وقت قديم.'
                  : 'Cannot book a past time.';
              } else if (errorMessage.includes('advance')) {
                errorMessage = isRTL
                  ? 'الحجز بعيد جداً في المستقبل.'
                  : 'Booking too far in advance.';
              } else if (errorMessage.includes('working day')) {
                errorMessage = isRTL
                  ? 'الخدمة غير متاحة في هذا اليوم.'
                  : 'Service not available on this day.';
              }

              Alert.alert(isRTL ? 'خطأ' : 'Error', errorMessage, [
                { text: isRTL ? 'حسناً' : 'OK' },
              ]);
            } finally {
              // Stop loading
              setIsAddingToCart(false);
            }
          }}
        >
          {isSuccessState || editCartItemId ? (
            <Svg
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill="none"
              style={{ marginRight: 8 }}
            >
              <Path
                d="M5 13l4 4L19 7"
                stroke={colors.textWhite}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ) : (
            <Svg
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill="none"
              style={{ marginRight: 8 }}
            >
              <Path
                d="M9 2L7 6M17 6L15 2M2 6h20l-2 14H4L2 6z"
                stroke={colors.textWhite}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
          <Text style={styles.addToCartButtonText}>
            {checkingAvailability
              ? isRTL
                ? 'جاري التحقق...'
                : 'CHECKING...'
              : isAddingToCart
                ? isRTL
                  ? 'جاري الإضافة...'
                  : 'ADDING...'
                : isSuccessState
                  ? isRTL
                    ? '✓ تم الإضافة'
                    : '✓ ADDED'
                  : editCartItemId
                    ? isRTL
                      ? `حفظ التغييرات (${totalPrice.toFixed(3)} د.ك)`
                      : `SAVE CHANGES (${totalPrice.toFixed(3)} KD)`
                    : isRTL
                      ? `أضف إلى السلة (${totalPrice.toFixed(3)} د.ك)`
                      : `ADD TO CART (${totalPrice.toFixed(3)} KD)`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButtonBottom}
          activeOpacity={0.85}
          onPress={onBack}
        >
          <Text style={styles.backButtonText}>{isRTL ? 'رجوع' : 'BACK'}</Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {service && (
        <DatePickerModal
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSelectDate={date => {
            setSelectedDate(date);
            setGlobalSelectedDate(date); // Sync globally so all services use the same date
            setSelectedTime(null); // Reset time when date changes
            // Automatically open time picker after selecting date
            setShowDatePicker(false);
            setTimeout(() => {
              setShowTimePicker(true);
            }, 300); // Small delay for smooth transition
          }}
          serviceId={service._id}
          vendorId={service.vendor?._id || ''}
          selectedDate={selectedDate || undefined}
          token={userToken || undefined}
        />
      )}

      {/* Time Picker Modal */}
      {service && selectedDate && (
        <TimePickerModal
          visible={showTimePicker}
          onClose={() => setShowTimePicker(false)}
          onSelectTime={timeSlot => setSelectedTime(timeSlot)}
          serviceId={service._id}
          vendorId={service.vendor?._id || ''}
          selectedDate={selectedDate}
          selectedTime={selectedTime || undefined}
          token={userToken || undefined}
        />
      )}

      {/* Write Review Modal */}
      {service && (
        <WriteReview
          visible={showWriteReviewModal}
          bookingId={userBookingId || ''}
          serviceId={service._id}
          serviceName={displayName}
          initialRating={userReview?.rating || 0}
          initialComment={userReview?.comment || ''}
          oldReviewId={userReview?._id}
          onBack={() => setShowWriteReviewModal(false)}
          onSuccess={() => {
            setShowWriteReviewModal(false);
            refetchReviews();
          }}
        />
      )}

      {/* Custom Alert for Delete Confirmation */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />

      {/* Fullscreen Image Viewer Overlay */}
      {activeFullImageUrl && (
        <View style={styles.fullscreenOverlay}>
          {/* Main click outside area to dismiss */}
          <TouchableOpacity
            style={styles.fullscreenClickOutside}
            activeOpacity={1}
            onPress={() => setActiveFullImageUrl(null)}
          />

          {/* Image Container directly holding the rounded image and close button */}
          <View style={styles.fullscreenImageContainer}>
            <Image
              source={{ uri: activeFullImageUrl }}
              style={styles.fullscreenImage}
              resizeMode="cover"
            />
            {/* Close Button on top of the image itself */}
            <TouchableOpacity
              style={styles.fullscreenCloseButton}
              onPress={() => setActiveFullImageUrl(null)}
            >
              <Icon name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default ServiceDetails;
