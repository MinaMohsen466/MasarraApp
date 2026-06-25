import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StatusBar, BackHandler, PanResponder, Dimensions } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useSiteSettings } from "./src/hooks/useSiteSettings";
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { LanguageProvider, useLanguage } from "./src/contexts/LanguageContext";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { SocketProvider, useSocket } from "./src/contexts/SocketContext";
import { DateProvider } from "./src/contexts/DateContext";
import { NotificationProvider, useNotification, renderNotificationText } from "./src/contexts/NotificationContext";
import { CustomAlert } from "./src/components/CustomAlert/CustomAlert";
import AsyncStorage from "@react-native-async-storage/async-storage";
import colors from './src/constants/colors';
import { AppState, AppStateStatus } from 'react-native';

// Set up AppState listener for React Query to refetch on app foreground
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
    handleFocus(state === 'active');
  });
  return () => {
    subscription.remove();
  };
});

// Components
import Header from "./src/components/header/Header";
import BottomNavigation from "./src/components/BottomNavigation";
import Occasions from "./src/components/Occasions";
import Packages from "./src/components/Packages";
import ServicesPage from "./src/components/ServicesPage";
import Vendors from "./src/components/Vendors";
import ServiceDetails from "./src/components/ServiceDetails";
import PackageDetails from "./src/components/PackageDetails";
import Home from "./src/screens/Home";
import Cart from "./src/screens/Cart";
import SplashScreen from "./src/components/SplashScreen";
import About from "./src/components/About";
import Terms from "./src/components/Terms";
import Privacy from "./src/components/Privacy";
import RefundPolicy from "./src/components/RefundPolicy";
import Addresses from "./src/components/Addresses";
import Search from "./src/screens/Search";
import Contact from "./src/screens/Contact";
import BecomeSeller from "./src/components/BecomeSeller";

// Helper component with auth
const AddressesWithAuth: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { token } = useAuth();
  return <Addresses onBack={onBack} token={token} />;
};

// Query client setup - Optimized for faster loading
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes stale time
      gcTime: 15 * 60 * 1000, // 15 minutes - keep cached data longer
      refetchOnWindowFocus: true, // Refetch on focus in mobile when stale
      refetchOnMount: false, // Don't refetch on mount if data exists
      refetchOnReconnect: true, // Only refetch on network reconnect
    },
  },
});

