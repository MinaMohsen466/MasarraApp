import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useLanguage } from '../../contexts/LanguageContext';
import { styles } from './styles';
import { colors } from '../../constants/colors';
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
  const [showOccasionModal, setShowOccasionModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<
    Occasion | undefined
  >();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleOccasionSelect = (occasion: Occasion) => {
    setSelectedOccasion(occasion);
    setShowOccasionModal(false);
    // Don't call onSelectOccasion here - wait for search button press
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
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
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            {/* Clean Grid Icon - 2x2 squares with proper spacing */}
            <Path
              d="M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h6v6h-6v-6z"
              fill={colors.textWhite}
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
