import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect, Text as SvgText } from 'react-native-svg';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGlobalDate } from '../../contexts/DateContext';
import { styles } from './styles';
import { Occasion } from '../../services/api';
import OccasionSelector from './OccasionSelector';
import DateSelector from './DateSelector';
import { colors } from '../../constants/colors';

interface SearchSectionProps {
  onSearch?: () => void;
  onSelectOccasion?: (occasion: Occasion, selectedDate?: Date) => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({
  onSearch,
  onSelectOccasion,
}) => {
  const { isRTL } = useLanguage();
  const { globalSelectedDate, setGlobalSelectedDate } = useGlobalDate();
  const [showOccasionModal, setShowOccasionModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<
    Occasion | undefined
  >();
  const [selectedDate, setSelectedDate] = useState<Date>(globalSelectedDate);

  // Sync local date with global date
  useEffect(() => {
    setSelectedDate(globalSelectedDate);
  }, [globalSelectedDate]);

  const handleOccasionSelect = (occasion: Occasion) => {
    setSelectedOccasion(occasion);
    setShowOccasionModal(false);
    // Don't call onSelectOccasion here - wait for search button press
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setGlobalSelectedDate(date); // Sync globally so all services use the same date
  };

  const formatDate = (dateObj: Date) => {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <View style={styles.container}>
      {/* Date Picker */}
      <TouchableOpacity
        style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}
        activeOpacity={0.7}
        onPress={() => setShowDateModal(true)}
      >
        <View style={[styles.iconWrapper, isRTL && styles.iconWrapperRTL]}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            {/* Header (Top section) - Filled with colors.primary */}
            <Path
              d="M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v2H3V7z"
              fill={colors.primary}
            />
            {/* Body (Bottom section) - Filled with light teal '#b5e7e4' */}
            <Path
              d="M3 9h18v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9z"
              fill="#b5e7e4"
            />
            {/* Outer Outline */}
            <Rect
              x="3"
              y="4"
              width="18"
              height="17"
              rx="3"
              stroke={colors.primary}
              strokeWidth={1.8}
            />
            {/* Binder rings */}
            <Path
              d="M7 2v4M17 2v4"
              stroke={colors.primary}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
            {/* Day Number text inside body */}
            <SvgText
              x="12"
              y="16.5"
              fill={colors.primaryDark}
              fontSize="9"
              fontWeight="bold"
              textAnchor="middle"
            >
              {selectedDate.getDate()}
            </SvgText>
          </Svg>
        </View>
        <Text style={[styles.inputText, isRTL && styles.inputTextRTL]}>
          {formatDate(selectedDate)}
        </Text>
      </TouchableOpacity>

      {/* Occasion Selector */}
      <TouchableOpacity
        style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}
        activeOpacity={0.7}
        onPress={() => setShowOccasionModal(true)}
      >
        <View style={[styles.iconWrapper, isRTL && styles.iconWrapperRTL]}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            {/* Top Left - Dark Teal */}
            <Rect
              x="3"
              y="3"
              width="8"
              height="8"
              rx="2.2"
              fill={colors.primary}
            />
            {/* Top Right - Light Teal */}
            <Rect x="13" y="3" width="8" height="8" rx="2.2" fill="#b5e7e4" />
            {/* Bottom Left - Light Teal */}
            <Rect x="3" y="13" width="8" height="8" rx="2.2" fill="#b5e7e4" />
            {/* Bottom Right - Dark Teal */}
            <Rect
              x="13"
              y="13"
              width="8"
              height="8"
              rx="2.2"
              fill={colors.primary}
            />
          </Svg>
        </View>
        <Text style={[styles.inputText, isRTL && styles.inputTextRTL]}>
          {selectedOccasion
            ? isRTL
              ? selectedOccasion.nameAr
              : selectedOccasion.name
            : isRTL
            ? 'اختر المناسبة'
            : 'Select Occasion'}
        </Text>
        <View style={styles.arrowIcon}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d={isRTL ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}
              stroke={colors.primary}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </TouchableOpacity>

      {/* Search Button */}
      <TouchableOpacity
        style={styles.searchButton}
        onPress={() => {
          // Call onSelectOccasion with both occasion and selected date
          if (selectedOccasion && onSelectOccasion) {
            onSelectOccasion(selectedOccasion, selectedDate);
          }
          if (onSearch) {
            onSearch();
          }
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.searchButtonText}>{isRTL ? 'بحث' : 'SEARCH'}</Text>
      </TouchableOpacity>

      {/* Occasion Selector Modal */}
      <OccasionSelector
        visible={showOccasionModal}
        onClose={() => setShowOccasionModal(false)}
        onSelect={handleOccasionSelect}
        selectedOccasion={selectedOccasion}
      />

      {/* Date Selector Modal */}
      <DateSelector
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
        onSelect={handleDateSelect}
        selectedDate={selectedDate}
      />
    </View>
  );
};

export default SearchSection;
