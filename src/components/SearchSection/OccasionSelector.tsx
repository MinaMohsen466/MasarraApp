import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { styles } from './OccasionSelectorStyles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOccasions } from '../../hooks/useOccasions';
import { Occasion } from '../../services/api';

interface OccasionSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (occasion: Occasion) => void;
  selectedOccasion?: Occasion;
}

const OccasionSelector: React.FC<OccasionSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  selectedOccasion,
}) => {
  const { isRTL } = useLanguage();
  const { data: occasions, isLoading } = useOccasions();

  const renderOccasionItem = ({ item }: { item: Occasion }) => {
    const displayName = isRTL ? item.nameAr : item.name;
    const isSelected = selectedOccasion?._id === item._id;

    return (
      <TouchableOpacity
        style={[
          styles.occasionItem,
          isSelected && styles.occasionItemSelected,
        ]}
        onPress={() => {
          console.log('🎉 Occasion selected from modal:', item._id, item.name);
          onSelect(item);
          onClose();
        }}
        activeOpacity={0.7}>
        <View style={styles.occasionItemContent}>
          <Text style={[styles.occasionItemText, isRTL && styles.occasionItemTextRTL]}>
            {displayName}
          </Text>
          {isSelected && (
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 6L9 17L4 12"
                stroke={colors.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isRTL && styles.modalContentRTL]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isRTL ? 'اختر المناسبة' : 'Select Occasion'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6L18 18"
                  stroke={colors.textDark}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Occasions List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={occasions}
              renderItem={renderOccasionItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              contentContainerStyle={styles.occasionsList}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default OccasionSelector;
