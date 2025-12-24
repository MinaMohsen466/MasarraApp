import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput } from 'react-native';
import { styles } from './styles';
import { useLanguage } from '../../contexts/LanguageContext';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilter: (filters: {
    minPrice?: number;
    maxPrice?: number;
    bookingType?: string;
    onSale?: boolean;
  }) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApplyFilter,
}) => {
  const { isRTL } = useLanguage();
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(20000);
  const [bookingType, setBookingType] = useState<string>('all');
  const [onSale, setOnSale] = useState<boolean>(false);

  const handleApplyFilter = () => {
    onApplyFilter({
      minPrice,
      maxPrice,
      bookingType: bookingType === 'all' ? undefined : bookingType,
      onSale: onSale ? true : undefined,
    });
    onClose();
  };

  const handleResetFilter = () => {
    setMinPrice(0);
    setMaxPrice(20000);
    setBookingType('all');
    setOnSale(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, isRTL && styles.containerRTL]}>
          {/* Header */}
          <View style={[styles.header, isRTL && styles.headerRTL]}>
            <Text style={[styles.title, isRTL && styles.textRTL]}>
              {isRTL ? 'تصفية' : 'Filter'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Price Range Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {isRTL ? 'نطاق السعر' : 'Price Range'}
            </Text>

            <View style={styles.priceRangeContainer}>
              {/* Price badges above the range track */}
              <View style={styles.priceLabelsContainer}>
                <View style={styles.priceBadgeWrapper}>
                  <View style={styles.priceValueBadge}>
                    <Text style={styles.priceValueText}>
                      {isRTL
                        ? `د.ك ${minPrice.toFixed(0)}`
                        : `${minPrice.toFixed(0)} KD`}
                    </Text>
                  </View>
                </View>
                <View style={styles.priceBadgeWrapper}>
                  <View style={styles.priceValueBadge}>
                    <Text style={styles.priceValueText}>
                      {isRTL
                        ? `د.ك ${maxPrice.toFixed(0)}`
                        : `${maxPrice.toFixed(0)} KD`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Range track */}
              <View style={styles.rangeTrackContainer}>
                <View style={styles.rangeTrack}>
                  <View
                    style={[
                      styles.rangeTrackFill,
                      {
                        left: `${(minPrice / 20000) * 100}%`,
                        right: `${100 - (maxPrice / 20000) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Min/Max labels */}
              <View style={styles.priceLabelsRow}>
                <Text style={[styles.priceLabel, isRTL && styles.textRTL]}>
                  {isRTL ? 'الحد الأدنى' : 'Min'}
                </Text>
                <Text style={[styles.priceLabel, isRTL && styles.textRTL]}>
                  {isRTL ? 'الحد الأقصى' : 'Max'}
                </Text>
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  style={[
                    styles.priceInputField,
                    isRTL && styles.priceInputFieldRTL,
                  ]}
                  value={minPrice.toFixed(0)}
                  onChangeText={val =>
                    setMinPrice(
                      Math.max(0, Math.min(20000, parseFloat(val) || 0)),
                    )
                  }
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
                <Text style={styles.inputSeparator}>-</Text>
                <TextInput
                  style={[
                    styles.priceInputField,
                    isRTL && styles.priceInputFieldRTL,
                  ]}
                  value={maxPrice.toFixed(0)}
                  onChangeText={val =>
                    setMaxPrice(Math.min(20000, parseFloat(val) || 20000))
                  }
                  keyboardType="decimal-pad"
                  placeholder="20000"
                />
              </View>
            </View>
          </View>

          {/* Booking Type Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {isRTL ? 'نوع الحجز' : 'Booking Type'}
            </Text>
            <View style={styles.bookingTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.bookingTypeButton,
                  bookingType === 'all' && styles.bookingTypeButtonActive,
                ]}
                onPress={() => setBookingType('all')}
              >
                <Text
                  style={[
                    styles.bookingTypeText,
                    bookingType === 'all' && styles.bookingTypeTextActive,
                    isRTL && styles.textRTL,
                  ]}
                >
                  {isRTL ? 'الكل' : 'All'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.bookingTypeButton,
                  bookingType === 'limited' && styles.bookingTypeButtonActive,
                ]}
                onPress={() => setBookingType('limited')}
              >
                <Text
                  style={[
                    styles.bookingTypeText,
                    bookingType === 'limited' && styles.bookingTypeTextActive,
                    isRTL && styles.textRTL,
                  ]}
                >
                  {isRTL ? 'بمواعيد محددة' : 'Limited'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.bookingTypeButton,
                  bookingType === 'unlimited' && styles.bookingTypeButtonActive,
                ]}
                onPress={() => setBookingType('unlimited')}
              >
                <Text
                  style={[
                    styles.bookingTypeText,
                    bookingType === 'unlimited' && styles.bookingTypeTextActive,
                    isRTL && styles.textRTL,
                  ]}
                >
                  {isRTL ? 'غير محدود' : 'Unlimited'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Discounts Only Filter */}
          <View style={styles.filterSection}>
            <TouchableOpacity
              style={styles.discountToggleContainer}
              onPress={() => setOnSale(!onSale)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, onSale && styles.checkboxActive]}>
                {onSale && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text
                style={[styles.discountToggleText, isRTL && styles.textRTL]}
              >
                {isRTL ? 'الخدمات المخفضة فقط' : 'Discounts Only'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View
            style={[styles.buttonContainer, isRTL && styles.buttonContainerRTL]}
          >
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetFilter}
            >
              <Text style={[styles.resetButtonText, isRTL && styles.textRTL]}>
                {isRTL ? 'إعادة تعيين' : 'Reset'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyFilter}
            >
              <Text style={[styles.applyButtonText, isRTL && styles.textRTL]}>
                {isRTL ? 'تطبيق' : 'Apply'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FilterModal;
