import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { styles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOccasions } from '../../hooks/useOccasions';
import { Occasion } from '../../services/api';
import { getImageUrl } from '../../services/api';

interface OccasionsProps {
  onSelectOccasion?: (occasion: Occasion) => void;
  onBack?: () => void;
}

const Occasions: React.FC<OccasionsProps> = ({
  onSelectOccasion,
  onBack,
}) => {
  const { isRTL, t } = useLanguage();
  const { data: occasions, isLoading, error } = useOccasions();

  useEffect(() => {
    console.log('📋 Occasions data:', occasions);
    if (error) {
      console.error('❌ Error loading occasions:', error);
    }
  }, [occasions, error]);

  const renderOccasionCard = ({ item }: { item: Occasion }) => {
    const displayName = isRTL ? item.nameAr : item.name;
    
    return (
      <TouchableOpacity
        style={styles.occasionCard}
        onPress={() => {
          console.log('🎉 Occasion pressed:', item._id, item.name, item.nameAr);
          onSelectOccasion && onSelectOccasion(item);
        }}
        activeOpacity={0.8}>
        <View style={styles.iconContainer}>
          {item.image ? (
            <Image 
              key={item.image}
              source={{ uri: getImageUrl(item.image) }}
              style={styles.occasionImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderIcon} />
          )}
        </View>
        <Text style={[styles.occasionText, isRTL && styles.occasionTextRTL]} numberOfLines={2}>
          {displayName}
        </Text>
      </TouchableOpacity>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, isRTL && styles.textRTL]}>
          {t('loadingOccasions')}
        </Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.errorText, isRTL && styles.textRTL]}>
          {t('failedToLoad')}
        </Text>
        <Text style={[styles.errorSubtext, isRTL && styles.textRTL]}>
          {error.message}
        </Text>
      </View>
    );
  }

  // Show empty state
  if (!occasions || occasions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.emptyText, isRTL && styles.textRTL]}>
          {t('noOccasionsAvailable')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header with Back Button */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <TouchableOpacity 
          style={[styles.backButton, isRTL && styles.backButtonRTL]}
          onPress={onBack}
          activeOpacity={0.7}>
          <Svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none">
            <Path
              d="M15 18L9 12L15 6"
              stroke={colors.primary}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
          {t('occasions').toUpperCase()}
        </Text>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Occasions List */}
      <FlatList
        data={occasions}
        renderItem={renderOccasionCard}
        keyExtractor={(item) => item._id}
        numColumns={3}
        columnWrapperStyle={[styles.row, isRTL && styles.rowRTL]}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default Occasions;
