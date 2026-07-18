import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useLanguage } from '../../contexts/LanguageContext';
import { styles } from './DateSelectorStyles';
import { colors } from '../../constants/colors';

interface DateSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedDate?: Date;
  allowPastDates?: boolean;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  selectedDate,
  allowPastDates = false,
}) => {
  const { isRTL } = useLanguage();

  // Local state for viewed month/year in the calendar view
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Local state for selected date inside the modal
  const [tempSelectedDate, setTempSelectedDate] = useState<Date>(new Date());

  // Sync state when modal becomes visible
  useEffect(() => {
    if (visible) {
      const initialDate = selectedDate || new Date();
      setTempSelectedDate(initialDate);
      setCurrentMonth(initialDate.getMonth());
      setCurrentYear(initialDate.getFullYear());
    }
  }, [visible, selectedDate]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const monthNamesEn = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const monthNamesAr = [
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
  ];
  const monthNames = isRTL ? monthNamesAr : monthNamesEn;

  const weekdaysEn = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const weekdaysAr = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
  const weekdays = isRTL ? weekdaysAr : weekdaysEn;

  // Calculate days in the current viewed month
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handleDaySelect = (dayNum: number) => {
    const newDate = new Date(currentYear, currentMonth, dayNum);
    setTempSelectedDate(newDate);
  };

  const isSelected = (dayNum: number) => {
    return (
      tempSelectedDate.getDate() === dayNum &&
      tempSelectedDate.getMonth() === currentMonth &&
      tempSelectedDate.getFullYear() === currentYear
    );
  };

  const isToday = (dayNum: number) => {
    const today = new Date();
    return (
      today.getDate() === dayNum &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  const isPast = (dayNum: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(currentYear, currentMonth, dayNum);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck < today;
  };

  const isPrevDisabled = () => {
    if (allowPastDates) return false;
    const today = new Date();
    return (
      currentYear <= today.getFullYear() && currentMonth <= today.getMonth()
    );
  };

  const handleOK = () => {
    onSelect(tempSelectedDate);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const getHeaderDateString = () => {
    const daysWeekAr = [
      'الأحد',
      'الاثنين',
      'الثلاثاء',
      'الأربعاء',
      'الخميس',
      'الجمعة',
      'السبت',
    ];
    const daysWeekEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekDay = isRTL
      ? daysWeekAr[tempSelectedDate.getDay()]
      : daysWeekEn[tempSelectedDate.getDay()];
    const month = monthNames[tempSelectedDate.getMonth()];
    const day = tempSelectedDate.getDate();
    return isRTL
      ? `${weekDay}، ${day} ${month}`
      : `${weekDay}, ${month} ${day}`;
  };

  // Build grid items (offset empty cells + active day cells)
  const gridCells = [];
  // Empty space offset
  for (let i = 0; i < firstDayIndex; i++) {
    gridCells.push({ type: 'empty', val: i });
  }
  // Days of month
  for (let i = 1; i <= totalDays; i++) {
    gridCells.push({ type: 'day', val: i });
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.dateHeader}>
            <Text style={styles.titleText}>
              {isRTL ? 'اختر التاريخ' : 'Select Date'}
            </Text>
            <Text style={styles.selectedDateText}>{getHeaderDateString()}</Text>
          </View>

          {/* Month Navigator */}
          <View
            style={[
              styles.monthHeader,
              isRTL && { flexDirection: 'row-reverse' },
            ]}
          >
            <TouchableOpacity
              onPress={handlePrevMonth}
              disabled={isPrevDisabled()}
              style={[
                styles.arrowButton,
                isPrevDisabled() && styles.disabledArrowButton,
              ]}
              activeOpacity={0.7}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d={isRTL ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
                  stroke={
                    isPrevDisabled() ? '#CBD5E1' : colors.primary || '#00a19c'
                  }
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            <Text style={styles.monthHeaderText}>
              {`${monthNames[currentMonth]} ${currentYear}`}
            </Text>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={styles.arrowButton}
              activeOpacity={0.7}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d={isRTL ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
                  stroke={colors.primary || '#00a19c'}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Weekday Labels */}
          <View
            style={[
              styles.weekdaysRow,
              isRTL && { flexDirection: 'row-reverse' },
            ]}
          >
            {weekdays.map((wd, i) => (
              <View key={i} style={styles.weekdayCol}>
                <Text style={styles.weekdayText}>{wd}</Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View
            style={[styles.daysGrid, isRTL && { flexDirection: 'row-reverse' }]}
          >
            {gridCells.map((cell, idx) => {
              if (cell.type === 'empty') {
                return <View key={`empty-${idx}`} style={styles.dayCell} />;
              }

              const dayVal = cell.val;
              const selected = isSelected(dayVal);
              const today = isToday(dayVal);
              const past = isPast(dayVal);
              const disabled = !allowPastDates && past;

              return (
                <TouchableOpacity
                  key={`day-${dayVal}`}
                  onPress={() => handleDaySelect(dayVal)}
                  disabled={disabled}
                  style={styles.dayCell}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.dayCellBg,
                      selected && styles.selectedDayCellBg,
                      today && !selected && styles.todayDayCellBg,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selected && styles.selectedDayText,
                        disabled && styles.disabledDayText,
                        today && !selected && styles.todayDayText,
                      ]}
                    >
                      {dayVal}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action Buttons */}
          <View
            style={[
              styles.actionButtons,
              isRTL && { flexDirection: 'row-reverse' },
            ]}
          >
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.cancelButton}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>
                {isRTL ? 'إلغاء' : 'CANCEL'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOK}
              style={styles.okButton}
              activeOpacity={0.8}
            >
              <Text style={styles.okButtonText}>{isRTL ? 'موافق' : 'OK'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DateSelector;
