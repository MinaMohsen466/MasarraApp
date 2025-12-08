import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, FlatList, StatusBar, Dimensions } from 'react-native';
import { styles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useVendors } from '../../hooks/useVendors';
import { Vendor } from '../../services/vendorsApi';
import { API_BASE_URL } from '../../config/api.config';

interface VendorsProps {
  onSelectVendor?: (vendorId: string, vendorName: string) => void;
  onBack?: () => void;
}

const Vendors: React.FC<VendorsProps> = ({ onSelectVendor, onBack }) => {
  const { isRTL } = useLanguage();
  const screenWidth = Dimensions.get('window').width;
  const numColumns = screenWidth >= 600 ? 4 : 3;
  const { data: vendors, isLoading, error } = useVendors();

  const [imageErrors, setImageErrors] = React.useState<Set<string>>(new Set());

  const renderVendorCard = ({ item }: { item: Vendor }) => {
    const vendorImage = item.vendorProfile?.profilePicture || item.image;
    const imageUrl = vendorImage 
      ? (vendorImage.startsWith('http') ? vendorImage : `${API_BASE_URL}${vendorImage}`)
      : null;
    
    const hasError = imageUrl && imageErrors.has(item._id);
    
    return (
      <TouchableOpacity
        style={styles.vendorCard}
        onPress={() => onSelectVendor?.(item._id, item.name)}
        activeOpacity={0.8}>
        <View style={styles.imageContainer}>
          {imageUrl && !hasError ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.vendorImage}
              resizeMode="cover"
              onError={() => {
                setImageErrors(prev => new Set(prev).add(item._id));
              }}
            />
          ) : (
            <Text style={styles.letterAvatar}>{item.name.charAt(0).toUpperCase()}</Text>
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

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {isRTL ? 'فشل في تحميل الموردين' : 'Failed to load vendors'}
          </Text>
        </View>
      )}
      {!isLoading && !error && (
        <FlatList
          key={numColumns}
          data={vendors}
          renderItem={renderVendorCard}
          keyExtractor={(item) => item._id}
          numColumns={numColumns}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={[styles.row, isRTL && styles.rowRTL]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default Vendors;
