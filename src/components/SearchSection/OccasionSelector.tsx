import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SvgUri } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './OccasionSelectorStyles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOccasions } from '../../hooks/useOccasions';
import { Occasion, getImageUrl } from '../../services/api';
import { BottomSheet } from '../common/BottomSheet';

interface OccasionSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (occasion: Occasion) => void;
  selectedOccasion?: Occasion;
}

const OccasionSelector: React.FC<OccasionSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  selectedOccasion,
}) => {
  const { isRTL } = useLanguage();
  const { data: occasions, isLoading } = useOccasions();
  const insets = useSafeAreaInsets();

  const renderOccasionItem = ({ item }: { item: Occasion }) => {
    const displayName = isRTL ? item.nameAr : item.name;
    const isSelected = selectedOccasion?._id === item._id;

    return (
      <TouchableOpacity
        style={[styles.occasionItem, isSelected && styles.occasionItemSelected]}
        onPress={() => {
          onSelect(item);
          onClose();
        }}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.occasionItemContent,
            isRTL && styles.occasionItemContentRTL,
          ]}
        >
          {/* Occasion Icon/Image Container */}
          <View
            style={[
              styles.iconWrapper,
              isSelected && styles.iconWrapperSelected,
            ]}
          >
            {item.image ? (
              item.image.toLowerCase().endsWith('.svg') ? (
                <SvgUri
                  uri={getImageUrl(item.image)}
                  width={24}
                  height={24}
                  fill={isSelected ? colors.primary : '#475569'}
                />
              ) : (
                <Image
                  source={{ uri: getImageUrl(item.image) }}
                  style={styles.occasionImage}
                  resizeMode="cover"
                />
              )
            ) : (
              <View style={styles.placeholderIcon} />
            )}
          </View>

          {/* Occasion Name */}
          <Text
            style={[
              styles.occasionItemText,
              isSelected && styles.occasionItemTextActive,
              isRTL && styles.occasionItemTextRTL,
            ]}
          >
            {displayName}
          </Text>

          {/* Selected Checkmark */}
          {isSelected && (
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 6L9 17L4 12"
                stroke={colors.primary}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View
        style={[
          styles.modalContent,
          isRTL && styles.modalContentRTL,
          { paddingBottom: 16 + insets.bottom },
        ]}
      >
        {/* Header */}
        <View style={[styles.modalHeader, isRTL && styles.modalHeaderRTL]}>
          <Text style={[styles.modalTitle, isRTL && styles.modalTitleRTL]}>
            {isRTL ? 'اختر المناسبة' : 'Select Occasion'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M18 6L6 18M6 6L18 18"
                stroke="#475569"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Occasions List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={occasions}
            renderItem={renderOccasionItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.occasionsList}
            showsVerticalScrollIndicator={false}
            style={styles.flatListStyle}
          />
        )}
      </View>
    </BottomSheet>
  );
};

export default OccasionSelector;
