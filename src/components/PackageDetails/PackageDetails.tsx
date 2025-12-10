import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions, Alert, Modal, Animated, Share } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePackageDetails } from '../../hooks/usePackages';
import { useLanguage } from '../../contexts/LanguageContext';
import { getImageUrl } from '../../services/api';
import { toggleWishlist, isWishlisted, WishlistItem } from '../../services/wishlist';
import { colors } from '../../constants/colors';
import DatePickerModal from '../DatePickerModal/DatePickerModal';
import TimePickerModal from '../TimePickerModal/TimePickerModal';
import { addToCart } from '../../services/cart';
import { checkTimeSlotAvailability } from '../../services/api';
import AllReviews from '../../screens/AllReviews';
import { getServiceReviews, Review, ReviewStats } from '../../services/reviewsApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PackageDetailsProps {
  packageId: string;
  onBack?: () => void;
}

const PackageDetails: React.FC<PackageDetailsProps> = ({ packageId, onBack }) => {
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { data: packageData, isLoading, error } = usePackageDetails(packageId);
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
  const [expandedAdditionalServices, setExpandedAdditionalServices] = useState<{[key: number]: boolean}>({});

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Animation for add to cart
  const [showFlyingIcon, setShowFlyingIcon] = useState(false);
  const [iconStartPosition, setIconStartPosition] = useState({ x: 0, y: 0 });
  const flyingIconTranslate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const flyingIconScale = useRef(new Animated.Value(1)).current;
  const addToCartButtonRef = useRef<View>(null);

  useEffect(() => {
    const getToken = async () => {
      const token = await AsyncStorage.getItem('userToken');
      setUserToken(token);
    };
    getToken();
  }, []);

  // Load reviews when package's main service changes
  useEffect(() => {
    const loadReviews = async () => {
      if (!packageData?.service?._id) return;
      
      try {
        setLoadingReviews(true);
        const reviewsData = await getServiceReviews(packageData.service._id, 1, 10);
        setReviews(reviewsData.reviews);
        setReviewStats(reviewsData.stats);
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    };
    
    loadReviews();
  }, [packageData?.service?._id]);

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
    if (!selectedDate || !selectedTime || !packageData?.service?._id || !packageData?.vendor?._id) return;
    
    setCheckingAvailability(true);
    try {
      const result = await checkTimeSlotAvailability(
        packageData.service._id,
        packageData.vendor._id,
        selectedDate
      );
      // Find the slot matching selectedTime and check availability
      const timeSlot = result.find((slot: any) => slot.timeSlot === selectedTime);
      setIsTimeSlotAvailable(timeSlot ? timeSlot.available : false);
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleAddToCart = async () => {
    if (!userToken) {
      Alert.alert(
        isRTL ? 'تسجيل الدخول مطلوب' : 'Login Required',
        isRTL ? 'يرجى تسجيل الدخول لإضافة العناصر إلى السلة' : 'Please login to add items to cart'
      );
      return;
    }

    if (!selectedDate || !selectedTime) {
      Alert.alert(
        isRTL ? 'اختر التاريخ والوقت' : 'Select Date & Time',
        isRTL ? 'يرجى اختيار التاريخ والوقت أولاً' : 'Please select date and time first'
      );
      return;
    }

    if (!isTimeSlotAvailable) {
      Alert.alert(
        isRTL ? 'غير متاح' : 'Not Available',
        isRTL ? 'هذا الوقت محجوز بالفعل' : 'This time slot is already booked'
      );
      return;
    }

    setIsAddingToCart(true);
    try {
      // Parse time from selectedTime string format (e.g., "14:00 - 15:00")
      const timeMatch = selectedTime.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
      let slotStart: Date | string = selectedTime;
      let slotEnd: Date | string = selectedTime;
      
      if (timeMatch) {
        const startHours = parseInt(timeMatch[1]);
        const startMinutes = parseInt(timeMatch[2]);
        const endHours = parseInt(timeMatch[3]);
        const endMinutes = parseInt(timeMatch[4]);

        // Convert Kuwait time to UTC (subtract 3 hours)
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const day = selectedDate.getDate();
        
        const slotStartUTC = Date.UTC(year, month, day, startHours - 3, startMinutes, 0, 0);
        const slotEndUTC = Date.UTC(year, month, day, endHours - 3, endMinutes, 0, 0);
        
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
        price: packageData!.discountPrice > 0 ? packageData!.discountPrice : packageData!.totalPrice,
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
    } catch (error: any) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        error.message || (isRTL ? 'فشل في إضافة الباقة' : 'Failed to add package')
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  const triggerAddToCartAnimation = () => {
    if (addToCartButtonRef.current) {
      addToCartButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        // Calculate start position (center of button)
        const startX = pageX + width / 2;
        const startY = pageY + height / 2;
        
        // Calculate target position (bottom navigation cart icon)
        const screenHeight = Dimensions.get('window').height;
        const screenWidth = Dimensions.get('window').width;
        
        // Cart icon position changes based on text direction
        // In RTL (Arabic): cart is on the LEFT side of screen
        // In LTR (English): cart is on the RIGHT side of screen
        const targetX = isRTL ? 50 : screenWidth - 50;  // Left in RTL, Right in LTR
        const targetY = screenHeight - 65;  // Bottom tab bar height ~65px
        
        // Calculate icon size (30x30)
        const iconSize = 30;
        
        // Calculate translation needed from start position
        const translateX = (targetX - iconSize / 2) - (startX - iconSize / 2);
        const translateY = (targetY - iconSize / 2) - (startY - iconSize / 2);
        
        // Set start position (center-based)
        setIconStartPosition({ x: startX - iconSize / 2, y: startY - iconSize / 2 });
        
        // Reset animations
        flyingIconTranslate.setValue({ x: 0, y: 0 });
        flyingIconScale.setValue(1);
        
        setShowFlyingIcon(true);
        
        // Animate icon flying to cart
        Animated.parallel([
          Animated.timing(flyingIconTranslate, {
            toValue: { x: translateX, y: translateY },
            duration: 600,
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
          setShowFlyingIcon(false);
          flyingIconTranslate.setValue({ x: 0, y: 0 });
          flyingIconScale.setValue(1);
        });
      });
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !packageData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 16, color: '#999' }}>
          {isRTL ? 'فشل في تحميل تفاصيل الباقة' : 'Failed to load package details'}
        </Text>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={{
              marginTop: 20,
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: colors.primary,
              borderRadius: 8,
            }}>
            <Text style={{ color: '#fff', fontSize: 16 }}>
              {isRTL ? 'رجوع' : 'Go Back'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const displayName = isRTL ? packageData.nameAr : packageData.name;
  const displayDescription = isRTL ? packageData.descriptionAr : packageData.description;
  const displayPrice = packageData.discountPrice > 0 ? packageData.discountPrice : packageData.totalPrice;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 0,
          backgroundColor: colors.background,
          zIndex: 50,
        }}>
        {/* Left side - Back button and Share/Wishlist buttons for RTL */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: isRTL ? 'flex-start' : 'flex-end', gap: 14 }}>
          {isRTL && (
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={async () => {
                  if (!packageData) return;
                  try {
                    const price = displayPrice.toFixed(3);
                    const vendorName = packageData.vendor?.name || '';
                    
                    const message = isRTL
                      ? `${displayName}\n${vendorName}\n${price} د.ك\n\nشاهد هذه الباقة الرائعة!`
                      : `${displayName}\n${vendorName}\nKD ${price}\n\nCheck out this amazing package!`;

                    const result = await Share.share({
                      message: message,
                      title: displayName,
                    });

                    if (result.action === Share.sharedAction) {
                      // Share was successful
                    } else if (result.action === Share.dismissedAction) {
                      // Share was dismissed
                    }
                  } catch (error: any) {
                    Alert.alert(
                      isRTL ? 'خطأ' : 'Error',
                      error.message || (isRTL ? 'فشلت المشاركة' : 'Failed to share')
                    );
                  }
                }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"
                    stroke={colors.primary}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M16 6l-4-4-4 4"
                    stroke={colors.primary}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M12 2v14"
                    stroke={colors.primary}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
              
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={async () => {
                  if (!packageData) return;
                  const img = packageData.images && packageData.images.length > 0 ? getImageUrl(packageData.images[0]) : undefined;
                  const item: WishlistItem = { _id: packageData._id, name: displayName, image: img, price: displayPrice };
                  await toggleWishlist(item);
                  const now = await isWishlisted(packageData._id);
                  setIsSaved(now);
                }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M20.8 7.6a4.8 4.8 0 0 0-6.8 0L12 9.6l-2-2a4.8 4.8 0 1 0-6.8 6.8L12 22l8.8-7.6a4.8 4.8 0 0 0 0-6.8z"
                    stroke={isSaved ? colors.primary : '#7FBFB6'}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={isSaved ? colors.primary : 'none'}
                  />
                </Svg>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Center - Back button */}
        <View style={{ position: 'absolute', left: isRTL ? 'auto' : 10, right: isRTL ? 10 : 'auto' }}>
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={{
              width: 52,
              height: 52,
              borderRadius: 0,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
              <Path
                d={isRTL ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"}
                stroke={colors.primary}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Right side - Share/Wishlist buttons for LTR */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 14 }}>
          {!isRTL && (
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={async () => {
                  if (!packageData) return;
                  const img = packageData.images && packageData.images.length > 0 ? getImageUrl(packageData.images[0]) : undefined;
                  const item: WishlistItem = { _id: packageData._id, name: displayName, image: img, price: displayPrice };
                  await toggleWishlist(item);
                  const now = await isWishlisted(packageData._id);
                  setIsSaved(now);
                }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M20.8 7.6a4.8 4.8 0 0 0-6.8 0L12 9.6l-2-2a4.8 4.8 0 1 0-6.8 6.8L12 22l8.8-7.6a4.8 4.8 0 0 0 0-6.8z"
                    stroke={isSaved ? colors.primary : '#7FBFB6'}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={isSaved ? colors.primary : 'none'}
                  />
                </Svg>
              </TouchableOpacity>
              
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={async () => {
                  if (!packageData) return;
                  try {
                    const price = displayPrice.toFixed(3);
                    const vendorName = packageData.vendor?.name || '';
                    
                    const message = isRTL
                      ? `${displayName}\n${vendorName}\n${price} د.ك\n\nشاهد هذه الباقة الرائعة!`
                      : `${displayName}\n${vendorName}\nKD ${price}\n\nCheck out this amazing package!`;

                    const result = await Share.share({
                      message: message,
                      title: displayName,
                    });

                    if (result.action === Share.sharedAction) {
                      // Share was successful
                    } else if (result.action === Share.dismissedAction) {
                      // Share was dismissed
                    }
                  } catch (error: any) {
                    Alert.alert(
                      isRTL ? 'خطأ' : 'Error',
                      error.message || (isRTL ? 'فشلت المشاركة' : 'Failed to share')
                    );
                  }
                }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"
                    stroke={colors.primary}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M16 6l-4-4-4 4"
                    stroke={colors.primary}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M12 2v14"
                    stroke={colors.primary}
                    strokeWidth={1.8}
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
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 56, paddingBottom: SCREEN_WIDTH >= 600 ? insets.bottom + 280 : insets.bottom + 180 }}>
        {/* Image Gallery */}
        {packageData.images && packageData.images.length > 0 && (
          <View>
            <Image
              source={{ uri: getImageUrl(packageData.images[currentImageIndex]) }}
              style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.75 }}
              resizeMode="cover"
            />
            {packageData.discountPrice > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  backgroundColor: '#ff3b30',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
                  {Math.round(((packageData.totalPrice - packageData.discountPrice) / packageData.totalPrice) * 100)}% OFF
                </Text>
              </View>
            )}
            {packageData.images.length > 1 && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 16,
                  left: 0,
                  right: 0,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}>
                {packageData.images.map((_: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setCurrentImageIndex(index)}
                    style={{
                      width: index === currentImageIndex ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: index === currentImageIndex ? colors.primary : 'rgba(255,255,255,0.5)',
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Package Info */}
        <View style={{ padding: 20 }}>
          {/* Package Badge */}
          <View
            style={{
              alignSelf: isRTL ? 'flex-end' : 'flex-start',
              backgroundColor: colors.primary + '15',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              marginBottom: 12,
            }}>
            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 12 }}>
              {isRTL ? 'باقة' : 'PACKAGE'}
            </Text>
          </View>

          {/* Package Name */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#333',
              textAlign: isRTL ? 'right' : 'left',
              marginBottom: 12,
            }}>
            {displayName}
          </Text>

          {/* Vendor Name */}
          {packageData.vendor && (
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                marginBottom: 16,
              }}>
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
                style={{
                  fontSize: 14,
                  color: '#666',
                  marginLeft: isRTL ? 0 : 8,
                  marginRight: isRTL ? 8 : 0,
                }}>
                {packageData.vendor.name}
              </Text>
            </View>
          )}

          {/* Price & Rating */}
          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}>
            <View style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 12,
            }}>
              {packageData.discountPrice > 0 && (
                <Text
                  style={{
                    fontSize: 14,
                    color: '#999',
                    textDecorationLine: 'line-through',
                  }}>
                  {packageData.totalPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                </Text>
              )}
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: colors.primary,
                }}>
                {displayPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
              </Text>
            </View>
            {reviewStats && reviewStats.totalRatings > 0 && (
              <View style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                backgroundColor: colors.primaryLight,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                gap: 4,
              }}>
                <Text style={{ fontSize: 16, color: colors.primary, fontWeight: 'bold' }}>
                  {reviewStats.averageRating.toFixed(1)}
                </Text>
                <Text style={{ fontSize: 14, color: colors.primary }}>★</Text>
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '500' }}>
                  ({reviewStats.totalRatings})
                </Text>
              </View>
            )}
          </View>

          {/* Date & Time Selection */}
          <View style={{ 
            backgroundColor: '#F9F9F9',
            borderRadius: 8,
            paddingHorizontal: 20,
            paddingVertical: 14,
            marginTop: 0,
            marginBottom: 20,
          }}>
            <Text style={{
              alignSelf: 'center',
              backgroundColor: colors.background,
              color: colors.primary,
              fontSize: 12,
              fontWeight: '700',
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 12,
              marginBottom: 12,
              letterSpacing: 0.6,
            }}>
              {isRTL ? 'اختر اليوم والوقت' : 'SELECT EVENT DAY & TIME'}
            </Text>

            <View style={{ width: '100%', backgroundColor: 'transparent', borderRadius: 8, paddingBottom: 6 }}>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  marginBottom: 10,
                }}>
                <View style={{ marginRight: isRTL ? 0 : 14, marginLeft: isRTL ? 14 : 0 }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    borderWidth: 1.4,
                    borderColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
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
                <Text style={{
                  flex: 1,
                  fontSize: 15,
                  color: colors.textDark,
                  fontWeight: '500',
                  textAlign: isRTL ? 'right' : 'left',
                }}>
                  {selectedDate
                    ? selectedDate.toLocaleDateString(isRTL ? 'ar-KW' : 'en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })
                    : isRTL ? 'اختر التاريخ' : 'Select Date'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => selectedDate && setShowTimePicker(true)}
                disabled={!selectedDate}
                activeOpacity={0.8}
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  marginBottom: 10,
                  opacity: selectedDate ? 1 : 0.5,
                }}>
                <View style={{ marginRight: isRTL ? 0 : 14, marginLeft: isRTL ? 14 : 0 }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    borderWidth: 1.4,
                    borderColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
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
                <Text style={{
                  flex: 1,
                  fontSize: 15,
                  color: colors.textDark,
                  fontWeight: '500',
                  textAlign: isRTL ? 'right' : 'left',
                }}>
                  {selectedTime || (isRTL ? 'اختر الوقت' : 'Select Time')}
                </Text>
                {checkingAvailability && <ActivityIndicator size="small" color={colors.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  alignSelf: 'center',
                  backgroundColor: colors.primaryDark,
                  borderRadius: 20,
                  paddingVertical: 10,
                  paddingHorizontal: 22,
                  marginTop: 4,
                  opacity: (!selectedDate || !selectedTime || !isTimeSlotAvailable) ? 0.5 : 1,
                }}
                activeOpacity={0.85}
                disabled={!selectedDate || !selectedTime || !isTimeSlotAvailable}>
                <Text style={{
                  color: colors.textWhite,
                  fontSize: 14,
                  fontWeight: '700',
                }}>
                  {checkingAvailability
                    ? (isRTL ? 'جاري التحقق...' : 'Checking...')
                    : !isTimeSlotAvailable && selectedDate && selectedTime
                    ? (isRTL ? '✗ غير متاح' : '✗ Not Available')
                    : selectedDate && selectedTime
                    ? (isRTL ? '✓ متاح' : '✓ Available')
                    : (isRTL ? 'اختر التاريخ والوقت' : 'Select Date & Time')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {selectedTime && !isTimeSlotAvailable && (
            <Text style={{
              color: '#ff3b30',
              fontSize: 14,
              marginTop: 8,
              textAlign: isRTL ? 'right' : 'left',
            }}>
              {isRTL ? 'هذا الوقت محجوز بالفعل' : 'This time slot is already booked'}
            </Text>
          )}

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: '#e0e0e0', marginVertical: 20 }} />

          {/* Description */}
          {displayDescription && (
            <>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: '#333',
                  textAlign: isRTL ? 'right' : 'left',
                  marginBottom: 8,
                }}>
                {isRTL ? 'الوصف' : 'Description'}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#666',
                  lineHeight: 22,
                  textAlign: isRTL ? 'right' : 'left',
                  marginBottom: 20,
                }}>
                {displayDescription}
              </Text>
            </>
          )}

          {/* Main Service */}
          {packageData.service && (
            <>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: '#333',
                  textAlign: isRTL ? 'right' : 'left',
                  marginBottom: 12,
                }}>
                {isRTL ? 'الخدمة الرئيسية' : 'Main Service'}
              </Text>
              <TouchableOpacity
                onPress={() => setExpandedMainService(!expandedMainService)}
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 20,
                }}>
                <View style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: '#333',
                        textAlign: isRTL ? 'right' : 'left',
                        marginBottom: 4,
                      }}>
                      {packageData.service.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.primary,
                        textAlign: isRTL ? 'right' : 'left',
                      }}>
                      {packageData.customPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                    </Text>
                  </View>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d={expandedMainService ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}
                      stroke={colors.primary}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                
                {expandedMainService && (
                  <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e0e0e0' }}>
                    {packageData.service.description && (
                      <Text style={{
                        fontSize: 14,
                        color: '#666',
                        lineHeight: 20,
                        textAlign: isRTL ? 'right' : 'left',
                        marginBottom: 12,
                      }}>
                        {packageData.service.description}
                      </Text>
                    )}
                    {packageData.service.images && packageData.service.images.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {packageData.service.images.map((img: string, idx: number) => (
                          <Image
                            key={idx}
                            source={{ uri: getImageUrl(img) }}
                            style={{
                              width: 100,
                              height: 100,
                              borderRadius: 8,
                              marginRight: 8,
                            }}
                            resizeMode="cover"
                          />
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Additional Services */}
          {packageData.additionalServices && packageData.additionalServices.length > 0 && (
            <>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: '#333',
                  textAlign: isRTL ? 'right' : 'left',
                  marginBottom: 12,
                }}>
                {isRTL ? 'خدمات إضافية' : 'Additional Services'}
              </Text>
              {packageData.additionalServices.map((item: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setExpandedAdditionalServices(prev => ({ ...prev, [index]: !prev[index] }))}
                  style={{
                    backgroundColor: '#f5f5f5',
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}>
                  <View style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#333',
                          textAlign: isRTL ? 'right' : 'left',
                          marginBottom: 4,
                        }}>
                        {item.service?.name || 'Service'}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: colors.primary,
                          textAlign: isRTL ? 'right' : 'left',
                        }}>
                        {item.customPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                      </Text>
                    </View>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path
                        d={expandedAdditionalServices[index] ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}
                        stroke={colors.primary}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                  
                  {expandedAdditionalServices[index] && (
                    <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e0e0e0' }}>
                      {item.service?.description && (
                        <Text style={{
                          fontSize: 14,
                          color: '#666',
                          lineHeight: 20,
                          textAlign: isRTL ? 'right' : 'left',
                          marginBottom: 12,
                        }}>
                          {item.service.description}
                        </Text>
                      )}
                      {item.service?.images && item.service.images.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {item.service.images.map((img: string, idx: number) => (
                            <Image
                              key={idx}
                              source={{ uri: getImageUrl(img) }}
                              style={{
                                width: 100,
                                height: 100,
                                borderRadius: 8,
                                marginRight: 8,
                              }}
                              resizeMode="cover"
                            />
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Reviews Section */}
          {reviewStats && reviewStats.totalRatings > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: '#333',
                  textAlign: isRTL ? 'right' : 'left',
                  marginBottom: 16,
                }}>
                {isRTL ? 'التقييمات' : 'Reviews'} ({reviewStats.totalRatings})
              </Text>
              
              {/* Review Stats */}
              <View style={{
                backgroundColor: '#f9f9f9',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                flexDirection: isRTL ? 'row-reverse' : 'row',
              }}>
                <View style={{
                  alignItems: 'center',
                  paddingRight: isRTL ? 0 : 20,
                  paddingLeft: isRTL ? 20 : 0,
                  borderRightWidth: isRTL ? 0 : 1,
                  borderLeftWidth: isRTL ? 1 : 0,
                  borderColor: '#e0e0e0',
                }}>
                  <Text style={{ fontSize: 36, fontWeight: 'bold', color: colors.primary }}>
                    {reviewStats.averageRating.toFixed(1)}
                  </Text>
                  <Text style={{ fontSize: 18, color: colors.primary, marginVertical: 4 }}>
                    {'★'.repeat(Math.round(reviewStats.averageRating))}
                    {'☆'.repeat(5 - Math.round(reviewStats.averageRating))}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    {reviewStats.totalRatings} {isRTL ? 'تقييم' : 'reviews'}
                  </Text>
                </View>
                
                {/* Rating Distribution */}
                <View style={{ flex: 1, paddingLeft: isRTL ? 0 : 20, paddingRight: isRTL ? 20 : 0 }}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviewStats.ratingDistribution[star as keyof typeof reviewStats.ratingDistribution] || 0;
                    const percentage = reviewStats.totalRatings > 0 ? (count / reviewStats.totalRatings) * 100 : 0;
                    return (
                      <View key={star} style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ fontSize: 12, color: '#666', width: 30, textAlign: isRTL ? 'left' : 'right' }}>
                          {star}★
                        </Text>
                        <View style={{
                          flex: 1,
                          height: 6,
                          backgroundColor: '#e0e0e0',
                          borderRadius: 3,
                          marginHorizontal: 8,
                          overflow: 'hidden',
                        }}>
                          <View style={{
                            width: `${percentage}%`,
                            height: '100%',
                            backgroundColor: colors.primary,
                          }} />
                        </View>
                        <Text style={{ fontSize: 12, color: '#666', width: 25 }}>
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
                  {reviews.slice(0, 2).map((review) => (
                    <View key={review._id} style={{
                      backgroundColor: '#fff',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: '#e8e8e8',
                    }}>
                      <View style={{
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 12,
                      }}>
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', flex: 1 }}>
                          {review.user.profilePicture ? (
                            <Image 
                              source={{ uri: getImageUrl(review.user.profilePicture) }}
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                marginRight: isRTL ? 0 : 12,
                                marginLeft: isRTL ? 12 : 0,
                              }}
                            />
                          ) : (
                            <View style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: colors.primary,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: isRTL ? 0 : 12,
                              marginLeft: isRTL ? 12 : 0,
                            }}>
                              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                                {review.user.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                              <Text style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: '#333',
                                maxWidth: '50%',
                              }} numberOfLines={1}>
                                {review.user.name}
                              </Text>
                              <Text style={{ fontSize: 12, color: '#999', marginHorizontal: 6 }}>•</Text>
                              <Text style={{ fontSize: 12, color: '#999' }}>
                                {new Date(review.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                              </Text>
                            </View>
                            {review.isVerifiedPurchase && (
                              <Text style={{ fontSize: 11, color: colors.primary, marginTop: 2 }}>
                                ✓ {isRTL ? 'مشترٍ موثق' : 'Verified'}
                              </Text>
                            )}
                          </View>
                        </View>
                        <View style={{
                          backgroundColor: colors.primaryLight,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                        }}>
                          <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>
                            {review.rating.toFixed(1)} ★
                          </Text>
                        </View>
                      </View>
                      <Text style={{
                        fontSize: 14,
                        color: '#666',
                        lineHeight: 20,
                        textAlign: isRTL ? 'right' : 'left',
                      }}>
                        {review.comment}
                      </Text>
                      {review.vendorReply && (
                        <View style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTopWidth: 1,
                          borderTopColor: '#f0f0f0',
                        }}>
                          <Text style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: colors.primary,
                            marginBottom: 4,
                            textAlign: isRTL ? 'right' : 'left',
                          }}>
                            {isRTL ? 'رد البائع:' : 'Vendor Reply:'}
                          </Text>
                          <Text style={{
                            fontSize: 13,
                            color: '#666',
                            lineHeight: 18,
                            textAlign: isRTL ? 'right' : 'left',
                          }}>
                            {review.vendorReply.text}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                  
                  {/* Show More Reviews Button */}
                  {reviews.length > 2 && (
                    <TouchableOpacity 
                      style={{
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 12,
                        backgroundColor: '#f9f9f9',
                        borderRadius: 8,
                        marginTop: 8,
                      }}
                      activeOpacity={0.7}
                      onPress={() => setShowAllReviewsModal(true)}>
                      <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>
                        {isRTL ? `عرض جميع التقييمات (${reviews.length})` : `Show All Reviews (${reviews.length})`}
                      </Text>
                      <Svg 
                        width={20} 
                        height={20} 
                        viewBox="0 0 24 24" 
                        fill="none"
                        style={{ 
                          marginLeft: isRTL ? 0 : 8,
                          marginRight: isRTL ? 8 : 0,
                          transform: [{ rotate: isRTL ? '180deg' : '0deg' }],
                        }}>
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
        onRequestClose={() => setShowAllReviewsModal(false)}>
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
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#F8F8F8',
          paddingHorizontal: 20,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: '#E8E8E8',
        }}>
        <TouchableOpacity
          ref={addToCartButtonRef}
          onPress={handleAddToCart}
          disabled={isAddingToCart || !selectedDate || !selectedTime || !isTimeSlotAvailable}
          style={{
            backgroundColor: (!selectedDate || !selectedTime || !isTimeSlotAvailable) ? '#ccc' : '#2D6A5F',
            borderRadius: 12,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
          }}
          activeOpacity={0.8}>
          {isAddingToCart ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                <Path
                  d="M9 2L7 6M17 6L15 2M2 6h20l-2 14H4L2 6z"
                  stroke="#fff"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 }}>
                {isAddingToCart 
                  ? (isRTL ? 'جاري الإضافة...' : 'ADDING...')
                  : (isRTL ? 'أضف إلى السلة' : 'ADD TO CART')
                }
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: 'transparent',
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: colors.primary,
            marginBottom: Math.max(insets.bottom + 34, 10),
          }}
          activeOpacity={0.85}
          onPress={onBack}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 }}>
            {isRTL ? 'رجوع' : 'BACK'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {packageData?.service?._id && (
        <DatePickerModal
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSelectDate={(date) => {
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
          onSelectTime={(time) => {
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
            left: iconStartPosition.x,
            top: iconStartPosition.y,
            zIndex: 9999,
            transform: [
              { translateX: flyingIconTranslate.x },
              { translateY: flyingIconTranslate.y },
              { scale: flyingIconScale },
            ],
          }}>
          <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 2L7 4H3v2h18V4h-4l-2-2H9zM3 8v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8H3z"
              fill={colors.primary}
            />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
};

export default PackageDetails;
