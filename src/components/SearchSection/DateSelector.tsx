import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

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

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
      onSelect(selectedDate);
      onClose();
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <View>
      <DateTimePicker
        value={date}
        mode="date"
        display="spinner"
        onChange={handleDateChange}
      />
    </View>
  );
};

export default DateSelector;
