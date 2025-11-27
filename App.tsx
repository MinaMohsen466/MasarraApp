import React, { useState } from "react";
import { View, StatusBar } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from "./src/components/header/Header";
import BottomNavigation from "./src/components/BottomNavigation";
import Occasions from "./src/components/Occasions";
import ServicesPage from "./src/components/ServicesPage";
import Vendors from "./src/components/Vendors";
import ServiceDetails from "./src/components/ServiceDetails";
import Home from "./src/screens/Home";
import Cart from "./src/screens/Cart";
import SplashScreen from "./src/components/SplashScreen";
import About from "./src/components/About";
import Terms from "./src/components/Terms";
import Privacy from "./src/components/Privacy";
import Addresses from "./src/components/Addresses";
import Search from "./src/screens/Search";
import Contact from "./src/screens/Contact";
import { useAuth } from "./src/contexts/AuthContext";

const AddressesWithAuth: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { token } = useAuth();
  return <Addresses onBack={onBack} token={token} />;
};
import { LanguageProvider } from "./src/contexts/LanguageContext";
import { AuthProvider } from "./src/contexts/AuthContext";
import colors from './src/constants/colors';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [selectedVendorId, setSelectedVendorId] = useState<string | undefined>(undefined);
  const [selectedVendorName, setSelectedVendorName] = useState<string | undefined>(undefined);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);
  const [selectedServiceOrigin, setSelectedServiceOrigin] = useState<'home' | 'services' | 'vendor-services' | 'occasion-services' | undefined>(undefined);
  const [selectedOccasionId, setSelectedOccasionId] = useState<string | undefined>(undefined);
  const [selectedOccasionName, setSelectedOccasionName] = useState<string | undefined>(undefined);
  const [selectedOccasionOrigin, setSelectedOccasionOrigin] = useState<'home' | 'occasions' | undefined>(undefined);

  const handleNavigation = (route: string) => {
    console.log('🧭 Navigating to:', route);
    setCurrentRoute(route);
  };

  const handleBack = () => {
    console.log('🔙 Going back');
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
    } else {
      setCurrentRoute('home');
    }
  };

  const handleVendorSelect = (vendorId: string, vendorName: string) => {
    console.log('🏪 Selected vendor:', vendorName, vendorId);
    setSelectedVendorId(vendorId);
    setSelectedVendorName(vendorName);
    setCurrentRoute('vendor-services');
  };

  const handleServiceSelect = (serviceId: string, origin?: 'home' | 'services' | 'vendor-services' | 'occasion-services') => {
    console.log('📦 Selected service:', serviceId, 'origin:', origin);
    setSelectedServiceId(serviceId);
    setSelectedServiceOrigin(origin);
    setCurrentRoute('service-details');
  };

  const handleOccasionSelect = (occasionId: string, occasionName: string, origin?: 'home' | 'occasions') => {
    console.log('🎉 Selected occasion:', { occasionId, occasionName, origin });
    if (!occasionId) {
      console.error('❌ Error: occasionId is empty');
      return;
    }
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
  return <Home onNavigate={handleNavigation} currentRoute={currentRoute} onSelectService={(serviceId) => handleServiceSelect(serviceId, 'home')} onSelectOccasion={(occasion) => handleOccasionSelect(occasion._id, occasion.name || occasion.nameAr, 'home')} />;
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
      case 'cart':
        return (
          <Cart 
            onBack={handleBack}
            onNavigate={handleNavigation}
            onViewDetails={(serviceId) => handleServiceSelect(serviceId, 'services')}
            onEdit={(cartItemId) => {
              console.log('Edit cart item:', cartItemId);
              // TODO: Implement edit functionality
            }}
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

  // Check if we should show the main header (hide on occasions, services, vendors, service-details, cart, about, terms, privacy and contact pages)
  // Hide main header on screens that provide their own headers or require a full-bleed layout
  const shouldShowHeader = currentRoute !== 'occasions' && currentRoute !== 'categories' && currentRoute !== 'services' && currentRoute !== 'vendors' && currentRoute !== 'vendor-services' && currentRoute !== 'occasion-services' && currentRoute !== 'service-details' && currentRoute !== 'cart' && currentRoute !== 'about' && currentRoute !== 'terms' && currentRoute !== 'privacy' && currentRoute !== 'contact' && currentRoute !== 'profile' && currentRoute !== 'addresses';
  
  // Check if we should render without SafeAreaView (for pages with custom safe areas like About, Terms, Privacy, Contact, Cart, and ServiceDetails)
  // Render without SafeAreaView for pages that provide their own header / handle notch themselves
  const shouldRenderWithoutSafeArea = currentRoute === 'about' || currentRoute === 'terms' || currentRoute === 'privacy' || currentRoute === 'contact' || currentRoute === 'service-details' || currentRoute === 'cart' || currentRoute === 'profile';

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        {/* Global StatusBar: keep a consistent status bar style across the app */}
        <StatusBar backgroundColor={colors.background} barStyle="dark-content" translucent={false} />
        <LanguageProvider>
          <AuthProvider onLogout={() => setCurrentRoute('home')}>
        {showSplash ? (
          <SplashScreen onFinish={() => setShowSplash(false)} />
        ) : shouldRenderWithoutSafeArea ? (
          <View style={{ flex: 1 }}>
            {renderScreen()}
            
            {/* Bottom Navigation */}
            <BottomNavigation 
              activeRoute={currentRoute}
              onNavigate={handleNavigation}
            />
          </View>
        ) : (
          <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
            {shouldShowHeader && <Header onNavigate={handleNavigation} />}
            
            {/* Main Content Area */}
            <View style={{ flex: 1 }}>
              {renderScreen()}
            </View>
            
            {/* Bottom Navigation */}
            <BottomNavigation 
              activeRoute={currentRoute}
              onNavigate={handleNavigation}
            />
          </SafeAreaView>
        )}
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

export default App;
