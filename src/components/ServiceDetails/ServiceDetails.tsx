import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, Dimensions, ActivityIndicator, Alert, Modal, Share, Animated, TextInput } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { getServiceImageUrl, fetchServices } from '../../services/servicesApi';
import { getImageUrl, checkTimeSlotAvailability } from '../../services/api';
import { toggleWishlist, isWishlisted, WishlistItem } from '../../services/wishlist';
import { addToCart, CartItem } from '../../services/cart';
import DatePickerModal, { clearDatePickerCacheForService } from '../DatePickerModal/DatePickerModal';
import TimePickerModal from '../TimePickerModal/TimePickerModal';
import AllReviews from '../../screens/AllReviews';
import { getServiceReviews, Review, ReviewStats } from '../../services/reviewsApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ServiceDetailsProps {
  serviceId: string;
  onBack?: () => void;
}

const ServiceDetails: React.FC<ServiceDetailsProps> = ({ serviceId, onBack }) => {
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const fixedHeight = insets.top + 46; // 22 (ACTIONS_BAR_HEIGHT) + 24 (EXTRA_HEIGHT)
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  // Date/Time picker state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  
  // Availability state - track if selected time slot is available
  const [isTimeSlotAvailable, setIsTimeSlotAvailable] = useState<boolean>(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  // Custom inputs state - stores selected option index for each custom input
  const [customInputSelections, setCustomInputSelections] = useState<{ [key: string]: number | string | number[] }>({});
  // State to control which custom inputs are expanded
  const [expandedCustomInputs, setExpandedCustomInputs] = useState<{ [key: string]: boolean }>({});
  
  // Loading state for add to cart
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);

  // Animation states
  const [showFlyingIcon, setShowFlyingIcon] = useState(false);
  const [iconStartPosition, setIconStartPosition] = useState({ x: 0, y: 0 });
  const flyingIconTranslate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const flyingIconScale = useRef(new Animated.Value(1)).current;
  const addToCartButtonRef = useRef<View>(null);

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
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      
      const selectedDateTime = new Date(selectedDate);
      selectedDateTime.setHours(hours, minutes, 0, 0);
      
      return selectedDateTime < now;
    }
    
    return false;
  };

  // Animation function for adding to cart
  const triggerAddToCartAnimation = () => {
    // Get button position
    if (addToCartButtonRef.current) {
      addToCartButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        // Calculate start position (center of button)
        const startX = pageX + width / 2;
        const startY = pageY + height / 2;
        
        // Calculate target position (bottom navigation cart icon - more accurate)
        const screenHeight = Dimensions.get('window').height;
        const screenWidth = Dimensions.get('window').width;
        
        // Cart icon position changes based on text direction
        // In RTL (Arabic): cart is on the LEFT side of screen
        // In LTR (English): cart is on the RIGHT side of screen
        const targetX = isRTL ? 50 : screenWidth - 50;  // Left in RTL, Right in LTR
        const targetY = screenHeight - 65;  // Bottom tab bar height ~65px
        
        // Calculate icon size (60x60)
        const iconSize = 60;
        
        // Adjust target to be center of cart icon (not corner)
        const targetCenterX = targetX - iconSize / 2;
        const targetCenterY = targetY - iconSize / 2;
        
        // Calculate translation needed from start position
        const translateX = targetCenterX - (startX - iconSize / 2);
        const translateY = targetCenterY - (startY - iconSize / 2);
        
        // Set start position (center-based)
        setIconStartPosition({ x: startX - iconSize / 2, y: startY - iconSize / 2 });
        setShowFlyingIcon(true);
        
        // Reset animations
        flyingIconTranslate.setValue({ x: 0, y: 0 });
        flyingIconScale.setValue(1);
        
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
          // Hide flying icon
          setShowFlyingIcon(false);
        });
      });
    }
  };

  // Load user token
  React.useEffect(() => {
    const loadToken = async () => {
      const token = await AsyncStorage.getItem('userToken');
      setUserToken(token);
    };
    loadToken();
  }, []);

  // Load reviews when service changes
  useEffect(() => {
    const loadReviews = async () => {
      if (!serviceId) return;
      
      try {
        setLoadingReviews(true);
        const reviewsData = await getServiceReviews(serviceId, 1, 10);
        setReviews(reviewsData.reviews);
        setReviewStats(reviewsData.stats);
      } catch (error) {
      } finally {
        setLoadingReviews(false);
      }
    };
    
    loadReviews();
  }, [serviceId]);

  // Fetch services and find the selected service
  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
  });

  const service = services?.find(s => s._id === serviceId);

  // Check availability whenever date or time changes
  React.useEffect(() => {
    const checkAvailability = async () => {
      if (!selectedDate || !selectedTime || !service) {
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
          userToken || undefined
        );
        
        // Check local cart for this service and date
        const { getCart } = require('../../services/cart');
        const localCart = await getCart();
        
        // Compare dates properly
        const selectedDateStr = selectedDate.toDateString();
        const cartItemsForThisSlot = localCart.filter((cartItem: any) => {
          const cartDate = typeof cartItem.selectedDate === 'string' 
            ? new Date(cartItem.selectedDate)
            : cartItem.selectedDate;
          const cartDateStr = cartDate.toDateString();
          
          return cartItem.serviceId === service._id &&
                 cartDateStr === selectedDateStr &&
                 cartItem.selectedTime === selectedTime;
        });
        
        // Normalize function to remove extra whitespace
        const normalizeTimeSlot = (time: string) => time.replace(/\s+/g, ' ').trim();
        
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
      } catch (error) {
        // On error, default to available to not block user
        setIsTimeSlotAvailable(true);
      } finally {
        setCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, [selectedDate, selectedTime, service, userToken]);

  // check wishlist state
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!service) return;
      const saved = await isWishlisted(service._id);
      if (mounted) setIsSaved(saved);
    })();
    return () => { mounted = false };
  }, [service]);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={[styles.serviceName, { textAlign: 'center' }]}>
          {isRTL ? 'الخدمة غير موجودة' : 'Service not found'}
        </Text>
      </View>
    );
  }

  const displayName = isRTL ? service.nameAr : service.name;
  const displayDescription = isRTL ? service.descriptionAr : service.description;

  // Render image carousel item
  const renderImageItem = ({ item }: { item: string }) => {
    return (
      <View style={styles.imageSlide}>
        <Image
          source={{ uri: getServiceImageUrl(item) }}
          style={styles.carouselImage}
          resizeMode="cover"
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>

      {/* Fixed actions bar under notch (not scrolling) */}
  <View style={[styles.fixedActionsRow, { top: 0, height: fixedHeight, paddingTop: insets.top }]}> 
        <View style={styles.actionsLeft}> 
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={[styles.actionButton, styles.actionButtonLarge]} accessibilityLabel="Back">
            <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
              <Path d="M15 18l-6-6 6-6" stroke={colors.primary} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsRight}>
          <TouchableOpacity activeOpacity={0.7} onPress={async () => {
            if (!service) return;
            const img = service.images && service.images.length > 0 ? getServiceImageUrl(service.images[0]) : undefined;
            const item: WishlistItem = { _id: service._id, name: service.name, image: img, price: service.price };
            await toggleWishlist(item);
            const now = await isWishlisted(service._id);
            setIsSaved(now);
          }} style={[styles.actionButton, styles.actionButtonLarge]} accessibilityLabel="Wishlist">
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M20.8 7.6a4.8 4.8 0 0 0-6.8 0L12 9.6l-2-2a4.8 4.8 0 1 0-6.8 6.8L12 22l8.8-7.6a4.8 4.8 0 0 0 0-6.8z" stroke={isSaved ? colors.primary : '#7FBFB6'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill={isSaved ? colors.primary : 'none'} />
            </Svg>
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.7} 
            style={[styles.actionButton, styles.actionButtonLarge]} 
            accessibilityLabel="Share"
            onPress={async () => {
              if (!service) return;
              try {
                const serviceName = isRTL ? service.nameAr : service.name;
                const vendorName = service.vendor?.name || '';
                const price = service.price.toFixed(3);
                
                const message = isRTL
                  ? `${serviceName}\n${vendorName}\n${price} د.ك\n\nشاهد هذه الخدمة الرائعة!`
                  : `${serviceName}\n${vendorName}\nKD ${price}\n\nCheck out this amazing service!`;

                const result = await Share.share({
                  message: message,
                  title: serviceName,
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
            }}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M16 6l-4-4-4 4" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M12 2v14" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

  <ScrollView
    showsVerticalScrollIndicator={false}
    contentContainerStyle={{ paddingTop: fixedHeight, paddingBottom: SCREEN_WIDTH >= 600 ? insets.bottom + 280 : insets.bottom + 180 }}>

        {/* Image Carousel */}
        {service.images && service.images.length > 0 && (
          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={service.images}
              renderItem={renderImageItem}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x / SCREEN_WIDTH
                );
                setCurrentImageIndex(index);
              }}
            />

            {/* Pagination Dots */}
            <View style={styles.paginationContainer}>
              {service.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentImageIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
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
            <View>
              <Text style={styles.priceLabel}>
                {isRTL ? 'السعر يبدأ من' : 'Price starts from'}
              </Text>
              <Text style={styles.priceValue}>
                {service.price.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}{' '}
                <Text style={styles.priceUnit}>{isRTL ? 'يومياً' : 'per day'}</Text>
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              {reviewStats ? (
                <>
                  <Text style={styles.ratingStars}>
                    {'★'.repeat(Math.round(reviewStats.averageRating))}
                    {'☆'.repeat(5 - Math.round(reviewStats.averageRating))}
                  </Text>
                  <Text style={styles.ratingText}>
                    {reviewStats.averageRating.toFixed(1)} ({reviewStats.totalRatings} {isRTL ? 'تقييم' : 'Reviews'})
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
            </View>
          </View>

          {/* Description */}
          <Text style={[styles.descriptionText, isRTL && styles.descriptionTextRTL]}>
            {displayDescription}
          </Text>

          {/* Vendor Policy Section */}
          {service.policies && service.policies.length > 0 && (
            <View style={styles.policiesSection}>
              <Text style={[styles.policiesTitle, isRTL && styles.policiesTitleRTL]}>
                {isRTL ? 'سياسة المورد' : 'VENDOR POLICY'}
              </Text>

              <View style={styles.policiesGrid}>
                {service.policies.map((policyItem: any, index: number) => {
                  const policy = policyItem.policy;
                  const policyName = isRTL ? policy.nameAr : policy.name;
                  const description = policy.descriptions && policy.descriptions.length > 0
                    ? (isRTL ? policy.descriptions[0].textAr : policy.descriptions[0].text)
                    : '';

                  return (
                    <View key={index} style={[styles.policyCard, isRTL && styles.policyCardRTL]}>
                      <View style={[styles.policyIconContainer, isRTL && styles.policyIconContainerRTL]}>
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
                        <Text style={[styles.policyName, isRTL && styles.policyNameRTL]}>
                          {policyName}
                        </Text>
                        <Text 
                          style={[styles.policyDescription, isRTL && styles.policyDescriptionRTL]}
                          numberOfLines={2}
                          ellipsizeMode="tail">
                          {description}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

                  {/* Booking / Availability preview under Vendor Policy */}
                  <View style={styles.bookingContainer}>
                    <Text style={[styles.bookingHeader, isRTL && styles.descriptionTextRTL]}>
                      {isRTL ? 'اختر اليوم والوقت' : 'SELECT EVENT DAY & TIME'}
                    </Text>

                    <View style={styles.bookingCard}>
                      <TouchableOpacity 
                        style={[styles.bookingRow, isRTL && styles.bookingRowRTL]} 
                        activeOpacity={0.8}
                        onPress={() => {
                          // حذف cache البيانات القديمة قبل فتح modal التاريخ
                          if (service) {
                            clearDatePickerCacheForService(service._id, service.vendor?._id || '');
                          }
                          setShowDatePicker(true);
                        }}>
                        <View style={[styles.bookingIconWrap, isRTL && styles.bookingIconWrapRTL]}>
                          <View style={styles.calendarIconSmallBorder}>
                            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                              <Path d="M7 11h10M7 7h10M7 3h10" stroke={colors.primary} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                              <Path d="M5 21h14V7H5v14z" stroke={colors.primary} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                            </Svg>
                          </View>
                        </View>
                        <Text style={[styles.bookingText, isRTL && styles.descriptionTextRTL]}>
                          {selectedDate 
                            ? selectedDate.toLocaleDateString(isRTL ? 'ar-KW' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
                            : (isRTL ? 'اختر التاريخ' : 'Select Date')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.bookingRow, isRTL && styles.bookingRowRTL]} 
                        activeOpacity={0.8}
                        onPress={() => selectedDate && setShowTimePicker(true)}
                        disabled={!selectedDate}>
                        <View style={[styles.bookingIconWrap, isRTL && styles.bookingIconWrapRTL]}>
                          <View style={styles.clockIconSmallBorder}>
                            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                              <Path d="M12 7v6l4 2" stroke={colors.primary} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                              <Path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke={colors.primary} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                            </Svg>
                          </View>
                        </View>
                        <Text style={[styles.bookingText, isRTL && styles.descriptionTextRTL]}>
                          {selectedTime || (isRTL ? 'اختر الوقت' : 'Select Time')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[
                          styles.availabilityButton, 
                          (!selectedDate || !selectedTime || isTimeInPast() || !isTimeSlotAvailable) && { opacity: 0.5 }
                        ]} 
                        activeOpacity={0.85}
                        disabled={!selectedDate || !selectedTime || isTimeInPast() || !isTimeSlotAvailable}>
                        <Text style={styles.availabilityButtonText}>
                          {checkingAvailability
                            ? (isRTL ? 'جاري التحقق...' : 'Checking...')
                            : isTimeInPast() 
                            ? (isRTL ? '⚠ وقت قديم' : '⚠ Past Time')
                            : !isTimeSlotAvailable && selectedDate && selectedTime
                            ? (isRTL ? '✗ غير متاح' : '✗ Not Available')
                            : selectedDate && selectedTime 
                              ? (isRTL ? '✓ متاح' : '✓ Available')
                              : (isRTL ? 'اختر التاريخ والوقت' : 'Select Date & Time')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Custom Text Section */}
                  {service.customInputs && service.customInputs.length > 0 && (
                    <View style={styles.customTextContainer}>
                      <Text style={[styles.customTextHeader, isRTL && styles.descriptionTextRTL]}>
                        {isRTL ? 'خيارات' : 'OPTIONS'}
                      </Text>

                      {/* Each Custom Input as Separate Option */}
                      {service.customInputs.map((input: any, index: number) => {
                        const inputLabel = isRTL ? input.labelAr : input.label;
                        const inputType = input.type;
                        const inputOptions = isRTL ? input.optionsAr : input.options;
                        const isExpanded = expandedCustomInputs[input._id] || false;
                        const selectedValue = customInputSelections[input._id];

                        return (
                          <View key={input._id} style={styles.optionCardContainer}>
                            {/* Add Option Button - shows the label and toggle */}
                            <TouchableOpacity 
                              style={styles.addOptionButton}
                              activeOpacity={0.8}
                              onPress={() => {
                                setExpandedCustomInputs({
                                  ...expandedCustomInputs,
                                  [input._id]: !isExpanded,
                                });
                              }}>
                              <Text style={styles.addOptionText}>
                                {inputLabel}
                              </Text>
                              <Svg 
                                width={20} 
                                height={20} 
                                viewBox="0 0 24 24" 
                                fill="none"
                                style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}>
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
                                    style={[styles.textInputField, isRTL && styles.textInputFieldRTL]}
                                    placeholder={isRTL ? input.placeholderAr : input.placeholder}
                                    placeholderTextColor="#999"
                                    value={selectedValue as string || ''}
                                    onChangeText={(text) => {
                                      setCustomInputSelections({
                                        ...customInputSelections,
                                        [input._id]: text,
                                      });
                                    }}
                                    textAlign={isRTL ? 'right' : 'left'}
                                  />
                                )}

                                {/* Number Input */}
                                {inputType === 'number' && (
                                  <TextInput
                                    style={[styles.textInputField, isRTL && styles.textInputFieldRTL]}
                                    placeholder={isRTL ? input.placeholderAr : input.placeholder}
                                    placeholderTextColor="#999"
                                    keyboardType="number-pad"
                                    value={selectedValue as string || ''}
                                    onChangeText={(text) => {
                                      const num = parseInt(text) || '';
                                      if (num === '' || (input.validation && num >= (input.validation.min || 0) && num <= (input.validation.max || 999))) {
                                        setCustomInputSelections({
                                          ...customInputSelections,
                                          [input._id]: num as any,
                                        });
                                      }
                                    }}
                                    textAlign={isRTL ? 'right' : 'left'}
                                  />
                                )}

                                {/* Radio Single or Multiple */}
                                {(inputType === 'radio-single' || inputType === 'radio-multiple') && inputOptions && inputOptions.length > 0 && (
                                  inputOptions.map((option: string, optIndex: number) => {
                                    // For radio-multiple, selectedValue will be an array
                                    const isMultiple = inputType === 'radio-multiple';
                                    const selectedArray = isMultiple ? (selectedValue as number[] || []) : [];
                                    const isSelected = isMultiple 
                                      ? selectedArray.includes(optIndex)
                                      : selectedValue === optIndex;
                                    const price = input.optionPrices?.[optIndex] || 0;

                                    return (
                                      <TouchableOpacity
                                        key={optIndex}
                                        style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                          if (isMultiple) {
                                            // For radio-multiple, toggle the selection
                                            const currentArray = selectedArray;
                                            const newArray = isSelected
                                              ? currentArray.filter(idx => idx !== optIndex)
                                              : [...currentArray, optIndex];
                                            
                                            if (newArray.length === 0) {
                                              const newSelections = { ...customInputSelections };
                                              delete newSelections[input._id];
                                              setCustomInputSelections(newSelections);
                                            } else {
                                              setCustomInputSelections({
                                                ...customInputSelections,
                                                [input._id]: newArray,
                                              });
                                            }
                                          } else {
                                            // For radio-single, replace the selection
                                            if (isSelected) {
                                              const newSelections = { ...customInputSelections };
                                              delete newSelections[input._id];
                                              setCustomInputSelections(newSelections);
                                            } else {
                                              setCustomInputSelections({
                                                ...customInputSelections,
                                                [input._id]: optIndex,
                                              });
                                            }
                                          }
                                        }}>
                                        <View style={styles.checkboxContainer}>
                                          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                            {isSelected && (
                                              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                                                <Path d="M20 6L9 17l-5-5" stroke={colors.textWhite} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                                              </Svg>
                                            )}
                                          </View>
                                          <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                            {option}
                                          </Text>
                                        </View>
                                        <Text style={[styles.optionPrice, isSelected && styles.optionPriceSelected]}>
                                          +{price.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  })
                                )}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}



          {/* Reviews Section */}
          {reviewStats && reviewStats.totalRatings > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={[styles.reviewsTitle, isRTL && styles.reviewsTitleRTL]}>
                {isRTL ? 'التقييمات' : 'Reviews'} ({reviewStats.totalRatings})
              </Text>
              
              {/* Review Stats */}
              <View style={styles.reviewStatsCard}>
                <View style={styles.averageRatingContainer}>
                  <Text style={styles.averageRatingNumber}>{reviewStats.averageRating.toFixed(1)}</Text>
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
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviewStats.ratingDistribution[star as keyof typeof reviewStats.ratingDistribution] || 0;
                    const percentage = reviewStats.totalRatings > 0 ? (count / reviewStats.totalRatings) * 100 : 0;
                    return (
                      <View key={star} style={styles.distributionRow}>
                        <Text style={styles.distributionStar}>{star}★</Text>
                        <View style={styles.distributionBar}>
                          <View style={[styles.distributionFill, { width: `${percentage}%` }]} />
                        </View>
                        <Text style={styles.distributionCount}>{count}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Individual Reviews */}
              {reviews.length > 0 && (
                <View style={styles.reviewsList}>
                  {reviews.slice(0, 2).map((review) => (
                    <View key={review._id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewUserInfo}>
                          {review.user.profilePicture ? (
                            <Image 
                              source={{ uri: getImageUrl(review.user.profilePicture) }}
                              style={styles.reviewUserAvatar}
                            />
                          ) : (
                            <View style={styles.reviewUserAvatarPlaceholder}>
                              <Text style={styles.reviewUserAvatarText}>
                                {review.user.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                              <Text style={[styles.reviewUserName, { maxWidth: '50%' }]} numberOfLines={1}>
                                {review.user.name}
                              </Text>
                              <Text style={{ fontSize: 12, color: colors.textSecondary, marginHorizontal: 6 }}>•</Text>
                              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                                {new Date(review.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                              </Text>
                            </View>
                            {review.isVerifiedPurchase && (
                              <Text style={styles.verifiedBadge}>
                                ✓ {isRTL ? 'مشترٍ موثق' : 'Verified'}
                              </Text>
                            )}
                          </View>
                        </View>
                        <View style={styles.reviewRating}>
                          <Text style={styles.reviewRatingText}>
                            {review.rating.toFixed(1)} ★
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.reviewComment, isRTL && styles.reviewCommentRTL]}>
                        {review.comment}
                      </Text>
                      {review.vendorReply && (
                        <View style={styles.vendorReply}>
                          <Text style={styles.vendorReplyLabel}>
                            {isRTL ? 'رد البائع:' : 'Vendor Reply:'}
                          </Text>
                          <Text style={[styles.vendorReplyText, isRTL && styles.vendorReplyTextRTL]}>
                            {review.vendorReply.text}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                  
                  {/* Show More/Less Button */}
                  {reviews.length > 2 && (
                    <TouchableOpacity 
                      style={styles.showMoreReviewsButton}
                      activeOpacity={0.7}
                      onPress={() => setShowAllReviewsModal(true)}>
                      <Text style={styles.showMoreReviewsText}>
                        {isRTL ? `عرض جميع التقييمات (${reviews.length})` : `Show All Reviews (${reviews.length})`}
                      </Text>
                      <Svg 
                        width={20} 
                        height={20} 
                        viewBox="0 0 24 24" 
                        fill="none"
                        style={{ 
                          marginLeft: isRTL ? 0 : 8,
                          marginRight: isRTL ? 8 : 0
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

      {/* Bottom Action Buttons */}
      <View style={[styles.bottomActions, { paddingBottom: SCREEN_WIDTH >= 600 ? insets.bottom + 120 : insets.bottom + 60 }]}>
        <TouchableOpacity
          ref={addToCartButtonRef}
          style={[
            styles.addToCartButton,
            (!selectedDate || !selectedTime || isTimeInPast() || !isTimeSlotAvailable || isAddingToCart) && { opacity: 0.5 }
          ]}
          activeOpacity={0.85}
          disabled={!selectedDate || !selectedTime || isTimeInPast() || !isTimeSlotAvailable || isAddingToCart}
          onPress={async () => {
            if (!service) return;
            
            // Check if user is logged in
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
              Alert.alert(
                isRTL ? 'تسجيل الدخول مطلوب' : 'Login Required',
                isRTL ? 'يجب تسجيل الدخول أولاً لإضافة خدمات إلى السلة' : 'Please login first to add services to cart',
                [{ text: isRTL ? 'حسناً' : 'OK' }]
              );
              return;
            }
            
            // Validate required selections
            if (!selectedDate || !selectedTime) {
              Alert.alert(
                isRTL ? 'تنبيه' : 'Alert',
                isRTL ? 'الرجاء اختيار التاريخ والوقت' : 'Please select date and time',
                [{ text: isRTL ? 'حسناً' : 'OK' }]
              );
              return;
            }

            // Check if time is in the past (client-side check)
            if (isTimeInPast()) {
              Alert.alert(
                isRTL ? 'تنبيه' : 'Alert',
                isRTL ? 'لا يمكن حجز وقت قديم. الرجاء اختيار وقت مستقبلي.' : 'Cannot book a past time. Please select a future time.',
                [{ text: isRTL ? 'حسناً' : 'OK' }]
              );
              return;
            }

            // Check if time slot is not available
            if (!isTimeSlotAvailable) {
              Alert.alert(
                isRTL ? 'تنبيه' : 'Alert',
                isRTL ? 'هذا الوقت غير متاح. الرجاء اختيار وقت آخر.' : 'This time slot is not available. Please select another time.',
                [{ text: isRTL ? 'حسناً' : 'OK' }]
              );
              return;
            }

            try {
              // Start loading
              setIsAddingToCart(true);

              // Parse the selected time - format is "HH:MM - HH:MM" (24-hour format)
              // Example: "09:00 - 09:30" or "14:30 - 15:00"
              const timeMatch = selectedTime.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
              if (!timeMatch) {
                Alert.alert(
                  isRTL ? 'خطأ' : 'Error',
                  isRTL ? 'تنسيق الوقت غير صحيح' : 'Invalid time format',
                  [{ text: isRTL ? 'حسناً' : 'OK' }]
                );
                setIsAddingToCart(false);
                return;
              }

              // Extract hours and minutes from the time slot
              const startHours = parseInt(timeMatch[1]);
              const startMinutes = parseInt(timeMatch[2]);
              const endHours = parseInt(timeMatch[3]);
              const endMinutes = parseInt(timeMatch[4]);

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
              const slotStartUTC = Date.UTC(year, month, day, startHours - 3, startMinutes, 0, 0);
              const slotEndUTC = Date.UTC(year, month, day, endHours - 3, endMinutes, 0, 0);
              
              const slotStart = new Date(slotStartUTC);
              const slotEnd = new Date(slotEndUTC);

              // Calculate total price including custom options
              let totalPrice = service.price;
              const selectedCustomInputs = (service.customInputs?.map((input: any) => {
                const selectedValue = customInputSelections[input._id];
                
                // Handle radio buttons (single and multiple)
                if (input.type === 'radio-single' || input.type === 'radio-multiple') {
                  // For radio-multiple, selectedValue is an array; for radio-single, it's a number
                  const isMultiple = input.type === 'radio-multiple';
                  const selectedIndices = isMultiple ? (selectedValue as number[] || []) : (selectedValue !== undefined ? [selectedValue as number] : []);
                  
                  if (selectedIndices.length > 0) {
                    const selectedOptions = selectedIndices.map((index: number) => {
                      const selectedOption = (isRTL ? input.optionsAr : input.options)[index];
                      const optionPrice = Number(input.optionPrices[index] ?? 0);
                      totalPrice += optionPrice; // Add option price to total
                      return {
                        label: String(input.label), // Always use English label for backend matching
                        value: selectedOption as string | number,
                        price: optionPrice
                      };
                    });
                    
                    // Return single object for radio-single, array for radio-multiple
                    return isMultiple ? selectedOptions : selectedOptions[0];
                  }
                } 
                // Handle text and number inputs
                else if ((input.type === 'text' || input.type === 'number') && selectedValue !== undefined && selectedValue !== '') {
                  return {
                    label: String(input.label), // Always use English label for backend matching
                    value: selectedValue,
                    price: 0 // Text/number inputs don't have option prices
                  } as { label: string; value: string | number; price?: number };
                }
                
                return null;
              }) ?? []).filter((v): v is { label: string; value: string | number; price?: number } => v !== null);

              const cartItem: CartItem = {
                _id: `${service._id}_${Date.now()}`,
                serviceId: service._id,
                vendorId: service.vendor?._id || '',
                name: service.name,
                nameAr: service.nameAr,
                vendorName: service.vendor?.name,
                image: service.images && service.images.length > 0 ? service.images[0] : undefined,
                price: service.price,
                totalPrice: totalPrice, // Total price including custom options
                quantity: 1, // Default quantity is 1, user can change in Cart (for unlimited services)
                selectedDate,
                selectedTime,
                customInputs: selectedCustomInputs.filter(v => v !== null && v !== undefined),
                timeSlot: {
                  start: slotStart,
                  end: slotEnd
                },
                availabilityStatus: service.availabilityStatus,
                maxBookingsPerSlot: service.maxBookingsPerSlot // Pass maxBookingsPerSlot to cart
              };

              // Add to local storage cart
              await addToCart(cartItem);
              
              // Trigger animation
              triggerAddToCartAnimation();
              
              // Reset date, time, and custom inputs after successful add to cart
              setSelectedDate(null);
              setSelectedTime(null);
              setCustomInputSelections({});
              setExpandedCustomInputs({});
              
              // Success - silently added to cart, no alert
            } catch (error: any) {
              // Backend rejected the booking (time not available, etc.)
              let errorMessage = error.message || 'Failed to add to cart';
              
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
              
              Alert.alert(
                isRTL ? 'خطأ' : 'Error',
                errorMessage,
                [{ text: isRTL ? 'حسناً' : 'OK' }]
              );
            } finally {
              // Stop loading
              setIsAddingToCart(false);
            }
          }}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
            <Path d="M9 2L7 6M17 6L15 2M2 6h20l-2 14H4L2 6z" stroke={colors.textWhite} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={styles.addToCartButtonText}>
            {isAddingToCart 
              ? (isRTL ? 'جاري الإضافة...' : 'ADDING...')
              : (isRTL ? 'أضف إلى السلة' : 'ADD TO CART')
            }
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButtonBottom}
          activeOpacity={0.85}
          onPress={onBack}>
          <Text style={styles.backButtonText}>
            {isRTL ? 'رجوع' : 'BACK'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {service && (
        <DatePickerModal
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSelectDate={(date) => {
            setSelectedDate(date);
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
          onSelectTime={(timeSlot) => setSelectedTime(timeSlot)}
          serviceId={service._id}
          vendorId={service.vendor?._id || ''}
          selectedDate={selectedDate}
          selectedTime={selectedTime || undefined}
          token={userToken || undefined}
        />
      )}



      {/* All Reviews Modal */}
      {reviewStats && (
        <Modal
          visible={showAllReviewsModal}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowAllReviewsModal(false)}>
          <AllReviews
            reviews={reviews}
            reviewStats={reviewStats}
            serviceName={displayName}
            onBack={() => setShowAllReviewsModal(false)}
          />
        </Modal>
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
              { scale: flyingIconScale }
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
    </View>
  );
};

export default ServiceDetails;
