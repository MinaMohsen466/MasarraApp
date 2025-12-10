import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getCart, removeFromCart, updateCartItemQuantity, clearCart, CartItem, checkCartAvailability, createBookingsFromCart } from '../services/cart';
import { getServiceImageUrl } from '../services/servicesApi';
import { getImageUrl } from '../services/api';
import { styles } from './cartStyles';
import Drawer from '../components/Drawer';
import OrderSuccess from './OrderSuccess';
import AddressSelection from '../components/AddressSelection/AddressSelection';
import { API_BASE_URL } from '../config/api.config';

interface CartProps {
  onBack?: () => void;
  onViewDetails?: (serviceId: string) => void;
  onNavigate?: (route: string) => void;
}

const Cart: React.FC<CartProps> = ({ onBack, onViewDetails, onNavigate }) => {
  const { isRTL, t } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
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
      
      const message = t('oldBookingsMessage')
        .replace('{count}', oldItems.length.toString())
        .replace('{items}', oldItemNames);
      
      Alert.alert(t('oldBookingsAlert'), message, [{ text: t('ok') }]);
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
    const buttons = [
      {
        text: t('remove'),
        style: 'destructive' as const,
        onPress: async () => {
          await removeFromCart(id);
          await loadCart();
        },
      },
      { text: t('cancel'), style: 'cancel' as const },
    ];

    Alert.alert(
      t('confirmDelete'),
      t('removeItemMessage'),
      isRTL ? buttons : buttons.reverse()
    );
  };

  const handleUserIconPress = () => {
    if (onNavigate) {
      onNavigate(isLoggedIn ? 'profile' : 'auth');
    }
  };

  const toggleDrawer = (state?: boolean) => {
    setIsDrawerVisible(state ?? !isDrawerVisible);
  };

  const handleNavigation = (route: string) => {
    if (onNavigate) {
      onNavigate(route.toLowerCase());
    }
    toggleDrawer(false);
  };

  const handleCheckout = async () => {
    try {
      setIsProcessingCheckout(true);

      const { available, unavailableItems } = await checkCartAvailability();

      if (!available) {
        setIsProcessingCheckout(false);
        const errorItems = unavailableItems
          .map(({ item, reason }) => {
            const itemName = isRTL ? (item.nameAr || item.name) : item.name;
            return `â€¢ ${itemName} (${item.selectedTime})\n  ${reason}`;
          })
          .join('\n\n');

        const message = t('unavailableItemsMessage').replace('{items}', errorItems);
        Alert.alert(t('someItemsUnavailable'), message, [{ text: t('ok') }]);
        return;
      }

      setIsProcessingCheckout(false);
      setShowAddressSelection(true);

    } catch (error) {
      setIsProcessingCheckout(false);
      console.error('Error during checkout:', error);
      Alert.alert(t('error'), t('errorProcessingOrder'), [{ text: t('ok') }]);
    }
  };

  const handleAddressSelected = async (address: any) => {
    try {
      setSelectedAddress(address);
      setShowAddressSelection(false);
      setIsProcessingCheckout(true);

      // Build address parts array
      const addressParts = [address.street];
      if (address.houseNumber) {
        addressParts.push(isRTL ? `منزل ${address.houseNumber}` : `House ${address.houseNumber}`);
      }
      if (address.floorNumber) {
        addressParts.push(isRTL ? `طابق ${address.floorNumber}` : `Floor ${address.floorNumber}`);
      }
      addressParts.push(address.city);
      
      const fullAddress = addressParts.join(', ');
      
      const { success, bookings, errors } = await createBookingsFromCart(fullAddress);

      setIsProcessingCheckout(false);

      if (!success) {
        // Some bookings failed
        const errorItems = errors
          .map(({ item, error }) => {
            const itemName = isRTL ? (item.nameAr || item.name) : item.name;
            return `â€¢ ${itemName}\n  ${error}`;
          })
          .join('\n\n');

        const message = t('failedToCreateBookings').replace('{items}', errorItems);
        Alert.alert(t('bookingError'), message, [{ text: t('ok') }]);
        return;
      }

      await clearCart();
      setCartItems([]);

      // Show success screen
      setShowSuccessScreen(true);

    } catch (error) {
      setIsProcessingCheckout(false);
      console.error('Error creating bookings:', error);
      Alert.alert(t('error'), t('errorCreatingBookings'), [{ text: t('ok') }]);
    }
  };

  const calculateSubTotal = () => {
    return cartItems.reduce((total, item) => {
      if (!item.availabilityStatus || item.availabilityStatus === 'available_now') {
        const itemPrice = item.totalPrice ?? item.price;
        return total + (itemPrice * item.quantity);
      }
      return total;
    }, 0);
  };

  const calculateDeliveryCharges = () => {
    const uniqueUnlimitedServiceIds = new Set<string>();
    cartItems.forEach(item => {
      if ((!item.availabilityStatus || item.availabilityStatus === 'available_now') &&
          item.maxBookingsPerSlot === -1) {
        uniqueUnlimitedServiceIds.add(item.serviceId);
      }
    });
    return uniqueUnlimitedServiceIds.size * 5;
  };

  const calculatePayNowAmount = () => {
    const availableNowSubtotal = cartItems.reduce((total, item) => {
      if (!item.availabilityStatus || item.availabilityStatus === 'available_now') {
        const itemPrice = item.totalPrice ?? item.price;
        return total + (itemPrice * item.quantity);
      }
      return total;
    }, 0);
    return (availableNowSubtotal + calculateDeliveryCharges()) * 0.6;
  };

  const calculatePayableAfterConfirmation = () => {
    const availableNowSubtotal = cartItems.reduce((total, item) => {
      if (!item.availabilityStatus || item.availabilityStatus === 'available_now') {
        const itemPrice = item.totalPrice ?? item.price;
        return total + (itemPrice * item.quantity);
      }
      return total;
    }, 0);
    const deliveryCharges = calculateDeliveryCharges();
    const availableNowRemaining = (availableNowSubtotal + deliveryCharges) * 0.4;
    const pendingTotal = cartItems.reduce((total, item) => {
      if (item.availabilityStatus === 'pending_confirmation') {
        const itemPrice = item.totalPrice ?? item.price;
        return total + (itemPrice * item.quantity);
      }
      return total;
    }, 0);
    return availableNowRemaining + pendingTotal;
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
            onPress={() => toggleDrawer(true)} 
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
              {t('myCart')}
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
            {t('pleaseLoginToViewCart')}
          </Text>
          <TouchableOpacity 
            style={[styles.checkoutButton, { marginTop: 20, width: 200 }]}
            onPress={() => onNavigate && onNavigate('auth')}>
            <Text style={styles.checkoutButtonText}>{t('login')}</Text>
          </TouchableOpacity>
        </View>

        <Drawer 
          isVisible={isDrawerVisible}
          onClose={() => toggleDrawer(false)}
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
          onPress={() => toggleDrawer(true)} 
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
            {t('myCart')}
          </Text>
        </View>

        {/* Right - Profile Button */}
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={handleUserIconPress}
          activeOpacity={0.6}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          {isLoggedIn && currentProfilePicture && !imageError ? (
            <Image 
              source={{ uri: getImageUrl(currentProfilePicture) }}
              style={styles.profileIcon}
              resizeMode="cover"
              onError={() => setImageError(true)}
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
          <Text style={styles.emptyText}>{t('loading')}</Text>
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>{t('cartEmpty')}</Text>
        </View>
      ) : (
        <>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={{ 
              paddingBottom: Dimensions.get('window').width >= 600 ? (summaryHeight + (insets.bottom ?? 0) + 50) : (summaryHeight + (insets.bottom ?? 0) + 20)
            }}
            showsVerticalScrollIndicator={false}>
            {cartItems.map((item, index) => {
              const now = new Date();
              const isItemOld = item.timeSlot?.start 
                ? new Date(item.timeSlot.start) < now
                : item.selectedDate && new Date(item.selectedDate).toDateString() < now.toDateString();
              
              return (
              <View key={item._id} style={styles.cartCard}>
                {/* Old Booking Warning Badge */}
                {isItemOld && (
                  <View style={styles.oldBookingBadge}>
                    <Text style={styles.oldBookingText}>{t('pastTimeWarning')}</Text>
                  </View>
                )}

                {/* Remove Button */}
                <TouchableOpacity 
                  style={[styles.removeButton, isRTL && styles.removeButtonRTL]}
                  onPress={() => handleRemoveItem(item._id)}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M18 6L6 18M6 6l12 12" stroke="#555" strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                </TouchableOpacity>

                {/* Item Header with Image and Title */}
                <View style={[styles.itemHeader, isRTL && styles.itemHeaderRTL]}>
                  {item.image && (
                    <Image
                      source={{ uri: getServiceImageUrl(item.image) }}
                      style={[styles.itemImage, isRTL && styles.itemImageRTL]}
                      resizeMode="cover"
                    />
                  )}
                  <View style={[styles.itemHeaderText, isRTL && styles.itemHeaderTextRTL]}>
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
                          <Text style={{ color: colors.textWhite, fontSize: 14, fontWeight: 'bold' }}>âˆ’</Text>
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
                <View style={[styles.dateTimeSection, isRTL && styles.dateTimeSectionRTL]}>
                  <View style={[styles.dateTimeRow, isRTL && styles.dateTimeRowRTL]}>
                    {isRTL && <Text style={styles.dateTimeText}>
                      {item.selectedDate 
                        ? new Date(item.selectedDate).toLocaleDateString(isRTL ? 'ar-KW' : 'en-US', { 
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric' 
                          })
                        : '-'}
                    </Text>}
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    {!isRTL && <Text style={styles.dateTimeText}>
                      {item.selectedDate 
                        ? new Date(item.selectedDate).toLocaleDateString(isRTL ? 'ar-KW' : 'en-US', { 
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric' 
                          })
                        : '-'}
                    </Text>}
                  </View>

                  <View style={[styles.dateTimeRow, isRTL && styles.dateTimeRowRTL]}>
                    {isRTL && <Text style={styles.dateTimeText}>
                      {item.selectedTime || '-'}
                    </Text>}
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 7v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    {!isRTL && <Text style={styles.dateTimeText}>
                      {item.selectedTime || '-'}
                    </Text>}
                  </View>
                </View>

                {/* Amount and Delivery */}
                <View style={styles.priceSection}>
                  <View style={styles.priceRow}>
                    {isRTL ? (
                      <>
                        {item.availabilityStatus === 'pending_confirmation' ? (
                          <Text style={[styles.priceValue, { color: colors.textSecondary, fontSize: 12 }]}>
                            {t('afterConfirmation')}
                          </Text>
                        ) : (
                          <Text style={styles.priceValue}>
                            {isRTL ? 'د.ك' : 'KD'} {((item.totalPrice ?? item.price) * item.quantity).toFixed(3)}
                          </Text>
                        )}
                        <Text style={[styles.priceLabel, { marginLeft: 'auto' }]}>{t('amount')}</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.priceLabel}>{t('amount')}</Text>
                        {item.availabilityStatus === 'pending_confirmation' ? (
                          <Text style={[styles.priceValue, { color: colors.textSecondary, fontSize: 12 }]}>
                            {t('afterConfirmation')}
                          </Text>
                        ) : (
                          <Text style={styles.priceValue}>
                            {isRTL ? 'د.ك' : 'KD'} {((item.totalPrice ?? item.price) * item.quantity).toFixed(3)}
                          </Text>
                        )}
                      </>
                    )}
                  </View>
                  <View style={styles.priceRow}>
                    {isRTL ? (
                      <>
                        {item.availabilityStatus === 'pending_confirmation' ? (
                          <Text style={[styles.deliveryChargeValue, { color: colors.textSecondary, fontSize: 12 }]}>
                            {t('afterConfirmation')}
                          </Text>
                        ) : item.maxBookingsPerSlot === -1 ? (
                          <Text style={styles.deliveryChargeValue}>
                            {isRTL ? 'د.ك' : 'KD'} {(5).toFixed(3)}
                          </Text>
                        ) : (
                          <Text style={styles.deliveryChargeValue}>
                            {isRTL ? 'د.ك' : 'KD'} {(0).toFixed(3)}
                          </Text>
                        )}
                        <Text style={[styles.priceLabel, { marginLeft: 'auto' }]}>{t('deliveryCharges')}</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.priceLabel}>{t('deliveryCharges')}</Text>
                        {item.availabilityStatus === 'pending_confirmation' ? (
                          <Text style={[styles.deliveryChargeValue, { color: colors.textSecondary, fontSize: 12 }]}>
                            {t('afterConfirmation')}
                          </Text>
                        ) : item.maxBookingsPerSlot === -1 ? (
                          <Text style={styles.deliveryChargeValue}>
                            {isRTL ? 'د.ك' : 'KD'} {(5).toFixed(3)}
                          </Text>
                        ) : (
                          <Text style={styles.deliveryChargeValue}>
                            {isRTL ? 'د.ك' : 'KD'} {(0).toFixed(3)}
                          </Text>
                        )}
                      </>
                    )}
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.viewDetailsButton}
                    onPress={() => onViewDetails && onViewDetails(item.serviceId)}>
                    <Text style={styles.viewDetailsText}>{t('viewDetails')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
            })}
          </ScrollView>

          <View
            onLayout={(e) => setSummaryHeight(e.nativeEvent.layout.height)}
            style={[
              styles.bottomSummary,
              { 
                bottom: (insets.bottom ?? 0) + 8, 
                paddingBottom: Dimensions.get('window').width >= 600 ? (insets.bottom ?? 0) + 120 : (insets.bottom ?? 0) + 30,
              },
            ]}>
            {/* Totals */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('subTotal')}</Text>
              <Text style={styles.summaryValue}>
                {isRTL ? 'د.ك' : 'KD'} {calculateSubTotal().toFixed(3)}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('totalDeliveryCharges')}</Text>
              <Text style={styles.summaryValueGreen}>
                {isRTL ? 'د.ك' : 'KD'} {calculateDeliveryCharges().toFixed(3)}
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={styles.summaryLabelTotal}>{t('totalAmount')}</Text>
              <Text style={styles.summaryValueTotal}>
                {isRTL ? 'د.ك' : 'KD'} {(calculateSubTotal() + calculateDeliveryCharges()).toFixed(3)}
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Payment Options */}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>{t('payNow')}</Text>
              <Text style={styles.paymentValue}>
                {isRTL ? 'د.ك' : 'KD'} {calculatePayNowAmount().toFixed(3)}
              </Text>
            </View>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabelOrange}>{t('payableAfterConfirmation')}</Text>
              <Text style={styles.paymentValueOrange}>
                {isRTL ? 'د.ك' : 'KD'} {calculatePayableAfterConfirmation().toFixed(3)}
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
                <Text style={styles.checkoutButtonText}>{t('checkout')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.continueShoppingButton}
              onPress={() => onNavigate && onNavigate('home')}
              disabled={isProcessingCheckout}>
              <Text style={styles.continueShoppingButtonText}>{t('continueShopping')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Drawer Navigation */}
      <Drawer 
        isVisible={isDrawerVisible}
        onClose={() => toggleDrawer(false)}
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

export default Cart;
