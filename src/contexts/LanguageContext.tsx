import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { I18nManager } from 'react-native';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  isRTL: boolean;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Header
    appName: 'Masarra',
    
    // Drawer Menu Items
    home: 'Home',
    occasions: 'Occasions',
    packages: 'Packages',
    aboutUs: 'About Us',
    myAccount: 'My Account',
    termsConditions: 'Terms & Conditions',
    privacyPolicy: 'Privacy Policy',
    contact: 'Contact',
    settings: 'Settings',
    switchToArabic: 'عربي',
    switchToEnglish: 'English',
    logIn: 'Log In',
    logOut: 'Log Out',
    
    // Tagline
    tagline: 'Your occasion on us',
    
    // Occasions Page
    loadingOccasions: 'Loading occasions...',
    failedToLoad: 'Failed to load occasions',
    noOccasionsAvailable: 'No occasions available',
    
    // Cart Page
    myCart: 'MY CART',
    loading: 'Loading...',
    cartEmpty: 'Cart is empty',
    confirmDelete: 'Confirm',
    removeItemMessage: 'Remove this item from cart?',
    cancel: 'Cancel',
    remove: 'Remove',
    amount: 'Amount',
    deliveryCharges: 'Delivery Charges',
    afterConfirmation: 'After Confirmation',
    viewDetails: 'View Details',
    subTotal: 'Sub Total',
    totalDeliveryCharges: 'Total Delivery Charges',
    totalAmount: 'Total Amount',
    payNow: 'Pay Now',
    payableAfterConfirmation: 'Payable After Confirmation',
    checkout: 'Checkout',
    continueShopping: 'Continue Shopping',
    
    // Coupon
    couponCode: 'Coupon Code',
    enterCouponCode: 'Enter coupon code',
    apply: 'Apply',
    applyCoupon: 'Apply Coupon',
    removeCoupon: 'Remove',
    couponApplied: 'Coupon applied successfully!',
    discount: 'Discount',
    invalidCoupon: 'Invalid coupon code',
    couponError: 'Error applying coupon',
    enterCoupon: 'Please enter coupon code',
    pleaseLogin: 'Please login first',
    
    pastTimeWarning: '⚠ Past Time',
    oldBookingsAlert: '⚠ Alert: Old Bookings',
    oldBookingsMessage: 'You have {count} booking(s) with past date/time in your cart:\n\n{items}\n\nPlease update or remove these bookings.',
    ok: 'OK',
    error: 'Error',
    errorProcessingOrder: 'Error processing your order',
    someItemsUnavailable: 'Some Items Unavailable',
    unavailableItemsMessage: 'Some items in your cart are no longer available:\n\n{items}\n\nPlease remove them before proceeding.',
    bookingError: 'Booking Error',
    failedToCreateBookings: 'Failed to create some bookings:\n\n{items}',
    errorCreatingBookings: 'Error creating bookings',
    pleaseLoginToViewCart: 'Please login to view cart',
    login: 'Login',
  },
  ar: {
    // Header
    appName: 'Masarra',
    
    // Drawer Menu Items
    home: 'الرئيسية',
    occasions: 'المناسبات',
    packages: 'الباقات',
    aboutUs: 'من نحن',
    myAccount: 'حسابي',
    termsConditions: 'الشروط والأحكام',
    privacyPolicy: 'سياسة الخصوصية',
    contact: 'اتصل بنا',
    settings: 'الإعدادات',
    switchToArabic: 'عربي',
    switchToEnglish: 'English',
    logIn: 'تسجيل الدخول',
    logOut: 'تسجيل الخروج',
    
    // Tagline
    tagline: 'مناسبتك علينا',
    
    // Occasions Page
    loadingOccasions: 'جاري تحميل المناسبات...',
    failedToLoad: 'فشل في تحميل المناسبات',
    noOccasionsAvailable: 'لا توجد مناسبات متاحة',
    
    // Cart Page
    myCart: 'سلتي',
    loading: 'جاري التحميل...',
    cartEmpty: 'السلة فارغة',
    confirmDelete: 'تأكيد',
    removeItemMessage: 'هل تريد إزالة هذا العنصر من السلة؟',
    cancel: 'إلغاء',
    remove: 'إزالة',
    amount: 'المبلغ',
    deliveryCharges: 'رسوم التوصيل',
    afterConfirmation: 'بعد التأكيد',
    viewDetails: 'عرض التفاصيل',
    subTotal: 'المجموع الفرعي',
    totalDeliveryCharges: 'إجمالي رسوم التوصيل',
    totalAmount: 'المبلغ الإجمالي',
    payNow: 'الدفع الآن',
    payableAfterConfirmation: 'الدفع بعد التأكيد',
    checkout: 'إتمام الطلب',
    continueShopping: 'متابعة التسوق',
    
    // Coupon
    couponCode: 'رمز الكوبون',
    enterCouponCode: 'أدخل رمز الكوبون',
    apply: 'تطبيق',
    applyCoupon: 'تطبيق الكوبون',
    removeCoupon: 'إزالة',
    couponApplied: 'تم تطبيق الكوبون بنجاح!',
    discount: 'الخصم',
    invalidCoupon: 'رمز كوبون غير صالح',
    couponError: 'حدث خطأ أثناء تطبيق الكوبون',
    enterCoupon: 'الرجاء إدخال رمز الكوبون',
    pleaseLogin: 'الرجاء تسجيل الدخول أولاً',
    
    pastTimeWarning: '⚠ وقت قديم',
    oldBookingsAlert: '⚠ تنبيه: حجوزات قديمة',
    oldBookingsMessage: 'لديك {count} حجز(حجوزات) بتاريخ قديم في السلة:\n\n{items}\n\nالرجاء تحديث أو إزالة هذه الحجوزات.',
    ok: 'حسناً',
    error: 'خطأ',
    errorProcessingOrder: 'حدث خطأ أثناء معالجة الطلب',
    someItemsUnavailable: 'بعض العناصر غير متاحة',
    unavailableItemsMessage: 'بعض العناصر في سلتك لم تعد متاحة:\n\n{items}\n\nالرجاء إزالتها قبل المتابعة.',
    bookingError: 'خطأ في إنشاء الحجوزات',
    failedToCreateBookings: 'فشل إنشاء بعض الحجوزات:\n\n{items}',
    errorCreatingBookings: 'حدث خطأ أثناء إنشاء الحجوزات',
    pleaseLoginToViewCart: 'يجب تسجيل الدخول لعرض السلة',
    login: 'تسجيل الدخول',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);
  const isRTL = language === 'ar';

  // Load language from AsyncStorage on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('appLanguage');
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language from storage:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    
    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      await AsyncStorage.setItem('appLanguage', lang);
      // Note: For full RTL support, you may need to restart the app
    } catch (error) {
      console.error('Error saving language to storage:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  // Don't render until language is loaded from storage
  if (!isInitialized) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, isRTL, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
