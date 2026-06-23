import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { styles } from './DateSelectorStyles';

interface DateSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedDate?: Date;
  allowPastDates?: boolean;
}

const ITEM_HEIGHT = 44; // Height of each row in the wheel picker

const DateSelector: React.FC<DateSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  selectedDate,
  allowPastDates = false,
}) => {
  const { isRTL } = useLanguage();
  const [date, setDate] = useState<Date>(selectedDate || new Date());
  
  const [selectedMonth, setSelectedMonth] = useState(date.getMonth());
  const [selectedDay, setSelectedDay] = useState(date.getDate());
  const [selectedYear, setSelectedYear] = useState(date.getFullYear());

  const monthRef = useRef<ScrollView>(null);
  const dayRef = useRef<ScrollView>(null);

  const monthNames = isRTL
    ? [
        'يناير',
        'فبراير',
        'مارس',
        'أبريل',
        'مايو',
        'يونيو',
        'يوليو',
        'أغسطس',
        'سبتمبر',
        'أكتوبر',
        'نوفمبر',
        'ديسمبر',
      ]
    : [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysCount = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysCount }, (_, i) => i + 1);

  // Sync state and scroll position when visible changes
  useEffect(() => {
    if (visible) {
      const initialDate = selectedDate || new Date();
      setDate(initialDate);
      setSelectedMonth(initialDate.getMonth());
      setSelectedDay(initialDate.getDate());
      setSelectedYear(initialDate.getFullYear());

      // Scroll to initial values with a small delay for layout
      setTimeout(() => {
        const monthIdx = initialDate.getMonth();
        const dayIdx = initialDate.getDate() - 1;

        monthRef.current?.scrollTo({ y: monthIdx * ITEM_HEIGHT, animated: false });
        dayRef.current?.scrollTo({ y: dayIdx * ITEM_HEIGHT, animated: false });
      }, 120);
    }
  }, [visible, selectedDate]);

  // Adjust selected day if it exceeds the maximum days in the new month
  const handleMonthSelect = (monthIdx: number) => {
    setSelectedMonth(monthIdx);
    const maxDays = getDaysInMonth(selectedYear, monthIdx);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
      dayRef.current?.scrollTo({ y: (maxDays - 1) * ITEM_HEIGHT, animated: true });
    }
  };

  const handleScroll = (type: 'month' | 'day', offsetY: number) => {
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (type === 'month') {
      const val = Math.max(0, Math.min(11, index));
      handleMonthSelect(val);
    } else if (type === 'day') {
      const maxDays = getDaysInMonth(selectedYear, selectedMonth);
      const val = Math.max(1, Math.min(maxDays, index + 1));
      setSelectedDay(val);
    }
  };

  const handleScrollEnd = (type: 'month' | 'day', e: NativeSyntheticEvent<NativeScrollEvent>) => {
    handleScroll(type, e.nativeEvent.contentOffset.y);
  };

  const handleOK = () => {
    // Generate final selected date
    const finalDate = new Date(selectedYear, selectedMonth, selectedDay);
    
    // If past dates are not allowed and selected date is before today, default to today
    if (!allowPastDates) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const testDate = new Date(finalDate);
      testDate.setHours(0, 0, 0, 0);
      if (testDate < today) {
        onSelect(new Date());
        onClose();
        return;
      }
    }

    onSelect(finalDate);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!visible) {
    return null;
  }

  // Header display name
  const weekDayName = isRTL
    ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][
        new Date(selectedYear, selectedMonth, selectedDay).getDay()
      ]
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
        new Date(selectedYear, selectedMonth, selectedDay).getDay()
      ];

  const monthName = monthNames[selectedMonth];

  // Formatted date string for header
  const headerDateStr = isRTL
    ? `${weekDayName}، ${selectedDay} ${monthName}`
    : `${weekDayName}, ${monthName} ${selectedDay}`;

  // Pad arrays with empty values at start/end so middle item snaps in the selection bar
  const paddedMonths = ['', '', ...monthNames.map((_, i) => i), '', ''];
  const paddedDays = ['', '', ...days, '', ''];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header with Title and Selected Date */}
          <View style={styles.dateHeader}>
            <Text style={styles.titleText}>{isRTL ? 'اختر التاريخ' : 'Select Date'}</Text>
            <Text style={styles.selectedDateText}>{headerDateStr}</Text>
          </View>

          {/* Wheel Picker Container */}
          <View style={styles.pickerContainer}>
            {/* The Selection highlight bar */}
            <View style={styles.selectionBar} pointerEvents="none" />

            {/* Months Scroll Column */}
            <View style={styles.columnWrapper}>
              <ScrollView
                ref={monthRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                snapToAlignment="center"
                decelerationRate="fast"
                scrollEventThrottle={16}
                onMomentumScrollEnd={(e) => handleScrollEnd('month', e)}
                onScrollEndDrag={(e) => handleScrollEnd('month', e)}
              >
                {paddedMonths.map((item, index) => {
                  const isMonth = typeof item === 'number';
                  const isSelected = isMonth && item === selectedMonth;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.itemWrapper}
                      activeOpacity={0.7}
                      disabled={!isMonth}
                      onPress={() => {
                        if (isMonth) {
                          handleMonthSelect(item);
                          monthRef.current?.scrollTo({ y: item * ITEM_HEIGHT, animated: true });
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.itemText,
                          isSelected && styles.selectedItemText,
                        ]}
                      >
                        {isMonth ? monthNames[item] : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Divider line */}
            <View style={styles.columnDivider} />

            {/* Days Scroll Column */}
            <View style={styles.columnWrapper}>
              <ScrollView
                ref={dayRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                snapToAlignment="center"
                decelerationRate="fast"
                scrollEventThrottle={16}
                onMomentumScrollEnd={(e) => handleScrollEnd('day', e)}
                onScrollEndDrag={(e) => handleScrollEnd('day', e)}
              >
                {paddedDays.map((item, index) => {
                  const isDay = typeof item === 'number';
                  const isSelected = isDay && item === selectedDay;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.itemWrapper}
                      activeOpacity={0.7}
                      disabled={!isDay}
                      onPress={() => {
                        if (isDay) {
                          setSelectedDay(item);
                          dayRef.current?.scrollTo({ y: (item - 1) * ITEM_HEIGHT, animated: true });
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.itemText,
                          isSelected && styles.selectedItemText,
                        ]}
                      >
                        {isDay ? String(item) : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={[styles.actionButtons, isRTL && { flexDirection: 'row-reverse' }]}>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelButton} activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>
                {isRTL ? 'إلغاء' : 'CANCEL'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOK} style={styles.okButton} activeOpacity={0.8}>
              <Text style={styles.okButtonText}>
                {isRTL ? 'موافق' : 'OK'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DateSelector;
