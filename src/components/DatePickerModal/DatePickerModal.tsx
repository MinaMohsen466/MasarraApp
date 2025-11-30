import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { styles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { checkDateAvailability } from '../../services/api';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  serviceId: string;
  vendorId: string;
  selectedDate?: Date;
  token?: string;
}

// Cache للبيانات المحملة بالفعل
const availabilityCache = new Map<string, Map<string, { available: boolean; slots: number }>>();

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  onSelectDate,
  serviceId,
  vendorId,
  selectedDate,
  token,
}) => {
  const { isRTL } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<Map<string, { available: boolean; slots: number }>>(new Map());
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const monthNames = isRTL
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayNames = isRTL
    ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Memoize cache key لتجنب re-renders غير ضرورية
  const cacheKey = useMemo(() => {
    return `${serviceId}-${vendorId}-${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
  }, [serviceId, vendorId, currentMonth]);

  useEffect(() => {
    if (visible) {
      // تحقق من الـ cache أولاً
      if (availabilityCache.has(cacheKey)) {
        setAvailability(availabilityCache.get(cacheKey)!);
        setLoading(false);
      } else {
        loadAvailability();
      }
    }
  }, [visible, cacheKey]);

  const loadAvailability = async () => {
    // تجنب multiple simultaneous requests
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    
    try {
      const availabilityMap = new Map();
      
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // تحميل الأيام بشكل تدريجي في مجموعات (5 أيام في كل مجموعة)
      const batchSize = 5;
      const batches = [];
      
      for (let i = 0; i < daysInMonth; i += batchSize) {
        const batchEnd = Math.min(i + batchSize, daysInMonth);
        const batch = Array.from({ length: batchEnd - i }, (_, idx) => {
          const day = i + idx + 1;
          const date = new Date(year, month, day);
          
          // تخطي الأيام الماضية
          if (date < today) {
            const dateKey = date.toISOString().split('T')[0];
            return Promise.resolve({ dateKey, available: false, slots: 0 });
          }
          
          return checkDateAvailability(serviceId, vendorId, date, token)
            .then(result => {
              const dateKey = date.toISOString().split('T')[0];
              return { dateKey, available: result.available, slots: result.slots };
            })
            .catch(() => {
              const dateKey = date.toISOString().split('T')[0];
              return { dateKey, available: false, slots: 0 };
            });
        });
        
        batches.push(batch);
      }

      // معالجة المجموعات بالتتابع مع تحديث الحالة تدريجياً
      for (const batch of batches) {
        const results = await Promise.all(batch);
        results.forEach(({ dateKey, available, slots }) => {
          availabilityMap.set(dateKey, { available, slots });
        });
        // تحديث الحالة بعد كل مجموعة للعرض التدريجي
        setAvailability(new Map(availabilityMap));
      }

      // حفظ في الـ cache
      availabilityCache.set(cacheKey, availabilityMap);
      setLoading(false);
    } finally {
      loadingRef.current = false;
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Memoize أيام الشهر لتجنب إعادة الحساب
  const memoizedDays = useMemo(() => getDaysInMonth(), [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleSelectDate = (date: Date) => {
    onSelectDate(date);
    onClose();
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const getDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const days = memoizedDays;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path d="M8 2v4M16 2v4M3 10h18" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.headerTitle}>{isRTL ? 'اختر التاريخ' : 'Select Date'}</Text>
            </View>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M15 18l-6-6 6-6" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
            
            <Text style={styles.monthTitle}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            
            <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M9 18l6-6-6-6" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Day Names */}
          <View style={styles.dayNamesRow}>
            {dayNames.map((name, index) => (
              <View key={index} style={styles.dayNameCell}>
                <Text style={styles.dayNameText}>{name}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <ScrollView style={styles.calendarScroll} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>{isRTL ? 'جاري التحميل...' : 'Loading...'}</Text>
              </View>
            ) : (
              <View style={styles.calendarGrid}>
                {days.map((date, index) => {
                  if (date === null) {
                    return <View key={`empty-${index}`} style={styles.dayCell} />;
                  }

                  const dateKey = getDateKey(date);
                  const dateAvailability = availability.get(dateKey);
                  const isPast = isPastDate(date);
                  const isSelected = isDateSelected(date);
                  const isFull = dateAvailability && !dateAvailability.available;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                        isPast && styles.dayCellPast,
                        isFull && styles.dayCellFull,
                      ]}
                      onPress={() => !isPast && handleSelectDate(date)}
                      disabled={isPast}
                      activeOpacity={0.7}>
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.dayTextSelected,
                          isPast && styles.dayTextPast,
                          isFull && styles.dayTextFull,
                        ]}>
                        {date.getDate()}
                      </Text>
                      {!isPast && dateAvailability && (
                        <Text style={[styles.slotsText, isSelected && styles.slotsTextSelected]}>
                          {dateAvailability.slots} {isRTL ? 'فتحات' : 'slots'}
                        </Text>
                      )}
                      {isFull && !isPast && (
                        <Text style={styles.fullText}>{isRTL ? 'ممتلئ' : 'Full'}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{isRTL ? 'إغلاق' : 'Close'}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default DatePickerModal;
