import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGlobalDate } from '../../contexts/DateContext';
import { styles } from './styles';
import { Occasion } from '../../services/api';
import OccasionSelector from './OccasionSelector';
import DateSelector from './DateSelector';

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
        <View style={styles.iconWrapper}>
          <View style={styles.calendarIcon}>
            <View style={styles.calendarTop} />
            <View style={styles.calendarBody}>
              <Text style={styles.calendarText}>{selectedDate.getDate()}</Text>
            </View>
          </View>
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
        <View style={styles.iconWrapper}>
          <Svg width={20} height={20} viewBox="0 0 120 120" fill="none">
            {/* Top Left */}
            <Path
              d="M6 18C6 11.373 11.373 6 18 6H42C48.627 6 54 11.373 54 18V42C54 48.627 48.627 54 42 54H18C11.373 54 6 48.627 6 42V18Z"
              fill="#FFFFFF"
            />
            {/* Top Right */}
            <Path
              d="M66 18C66 11.373 71.373 6 78 6H102C108.627 6 114 11.373 114 18V42C114 48.627 108.627 54 102 54H78C71.373 54 66 48.627 66 42V18Z"
              fill="#FFFFFF"
              opacity={0.6}
            />
            {/* Bottom Left */}
            <Path
              d="M6 78C6 71.373 11.373 66 18 66H42C48.627 66 54 71.373 54 78V102C54 108.627 48.627 114 42 114H18C11.373 114 6 108.627 6 102V78Z"
              fill="#FFFFFF"
              opacity={0.6}
            />
            {/* Bottom Right */}
            <Path
              d="M66 78C66 71.373 71.373 66 78 66H102C108.627 66 114 71.373 114 78V102C114 108.627 108.627 114 102 114H78C71.373 114 66 108.627 66 102V78Z"
              fill="#FFFFFF"
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
          <Text style={styles.arrowText}>{isRTL ? '‹' : '›'}</Text>
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
