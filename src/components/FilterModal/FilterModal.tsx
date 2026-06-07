import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
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

const MAX_PRICE = 20000;
const MIN_PRICE = 0;

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApplyFilter,
}) => {
  const { isRTL } = useLanguage();
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(20000);
  const [minPriceInput, setMinPriceInput] = useState('0');
  const [maxPriceInput, setMaxPriceInput] = useState('20000');
  const [bookingType, setBookingType] = useState<string>('all');
  const [onSale, setOnSale] = useState<boolean>(false);
  const [sliderWidth, setSliderWidth] = useState(300);
  const sliderRef = useRef<View>(null);
  const startMinPrice = useRef(0);
  const startMaxPrice = useRef(0);

  // Calculate thumb positions
  const minThumbPosition = (minPrice / MAX_PRICE) * sliderWidth;
  const maxThumbPosition = (maxPrice / MAX_PRICE) * sliderWidth;

  const activeThumb = useRef<'min' | 'max' | null>(null);

  // Single PanResponder for the entire slider container
  const sliderPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: event => {
        const { locationX } = event.nativeEvent;
        const touchPrice = (locationX / sliderWidth) * MAX_PRICE;

        const isMin =
          Math.abs(touchPrice - minPrice) < Math.abs(touchPrice - maxPrice);
        activeThumb.current = isMin ? 'min' : 'max';
        startMinPrice.current = minPrice;
        startMaxPrice.current = maxPrice;

        // Immediately jump closer thumb to touch position
        if (isMin) {
          const validPrice = Math.max(
            MIN_PRICE,
            Math.min(maxPrice - 100, touchPrice),
          );
          setMinPrice(validPrice);
          setMinPriceInput(validPrice.toFixed(0));
          startMinPrice.current = validPrice;
        } else {
          const validPrice = Math.max(
            minPrice + 100,
            Math.min(MAX_PRICE, touchPrice),
          );
          setMaxPrice(validPrice);
          setMaxPriceInput(validPrice.toFixed(0));
          startMaxPrice.current = validPrice;
        }
      },
      onPanResponderMove: (_, gestureState) => {
        const priceDelta = (gestureState.dx / sliderWidth) * MAX_PRICE;
        if (activeThumb.current === 'min') {
          const newPrice = Math.round(startMinPrice.current + priceDelta);
          const validPrice = Math.max(
            MIN_PRICE,
            Math.min(maxPrice - 100, newPrice),
          );
          setMinPrice(validPrice);
          setMinPriceInput(validPrice.toFixed(0));
        } else if (activeThumb.current === 'max') {
          const newPrice = Math.round(startMaxPrice.current + priceDelta);
          const validPrice = Math.max(
            minPrice + 100,
            Math.min(MAX_PRICE, newPrice),
          );
          setMaxPrice(validPrice);
          setMaxPriceInput(validPrice.toFixed(0));
        }
      },
      onPanResponderRelease: () => {
        activeThumb.current = null;
      },
    }),
  ).current;

  const handleSliderLayout = (event: LayoutChangeEvent) => {
    setSliderWidth(event.nativeEvent.layout.width);
  };

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
    setMinPriceInput('0');
    setMaxPriceInput('20000');
    setBookingType('all');
    setOnSale(false);
  };

  // Handle min price input blur - validate on blur instead of every keystroke
  const handleMinPriceBlur = () => {
    const parsed = parseFloat(minPriceInput) || 0;
    const validated = Math.max(0, Math.min(maxPrice - 100, parsed));
    setMinPrice(validated);
    setMinPriceInput(validated.toFixed(0));
  };

  // Handle max price input blur - validate on blur instead of every keystroke
  const handleMaxPriceBlur = () => {
    const parsed = parseFloat(maxPriceInput) || 20000;
    const validated = Math.max(minPrice + 100, Math.min(20000, parsed));
    setMaxPrice(validated);
    setMaxPriceInput(validated.toFixed(0));
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

              {/* Draggable Range Slider */}
              <View
                style={styles.sliderContainer}
                ref={sliderRef}
                onLayout={handleSliderLayout}
                {...sliderPanResponder.panHandlers}
              >
                {/* Background Track */}
                <View style={styles.rangeTrack} pointerEvents="none">
                  {/* Active Track Fill */}
                  <View
                    style={[
                      styles.rangeTrackFill,
                      {
                        left: minThumbPosition,
                        width: maxThumbPosition - minThumbPosition,
                      },
                    ]}
                    pointerEvents="none"
                  />
                </View>

                {/* Min Thumb */}
                <View
                  style={[styles.sliderThumb, { left: minThumbPosition - 12 }]}
                  pointerEvents="none"
                />

                {/* Max Thumb */}
                <View
                  style={[styles.sliderThumb, { left: maxThumbPosition - 12 }]}
                  pointerEvents="none"
                />
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
                  value={minPriceInput}
                  onChangeText={setMinPriceInput}
                  onBlur={handleMinPriceBlur}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
                <Text style={styles.inputSeparator}>-</Text>
                <TextInput
                  style={[
                    styles.priceInputField,
                    isRTL && styles.priceInputFieldRTL,
                  ]}
                  value={maxPriceInput}
                  onChangeText={setMaxPriceInput}
                  onBlur={handleMaxPriceBlur}
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
                  {isRTL ? 'محدود' : 'Limited'}
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
