import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from 'react-native';
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
  onAddAddress: () => void;
  token: string;
}

const AddressSelection: React.FC<AddressSelectionProps> = ({
  visible,
  onClose,
  onSelectAddress,
  onAddAddress,
  token,
}) => {
  const { isRTL } = useLanguage();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );

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
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedAddressId) {
      return;
    }

    const selectedAddress = addresses.find(
      addr => addr._id === selectedAddressId,
    );
    if (selectedAddress) {
      onSelectAddress(selectedAddress);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
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
                  ? 'لا توجد عناوين محفوظة. الرجاء إضافة عنوان للمتابعة.'
                  : 'No saved addresses. Please add an address to continue.'}
              </Text>
              <TouchableOpacity
                style={styles.addAddressButtonPrimary}
                onPress={onAddAddress}
              >
                <Text style={styles.addAddressButtonPrimaryText}>
                  + {isRTL ? 'إضافة عنوان' : 'Add Address'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.addressListContainer}>
              <ScrollView 
                style={styles.addressList}
                showsVerticalScrollIndicator={false}
              >
                {addresses.map(address => (
                  <TouchableOpacity
                    key={address._id}
                    style={[
                      styles.addressCard,
                      selectedAddressId === address._id &&
                        styles.addressCardSelected,
                    ]}
                    onPress={() => setSelectedAddressId(address._id)}
                  >
                    {/* Selection Radio */}
                    <View style={styles.radioContainer}>
                      <View
                        style={[
                          styles.radioOuter,
                          selectedAddressId === address._id &&
                            styles.radioOuterSelected,
                        ]}
                      >
                        {selectedAddressId === address._id && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                    </View>

                    {/* Address Details */}
                    <View style={styles.addressDetails}>
                      <View style={[styles.nameRow, isRTL && { flexDirection: 'row-reverse' }]}>
                        <Text
                          style={[
                            styles.addressName,
                            isRTL && styles.addressNameRTL,
                          ]}
                        >
                          {address.name}
                        </Text>
                        {address.isDefault && (
                          <View style={styles.defaultBadgeInline}>
                            <Text style={styles.defaultBadgeText}>
                              {isRTL ? 'افتراضي' : 'Default'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.addressText,
                          isRTL && styles.addressTextRTL,
                        ]}
                      >
                        {address.street}
                        {address.houseNumber &&
                          `, ${isRTL ? 'منزل' : 'House'} ${address.houseNumber}`}
                        {address.floorNumber &&
                          `, ${isRTL ? 'طابق' : 'Floor'} ${address.floorNumber}`}
                      </Text>
                      <Text
                        style={[
                          styles.addressText,
                          isRTL && styles.addressTextRTL,
                        ]}
                      >
                        {address.city}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity
                  style={styles.addAddressButton}
                  onPress={onAddAddress}
                >
                  <Text style={styles.addAddressButtonText}>
                    + {isRTL ? 'إضافة عنوان جديد' : 'Add New Address'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!selectedAddressId || addresses.length === 0) &&
                  styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedAddressId || addresses.length === 0}
            >
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
    maxHeight: '85%',
    display: 'flex',
    flexDirection: 'column',
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
    fontSize: 16,
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
  addAddressButtonPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginTop: 20,
  },
  addAddressButtonPrimaryText: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '600',
  },
  addressListContainer: {
    flex: 1,
    minHeight: 0,
  },
  addAddressButton: {
    backgroundColor: colors.backgroundLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addAddressButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  addressList: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  addressName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
  },
  addressNameRTL: {
    textAlign: 'right',
  },
  addressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 3,
    lineHeight: 16,
  },
  addressTextRTL: {
    textAlign: 'right',
  },
  defaultBadgeInline: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
    fontSize: 9,
    fontWeight: '600',
    color: colors.textWhite,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexShrink: 0,
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
