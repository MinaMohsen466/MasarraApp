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
  },
  ar: {
    // Header
    appName: 'Masarra',
    
    // Drawer Menu Items
    home: 'الرئيسية',
    occasions: 'المناسبات',
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
