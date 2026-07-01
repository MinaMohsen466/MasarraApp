import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingProps {
  onFinish: (targetRoute: 'home' | 'auth' | 'signup') => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onFinish }) => {
  const { isRTL, language, setLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const slides = [
    {
      titleEn: 'Endless Service Diversity',
      titleAr: 'تنوع غير محدود للخدمات',
      descEn: 'Browse hundreds of carefully selected services and vendors to organize your event details with ease.',
      descAr: 'تصفح مئات الخدمات ومزودي الخدمة المختارين بعناية لتغطية كافة تفاصيل مناسبتك وتنظيمها بكل يسر وسهولة.',
      icon: 'sparkles-outline',
    },
    {
      titleEn: 'Exclusive Packages & Prices',
      titleAr: 'باقات وأسعار حصرية',
      descEn: 'Enjoy customized packages designed for your budget with secure online payment and instant booking confirmation.',
      descAr: 'استمتع بعروض وباقات مصممة خصيصاً لتناسب ميزانيتك مع إمكانية الدفع الإلكتروني الآمن وتأكيد الحجز الفوري.',
      icon: 'pricetags-outline',
    },
    {
      titleEn: 'Smart & Reliable Booking',
      titleAr: 'إدارة ذكية وحجز موثوق',
      descEn: 'Chat directly with vendors, track your order statuses and booking updates in real-time from a single place.',
      descAr: 'تواصل مباشرة مع مزودي الخدمة، وتابع حالة طلباتك وتحديثات حجوزاتك لحظة بلحظة من مكان واحد.',
      icon: 'chatbubbles-outline',
    },
  ];

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleMomentumScrollEnd = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / SCREEN_WIDTH);
    setActiveSlide(index);
  };

  const renderSlideItem = ({ item }: { item: typeof slides[0] }) => {
    const title = isRTL ? item.titleAr : item.titleEn;
    const desc = isRTL ? item.descAr : item.descEn;

    return (
      <View style={styles.slideWrapper}>
        <View style={styles.glassCard}>
          {/* Glowing Icon Circular Container */}
          <View style={styles.iconCircle}>
            <Icon name={item.icon} size={42} color="#00a19c" />
          </View>

          {/* Text Content */}
          <Text style={[styles.slideTitle, isRTL && styles.arabicFont]}>
            {title}
          </Text>
          <Text style={[styles.slideDesc, isRTL && styles.arabicFont]}>
            {desc}
          </Text>
        </View>
      </View>
    );
  };

  // Align vertical level exactly with Sign In & Sign Up: insets.top > 24 ? insets.top - 4 : 12
  const topPadding = insets.top > 24 ? insets.top - 12 : 8;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Background Decorative Glow Circles */}
      <View style={styles.glowCircleTopLeft} />
      <View style={styles.glowCircleBottomRight} />

      {/* Top Header - Language Toggle */}
      <View style={[styles.headerBar, isRTL && styles.headerBarRTL]}>
        <TouchableOpacity
          style={styles.languagePill}
          onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          activeOpacity={0.8}
        >
          <Icon name="globe-outline" size={16} color="#FFFFFF" />
          <Text style={[styles.languageText, isRTL && styles.arabicFont]}>
            {language === 'ar' ? 'English' : 'العربية'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Slideshow Container */}
      <View style={styles.carouselContainer}>
        <FlatList
          data={slides}
          renderItem={renderSlideItem}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          contentContainerStyle={styles.listContent}
        />
      </View>

      {/* Footer Area - Indicators & Buttons */}
      <View style={[styles.footerContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24 }]}>
        {/* Animated Page Dot Indicators */}
        <View style={[styles.indicatorWrapper, isRTL && styles.indicatorWrapperRTL]}>
          {slides.map((_, index) => {
            const width = scrollX.interpolate({
              inputRange: [
                (index - 1) * SCREEN_WIDTH,
                index * SCREEN_WIDTH,
                (index + 1) * SCREEN_WIDTH,
              ],
              outputRange: [8, 22, 8],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange: [
                (index - 1) * SCREEN_WIDTH,
                index * SCREEN_WIDTH,
                (index + 1) * SCREEN_WIDTH,
              ],
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.indicatorDot,
                  { width, opacity },
                  activeSlide === index && { backgroundColor: '#00a19c' },
                ]}
              />
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <View style={[styles.rowButtons, isRTL && styles.rowButtonsRTL]}>
            <TouchableOpacity
              style={[styles.btn, styles.btnOutline]}
              onPress={() => onFinish('auth')}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnOutlineText, isRTL && styles.arabicFont]}>
                {isRTL ? 'تسجيل الدخول' : 'Log In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => onFinish('signup')}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnPrimaryText, isRTL && styles.arabicFont]}>
                {isRTL ? 'إنشاء حساب' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Guest Link - Forced onto a Single Line */}
          <TouchableOpacity
            style={styles.btnText}
            onPress={() => onFinish('home')}
            activeOpacity={0.7}
          >
            <View style={styles.singleLineWrapper}>
              <Text
                style={[styles.btnTextLabel, isRTL && styles.arabicFont]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {isRTL ? 'تابع التسوق كزائر' : 'Continue as Guest'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c2120', // Premium dark teal background
  },
  glowCircleTopLeft: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.primary,
    opacity: 0.15,
  },
  glowCircleBottomRight: {
    position: 'absolute',
    bottom: 80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.primaryLight,
    opacity: 0.1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    height: 48,
    alignItems: 'center',
    zIndex: 10,
  },
  headerBarRTL: {
    flexDirection: 'row-reverse',
  },
  languagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  languageText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    alignItems: 'center',
  },
  slideWrapper: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  glassCard: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 28,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 24,
    paddingVertical: 36,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  slideTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  slideDesc: {
    fontSize: 14.5,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  footerContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  indicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  indicatorWrapperRTL: {
    flexDirection: 'row-reverse',
  },
  indicatorDot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 4,
  },
  actionButtons: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  rowButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  rowButtonsRTL: {
    flexDirection: 'row-reverse',
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  btnOutlineText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnPrimary: {
    backgroundColor: '#00a19c',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnText: {
    paddingVertical: 10,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  singleLineWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  btnTextLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  arabicFont: {
    fontFamily: 'System',
  },
});
