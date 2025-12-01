import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { fetchAddresses } from '../../services/api';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';

interface Address {
  _id: string;
  name: string;
  street: string;
  houseNumber?: string;
  floorNumber?: string;
  city: string;
  isDefault?: boolean;
}

interface AddressSelectionProps {
  visible: boolean;
  onClose: () => void;
  onSelectAddress: (address: Address) => void;
  token: string;
}

const AddressSelection: React.FC<AddressSelectionProps> = ({
  visible,
  onClose,
  onSelectAddress,
  token
}) => {
  const { isRTL } = useLanguage();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && token) {
      loadAddresses();
    }
  }, [visible, token]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const data = await fetchAddresses(token);
      setAddresses(data);
      
      // Auto-select default address if available
      const defaultAddr = data.find((addr: Address) => addr.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedAddressId) {
      return;
    }
    
    const selectedAddress = addresses.find(addr => addr._id === selectedAddressId);
    if (selectedAddress) {
      onSelectAddress(selectedAddress);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, isRTL && styles.titleRTL]}>
              {isRTL ? 'اختر عنوان التسليم' : 'Select Delivery Address'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : addresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, isRTL && styles.emptyTextRTL]}>
                {isRTL 
                  ? 'لا توجد عناوين محفوظة. الرجاء إضافة عنوان من صفحة العناوين.'
                  : 'No saved addresses. Please add an address from the Addresses page.'}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.addressList}>
              {addresses.map((address) => (
                <TouchableOpacity
                  key={address._id}
                  style={[
                    styles.addressCard,
                    selectedAddressId === address._id && styles.addressCardSelected
                  ]}
                  onPress={() => setSelectedAddressId(address._id)}>
                  
                  {/* Selection Radio */}
                  <View style={styles.radioContainer}>
                    <View style={[
                      styles.radioOuter,
                      selectedAddressId === address._id && styles.radioOuterSelected
                    ]}>
                      {selectedAddressId === address._id && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                  </View>

                  {/* Address Details */}
                  <View style={styles.addressDetails}>
                    <Text style={[styles.addressName, isRTL && styles.addressNameRTL]}>
                      {address.name}
                    </Text>
                    <Text style={[styles.addressText, isRTL && styles.addressTextRTL]}>
                      {address.street}
                      {address.houseNumber && `, ${isRTL ? 'منزل' : 'House'} ${address.houseNumber}`}
                      {address.floorNumber && `, ${isRTL ? 'طابق' : 'Floor'} ${address.floorNumber}`}
                    </Text>
                    <Text style={[styles.addressText, isRTL && styles.addressTextRTL]}>
                      {address.city}
                    </Text>
                    
                    {address.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>
                          {isRTL ? 'افتراضي' : 'Default'}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}>
              <Text style={styles.cancelButtonText}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!selectedAddressId || addresses.length === 0) && styles.confirmButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={!selectedAddressId || addresses.length === 0}>
              <Text style={styles.confirmButtonText}>
                {isRTL ? 'تأكيد الحجز' : 'Confirm Booking'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  titleRTL: {
    textAlign: 'right',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyTextRTL: {
    textAlign: 'right',
  },
  addressList: {
    maxHeight: 400,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  addressCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5F4',
  },
  radioContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  addressDetails: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 6,
  },
  addressNameRTL: {
    textAlign: 'right',
  },
  addressText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  addressTextRTL: {
    textAlign: 'right',
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textWhite,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  confirmButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textWhite,
  },
});

export default AddressSelection;