const SocketNotificationListener: React.FC<{
  setCurrentRoute: (route: string) => void;
}> = ({ setCurrentRoute }) => {
  const { socket } = useSocket();
  const { isRTL } = useLanguage();
  const { addNotification } = useNotification();
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationButtons, setNotificationButtons] = useState<any[]>([]);

  const showAlert = useCallback((title: string, message: string, buttons: any[]) => {
    setNotificationTitle(title);
    setNotificationMessage(message);
    setNotificationButtons(buttons);
    setNotificationVisible(true);
  }, []);

  useEffect(() => {
    if (!socket) {
      return () => {}; // Return dummy cleanup function to satisfy TS7030
    }

    // Legacy booking_notification handler
    const handleBookingNotification = (data: any) => {
      console.log('Received booking notification via socket:', data);
      
      const title = isRTL ? data.title : data.titleEn;
      const message = isRTL ? data.message : data.messageEn;
      
      // Save notification to history and show top banner
      addNotification({
        title: data.title || (isRTL ? 'إشعار الحجز' : 'Booking Notification'),
        titleEn: data.titleEn || 'Booking Notification',
        message: data.message || '',
        messageEn: data.messageEn || '',
        type: data.type || 'booking_notification',
        bookingId: data.bookingId || data.id
      }).catch(err => console.error('Failed to add socket booking notification:', err));

      const buttons: Array<{
        text: string;
        onPress?: () => void;
        style?: 'default' | 'cancel' | 'destructive';
      }> = [
        {
          text: isRTL ? 'إغلاق' : 'Close',
          style: 'cancel',
          onPress: () => {},
        }
      ];

      if (data.type === 'booking_confirmed') {
        buttons.unshift({
          text: isRTL ? 'عرض الطلب والدفع' : 'View Order & Pay',
          style: 'default',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('openOrderHistory', '1');
              setCurrentRoute('profile');
            } catch (err) {
              console.error('Error redirecting to order history:', err);
            }
          }
        });
      } else if (data.type === 'booking_created') {
        buttons.unshift({
          text: isRTL ? 'عرض حجوزاتي' : 'View My Bookings',
          style: 'default',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('openOrderHistory', '1');
              setCurrentRoute('profile');
            } catch (err) {
              console.error('Error redirecting to order history:', err);
            }
          }
        });
      }

      showAlert(title || 'Notification', message || '', buttons);
    };

    // Payment confirmed notification
    const handlePaymentConfirmed = (data: any) => {
      console.log('Payment confirmed notification:', data);
      const title = isRTL ? '✅ تم تأكيد الدفع' : '✅ Payment Confirmed';
      const message = isRTL
        ? (data.messageAr || 'تم تأكيد دفعك بنجاح! حجزك مؤكد الآن.')
        : (data.messageEn || 'Your payment was confirmed! Your booking is now confirmed.');
      
      // Save notification to history and show top banner
      addNotification({
        title: isRTL ? 'تم تأكيد الدفع' : 'Payment Confirmed',
        titleEn: 'Payment Confirmed',
        message: data.messageAr || 'تم تأكيد دفعك بنجاح! حجزك مؤكد الآن.',
        messageEn: data.messageEn || 'Your payment was confirmed! Your booking is now confirmed.',
        type: 'booking_payment_confirmed',
        bookingId: data.bookingId || data.id
      }).catch(err => console.error('Failed to add payment socket notification:', err));

      showAlert(title, message, [
        {
          text: isRTL ? 'عرض حجوزاتي' : 'View My Bookings',
          style: 'default',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('openOrderHistory', '1');
              setCurrentRoute('profile');
            } catch (err) {
              console.error('Error redirecting to order history:', err);
            }
          }
        },
        {
          text: isRTL ? 'إغلاق' : 'Close',
          style: 'cancel',
        }
      ]);
    };

    // Vendor confirmed notification
    const handleVendorConfirmed = (data: any) => {
      console.log('Vendor confirmed notification:', data);
      const title = isRTL ? '🎉 تم قبول الحجز' : '🎉 Booking Confirmed';
      const message = isRTL
        ? (data.messageAr || 'قبل البائع حجزك!')
        : (data.messageEn || 'Vendor confirmed your booking!');
      
      // Save notification to history and show top banner
      addNotification({
        title: isRTL ? 'تم قبول الحجز' : 'Booking Confirmed',
        titleEn: 'Booking Confirmed',
        message: data.messageAr || 'قبل البائع حجزك!',
        messageEn: data.messageEn || 'Vendor confirmed your booking!',
        type: 'booking_confirmed_by_vendor',
        bookingId: data.bookingId || data.id
      }).catch(err => console.error('Failed to add vendor confirmation socket notification:', err));

      const buttons: any[] = [
        {
          text: isRTL ? 'إغلاق' : 'Close',
          style: 'cancel',
        }
      ];

      if (data.requiresPayment) {
        buttons.unshift({
          text: isRTL ? 'الدفع الآن' : 'Pay Now',
          style: 'default',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('openOrderHistory', '1');
              setCurrentRoute('profile');
            } catch (err) {
              console.error('Error redirecting to order history:', err);
            }
          }
        });
      } else {
        buttons.unshift({
          text: isRTL ? 'عرض حجوزاتي' : 'View My Bookings',
          style: 'default',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('openOrderHistory', '1');
              setCurrentRoute('profile');
            } catch (err) {
              console.error('Error redirecting to order history:', err);
            }
          }
        });
      }

      showAlert(title, message, buttons);
    };

    // Unified notification handler for new server-generated notifications
    const handleNewServerNotification = (data: any) => {
      console.log('Received unified notification via socket:', data);
      if (!data) return;

      const { title, message } = renderNotificationText(data, isRTL);
      const { title: titleEn, message: messageEn } = renderNotificationText(data, false);

      addNotification({
        title,
        titleEn,
        message,
        messageEn,
        type: data.type || 'notification',
        bookingId: data.booking,
      }).catch(err => console.error('Failed to add socket notification:', err));

      const buttons: Array<{
        text: string;
        onPress?: () => void;
        style?: 'default' | 'cancel' | 'destructive';
      }> = [
        {
          text: isRTL ? 'إغلاق' : 'Close',
          style: 'cancel',
          onPress: () => {},
        }
      ];

      // If it's related to bookings, allow direct navigation to bookings screen
      if (
        data.type === 'booking_confirmed' ||
        data.type === 'new_booking' ||
        data.type === 'booking_payment_confirmed'
      ) {
        buttons.unshift({
          text: isRTL ? 'عرض حجوزاتي' : 'View My Bookings',
          style: 'default',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('openOrderHistory', '1');
              setCurrentRoute('profile');
            } catch (err) {
              console.error('Error redirecting to order history:', err);
            }
          }
        });
      }

      showAlert(title, message, buttons);
    };

    socket.on('booking_notification', handleBookingNotification);
    socket.on('booking_payment_confirmed', handlePaymentConfirmed);
    socket.on('booking_confirmed_by_vendor', handleVendorConfirmed);
    socket.on('notification:new', handleNewServerNotification);

    return () => {
      socket.off('booking_notification', handleBookingNotification);
      socket.off('booking_payment_confirmed', handlePaymentConfirmed);
      socket.off('booking_confirmed_by_vendor', handleVendorConfirmed);
      socket.off('notification:new', handleNewServerNotification);
    };
  }, [socket, isRTL, setCurrentRoute, showAlert, addNotification]);

  return (
    <CustomAlert
      visible={notificationVisible}
      title={notificationTitle}
      message={notificationMessage}
      buttons={notificationButtons}
      onClose={() => setNotificationVisible(false)}
    />
  );
};

