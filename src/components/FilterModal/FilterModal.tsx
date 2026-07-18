import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { styles } from './styles';
import { useLanguage } from '../../contexts/LanguageContext';
import { BottomSheet } from '../common/BottomSheet';

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

const MAX_PRICE = 10000;
const MIN_PRICE = 0;

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApplyFilter,
}) => {
  const { isRTL } = useLanguage();
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [minPriceInput, setMinPriceInput] = useState('0');
  const [maxPriceInput, setMaxPriceInput] = useState('10000');
  const [bookingType, setBookingType] = useState<string>('all');
  const [onSale, setOnSale] = useState<boolean>(false);
  const [minInputActive, setMinInputActive] = useState(false);
  const [maxInputActive, setMaxInputActive] = useState(false);

  // Slide width and its ref to avoid stale closures
  const [sliderWidth, setSliderWidth] = useState(280);

  // Synchronized refs to avoid stale closures in PanResponder handlers
  const minPriceRef = useRef(0);
  const maxPriceRef = useRef(10000);
  const sliderWidthRef = useRef(280);
  const startMinPrice = useRef(0);
  const startMaxPrice = useRef(0);

  const activeThumb = useRef<'min' | 'max' | null>(null);
  const sliderRef = useRef<View>(null);

  // Sync refs when states are changed via helper functions
  const updateMinPrice = (val: number) => {
    setMinPrice(val);
    minPriceRef.current = val;
  };

  const updateMaxPrice = (val: number) => {
    setMaxPrice(val);
    maxPriceRef.current = val;
  };

  // Calculate thumb positions (capped at MAX_PRICE so typed values higher than MAX_PRICE sit at the end)
  const minThumbPosition =
    (Math.min(minPrice, MAX_PRICE) / MAX_PRICE) * sliderWidth;
  const maxThumbPosition =
    (Math.min(maxPrice, MAX_PRICE) / MAX_PRICE) * sliderWidth;

  // Single PanResponder for the entire slider container
  const sliderPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false, // Critical: prevent parent scroll views/modals from stealing the touch
      onPanResponderGrant: event => {
        const { locationX } = event.nativeEvent;
        const currentWidth = sliderWidthRef.current;
        const touchPrice = (locationX / currentWidth) * MAX_PRICE;

        // Use current ref values instead of stale state variables
        const currentMin = minPriceRef.current;
        const currentMax = maxPriceRef.current;

        const isMin =
          Math.abs(touchPrice - currentMin) < Math.abs(touchPrice - currentMax);
        activeThumb.current = isMin ? 'min' : 'max';
        startMinPrice.current = currentMin;
        startMaxPrice.current = currentMax;

        // Immediately jump closer thumb to touch position and support pushing
        const validPrice = Math.max(
          MIN_PRICE,
          Math.min(MAX_PRICE, Math.round(touchPrice)),
        );

        if (isMin) {
          updateMinPrice(validPrice);
          setMinPriceInput(validPrice.toFixed(0));
          startMinPrice.current = validPrice;

          if (validPrice > maxPriceRef.current) {
            updateMaxPrice(validPrice);
            setMaxPriceInput(validPrice.toFixed(0));
            startMaxPrice.current = validPrice;
          }
        } else {
          updateMaxPrice(validPrice);
          setMaxPriceInput(validPrice.toFixed(0));
          startMaxPrice.current = validPrice;

          if (validPrice < minPriceRef.current) {
            updateMinPrice(validPrice);
            setMinPriceInput(validPrice.toFixed(0));
            startMinPrice.current = validPrice;
          }
        }
      },
      onPanResponderMove: (_, gestureState) => {
        const currentWidth = sliderWidthRef.current;
        const priceDelta = (gestureState.dx / currentWidth) * MAX_PRICE;

        if (activeThumb.current === 'min') {
          const newPrice = Math.round(startMinPrice.current + priceDelta);
          const validPrice = Math.max(MIN_PRICE, Math.min(MAX_PRICE, newPrice));
          updateMinPrice(validPrice);
          setMinPriceInput(validPrice.toFixed(0));

          // Pushing behavior: if min exceeds max, push max
          if (validPrice > maxPriceRef.current) {
            updateMaxPrice(validPrice);
            setMaxPriceInput(validPrice.toFixed(0));
          }
        } else if (activeThumb.current === 'max') {
          const newPrice = Math.round(startMaxPrice.current + priceDelta);
          const validPrice = Math.max(MIN_PRICE, Math.min(MAX_PRICE, newPrice));
          updateMaxPrice(validPrice);
          setMaxPriceInput(validPrice.toFixed(0));

          // Pushing behavior: if max is below min, push min
          if (validPrice < minPriceRef.current) {
            updateMinPrice(validPrice);
            setMinPriceInput(validPrice.toFixed(0));
          }
        }
      },
      onPanResponderRelease: () => {
        activeThumb.current = null;
      },
      onPanResponderTerminate: () => {
        activeThumb.current = null;
      },
    }),
  ).current;

  const handleSliderLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setSliderWidth(width);
    sliderWidthRef.current = width;
  };

  const handleApplyFilter = () => {
    const finalMin = parseFloat(minPriceInput) || 0;
    const finalMax = parseFloat(maxPriceInput) || MAX_PRICE;

    const actualMin = Math.max(0, Math.min(finalMin, finalMax));
    const actualMax = Math.max(actualMin, finalMax);

    onApplyFilter({
      minPrice: actualMin,
      maxPrice: actualMax,
      bookingType: bookingType === 'all' ? undefined : bookingType,
      onSale: onSale ? true : undefined,
    });
    onClose();
  };

  const handleResetFilter = () => {
    updateMinPrice(0);
    updateMaxPrice(10000);
    setMinPriceInput('0');
    setMaxPriceInput('10000');
    setBookingType('all');
    setOnSale(false);
  };

  const handleMinPriceChange = (text: string) => {
    setMinPriceInput(text);
    if (text.trim() === '') {
      updateMinPrice(0);
      return;
    }
    const parsed = parseFloat(text);
    if (!isNaN(parsed)) {
      const validMin = Math.max(MIN_PRICE, parsed);
      updateMinPrice(validMin);
      if (validMin > maxPriceRef.current) {
        updateMaxPrice(validMin);
        setMaxPriceInput(validMin.toFixed(0));
      }
    }
  };

  const handleMaxPriceChange = (text: string) => {
    setMaxPriceInput(text);
    if (text.trim() === '') {
      updateMaxPrice(MAX_PRICE);
      return;
    }
    const parsed = parseFloat(text);
    if (!isNaN(parsed)) {
      const validMax = Math.max(MIN_PRICE, parsed);
      updateMaxPrice(validMax);
      if (validMax < minPriceRef.current) {
        updateMinPrice(validMax);
        setMinPriceInput(validMax.toFixed(0));
      }
    }
  };

  const handleMinPriceBlur = () => {
    const parsed = parseFloat(minPriceInput) || 0;
    const validated = Math.max(MIN_PRICE, parsed);
    updateMinPrice(validated);
    setMinPriceInput(validated.toFixed(0));
    if (validated > maxPriceRef.current) {
      updateMaxPrice(validated);
      setMaxPriceInput(validated.toFixed(0));
    }
  };

  const handleMaxPriceBlur = () => {
    const parsed = parseFloat(maxPriceInput) || MAX_PRICE;
    const validated = Math.max(MIN_PRICE, parsed);
    updateMaxPrice(validated);
    setMaxPriceInput(validated.toFixed(0));
    if (validated < minPriceRef.current) {
      updateMinPrice(validated);
      setMinPriceInput(validated.toFixed(0));
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={[styles.container, isRTL && styles.containerRTL]}>
        {/* Header */}
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <Text style={[styles.title, isRTL && styles.textRTL]}>
            {isRTL ? 'تصفية' : 'Filter'}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Icon name="close" size={20} color="#4B5563" />
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

              {/* Touch Overlay covering the slider container */}
              <View
                style={styles.touchOverlay}
                collapsable={false}
                {...sliderPanResponder.panHandlers}
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
                  minInputActive && styles.priceInputFieldActive,
                ]}
                value={minPriceInput}
                onChangeText={handleMinPriceChange}
                onFocus={() => setMinInputActive(true)}
                onBlur={() => {
                  setMinInputActive(false);
                  handleMinPriceBlur();
                }}
                keyboardType="decimal-pad"
                placeholder="0"
              />
              <Text style={styles.inputSeparator}>-</Text>
              <TextInput
                style={[
                  styles.priceInputField,
                  isRTL && styles.priceInputFieldRTL,
                  maxInputActive && styles.priceInputFieldActive,
                ]}
                value={maxPriceInput}
                onChangeText={handleMaxPriceChange}
                onFocus={() => setMaxInputActive(true)}
                onBlur={() => {
                  setMaxInputActive(false);
                  handleMaxPriceBlur();
                }}
                keyboardType="decimal-pad"
                placeholder="10000"
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
              {onSale && <Icon name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={[styles.discountToggleText, isRTL && styles.textRTL]}>
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
    </BottomSheet>
  );
};

export default FilterModal;
