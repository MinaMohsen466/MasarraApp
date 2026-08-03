import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './OccasionSelectorStyles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOccasions } from '../../hooks/useOccasions';
import { Occasion } from '../../services/api';
import { BottomSheet } from '../common/BottomSheet';
import { LogoLoader } from '../LogoLoader';

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
  const [searchQuery, setSearchQuery] = useState('');

  // Reset search query when modal visibility changes
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
    }
  }, [visible]);

  // Filter occasions based on search query
  const filteredOccasions = useMemo(() => {
    if (!occasions) return [];
    if (!searchQuery.trim()) return occasions;

    const query = searchQuery.trim().toLowerCase();
    return occasions.filter(item => {
      const nameArMatch = item.nameAr?.toLowerCase().includes(query);
      const nameEnMatch = item.name?.toLowerCase().includes(query);
      return nameArMatch || nameEnMatch;
    });
  }, [occasions, searchQuery]);

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

        {/* Search Input */}
        <View
          style={[
            styles.searchContainer,
            isRTL && styles.searchContainerRTL,
          ]}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
              stroke="#94A3B8"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <TextInput
            style={[
              styles.searchInput,
              isRTL && styles.searchInputRTL,
            ]}
            placeholder={isRTL ? 'ابحث عن مناسبة...' : 'Search for an occasion...'}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="#94A3B8"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          )}
        </View>

        {/* Occasions List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <LogoLoader />
          </View>
        ) : filteredOccasions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isRTL ? 'لا توجد نتائج مطابقة' : 'No matching occasions found'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredOccasions}
            renderItem={renderOccasionItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.occasionsList}
            showsVerticalScrollIndicator={false}
            style={styles.flatListStyle}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </BottomSheet>
  );
};

export default OccasionSelector;
