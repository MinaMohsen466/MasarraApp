/* eslint-disable @typescript-eslint/no-explicit-any, react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../constants/colors';
import {
  fetchServices,
  Service,
  getServiceImageUrl,
} from '../../services/servicesApi';
import ServiceDetails from '../ServiceDetails/ServiceDetails';

interface EmptyCartViewProps {
  isRTL: boolean;
  t: (key: string) => string;
  insets: { top: number };
  handleBack: () => void;
  handleUserIconPress: () => void;
  onNavigate?: (route: string) => void;
  onViewDetails?: (serviceId: string) => void;
  user: any;
  imageError: boolean;
  setImageError: (value: boolean) => void;
  getImageUri: (uri: string | null | undefined) => string | null;
}

export const EmptyCartView: React.FC<EmptyCartViewProps> = ({
  isRTL,
  t,
  insets,
  handleBack,
  handleUserIconPress,
  onNavigate,
  onViewDetails,
  user,
  imageError,
  setImageError,
  getImageUri,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const [recommendedServices, setRecommendedServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState<boolean>(true);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Calculate card width so exactly 2 full cards + ~30% of 3rd card are visible
  const cardWidth = Math.max(142, Math.floor((screenWidth - 44) / 2.3));

  useEffect(() => {
    let isMounted = true;
    const loadRecommendations = async () => {
      try {
        setLoadingServices(true);
        const data = await fetchServices();
        if (isMounted && Array.isArray(data)) {
          const featured = data.filter(s => s.isFeatured || s.isOnSale);
          const list = featured.length >= 3 ? featured : data;
          setRecommendedServices(list.slice(0, 10));
        }
      } catch {
        // Fallback silently if service fetching fails
      } finally {
        if (isMounted) setLoadingServices(false);
      }
    };
    loadRecommendations();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleServiceClick = (serviceId: string) => {
    if (onViewDetails) {
      onViewDetails(serviceId);
    }
    // Also set local state to ensure opening ServiceDetails modal
    setSelectedServiceId(serviceId);
  };

  return (
    <>
      <StatusBar
        backgroundColor={colors.backgroundCard}
        barStyle="dark-content"
        translucent={false}
      />
      <View style={{ flex: 1, backgroundColor: colors.backgroundCard }}>
        <View style={{ height: insets.top, backgroundColor: colors.backgroundCard }} />

        {/* Clean Header Bar */}
        <View
          style={{
            flexDirection: isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <TouchableOpacity
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: '#FFFFFF',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 5,
              elevation: 2,
              borderWidth: 1,
              borderColor: 'rgba(44, 95, 93, 0.15)',
            }}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Icon
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={20}
              color="#0F172A"
            />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#0F172A',
              textAlign: 'center',
              flex: 1,
            }}
          >
            {t('myCart')}
          </Text>

          <TouchableOpacity
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: '#FFFFFF',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(44, 95, 93, 0.15)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 5,
              elevation: 2,
              overflow: 'hidden',
            }}
            onPress={handleUserIconPress}
            activeOpacity={0.8}
          >
            {user?.profilePicture && !imageError ? (
              <Image
                source={{
                  uri: getImageUri(user.profilePicture) || undefined,
                }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <Icon name="person-outline" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {/* New Compact Empty Cart Hero Card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              marginHorizontal: 16,
              marginTop: 10,
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: 'rgba(44, 95, 93, 0.12)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.04,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  backgroundColor: '#F0FDFA',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(0, 161, 156, 0.18)',
                  flexShrink: 0,
                }}
              >
                <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    stroke={colors.primary}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>

              <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '700',
                    color: '#0F172A',
                    marginBottom: 3,
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                >
                  {isRTL ? 'سلتك فارغة' : 'Your Cart is Empty'}
                </Text>

                <Text
                  style={{
                    fontSize: 12,
                    color: '#64748B',
                    lineHeight: 17,
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                >
                  {isRTL
                    ? 'اكتشف أفضل الخدمات والباقات الفاخرة لمناسبتك.'
                    : 'Discover premium services & packages for your occasion.'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 11,
                paddingHorizontal: 20,
                borderRadius: 16,
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 14,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.22,
                shadowRadius: 6,
                elevation: 3,
              }}
              onPress={() => onNavigate && onNavigate('services')}
              activeOpacity={0.85}
            >
              <Icon name="compass-outline" size={17} color="#FFFFFF" />
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: '700',
                  letterSpacing: 0.3,
                }}
              >
                {isRTL ? 'ابدأ التسوق' : 'EXPLORE SERVICES'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recommended Services Section */}
          <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: 'rgba(0, 161, 156, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="sparkles" size={15} color={colors.primary} />
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#0F172A',
                  }}
                >
                  {isRTL ? 'مقترحات قد تعجبك' : 'Recommended Services'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => onNavigate && onNavigate('services')}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.primary,
                  }}
                >
                  {isRTL ? 'عرض الكل' : 'See All'}
                </Text>
              </TouchableOpacity>
            </View>

            {loadingServices ? (
              <View style={{ paddingVertical: 35, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingRight: isRTL ? 4 : 16,
                  paddingLeft: isRTL ? 16 : 4,
                  paddingVertical: 6,
                }}
              >
                {recommendedServices.map(service => {
                  const imageUrl =
                    service.images && service.images.length > 0
                      ? getServiceImageUrl(service.images[0])
                      : '';
                  const serviceName = isRTL
                    ? service.nameAr || service.name
                    : service.name;
                  const vendorName = service.vendor?.name || '';

                  // Robust discount & sale price calculation
                  const hasDiscount =
                    Boolean(service.isOnSale) &&
                    ((Boolean(service.salePrice) &&
                      service.salePrice! > 0 &&
                      service.salePrice! < service.price) ||
                      (Boolean(service.discountPercentage) &&
                        service.discountPercentage! > 0));

                  let finalSalePrice = service.price;
                  let discountPercent = 0;

                  if (hasDiscount) {
                    if (
                      service.salePrice &&
                      service.salePrice > 0 &&
                      service.salePrice < service.price
                    ) {
                      finalSalePrice = service.salePrice;
                      discountPercent = Math.round(
                        ((service.price - service.salePrice) / service.price) *
                          100,
                      );
                    } else if (
                      service.discountPercentage &&
                      service.discountPercentage > 0
                    ) {
                      discountPercent = service.discountPercentage;
                      finalSalePrice =
                        service.price * (1 - service.discountPercentage / 100);
                    }
                  }

                  const isDiscountValid =
                    hasDiscount &&
                    finalSalePrice > 0 &&
                    finalSalePrice < service.price;

                  return (
                    <TouchableOpacity
                      key={service._id}
                      style={{
                        width: cardWidth,
                        backgroundColor: '#FFFFFF',
                        borderRadius: 18,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: 'rgba(44, 95, 93, 0.12)',
                        marginRight: isRTL ? 0 : 12,
                        marginLeft: isRTL ? 12 : 0,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.05,
                        shadowRadius: 8,
                        elevation: 3,
                      }}
                      activeOpacity={0.88}
                      onPress={() => handleServiceClick(service._id)}
                    >
                      <View style={{ position: 'relative' }}>
                        <Image
                          source={
                            imageUrl
                              ? { uri: imageUrl }
                              : require('../../imgs/user.png')
                          }
                          style={{
                            width: '100%',
                            height: 110,
                            backgroundColor: '#F1F5F9',
                          }}
                          resizeMode="cover"
                        />

                        {/* App Theme Styled Rating Badge */}
                        {service.rating ? (
                          <View
                            style={{
                              position: 'absolute',
                              top: 6,
                              left: isRTL ? undefined : 6,
                              right: isRTL ? 6 : undefined,
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              borderWidth: 1,
                              borderColor: 'rgba(44, 95, 93, 0.15)',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 10,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            <Icon name="star" size={11} color={colors.primary} />
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: '700',
                                color: colors.primaryDark,
                              }}
                            >
                              {service.rating.toFixed(1)}
                            </Text>
                          </View>
                        ) : null}

                        {/* App Theme Styled Sale / Discount Badge */}
                        {isDiscountValid && (
                          <View
                            style={{
                              position: 'absolute',
                              top: 6,
                              right: isRTL ? undefined : 6,
                              left: isRTL ? 6 : undefined,
                              backgroundColor: colors.primary,
                              paddingHorizontal: 7,
                              paddingVertical: 3,
                              borderRadius: 10,
                              shadowColor: colors.primary,
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.2,
                              shadowRadius: 4,
                              elevation: 2,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 9,
                                fontWeight: '800',
                                color: '#FFFFFF',
                              }}
                            >
                              {discountPercent}% {isRTL ? 'خصم' : 'OFF'}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={{ padding: 10 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '700',
                            color: '#0F172A',
                            marginBottom: 2,
                            textAlign: isRTL ? 'right' : 'left',
                          }}
                          numberOfLines={1}
                        >
                          {serviceName}
                        </Text>

                        {vendorName ? (
                          <Text
                            style={{
                              fontSize: 10,
                              color: '#64748B',
                              marginBottom: 6,
                              textAlign: isRTL ? 'right' : 'left',
                            }}
                            numberOfLines={1}
                          >
                            {vendorName}
                          </Text>
                        ) : null}

                        {/* Pricing section with Sale Price and Original Price crossed out */}
                        <View
                          style={{
                            flexDirection: isRTL ? 'row-reverse' : 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 2,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: 'column',
                              alignItems: isRTL ? 'flex-end' : 'flex-start',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: '800',
                                color: colors.primary,
                              }}
                            >
                              {(isDiscountValid ? finalSalePrice : service.price).toFixed(3)}{' '}
                              {isRTL ? 'د.ك' : 'KD'}
                            </Text>

                            {isDiscountValid ? (
                              <Text
                                style={{
                                  fontSize: 10,
                                  color: '#94A3B8',
                                  textDecorationLine: 'line-through',
                                  fontWeight: '500',
                                  marginTop: -1,
                                }}
                              >
                                {service.price.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                              </Text>
                            ) : null}
                          </View>

                          <View
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: colors.primary,
                              alignItems: 'center',
                              justifyContent: 'center',
                              shadowColor: colors.primary,
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.2,
                              shadowRadius: 3,
                              elevation: 2,
                            }}
                          >
                            <Icon
                              name={isRTL ? 'arrow-back' : 'arrow-forward'}
                              size={14}
                              color="#FFFFFF"
                            />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </ScrollView>

        {/* Modal for Service Details Fallback */}
        {selectedServiceId && (
          <Modal
            visible={!!selectedServiceId}
            animationType="slide"
            transparent={false}
            statusBarTranslucent={true}
            onRequestClose={() => setSelectedServiceId(null)}
          >
            <ServiceDetails
              serviceId={selectedServiceId}
              onBack={() => setSelectedServiceId(null)}
              onNavigate={route => {
                setSelectedServiceId(null);
                if (onNavigate) onNavigate(route);
              }}
            />
          </Modal>
        )}
      </View>
    </>
  );
};
