import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { styles } from './DateSelectorStyles';

interface DateSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedDate?: Date;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  selectedDate,
}) => {
  const [date, setDate] = useState<Date>(selectedDate || new Date());
  const { isRTL } = useLanguage();

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  const monthNames = isRTL
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const weekDays = isRTL ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() - 1);
    setDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + 1);
    setDate(newDate);
  };

  const handleDayPress = (day: number) => {
    const newDate = new Date(date);
    newDate.setDate(day);
    setDate(newDate);
  };

  const handleOK = () => {
    onSelect(date);
    onClose();
  };

  const renderCalendar = () => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    const totalCells = Math.ceil((daysInMonth + firstDay) / 7) * 7;
    
    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < totalCells; i++) {
      const day = i - firstDay + 1;
      const isValidDay = day > 0 && day <= daysInMonth;
      
      // Check if this is a past date
      const dayDate = new Date(year, month, day);
      dayDate.setHours(0, 0, 0, 0);
      const isPastDate = dayDate < today;
      
      const isSelected = isValidDay && day === date.getDate() && month === date.getMonth() && year === date.getFullYear();
      const isDisabled = !isValidDay || isPastDate;

      days.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.dayCell,
            isSelected && styles.selectedDayCell,
            isPastDate && isValidDay && styles.pastDayCell,
          ]}
          onPress={() => isValidDay && !isPastDate && handleDayPress(day)}
          disabled={isDisabled}
          activeOpacity={0.7}
        >
          {isValidDay && (
            <Text style={[
              styles.dayText,
              isSelected && styles.selectedDayText,
              isPastDate && styles.pastDayText,
            ]}>
              {day}
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  if (!visible) {
    return null;
  }

  const weekDayName = isRTL 
    ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][date.getDay()]
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];

  const monthName = monthNames[date.getMonth()];
  const dayNum = date.getDate();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header with Year and Day */}
          <View style={styles.dateHeader}>
            <Text style={styles.yearText}>{date.getFullYear()}</Text>
            <Text style={styles.selectedDateText}>
              {`${weekDayName}, ${monthName.substring(0, 3)} ${dayNum}`}
            </Text>
          </View>

          {/* Calendar */}
          <View style={styles.calendarContainer}>
            {/* Month Navigation */}
            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
                <Text style={styles.navText}>{isRTL ? '›' : '‹'}</Text>
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {`${monthNames[date.getMonth()]} ${date.getFullYear()}`}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                <Text style={styles.navText}>{isRTL ? '‹' : '›'}</Text>
              </TouchableOpacity>
            </View>

            {/* Week Days */}
            <View style={styles.weekDaysRow}>
              {weekDays.map((day, index) => (
                <View key={index} style={styles.weekDayCell}>
                  <Text style={styles.weekDayText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Days Grid */}
            <View style={styles.daysGrid}>
              {renderCalendar()}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>
                {isRTL ? 'إلغاء' : 'CANCEL'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOK} style={styles.okButton}>
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
