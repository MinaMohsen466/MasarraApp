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
  Modal,
  Animated,
  Share,
  Dimensions,
  Easing,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
import { addToCart } from '../../services/cart';
import { checkTimeSlotAvailability } from '../../services/api';
import AllReviews from '../../screens/AllReviews';
import {
  getServiceReviews,
  Review,
  ReviewStats,
  ReviewsResponse,
} from '../../services/reviewsApi';
import { Package } from '../../hooks/usePackages';
import { CustomAlert } from '../CustomAlert/CustomAlert';

interface PackageDetailsProps {
  packageId: string;
  onBack?: () => void;
}

const PackageDetails: React.FC<PackageDetailsProps> = ({
  packageId,
  onBack,
}) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const styles = createStyles(SCREEN_WIDTH);
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { data: packageData, isLoading, error } = usePackageDetails(packageId) as {
    data: Package | undefined;
    isLoading: boolean;
    error: any;
  };
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
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
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // CustomAlert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = (title: string, message: string, buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: isRTL ? 'حسناً' : 'OK', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) }],
    });
  };

  // Animation for add to cart
  const [showFlyingIcon, setShowFlyingIcon] = useState(false);
  const [iconStartPosition, setIconStartPosition] = useState({ x: 0, y: 0 });
  const flyingIconTranslate = useRef(
    new Animated.ValueXY({ x: 0, y: 0 }),
  ).current;
  const flyingIconScale = useRef(new Animated.Value(1)).current;
  const addToCartButtonRef = useRef<View>(null);

  useEffect(() => {
    const getToken = async () => {
      const token = await AsyncStorage.getItem('userToken');
      setUserToken(token);
    };
    getToken();
  }, []);

  // Load reviews using React Query for better caching
  const { data: reviewsData } = useQuery<ReviewsResponse | null>({
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
  }, [selectedDate, selectedTime]);

  const checkAvailability = async () => {
    if (
      !selectedDate ||
      !selectedTime ||
      !packageData?.service?._id ||
      !packageData?.vendor?._id
    )
      return;

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

  const handleAddToCart = async () => {
    if (!userToken) {
      showAlert(
        isRTL ? 'تسجيل الدخول مطلوب' : 'Login Required',
        isRTL
          ? 'يرجى تسجيل الدخول لإضافة العناصر إلى السلة'
          : 'Please login to add items to cart'
      );
      return;
    }

    if (!selectedDate || !selectedTime) {
      showAlert(
        isRTL ? 'اختر التاريخ والوقت' : 'Select Date & Time',
        isRTL
          ? 'يرجى اختيار التاريخ والوقت أولاً'
          : 'Please select date and time first'
      );
      return;
    }

    if (!isTimeSlotAvailable) {
      showAlert(
        isRTL ? 'غير متاح' : 'Not Available',
        isRTL ? 'هذا الوقت محجوز بالفعل' : 'This time slot is already booked'
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
            ? (packageData!.totalPrice - packageData!.discountPrice)
            : packageData!.totalPrice,
        image: packageData!.images?.[0] || '',
        vendorName: packageData!.vendor?.displayName || '',
        quantity: 1,
        isPackage: true,
        mainServiceId: packageData!.service._id, // Main limited service for availability checking
        packageName: packageData!.name, // Store package name
        packageNameAr: packageData!.nameAr, // Store package name in Arabic
      });

      // Show success animation
      triggerAddToCartAnimation();
    } catch (err: any) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        err.message ||
        (isRTL ? 'فشل في إضافة الباقة' : 'Failed to add package')
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  const triggerAddToCartAnimation = () => {
    if (addToCartButtonRef.current) {
      addToCartButtonRef.current.measure(
        (_x, _y, width, height, pageX, pageY) => {
          // Calculate start position (center of button)
          const startX = pageX + width / 2;
          const startY = pageY + height / 2;

          // Get actual screen dimensions
          const screenHeight = Dimensions.get('window').height;
          const screenWidth = Dimensions.get('window').width;
          const isTabletDevice = screenWidth >= 600;

          // Bottom navigation bar height calculation (from styles.ts)
          // paddingBottom: 18 (mobile) or 24 (tablet)
          // navItem paddingVertical: 8 (mobile) or 12 (tablet)
          // iconSize: 28 (mobile) or 36 (tablet)
          // Plus View under BottomNav: 20px
          const paddingBottom = isTabletDevice ? 24 : 18;
          const navItemPaddingVertical = isTabletDevice ? 12 : 8;
          const navIconSize = isTabletDevice ? 36 : 28;
          const bottomViewHeight = 20;

          // Distance from screen bottom to icon center
          // Icon center is at: bottomViewHeight + paddingBottom + navItemPaddingVertical + (navIconSize/2)
          const iconCenterFromBottom = bottomViewHeight + paddingBottom + navItemPaddingVertical + (navIconSize / 2);

          // Cart icon is the LAST item in bottom nav (5th item, index 4)
          // Bottom nav has 5 items evenly distributed using space-around
          const navItemWidth = screenWidth / 5;
          const cartIconIndex = 4; // 0-based index (5th item)

          // In RTL, the container uses flexDirection: row-reverse, so cart appears first
          const cartPosition = isRTL ? 0 : cartIconIndex;

          // Calculate X position: center of the nav item
          const targetX = (cartPosition * navItemWidth) + (navItemWidth / 2);

          // Calculate Y position: screen height minus distance from bottom to icon center
          const targetY = screenHeight - iconCenterFromBottom;

          // Calculate icon size (60x60)
          const iconSize = 60;

          // Calculate translation needed from start position
          const translateX = targetX - startX;
          const translateY = targetY - startY;

          // Set start position (center-based)
          setIconStartPosition({
            x: startX - iconSize / 2,
            y: startY - iconSize / 2,
          });
          setShowFlyingIcon(true);

          // Reset animations
          flyingIconTranslate.setValue({ x: 0, y: 0 });
          flyingIconScale.setValue(1);

          // Animate icon flying to cart
          Animated.parallel([
            Animated.timing(flyingIconTranslate, {
              toValue: { x: translateX, y: translateY },
              duration: 600,
              easing: Easing.bezier(0.25, 0.1, 0.25, 1),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(flyingIconScale, {
                toValue: 1.2,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(flyingIconScale, {
                toValue: 0.3,
                duration: 500,
                useNativeDriver: true,
              }),
            ]),
          ]).start(() => {
            // Hide flying icon
            setShowFlyingIcon(false);
          });
        },
      );
    }
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
          <TouchableOpacity
            onPress={onBack}
            style={styles.errorButton}
          >
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
      ? (packageData.totalPrice - packageData.discountPrice)
      : packageData.totalPrice;

  const handleShare = async () => {
    if (!packageData) return;
    try {
      const price = displayPrice.toFixed(3);
      const vendorName = packageData.vendor?.name || '';
      const message = isRTL
        ? `${displayName}\n${vendorName}\n${price} د.ك\n\nشاهد هذه الباقة الرائعة!`
        : `${displayName}\n${vendorName}\nKD ${price}\n\nCheck out this amazing package!`;

      await Share.share({ message, title: displayName });
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
      {/* Header */}
      <View style={styles.header}>
        {/* Left Side */}
        <View style={styles.headerLeft}>
          {!isRTL ? (
            // LTR: Back button on left
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              style={styles.headerButton}
            >
              <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 6l-6 6 6 6"
                  stroke={colors.primary}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          ) : (
            // RTL: Wishlist & Share on left
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleToggleWishlist}
                style={styles.headerButton}
              >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    fill={isSaved ? '#E8837A' : 'none'}
                    stroke={isSaved ? '#E8837A' : colors.textSecondary}
                    strokeWidth={isSaved ? 0 : 2}
                  />
                </Svg>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleShare}
                style={styles.headerButton}
              >
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
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
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              style={styles.headerButton}
            >
              <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 6l6 6-6 6"
                  stroke={colors.primary}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          ) : (
            // LTR: Wishlist & Share on right
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleToggleWishlist}
                style={styles.headerButton}
              >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    fill={isSaved ? '#E8837A' : 'none'}
                    stroke={isSaved ? '#E8837A' : colors.textSecondary}
                    strokeWidth={isSaved ? 0 : 2}
                  />
                </Svg>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleShare}
                style={styles.headerButton}
              >
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
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
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              SCREEN_WIDTH >= 600 ? insets.bottom + 150 : insets.bottom + 180,
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
            {packageData.discountPrice > 0 && (
              <View
                style={styles.discountBadge}
              >
                <Text
                  style={styles.discountText}
                >
                  {Math.round(
                    (packageData.discountPrice / packageData.totalPrice) * 100
                  )}
                  % OFF
                </Text>
              </View>
            )}
            {packageData.images.length > 1 && (
              <View
                style={styles.paginationContainer}
              >
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

            <View
              style={styles.packageBadgeContainer}
            >
              <Text
                style={styles.packageBadgeText}
              >
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
                <Text
                  style={styles.originalPrice}
                >
                  {packageData.totalPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                </Text>
              )}
              <Text
                style={styles.currentPrice}
              >
                {displayPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
              </Text>
            </View>
            <View
              style={[
                styles.ratingContainer,
                isRTL && { flexDirection: 'row-reverse' },
              ]}
            >
              <Text
                style={styles.ratingValue}
              >
                {reviewStats ? reviewStats.averageRating.toFixed(1) : '0.0'}
              </Text>
              <Text style={styles.ratingStar}>★</Text>
              <Text
                style={styles.ratingCount}
              >
                ({reviewStats ? reviewStats.totalRatings : 0})
              </Text>
            </View>
          </View>

          {/* Date & Time Selection */}
          <View
            style={styles.dateTimeSection}
          >
            <Text
              style={styles.dateTimeTitle}
            >
              {isRTL ? 'اختر اليوم والوقت' : 'SELECT EVENT DAY & TIME'}
            </Text>

            <View
              style={styles.dateTimeInputsContainer}
            >
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
                  <View
                    style={styles.dateTimeIcon}
                  >
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
                  <View
                    style={styles.dateTimeIcon}
                  >
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
                <Text
                  style={styles.availabilityText}
                >
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
          <View
            style={styles.divider}
          />

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
                  <View
                    style={styles.serviceCardExpanded}
                  >
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
                        <View
                          style={styles.serviceCardExpanded}
                        >
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
          {reviewStats && reviewStats.totalRatings > 0 && (
            <View style={styles.reviewsContainer}>
              <Text
                style={[
                  styles.sectionTitle,
                  { textAlign: isRTL ? 'right' : 'left', marginBottom: 16 },
                ]}
              >
                {isRTL ? 'التقييمات' : 'Reviews'} ({reviewStats.totalRatings})
              </Text>

              {/* Review Stats */}
              <View
                style={[
                  styles.reviewStatsContainer,
                  isRTL && { flexDirection: 'row-reverse' },
                ]}
              >
                <View
                  style={[
                    styles.reviewStatsLeft,
                    isRTL && {
                      paddingRight: 0,
                      paddingLeft: 20,
                      borderRightWidth: 0,
                      borderLeftWidth: 1,
                    },
                  ]}
                >
                  <Text
                    style={styles.reviewStatsAverageRating}
                  >
                    {reviewStats.averageRating.toFixed(1)}
                  </Text>
                  <Text
                    style={styles.reviewStatsStars}
                  >
                    {'★'.repeat(Math.round(reviewStats.averageRating))}
                    {'☆'.repeat(5 - Math.round(reviewStats.averageRating))}
                  </Text>
                  <Text style={styles.reviewStatsTotalText}>
                    {reviewStats.totalRatings} {isRTL ? 'تقييم' : 'reviews'}
                  </Text>
                </View>

                {/* Rating Distribution */}
                <View
                  style={[
                    styles.reviewStatsRight,
                    isRTL && { paddingLeft: 0, paddingRight: 20 },
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
                          styles.reviewRatingRow,
                          isRTL && { flexDirection: 'row-reverse' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.reviewRatingLabel,
                            { width: 30, textAlign: isRTL ? 'left' : 'right' },
                          ]}
                        >
                          {star}★
                        </Text>
                        <View
                          style={styles.reviewRatingBar}
                        >
                          <View
                            style={[
                              styles.reviewRatingFill,
                              { width: `${percentage}%` },
                            ]}
                          />
                        </View>
                        <Text
                          style={styles.reviewRatingLabel}
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
                <View>
                  {reviews.slice(0, 2).map(review => (
                    <View
                      key={review._id}
                      style={styles.reviewCard}
                    >
                      <View
                        style={[
                          styles.reviewHeader,
                          isRTL && { flexDirection: 'row-reverse' },
                        ]}
                      >
                        <View
                          style={[
                            styles.reviewerInfo,
                            isRTL && { flexDirection: 'row-reverse' },
                          ]}
                        >
                          {review.user.profilePicture ? (
                            <Image
                              source={{
                                uri: getImageUrl(review.user.profilePicture),
                              }}
                              style={[
                                styles.userAvatar,
                                isRTL && { marginRight: 0, marginLeft: 12 },
                              ]}
                            />
                          ) : (
                            <View
                              style={[
                                styles.userAvatarPlaceholder,
                                isRTL && { marginRight: 0, marginLeft: 12 },
                              ]}
                            >
                              <Text
                                style={styles.userAvatarText}
                              >
                                {review.user.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <View style={styles.serviceCardContent}>
                            <View
                              style={styles.userInfoRow}
                            >
                              <Text
                                style={styles.userName}
                                numberOfLines={1}
                              >
                                {review.user.name}
                              </Text>
                              <Text
                                style={styles.dateSeparator}
                              >
                                •
                              </Text>
                              <Text style={styles.reviewDateText}>
                                {new Date(review.createdAt).toLocaleDateString(
                                  isRTL ? 'ar-EG' : 'en-US',
                                  { month: 'short', day: 'numeric' },
                                )}
                              </Text>
                            </View>
                            {review.isVerifiedPurchase && (
                              <Text
                                style={styles.verifiedBadge}
                              >
                                ✓ {isRTL ? 'مشترٍ موثق' : 'Verified'}
                              </Text>
                            )}
                          </View>
                        </View>
                        <View
                          style={styles.ratingContainer}
                        >
                          <Text
                            style={[
                              styles.reviewRatingValue,
                              { fontSize: 13 },
                            ]}
                          >
                            {review.rating.toFixed(1)} ★
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.reviewComment,
                          { textAlign: isRTL ? 'right' : 'left' },
                        ]}
                      >
                        {review.comment}
                      </Text>
                      {review.vendorReply && (
                        <View
                          style={styles.vendorReplyContainer}
                        >
                          <Text
                            style={[
                              styles.vendorReplyTitle,
                              { textAlign: isRTL ? 'right' : 'left' },
                            ]}
                          >
                            {isRTL ? 'رد البائع:' : 'Vendor Reply:'}
                          </Text>
                          <Text
                            style={[
                              styles.vendorReplyText,
                              { textAlign: isRTL ? 'right' : 'left' },
                            ]}
                          >
                            {review.vendorReply.text}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}

                  {/* Show More Reviews Button */}
                  {reviews.length > 2 && (
                    <TouchableOpacity
                      style={[
                        styles.showMoreButton,
                        isRTL && { flexDirection: 'row-reverse' },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => setShowAllReviewsModal(true)}
                    >
                      <Text
                        style={styles.showMoreText}
                      >
                        {isRTL
                          ? `عرض جميع التقييمات (${reviews.length})`
                          : `Show All Reviews (${reviews.length})`}
                      </Text>
                      <Svg
                        width={20}
                        height={20}
                        viewBox="0 0 24 24"
                        fill="none"
                        style={[
                          styles.showMoreIcon,
                          isRTL && {
                            marginLeft: 0,
                            marginRight: 8,
                            transform: [{ rotate: '180deg' }],
                          },
                        ]}
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
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* All Reviews Modal */}
      <Modal
        visible={showAllReviewsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAllReviewsModal(false)}
      >
        {reviewStats && reviews.length > 0 && (
          <AllReviews
            reviews={reviews}
            reviewStats={reviewStats}
            serviceName={displayName}
            onBack={() => setShowAllReviewsModal(false)}
          />
        )}
      </Modal>

      {/* Add to Cart Button */}
      <View
        style={[
          styles.bottomActions,
          { paddingBottom: Math.max(insets.bottom + 34, 10) },
        ]}
      >
        <View style={styles.bottomActionsInner}>
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
              (!selectedDate || !selectedTime || !isTimeSlotAvailable) &&
              styles.addToCartButtonDisabled,
            ]}
            activeOpacity={0.8}
          >
            {isAddingToCart ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Svg
                  width={22}
                  height={22}
                  viewBox="0 0 24 24"
                  fill="none"
                  style={styles.addToCartIcon}
                >
                  <Path
                    d="M9 2L7 6M17 6L15 2M2 6h20l-2 14H4L2 6z"
                    stroke="#fff"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text
                  style={styles.addToCartButtonText}
                >
                  {isAddingToCart
                    ? isRTL
                      ? 'جاري الإضافة...'
                      : 'ADDING...'
                    : isRTL
                      ? 'أضف إلى السلة'
                      : 'ADD TO CART'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.85}
            onPress={onBack}
          >
            <Text
              style={styles.backButtonText}
            >
              {isRTL ? 'رجوع' : 'BACK'}
            </Text>
          </TouchableOpacity>
        </View>
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

      {/* Flying Cart Icon Animation */}
      {showFlyingIcon && (
        <Animated.View
          style={{
            position: 'absolute',
            width: 60,
            height: 60,
            left: iconStartPosition.x,
            top: iconStartPosition.y,
            transform: [
              { translateX: flyingIconTranslate.x },
              { translateY: flyingIconTranslate.y },
              { scale: flyingIconScale },
            ],
            zIndex: 9999,
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              backgroundColor: colors.primary,
              borderRadius: 30,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 20,
              borderWidth: 2,
              borderColor: '#FFFFFF',
            }}
          >
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 2L7 6M17 6L15 2M2 6h20l-2 14H4L2 6z"
                stroke="#FFFFFF"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </View>
        </Animated.View>
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
