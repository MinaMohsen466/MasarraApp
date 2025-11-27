import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, FlatList, StatusBar, Platform } from 'react-native';
import { styles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useVendors } from '../../hooks/useVendors';
import { Vendor, getVendorImageUrl } from '../../services/vendorsApi';
import { API_BASE_URL } from '../../config/api.config';

interface VendorsProps {
  onSelectVendor?: (vendorId: string, vendorName: string) => void;
  onBack?: () => void;
}

const Vendors: React.FC<VendorsProps> = ({ onSelectVendor, onBack }) => {
  const { isRTL } = useLanguage();
  // removed useSafeAreaInsets to reduce extra top spacing on some devices
  const { data: vendors, isLoading, error } = useVendors();

  const renderVendorCard = ({ item }: { item: Vendor }) => {
    // Get first letter of vendor name for avatar
    const firstLetter = item.name.charAt(0).toUpperCase();
    
    // Get vendor image from vendorProfile.profilePicture
    const vendorImage = item.vendorProfile?.profilePicture || item.image;
    const imageUrl = vendorImage 
      ? (vendorImage.startsWith('http') ? vendorImage : `${API_BASE_URL}${vendorImage}`)
      : null;
    
    return (
      <TouchableOpacity
        style={styles.vendorCard}
        onPress={() => onSelectVendor && onSelectVendor(item._id, item.name)}
        activeOpacity={0.8}>
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.vendorImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.letterAvatar}>{firstLetter}</Text>
          )}
        </View>
        <Text style={[styles.vendorName, isRTL && styles.vendorNameRTL]} numberOfLines={2}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundLight }]}> 
      {/* set StatusBar color to match page and avoid extra top filler spacing */}
      <StatusBar backgroundColor={colors.backgroundLight} barStyle="dark-content" translucent={false} />
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>{isRTL ? '›' : '‹'}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, isRTL && styles.titleRTL]}>
          {isRTL ? 'الموردين' : 'VENDORS'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {isRTL ? 'فشل في تحميل الموردين' : 'Failed to load vendors'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={vendors}
          renderItem={renderVendorCard}
          keyExtractor={(item) => item._id}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={[styles.row, isRTL && styles.rowRTL]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default Vendors;