function AppContent() {
  const { data: siteSettings } = useSiteSettings();
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [showBottomNav, setShowBottomNav] = useState<boolean>(true);
  const [selectedVendorId, setSelectedVendorId] = useState<string | undefined>(undefined);
  const [selectedVendorName, setSelectedVendorName] = useState<string | undefined>(undefined);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);
  const [selectedServiceOrigin, setSelectedServiceOrigin] = useState<'home' | 'services' | 'vendor-services' | 'occasion-services' | 'cart' | undefined>(undefined);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>(undefined);
  const [selectedPackageOrigin, setSelectedPackageOrigin] = useState<'packages' | 'vendor-services' | 'cart' | undefined>(undefined);
  const [selectedOccasionId, setSelectedOccasionId] = useState<string | undefined>(undefined);
  const [selectedOccasionName, setSelectedOccasionName] = useState<string | undefined>(undefined);
  const [selectedOccasionOrigin, setSelectedOccasionOrigin] = useState<'home' | 'occasions' | undefined>(undefined);
  const [selectedSearchDate, setSelectedSearchDate] = useState<Date | undefined>(undefined);
  const [editCartItemId, setEditCartItemId] = useState<string | undefined>(undefined);
  const [becomeSellerOrigin, setBecomeSellerOrigin] = useState<string | undefined>(undefined);

  const { checkBookingsStatusChanges, registerNavigationHandler } = useNotification();
  const { token, user } = useAuth();
  const prevUserRef = useRef(user);

  useEffect(() => {
    if (prevUserRef.current && !user) {
      setCurrentRoute('home');
    }
    // Check if the user just logged in (transitioned from null to object)
    if (!prevUserRef.current && user) {
      AsyncStorage.getItem('redirectToRoute').then((route) => {
        if (route) {
          AsyncStorage.removeItem('redirectToRoute');
          setCurrentRoute(route);
        }
      }).catch(err => console.error('Failed to get redirect route', err));
    }
    prevUserRef.current = user;
  }, [user]);

  // Register navigation handler
  useEffect(() => {
    registerNavigationHandler(handleNavigation);
  }, [registerNavigationHandler]);

  // Check booking status changes when app starts or foregrounds
  useEffect(() => {
    if (!token) {
      return () => {};
    }

    checkBookingsStatusChanges(token);

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkBookingsStatusChanges(token);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [token, checkBookingsStatusChanges]);

  const handleNavigation = (route: string) => {
    if (route === 'become-seller') {
      setBecomeSellerOrigin(currentRoute);
    }
    setCurrentRoute(route);
  };

  const handleBack = useCallback(() => {
    // Handle back navigation based on current route
    if (currentRoute === 'service-details') {
      // Route back based on where the service was opened from
      switch (selectedServiceOrigin) {
        case 'home':
          setCurrentRoute('home');
          break;
        case 'occasion-services':
          setCurrentRoute('occasion-services');
          break;
        case 'vendor-services':
          setCurrentRoute('vendor-services');
          break;
        case 'cart':
          setCurrentRoute('cart');
          break;
        case 'services':
        default:
          setCurrentRoute('services');
          break;
      }
      setSelectedServiceId(undefined);
      setSelectedServiceOrigin(undefined);
      setEditCartItemId(undefined);
    } else if (currentRoute === 'package-details') {
      // Route back based on where the package was opened from
      if (selectedPackageOrigin === 'packages') {
        setCurrentRoute('packages');
      } else if (selectedPackageOrigin === 'vendor-services') {
        setCurrentRoute('vendor-services');
      } else if (selectedPackageOrigin === 'cart') {
        setCurrentRoute('cart');
      } else {
        setCurrentRoute('home');
      }
      setSelectedPackageId(undefined);
      setSelectedPackageOrigin(undefined);
      setEditCartItemId(undefined);
    } else if (currentRoute === 'occasion-services') {
      // Go back to the origin (home or occasions)
      if (selectedOccasionOrigin === 'home') {
        setCurrentRoute('home');
      } else {
        setCurrentRoute('occasions');
      }
      setSelectedOccasionId(undefined);
      setSelectedOccasionName(undefined);
      setSelectedOccasionOrigin(undefined);
    } else if (currentRoute === 'vendor-services') {
      setCurrentRoute('vendors');
      setSelectedVendorId(undefined);
      setSelectedVendorName(undefined);
    } else if (currentRoute === 'addresses') {
      setCurrentRoute('profile');
    } else if (currentRoute === 'become-seller') {
      setCurrentRoute(becomeSellerOrigin || 'home');
      setBecomeSellerOrigin(undefined);
    } else {
      setCurrentRoute('home');
    }
  }, [currentRoute, selectedServiceOrigin, selectedPackageOrigin, selectedOccasionOrigin, becomeSellerOrigin]);

  // Keep references to latest route and back handler for PanResponder to prevent stale state issues
  const currentRouteRef = useRef(currentRoute);
  const handleBackRef = useRef(handleBack);

  useEffect(() => {
    currentRouteRef.current = currentRoute;
    handleBackRef.current = handleBack;
  }, [currentRoute, handleBack]);

  // Initialize Android back button/gesture handling
  useEffect(() => {
    const handleHardwareBack = () => {
      if (currentRoute === 'home') {
        return false; // Exit app
      }
      handleBack();
      return true; // Intercept
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleHardwareBack
    );

    return () => {
      subscription.remove();
    };
  }, [currentRoute, handleBack]);

  // Initialize edge swipe-back gesture responder
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { x0, dx, dy } = gestureState;

        if (currentRouteRef.current === 'home') {
          return false;
        }

        // Swipe from left edge (LTR back gesture)
        const isNearLeftEdge = x0 < 40;
        // Swipe from right edge (RTL back gesture)
        const isNearRightEdge = x0 > SCREEN_WIDTH - 40;

        // Must be horizontal gesture: moved more than 10px horizontally and horizontal movement is dominant
        const isHorizontalMove = Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5;

        return (isNearLeftEdge && dx > 0 && isHorizontalMove) ||
               (isNearRightEdge && dx < 0 && isHorizontalMove);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { x0, dx } = gestureState;
        const isNearLeftEdge = x0 < 40;
        const isNearRightEdge = x0 > SCREEN_WIDTH - 40;

        if (isNearLeftEdge && dx > 50) {
          handleBackRef.current();
        } else if (isNearRightEdge && dx < -50) {
          handleBackRef.current();
        }
      },
      onPanResponderTerminate: () => {},
    })
  ).current;

  const handleVendorSelect = (vendorId: string, vendorName: string) => {
    setSelectedVendorId(vendorId);
    setSelectedVendorName(vendorName);
    setCurrentRoute('vendor-services');
  };

  const handleServiceSelect = (serviceId: string, origin?: 'home' | 'services' | 'vendor-services' | 'occasion-services') => {
    setSelectedServiceId(serviceId);
    setSelectedServiceOrigin(origin);
    setCurrentRoute('service-details');
  };

  const handlePackageSelect = (packageId: string, origin?: 'packages' | 'vendor-services') => {
    setSelectedPackageId(packageId);
    setSelectedPackageOrigin(origin);
    setCurrentRoute('package-details');
  };

  const handleOccasionSelect = (occasionId: string, occasionName: string, origin?: 'home' | 'occasions', searchDate?: Date) => {
    if (!occasionId) return;
    setSelectedOccasionId(occasionId);
    setSelectedOccasionName(occasionName);
    setSelectedOccasionOrigin(origin);
    setSelectedSearchDate(searchDate);
    setCurrentRoute('occasion-services');
  };

  const renderScreen = () => {
    switch (currentRoute) {
      case 'home':
      case 'auth':
      case 'profile':
        return (
          <Home
            onNavigate={handleNavigation}
            currentRoute={currentRoute}
            onSelectService={(serviceId) => handleServiceSelect(serviceId, 'home')}
            onSelectOccasion={(occasion, searchDate) => handleOccasionSelect(occasion._id, occasion.name || occasion.nameAr, 'home', searchDate)}
            isBannerDismissed={isBannerDismissed}
            setIsBannerDismissed={setIsBannerDismissed}
          />
        );
      case 'search':
        return (
          <Search
            onBack={handleBack}
            onSelectService={(serviceId) => handleServiceSelect(serviceId, 'services')}
            onSelectOccasion={(occasion) => handleOccasionSelect(occasion._id, occasion.name || occasion.nameAr, 'occasions')}
          />
        );
      case 'occasions':
      case 'categories':
        return (
          <Occasions
            onSelectOccasion={(occasion) => handleOccasionSelect(occasion._id, occasion.name || occasion.nameAr, 'occasions')}
            onBack={handleBack}
          />
        );
      case 'packages':
        return <Packages onBack={handleBack} onSelectPackage={(pkg) => handlePackageSelect(pkg._id, 'packages')} />;
      case 'occasion-services':
        return (
          <ServicesPage
            onSelectService={(service) => handleServiceSelect(service._id, 'occasion-services')}
            onBack={handleBack}
            occasionId={selectedOccasionId}
            occasionName={selectedOccasionName}
            preSelectedDate={selectedSearchDate}
          />
        );
      case 'services':
        return (
          <ServicesPage
            onSelectService={(service) => handleServiceSelect(service._id, 'services')}
            onBack={handleBack}
          />
        );
      case 'vendors':
        return (
          <Vendors
            onSelectVendor={handleVendorSelect}
            onBack={handleBack}
          />
        );
      case 'vendor-services':
        return (
          <ServicesPage
            onSelectService={(service) => handleServiceSelect(service._id, 'vendor-services')}
            onSelectPackage={(pkg) => handlePackageSelect(pkg._id, 'vendor-services')}
            onBack={handleBack}
            vendorId={selectedVendorId}
            vendorName={selectedVendorName}
          />
        );
      case 'service-details':
        return (
          <ServiceDetails
            serviceId={selectedServiceId!}
            onBack={handleBack}
            onNavigate={handleNavigation}
            editCartItemId={editCartItemId}
          />
        );
      case 'package-details':
        return (
          <PackageDetails
            packageId={selectedPackageId!}
            onBack={handleBack}
            onNavigate={handleNavigation}
            editCartItemId={editCartItemId}
          />
        );
      case 'cart':
        return (
          <Cart
            onBack={handleBack}
            onNavigate={handleNavigation}
            onEditService={(serviceId, cartItemId) => {
              setSelectedServiceId(serviceId);
              setEditCartItemId(cartItemId);
              setSelectedServiceOrigin('cart');
              setCurrentRoute('service-details');
            }}
            onEditPackage={(packageId, cartItemId) => {
              setSelectedPackageId(packageId);
              setEditCartItemId(cartItemId);
              setSelectedPackageOrigin('cart');
              setCurrentRoute('package-details');
            }}
          />
        );
      case 'about':
        return <About onBack={handleBack} />;
      case 'contact':
        return (
          <Contact
            onBack={handleBack}
            onShowChat={() => setShowBottomNav(false)}
            onHideChat={() => setShowBottomNav(true)}
          />
        );
      case 'addresses':
        return <AddressesWithAuth onBack={handleBack} />;
      case 'terms':
        return <Terms onBack={handleBack} />;
      case 'privacy':
        return <Privacy onBack={handleBack} />;
      case 'refund':
        return <RefundPolicy onBack={handleBack} />;
      case 'become-seller':
        return <BecomeSeller onBack={handleBack} />;
      default:
        return <Home onNavigate={handleNavigation} currentRoute={currentRoute} onSelectService={() => { }} onSelectOccasion={() => { }} />;
    }
  };

  const routesWithoutHeader = ['home', 'occasions', 'packages', 'categories', 'services', 'vendors', 'vendor-services', 'occasion-services', 'service-details', 'package-details', 'cart', 'about', 'terms', 'privacy', 'refund', 'contact', 'profile', 'addresses', 'search', 'auth', 'become-seller'];
  const shouldShowHeader = !routesWithoutHeader.includes(currentRoute);

  const routesWithoutSafeArea = ['about', 'terms', 'privacy', 'refund', 'contact', 'service-details', 'package-details', 'cart', 'profile', 'search', 'addresses', 'auth', 'become-seller'];
  const shouldRenderWithoutSafeArea = routesWithoutSafeArea.includes(currentRoute);

  const isBannerVisible = siteSettings?.bannerEnabled && !isBannerDismissed;
  const isBannerShownOnScreen = isBannerVisible && (currentRoute === 'home' || shouldShowHeader);
  const dynamicBgColor = isBannerShownOnScreen
    ? "#00a19c"
    : ['services', 'occasion-services', 'vendor-services', 'packages', 'vendors', 'occasions'].includes(currentRoute)
      ? colors.background
      : colors.backgroundHome;

  return (
    <SocketProvider>
      <SocketNotificationListener setCurrentRoute={setCurrentRoute} />
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : shouldRenderWithoutSafeArea ? (
        <View style={{ flex: 1 }} {...panResponder.panHandlers}>
          {renderScreen()}
          {showBottomNav && currentRoute !== 'cart' && currentRoute !== 'auth' && (
            <>
              <BottomNavigation
                activeRoute={currentRoute}
                onNavigate={handleNavigation}
              />
              <View style={{ height: 20, backgroundColor: colors.backgroundHome }} />
            </>
          )}
        </View>
      ) : (
        <SafeAreaView style={{ flex: 1, backgroundColor: dynamicBgColor }}>
          <StatusBar backgroundColor="#00a19c" barStyle="light-content" translucent={false} />
          {shouldShowHeader && <Header onNavigate={handleNavigation} />}
          <View style={{ flex: 1 }} {...panResponder.panHandlers}>
            {renderScreen()}
          </View>
          {showBottomNav && currentRoute !== 'auth' && (
            <>
              <BottomNavigation
                activeRoute={currentRoute}
                onNavigate={handleNavigation}
              />
              <View style={{ height: 20, backgroundColor: '#ffffff' }} />
            </>
          )}
        </SafeAreaView>
      )}
    </SocketProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <LanguageProvider>
          <NotificationProvider>
            <AuthProvider>
              <DateProvider>
                <AppContent />
              </DateProvider>
            </AuthProvider>
          </NotificationProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

export default App;
