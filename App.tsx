import React, { useState } from "react";
import { View, StatusBar } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from "./src/contexts/LanguageContext";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { SocketProvider } from "./src/contexts/SocketContext";
import colors from './src/constants/colors';

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
import Addresses from "./src/components/Addresses";
import Search from "./src/screens/Search";
import Contact from "./src/screens/Contact";

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
      staleTime: 10 * 60 * 1000, // 10 minutes - longer stale time
      cacheTime: 15 * 60 * 1000, // 15 minutes - keep cached data longer
      refetchOnWindowFocus: false, // Don't refetch on focus in mobile
      refetchOnMount: false, // Don't refetch on mount if data exists
      refetchOnReconnect: true, // Only refetch on network reconnect
    },
  },
});

function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [showBottomNav, setShowBottomNav] = useState<boolean>(true);
  const [selectedVendorId, setSelectedVendorId] = useState<string | undefined>(undefined);
  const [selectedVendorName, setSelectedVendorName] = useState<string | undefined>(undefined);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);
  const [selectedServiceOrigin, setSelectedServiceOrigin] = useState<'home' | 'services' | 'vendor-services' | 'occasion-services' | undefined>(undefined);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>(undefined);
  const [selectedPackageOrigin, setSelectedPackageOrigin] = useState<'packages' | 'vendor-services' | undefined>(undefined);
  const [selectedOccasionId, setSelectedOccasionId] = useState<string | undefined>(undefined);
  const [selectedOccasionName, setSelectedOccasionName] = useState<string | undefined>(undefined);
  const [selectedOccasionOrigin, setSelectedOccasionOrigin] = useState<'home' | 'occasions' | undefined>(undefined);

  const handleNavigation = (route: string) => {
    setCurrentRoute(route);
  };

  const handleBack = () => {
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
        case 'services':
        default:
          setCurrentRoute('services');
          break;
      }
      setSelectedServiceId(undefined);
      setSelectedServiceOrigin(undefined);
    } else if (currentRoute === 'package-details') {
      // Route back based on where the package was opened from
      if (selectedPackageOrigin === 'packages') {
        setCurrentRoute('packages');
      } else if (selectedPackageOrigin === 'vendor-services') {
        setCurrentRoute('vendor-services');
      } else {
        setCurrentRoute('home');
      }
      setSelectedPackageId(undefined);
      setSelectedPackageOrigin(undefined);
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
    } else {
      setCurrentRoute('home');
    }
  };

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

  const handleOccasionSelect = (occasionId: string, occasionName: string, origin?: 'home' | 'occasions') => {
    if (!occasionId) return;
    setSelectedOccasionId(occasionId);
    setSelectedOccasionName(occasionName);
    setSelectedOccasionOrigin(origin);
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
            onSelectOccasion={(occasion) => handleOccasionSelect(occasion._id, occasion.name || occasion.nameAr, 'home')} 
            onShowChat={() => setShowBottomNav(false)} 
            onHideChat={() => setShowBottomNav(true)} 
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
          />
        );
      case 'package-details':
        return (
          <PackageDetails 
            packageId={selectedPackageId!}
            onBack={handleBack}
          />
        );
      case 'cart':
        return (
          <Cart 
            onBack={handleBack}
            onNavigate={handleNavigation}
            onViewDetails={(serviceId) => handleServiceSelect(serviceId, 'services')}
          />
        );
      case 'about':
        return <About onBack={handleBack} />;
      case 'contact':
        return <Contact onBack={handleBack} />;
      case 'addresses':
        return <AddressesWithAuth onBack={handleBack} />;
      case 'terms':
        return <Terms onBack={handleBack} />;
      case 'privacy':
        return <Privacy onBack={handleBack} />;
      default:
        return <Home onNavigate={handleNavigation} />;
    }
  };

  const routesWithoutHeader = ['occasions', 'packages', 'categories', 'services', 'vendors', 'vendor-services', 'occasion-services', 'service-details', 'package-details', 'cart', 'about', 'terms', 'privacy', 'contact', 'profile', 'addresses', 'search'];
  const shouldShowHeader = !routesWithoutHeader.includes(currentRoute);
  
  const routesWithoutSafeArea = ['about', 'terms', 'privacy', 'contact', 'service-details', 'cart', 'profile', 'search'];
  const shouldRenderWithoutSafeArea = routesWithoutSafeArea.includes(currentRoute);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar backgroundColor={colors.backgroundHome} barStyle="dark-content" translucent={false} />
        <LanguageProvider>
          <AuthProvider onLogout={() => setCurrentRoute('home')}>
            <SocketProvider>
              {showSplash ? (
                <SplashScreen onFinish={() => setShowSplash(false)} />
              ) : shouldRenderWithoutSafeArea ? (
                <View style={{ flex: 1, paddingTop: currentRoute === 'search' ? 40 : 0 }}>
                  {renderScreen()}
                  {showBottomNav && (
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
                <SafeAreaView style={{ flex: 1, backgroundColor: colors.backgroundHome }}>
                  {shouldShowHeader && <Header onNavigate={handleNavigation} />}
                  <View style={{ flex: 1 }}>
                    {renderScreen()}
                  </View>
                  {showBottomNav && (
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
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

export default App;
