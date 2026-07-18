import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
  Share,
  StatusBar,
  Animated,
  Clipboard,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { usePackageDetails } from '../../hooks/usePackages';
import { useLanguage } from '../../contexts/LanguageContext';
import { getImageUrl } from '../../services/api';
import {
  toggleWishlist,
  isWishlisted,
  WishlistItem,
} from '../../services/wishlist';
import { colors } from '../../constants/colors';
import { createStyles } from './styles';
import DatePickerModal from '../DatePickerModal/DatePickerModal';
import TimePickerModal from '../TimePickerModal/TimePickerModal';
import { addToCart, updateCartItem } from '../../services/cart';
import { checkTimeSlotAvailability, getUserBookings } from '../../services/api';
import WriteReview from '../../screens/WriteReview';
import {
  getServiceReviews,
  checkUserReviewedService,
  deleteReview,
  Review,
  ReviewStats,
  ReviewsResponse,
} from '../../services/reviewsApi';
import { Package } from '../../hooks/usePackages';
import { CustomAlert } from '../CustomAlert/CustomAlert';

interface PackageDetailsProps {
  packageId: string;
  onBack?: () => void;
  onNavigate?: (route: string) => void;
  editCartItemId?: string;
}

const PackageDetails: React.FC<PackageDetailsProps> = ({
  packageId,
  onBack,
  onNavigate,
  editCartItemId,
}) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const styles = createStyles(SCREEN_WIDTH);
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const fixedHeight = insets.top + 56; // Increased from 46 to 56 to add vertical padding
  const isTablet = SCREEN_WIDTH >= 600;
  const backIconSize = isTablet ? 18 : 20;
  const headerIconSize = isTablet ? 16 : 18;
  const imageHeight = isTablet ? 480 : 380;
  const threshold = imageHeight - fixedHeight - 20;
  const {
    data: packageData,
    isLoading,
    error,
  } = usePackageDetails(packageId) as {
    data: Package | undefined;
    isLoading: boolean;
    error: any;
  };
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [originalDate, setOriginalDate] = useState<Date | null>(null);
  const [originalTime, setOriginalTime] = useState<string | null>(null);
  const [isTimeSlotAvailable, setIsTimeSlotAvailable] = useState<boolean>(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [expandedMainService, setExpandedMainService] = useState(false);
  const [expandedAdditionalServices, setExpandedAdditionalServices] = useState<{
    [key: number]: boolean;
  }>({});

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [userBookingId, setUserBookingId] = useState<string | null>(null);
  const [showWriteReviewModal, setShowWriteReviewModal] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDeletingReview, setIsDeletingReview] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // CustomAlert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = (
    title: string,
    message: string,
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>,
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: buttons || [
        {
          text: isRTL ? 'حسناً' : 'OK',
          onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })),
        },
      ],
    });
  };

  const [isSuccessState, setIsSuccessState] = useState(false);
  const addToCartButtonRef = useRef<View>(null);

  useEffect(() => {
    const loadUserData = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');
      setUserToken(token);
      setCurrentUserId(userId);
    };
    loadUserData();
  }, []);

  // Load existing cart item for editing and pre-fill selections
  useEffect(() => {
    const loadCartItemForEdit = async () => {
      if (!editCartItemId) return;
      try {
        const { getCart } = require('../../services/cart');
        const cart = await getCart();
        const item = cart.find((i: any) => i._id === editCartItemId);
        if (item) {
          if (item.selectedDate) {
            const dateObj = new Date(item.selectedDate);
            setSelectedDate(dateObj);
            setOriginalDate(dateObj);
          }
          if (item.selectedTime) {
            setSelectedTime(item.selectedTime);
            setOriginalTime(item.selectedTime);
          }
        }
      } catch (err) {
        console.error(
          'Error loading cart item for edit in PackageDetails:',
          err,
        );
      }
    };

    if (packageData) {
      loadCartItemForEdit();
    }
  }, [editCartItemId, packageData]);

  // Load reviews using React Query for better caching
  const { data: reviewsData, refetch: refetchReviews } =
    useQuery<ReviewsResponse | null>({
      queryKey: ['service-reviews', packageData?.service?._id],
      queryFn: async () => {
        if (!packageData?.service?._id) return null;
        return await getServiceReviews(packageData.service._id, 1, 10);
      },
      enabled: !!packageData?.service?._id,
      staleTime: 10 * 60 * 1000,
      gcTime: 20 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    });

  // Check if the user has purchased the package
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token || !packageId) {
          setHasPurchased(false);
          setUserBookingId(null);
          return;
        }

        const bookingsData = await getUserBookings(token);

        // Find if there's any booking for this package that is confirmed/completed
        const purchaseBooking = bookingsData.find(booking => {
          const hasPkg = booking.packages?.some(pkgItem => {
            const pkgIdFromBooking =
              typeof pkgItem.package === 'string'
                ? pkgItem.package
                : pkgItem.package?._id;
            return pkgIdFromBooking === packageId;
          });

          if (!hasPkg) return false;

          // Check if the booking status itself is confirmed or completed, or any of the services are confirmed/completed
          const isConfirmedOrCompleted =
            booking.status === 'confirmed' ||
            booking.status === 'completed' ||
            booking.services?.some(
              s => s.status === 'confirmed' || s.status === 'completed',
            );

          return isConfirmedOrCompleted;
        });

        if (purchaseBooking) {
          setHasPurchased(true);
          setUserBookingId(purchaseBooking._id);
        } else {
          setHasPurchased(false);
          setUserBookingId(null);
        }
      } catch (error) {
        console.log('Error checking package purchase status:', error);
        setHasPurchased(false);
        setUserBookingId(null);
      }
    };

    checkPurchaseStatus();
  }, [packageId, userToken]);

  // Fetch user's existing review if any
  useEffect(() => {
    const fetchUserReview = async () => {
      const serviceId = packageData?.service?._id;
      if (!serviceId || !userToken) {
        setUserReview(null);
        return;
      }
      try {
        const review = await checkUserReviewedService(serviceId);
        setUserReview(review);
      } catch (error) {
        console.log('Error checking package user review status:', error);
        setUserReview(null);
      }
    };

    fetchUserReview();
  }, [packageData?.service?._id, userToken]);

  // Update local state when reviews data changes
  useEffect(() => {
    if (reviewsData) {
      setReviews(reviewsData.reviews);
      setReviewStats(reviewsData.stats);
    }
  }, [reviewsData]);

  // Check wishlist state
  useEffect(() => {
    const checkWishlist = async () => {
      if (packageId) {
        const saved = await isWishlisted(packageId);
        setIsSaved(saved);
      }
    };
    checkWishlist();
  }, [packageId]);

  // Check availability when date/time changes
  useEffect(() => {
    if (selectedDate && selectedTime && packageData?.service?._id) {
      checkAvailability();
    }
  }, [selectedDate, selectedTime, editCartItemId, originalDate, originalTime]);

  const checkAvailability = async () => {
    if (
      !selectedDate ||
      !selectedTime ||
      !packageData?.service?._id ||
      !packageData?.vendor?._id
    )
      return;

    // If editing and date/time haven't changed, bypass backend check
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

    setCheckingAvailability(true);
    try {
      const result = await checkTimeSlotAvailability(
        packageData.service._id,
        packageData.vendor._id,
        selectedDate,
      );
      // Find the slot matching selectedTime and check availability
      const timeSlot = result.find(
        (slot: any) => slot.timeSlot === selectedTime,
      );
      setIsTimeSlotAvailable(timeSlot ? timeSlot.available : false);
    } catch (err) {
    } finally {
      setCheckingAvailability(false);
    }
  };

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
              // Check if the deleted review is the user's current review
              if (userReview && userReview._id === review._id) {
                setUserReview(null);
              }
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

  const handleAddToCart = async () => {
    if (!userToken) {
      showAlert(
        isRTL ? 'تسجيل الدخول مطلوب' : 'Login Required',
        isRTL
          ? 'يرجى تسجيل الدخول لإضافة العناصر إلى السلة'
          : 'Please login to add items to cart',
        [
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
      );
      return;
    }

    if (!selectedDate || !selectedTime) {
      showAlert(
        isRTL ? 'اختر التاريخ والوقت' : 'Select Date & Time',
        isRTL
          ? 'يرجى اختيار التاريخ والوقت أولاً'
          : 'Please select date and time first',
      );
      return;
    }

    if (!isTimeSlotAvailable) {
      showAlert(
        isRTL ? 'غير متاح' : 'Not Available',
        isRTL ? 'هذا الوقت محجوز بالفعل' : 'This time slot is already booked',
      );
      return;
    }

    setIsAddingToCart(true);
    try {
      // Parse time from selectedTime string format (e.g., "14:00 - 15:00")
      const timeMatch = selectedTime.match(
        /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/,
      );
      let slotStart: Date | string = selectedTime;
      let slotEnd: Date | string = selectedTime;

      if (timeMatch) {
        const startHours = parseInt(timeMatch[1], 10);
        const startMinutes = parseInt(timeMatch[2], 10);
        const endHours = parseInt(timeMatch[3], 10);
        const endMinutes = parseInt(timeMatch[4], 10);

        // Convert Kuwait time to UTC (subtract 3 hours)
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const day = selectedDate.getDate();

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

        slotStart = new Date(slotStartUTC);
        slotEnd = new Date(slotEndUTC);
      }

      if (editCartItemId) {
        await updateCartItem(editCartItemId, {
          selectedDate: selectedDate,
          selectedTime: selectedTime,
          timeSlot: { start: slotStart, end: slotEnd },
        });

        if (onBack) {
          onBack();
        }
      } else {
        const hasPendingService =
          packageData!.service?.availabilityStatus === 'pending_confirmation' ||
          (packageData!.additionalServices &&
            packageData!.additionalServices.some(
              (as: any) =>
                as.service?.availabilityStatus === 'pending_confirmation',
            ));

        await addToCart({
          _id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          serviceId: packageData!._id,
          vendorId: packageData!.vendor._id,
          name: isRTL ? packageData!.nameAr : packageData!.name,
          nameAr: packageData!.nameAr,
          selectedDate: selectedDate,
          selectedTime: selectedTime,
          timeSlot: { start: slotStart, end: slotEnd }, // Use parsed Date objects
          price:
            packageData!.discountPrice > 0
              ? packageData!.totalPrice - packageData!.discountPrice
              : packageData!.totalPrice,
          image: packageData!.images?.[0] || '',
          vendorName: packageData!.vendor?.displayName || '',
          quantity: 1,
          isPackage: true,
          mainServiceId: packageData!.service._id, // Main limited service for availability checking
          packageName: packageData!.name, // Store package name
          packageNameAr: packageData!.nameAr, // Store package name in Arabic
          availabilityStatus: hasPendingService
            ? 'pending_confirmation'
            : 'available_now',
        });

        // Trigger success button state and reset after 2 seconds
        setIsSuccessState(true);
        setTimeout(() => {
          setIsSuccessState(false);
        }, 2000);

        triggerAddToCartAnimation();
      }
    } catch (err: any) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        err.message ||
          (isRTL ? 'فشل في إضافة الباقة' : 'Failed to add package'),
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  const triggerAddToCartAnimation = () => {
    // No-op because bottom navigation bar is hidden on this screen
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !packageData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {isRTL
            ? 'فشل في تحميل تفاصيل الباقة'
            : 'Failed to load package details'}
        </Text>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>
              {isRTL ? 'رجوع' : 'Go Back'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const displayName = isRTL ? packageData.nameAr : packageData.name;
  const displayDescription = isRTL
    ? packageData.descriptionAr
    : packageData.description;
  // discountPrice is the discount amount (e.g., 20 KD off), not the final price
  // Final price = totalPrice - discountPrice
  const displayPrice =
    packageData.discountPrice > 0
      ? packageData.totalPrice - packageData.discountPrice
      : packageData.totalPrice;

  const handleShare = async () => {
    if (!packageData) return;
    try {
      // Create package URL
      const packageUrl = `https://masarrakw.com/packages/${packageData._id}`;

      // Copy link to clipboard
      await Clipboard.setString(packageUrl);

      // Build sharing message
      const packageName = isRTL ? packageData.nameAr : packageData.name;
      const shareMessage = `${packageName}\n${packageUrl}`;

      await Share.share({ message: shareMessage });
    } catch (error: any) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        error.message || (isRTL ? 'فشلت المشاركة' : 'Failed to share'),
      );
    }
  };

  const handleToggleWishlist = async () => {
    if (!packageData) return;
    const img =
      packageData.images && packageData.images.length > 0
        ? getImageUrl(packageData.images[0])
        : undefined;
    const item: WishlistItem = {
      _id: packageData._id,
      name: displayName,
      image: img,
      price: displayPrice,
    };
    await toggleWishlist(item);
    const now = await isWishlisted(packageData._id);
    setIsSaved(now);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="transparent"
        barStyle="dark-content"
        translucent={true}
      />
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            height: fixedHeight,
            paddingTop: insets.top,
            backgroundColor: headerBgColor,
            borderBottomWidth: 1,
            borderBottomColor: headerBorderColor,
          },
        ]}
      >
        {/* Left Side */}
        <View style={styles.headerLeft}>
          {!isRTL ? (
            // LTR: Back button on left
            <>
              <TouchableOpacity
                onPress={onBack}
                activeOpacity={0.7}
                style={styles.headerButton}
              >
                <Svg
                  width={backIconSize}
                  height={backIconSize}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <Path
                    d="M15 6l-6 6 6 6"
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
                {packageData?.name}
              </Animated.Text>
            </>
          ) : (
            // RTL: Wishlist & Share on left
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleToggleWishlist}
                style={styles.headerButton}
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
                onPress={handleShare}
                style={styles.headerButton}
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

        {/* Right Side */}
        <View style={styles.headerRight}>
          {isRTL ? (
            // RTL: Back button on right
            <>
              <Animated.Text
                style={[
                  styles.headerTitle,
                  { marginRight: 4, opacity: titleOpacity },
                ]}
                numberOfLines={1}
              >
                {packageData?.nameAr || packageData?.name}
              </Animated.Text>
              <TouchableOpacity
                onPress={onBack}
                activeOpacity={0.7}
                style={styles.headerButton}
              >
                <Svg
                  width={backIconSize}
                  height={backIconSize}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <Path
                    d="M9 6l6 6-6 6"
                    stroke={colors.primary}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </>
          ) : (
            // LTR: Wishlist & Share on right
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleToggleWishlist}
                style={styles.headerButton}
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
                onPress={handleShare}
                style={styles.headerButton}
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
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: 0,
            paddingBottom:
              SCREEN_WIDTH >= 600 ? insets.bottom + 280 : insets.bottom + 200,
          },
        ]}
      >
        {/* Image Gallery */}
        {packageData.images && packageData.images.length > 0 && (
          <View style={styles.imageGalleryContainer}>
            <Image
              source={{
                uri: getImageUrl(packageData.images[currentImageIndex]),
              }}
              style={styles.galleryImage}
              resizeMode="cover"
            />
            {packageData.images.length > 1 && (
              <View style={styles.paginationContainer}>
                {packageData.images.map((_: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setCurrentImageIndex(index)}
                    style={[
                      styles.paginationDot,
                      index === currentImageIndex
                        ? styles.paginationDotActive
                        : styles.paginationDotInactive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Package Info */}
        <View style={styles.infoSection}>
          {/* Package Name with Badge */}
          <View
            style={[
              styles.packageNameContainer,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Text
              style={[
                styles.packageName,
                { textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {displayName}
            </Text>

            <View style={styles.packageBadgeContainer}>
              <Text style={styles.packageBadgeText}>
                {isRTL ? 'باقة' : 'PACKAGE'}
              </Text>
            </View>
          </View>

          {/* Package Description */}
          {(packageData.description || packageData.descriptionAr) && (
            <Text
              style={[
                styles.packageDescription,
                { textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {isRTL ? packageData.descriptionAr : packageData.description}
            </Text>
          )}

          {/* Vendor Policy Section */}
          {packageData.vendor?.vendorProfile?.refundPeriodHours != null && (
            <View
              style={{
                marginTop: 12,
                marginBottom: 12,
                paddingVertical: 16,
                paddingHorizontal: 16,
                backgroundColor: colors.backgroundCard || '#F8FAFC',
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: colors.primary,
                  letterSpacing: 1.5,
                  marginBottom: 12,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {isRTL ? 'سياسة المورد' : 'VENDOR POLICY'}
              </Text>
              <View
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
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
                          packageData.vendor.vendorProfile.refundPeriodHours;
                        if (h === 0) return 'أي وقت';
                        if (h < 24) return `${h} ساعة`;
                        const d = Number(
                          (h / 24).toFixed(1).replace(/\.0$/, ''),
                        );
                        return `${d} يوم`;
                      })()} قبل المناسبة`
                    : `Full refund up to ${(() => {
                        const h =
                          packageData.vendor.vendorProfile.refundPeriodHours;
                        if (h === 0) return 'any time';
                        if (h < 24) return `${h} hours`;
                        const d = Number(
                          (h / 24).toFixed(1).replace(/\.0$/, ''),
                        );
                        return `${d} days`;
                      })()} before the event`}
                </Text>
              </View>
            </View>
          )}

          {/* Vendor Name */}
          {packageData.vendor && (
            <View
              style={[
                styles.vendorContainer,
                isRTL && { flexDirection: 'row-reverse' },
              ]}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                  stroke="#666"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                  stroke="#666"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text
                style={[
                  styles.vendorText,
                  isRTL && { marginLeft: 0, marginRight: 8 },
                ]}
              >
                {packageData.vendor.name}
              </Text>
            </View>
          )}

          {/* Price & Rating */}
          <View
            style={[
              styles.priceRatingContainer,
              isRTL && { flexDirection: 'row-reverse' },
            ]}
          >
            <View
              style={[
                styles.priceContainer,
                isRTL && { flexDirection: 'row-reverse' },
              ]}
            >
              {packageData.discountPrice > 0 && (
                <Text style={styles.originalPrice}>
                  {packageData.totalPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                </Text>
              )}
              <Text style={styles.currentPrice}>
                {displayPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
              </Text>
            </View>
            <View
              style={[
                styles.ratingContainer,
                isRTL && { flexDirection: 'row-reverse' },
              ]}
            >
              <Text style={styles.ratingValue}>
                {reviewStats ? reviewStats.averageRating.toFixed(1) : '0.0'}
              </Text>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingCount}>
                ({reviewStats ? reviewStats.totalRatings : 0})
              </Text>
            </View>
          </View>

          {/* Date & Time Selection */}
          <View style={styles.dateTimeSection}>
            <Text style={styles.dateTimeTitle}>
              {isRTL ? 'اختر اليوم والوقت' : 'SELECT EVENT DAY & TIME'}
            </Text>

            <View style={styles.dateTimeInputsContainer}>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
                style={[
                  styles.dateTimeButton,
                  isRTL && { flexDirection: 'row-reverse' },
                ]}
              >
                <View
                  style={[
                    styles.dateTimeIconContainer,
                    isRTL && { marginRight: 0, marginLeft: 14 },
                  ]}
                >
                  <View style={styles.dateTimeIcon}>
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
                    styles.dateTimeText,
                    { textAlign: isRTL ? 'right' : 'left' },
                  ]}
                >
                  {selectedDate
                    ? selectedDate.toLocaleDateString(
                        isRTL ? 'ar-KW' : 'en-US',
                        {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        },
                      )
                    : isRTL
                    ? 'اختر التاريخ'
                    : 'Select Date'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => selectedDate && setShowTimePicker(true)}
                disabled={!selectedDate}
                activeOpacity={0.8}
                style={[
                  styles.dateTimeButton,
                  isRTL && { flexDirection: 'row-reverse' },
                  !selectedDate && { opacity: 0.5 },
                ]}
              >
                <View
                  style={[
                    styles.dateTimeIconContainer,
                    isRTL && { marginRight: 0, marginLeft: 14 },
                  ]}
                >
                  <View style={styles.dateTimeIcon}>
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
                    styles.dateTimeText,
                    { textAlign: isRTL ? 'right' : 'left' },
                  ]}
                >
                  {selectedTime || (isRTL ? 'اختر الوقت' : 'Select Time')}
                </Text>
                {checkingAvailability && (
                  <ActivityIndicator size="small" color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.availabilityButton,
                  (!selectedDate || !selectedTime || !isTimeSlotAvailable) && {
                    opacity: 0.5,
                  },
                ]}
                activeOpacity={0.85}
                disabled={
                  !selectedDate || !selectedTime || !isTimeSlotAvailable
                }
              >
                <Text style={styles.availabilityText}>
                  {checkingAvailability
                    ? isRTL
                      ? 'جاري التحقق...'
                      : 'Checking...'
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

          {selectedTime && !isTimeSlotAvailable && (
            <Text
              style={[
                styles.unavailableText,
                { textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {isRTL
                ? 'هذا الوقت محجوز بالفعل'
                : 'This time slot is already booked'}
            </Text>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          {displayDescription && (
            <>
              <Text
                style={[
                  styles.sectionTitle,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {isRTL ? 'الوصف' : 'Description'}
              </Text>
              <Text
                style={[
                  styles.descriptionText,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {displayDescription}
              </Text>
            </>
          )}

          {/* Main Service */}
          {packageData.service && (
            <>
              <Text
                style={[
                  styles.sectionTitle,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {isRTL ? 'الخدمة الرئيسية' : 'Main Service'}
              </Text>
              <TouchableOpacity
                onPress={() => setExpandedMainService(!expandedMainService)}
                style={styles.mainServiceCard}
              >
                <View
                  style={[
                    styles.serviceCardHeader,
                    isRTL && { flexDirection: 'row-reverse' },
                  ]}
                >
                  <View style={styles.serviceCardContent}>
                    <Text
                      style={[
                        styles.serviceCardTitle,
                        { textAlign: isRTL ? 'right' : 'left' },
                      ]}
                    >
                      {packageData.service.name}
                    </Text>
                    <Text
                      style={[
                        styles.serviceCardPrice,
                        { textAlign: isRTL ? 'right' : 'left' },
                      ]}
                    >
                      {packageData.customPrice.toFixed(3)}{' '}
                      {isRTL ? 'د.ك' : 'KD'}
                    </Text>
                  </View>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d={
                        expandedMainService ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'
                      }
                      stroke={colors.primary}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>

                {expandedMainService && (
                  <View style={styles.serviceCardExpanded}>
                    {packageData.service.description && (
                      <Text
                        style={[
                          styles.serviceCardDescription,
                          { textAlign: isRTL ? 'right' : 'left' },
                        ]}
                      >
                        {packageData.service.description}
                      </Text>
                    )}
                    {packageData.service.images &&
                      packageData.service.images.length > 0 && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                        >
                          {packageData.service.images.map(
                            (img: string, idx: number) => (
                              <Image
                                key={idx}
                                source={{ uri: getImageUrl(img) }}
                                style={styles.serviceImage}
                                resizeMode="cover"
                              />
                            ),
                          )}
                        </ScrollView>
                      )}
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Additional Services */}
          {packageData.additionalServices &&
            packageData.additionalServices.length > 0 && (
              <>
                <Text
                  style={[
                    styles.sectionTitle,
                    { textAlign: isRTL ? 'right' : 'left' },
                  ]}
                >
                  {isRTL ? 'خدمات إضافية' : 'Additional Services'}
                </Text>
                {packageData.additionalServices.map(
                  (item: any, index: number) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() =>
                        setExpandedAdditionalServices(prev => ({
                          ...prev,
                          [index]: !prev[index],
                        }))
                      }
                      style={styles.serviceCard}
                    >
                      <View
                        style={[
                          styles.serviceCardHeader,
                          isRTL && { flexDirection: 'row-reverse' },
                        ]}
                      >
                        <View style={styles.serviceCardContent}>
                          <Text
                            style={[
                              styles.serviceCardTitle,
                              { textAlign: isRTL ? 'right' : 'left' },
                            ]}
                          >
                            {item.service?.name || 'Service'}
                          </Text>
                          <Text
                            style={[
                              styles.serviceCardPrice,
                              { textAlign: isRTL ? 'right' : 'left' },
                            ]}
                          >
                            {item.customPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                          </Text>
                        </View>
                        <Svg
                          width={20}
                          height={20}
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <Path
                            d={
                              expandedAdditionalServices[index]
                                ? 'M18 15l-6-6-6 6'
                                : 'M6 9l6 6 6-6'
                            }
                            stroke={colors.primary}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </View>

                      {expandedAdditionalServices[index] && (
                        <View style={styles.serviceCardExpanded}>
                          {item.service?.description && (
                            <Text
                              style={[
                                styles.serviceCardDescription,
                                { textAlign: isRTL ? 'right' : 'left' },
                              ]}
                            >
                              {item.service.description}
                            </Text>
                          )}
                          {item.service?.images &&
                            item.service.images.length > 0 && (
                              <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                              >
                                {item.service.images.map(
                                  (img: string, idx: number) => (
                                    <Image
                                      key={idx}
                                      source={{ uri: getImageUrl(img) }}
                                      style={styles.serviceImage}
                                      resizeMode="cover"
                                    />
                                  ),
                                )}
                              </ScrollView>
                            )}
                        </View>
                      )}
                    </TouchableOpacity>
                  ),
                )}
              </>
            )}

          {/* Reviews Section */}
          {((reviewStats && reviewStats.totalRatings > 0) || hasPurchased) && (
            <View style={styles.reviewsSection}>
              <View
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
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

              {/* Review Stats and Reviews Container */}
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
                      isRTL && { flexDirection: 'row-reverse' },
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
                    <View
                      style={[
                        styles.averageRatingContainer,
                        isRTL && {
                          paddingRight: 0,
                          paddingLeft: 16,
                          borderRightWidth: 0,
                          borderLeftWidth: 1,
                        },
                      ]}
                    >
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
                    <View
                      style={[
                        styles.ratingDistribution,
                        isRTL && { paddingLeft: 0, paddingRight: 16 },
                      ]}
                    >
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
                          <View
                            key={star}
                            style={[
                              styles.distributionRow,
                              isRTL && { flexDirection: 'row-reverse' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.distributionStar,
                                { textAlign: isRTL ? 'left' : 'right' },
                              ]}
                            >
                              {star}★
                            </Text>
                            <View style={styles.distributionBar}>
                              <View
                                style={[
                                  styles.distributionFill,
                                  { width: `${percentage}%` },
                                ]}
                              />
                            </View>
                            <Text
                              style={[
                                styles.distributionCount,
                                { textAlign: isRTL ? 'right' : 'left' },
                              ]}
                            >
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
                              <View
                                style={[
                                  styles.reviewUserInfo,
                                  isRTL && { flexDirection: 'row-reverse' },
                                ]}
                              >
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
                                      flexDirection: isRTL
                                        ? 'row-reverse'
                                        : 'row',
                                      alignItems: 'center',
                                      flexWrap: 'wrap',
                                      marginLeft: isRTL ? 0 : 8,
                                      marginRight: isRTL ? 8 : 0,
                                    }}
                                  >
                                    <Text
                                      style={[
                                        styles.reviewUserName,
                                        { textAlign: isRTL ? 'right' : 'left' },
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
                                      flexDirection: isRTL
                                        ? 'row-reverse'
                                        : 'row',
                                      alignItems: 'center',
                                      marginTop: 2,
                                      marginLeft: isRTL ? 0 : 8,
                                      marginRight: isRTL ? 8 : 0,
                                    }}
                                  >
                                    <Text style={styles.reviewDate}>
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
                                  <Text
                                    style={[
                                      styles.vendorReplyLabel,
                                      { textAlign: isRTL ? 'right' : 'left' },
                                    ]}
                                  >
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
                    </View>
                  )}

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
                      onPress={() => setIsReviewsExpanded(!isReviewsExpanded)}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: colors.primary,
                        }}
                      >
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
                        style={{
                          marginLeft: isRTL ? 0 : 4,
                          marginRight: isRTL ? 4 : 0,
                          transform: [
                            { rotate: isReviewsExpanded ? '270deg' : '90deg' },
                          ],
                        }}
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
      </Animated.ScrollView>

      {/* Write Review Modal */}
      {packageData?.service && (
        <WriteReview
          visible={showWriteReviewModal}
          bookingId={userBookingId || ''}
          serviceId={packageData.service._id}
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
          onPress={handleAddToCart}
          disabled={
            isAddingToCart ||
            !selectedDate ||
            !selectedTime ||
            !isTimeSlotAvailable
          }
          style={[
            styles.addToCartButton,
            (isAddingToCart ||
              !selectedDate ||
              !selectedTime ||
              !isTimeSlotAvailable) && { opacity: 0.5 },
          ]}
          activeOpacity={0.85}
        >
          {isAddingToCart ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              {isSuccessState || editCartItemId ? (
                <Svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{
                    marginRight: isRTL ? 0 : 8,
                    marginLeft: isRTL ? 8 : 0,
                  }}
                >
                  <Path
                    d="M5 13l4 4L19 7"
                    stroke="#fff"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              ) : (
                <Svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{
                    marginRight: isRTL ? 0 : 8,
                    marginLeft: isRTL ? 8 : 0,
                  }}
                >
                  <Path
                    d="M9 2L7 6M17 6L15 2M2 6h20l-2 14H4L2 6z"
                    stroke="#fff"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              )}
              <Text style={styles.addToCartButtonText}>
                {isAddingToCart
                  ? isRTL
                    ? 'جاري الإضافة...'
                    : 'ADDING...'
                  : isSuccessState
                  ? isRTL
                    ? '✓ تم الإضافة'
                    : '✓ ADDED'
                  : editCartItemId
                  ? isRTL
                    ? 'حفظ التغييرات'
                    : 'SAVE CHANGES'
                  : isRTL
                  ? 'أضف إلى السلة'
                  : 'ADD TO CART'}
              </Text>
            </>
          )}
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
      {packageData?.service?._id && (
        <DatePickerModal
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSelectDate={date => {
            setSelectedDate(date);
            setSelectedTime(null);
            setShowDatePicker(false);
            // فتح اختيار الوقت تلقائياً
            setTimeout(() => setShowTimePicker(true), 300);
          }}
          serviceId={packageData.service._id}
          vendorId={packageData.vendor?._id || ''}
        />
      )}

      {/* Time Picker Modal */}
      {packageData?.service?._id && selectedDate && (
        <TimePickerModal
          visible={showTimePicker}
          onClose={() => setShowTimePicker(false)}
          onSelectTime={time => {
            setSelectedTime(time);
            setShowTimePicker(false);
          }}
          serviceId={packageData.service._id}
          selectedDate={selectedDate}
          vendorId={packageData.vendor?._id || ''}
        />
      )}

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </View>
  );
};

export default PackageDetails;
