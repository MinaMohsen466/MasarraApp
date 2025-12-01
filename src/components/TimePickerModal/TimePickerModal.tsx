import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { styles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { checkTimeSlotAvailability } from '../../services/api';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (timeSlot: string) => void;
  serviceId: string;
  vendorId: string;
  selectedDate: Date;
  selectedTime?: string;
  token?: string;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onClose,
  onSelectTime,
  serviceId,
  vendorId,
  selectedDate,
  selectedTime,
  token,
}) => {
  const { isRTL } = useLanguage();
  const [timeSlots, setTimeSlots] = useState<{ timeSlot: string; available: boolean; bookingsCount: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && selectedDate) {
      loadTimeSlots();
    }
  }, [visible, selectedDate, serviceId, vendorId]);

  const loadTimeSlots = async () => {
    setLoading(true);
    try {
      const slots = await checkTimeSlotAvailability(serviceId, vendorId, selectedDate, token);
      
      // Filter out past time slots if selectedDate is today
      const now = new Date();
      const isToday = selectedDate.toDateString() === now.toDateString();
      
      const filteredSlots = slots.map(slot => {
        if (isToday) {
          // Parse the time slot (format: "HH:MM - HH:MM")
          const startTime = slot.timeSlot.split(' - ')[0];
          const [hours, minutes] = startTime.split(':').map(Number);
          
          // Create a date object for the slot time
          const slotDateTime = new Date(selectedDate);
          slotDateTime.setHours(hours, minutes, 0, 0);
          
          // Check if slot time is in the past
          if (slotDateTime < now) {
            return { ...slot, available: false, isPast: true };
          }
        }
        return slot;
      });
      
      setTimeSlots(filteredSlots);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString(isRTL ? 'ar-KW' : 'en-US', options);
  };

  const handleSelectTime = (timeSlot: string) => {
    onSelectTime(timeSlot);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path d="M12 7v6l4 2" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.headerTitle}>{isRTL ? 'الأوقات المتاحة' : 'Available Times'}</Text>
            </View>
          </View>

          {/* Selected Date */}
          <View style={styles.dateDisplay}>
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          </View>

          {/* Time Slots List */}
          <ScrollView style={styles.slotsScroll} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>{isRTL ? 'جاري التحميل...' : 'Loading...'}</Text>
              </View>
            ) : timeSlots.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {isRTL ? 'لا توجد أوقات متاحة لهذا التاريخ' : 'No available time slots for this date'}
                </Text>
              </View>
            ) : (
              timeSlots.map((slot, index) => {
                const isSelected = selectedTime === slot.timeSlot;
                const maxSlots = 1;
                const availableSlots = maxSlots - slot.bookingsCount;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeSlotCard,
                      isSelected && styles.timeSlotCardSelected,
                      !slot.available && styles.timeSlotCardDisabled,
                    ]}
                    onPress={() => slot.available && handleSelectTime(slot.timeSlot)}
                    disabled={!slot.available}
                    activeOpacity={0.7}>
                    <View style={styles.timeSlotLeft}>
                      <Text
                        style={[
                          styles.timeSlotText,
                          isSelected && styles.timeSlotTextSelected,
                          !slot.available && styles.timeSlotTextDisabled,
                        ]}>
                        {slot.timeSlot}
                      </Text>
                    </View>
                    <View style={styles.timeSlotRight}>
                      {slot.available ? (
                        <Text style={[styles.availabilityText, isSelected && styles.availabilityTextSelected]}>
                          {availableSlots}/{maxSlots} {isRTL ? 'فتحات' : 'spots'}
                        </Text>
                      ) : (
                        <Text style={styles.unavailableText}>{isRTL ? 'مكتمل' : 'Full'}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
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

export default TimePickerModal;
