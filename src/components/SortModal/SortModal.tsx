import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { styles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';

interface SortOption {
  id: string;
  label: string;
  labelAr: string;
}

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  selectedSort: string;
  onSortSelect: (sortId: string) => void;
}

const sortOptions: SortOption[] = [
  { id: 'newest', label: 'Newly Added', labelAr: 'الأحدث' },
  {
    id: 'priceHigh',
    label: 'Price (high to low)',
    labelAr: 'السعر (الأعلى إلى الأقل)',
  },
  {
    id: 'priceLow',
    label: 'Price (low to high)',
    labelAr: 'السعر (الأقل إلى الأعلى)',
  },
  { id: 'nameAZ', label: 'Name A - Z', labelAr: 'الاسم أ - ي' },
  { id: 'nameZA', label: 'Name Z - A', labelAr: 'الاسم ي - أ' },
];

const SortModal: React.FC<SortModalProps> = ({
  visible,
  onClose,
  selectedSort,
  onSortSelect,
}) => {
  const { isRTL } = useLanguage();

  const handleSortSelect = (sortId: string) => {
    onSortSelect(sortId);
    onClose();
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
              {isRTL ? 'ترتيب حسب' : 'Sort by'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Sort Options */}
          <View style={styles.optionsContainer}>
            {sortOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionItem}
                onPress={() => handleSortSelect(option.id)}
              >
                <Text style={[styles.optionLabel, isRTL && styles.textRTL]}>
                  {isRTL ? option.labelAr : option.label}
                </Text>
                <View
                  style={[
                    styles.radio,
                    selectedSort === option.id && styles.radioSelected,
                  ]}
                >
                  {selectedSort === option.id && (
                    <View style={styles.radioDot} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SortModal;
