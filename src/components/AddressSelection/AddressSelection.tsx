import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import { fetchAddresses, createAddress } from '../../services/api';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';

interface Address {
  _id: string;
  name: string;
  street: string;
  block?: string;
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
  // onAddAddress kept for backwards compatibility
  onAddAddress: _onAddAddress,
  token,
}) => {
  const { isRTL } = useLanguage();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );

  // New address form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
    name: '',
    city: '',
    block: '',
    street: '',
    houseNumber: '',
    floorNumber: '',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (visible && token) {
      loadAddresses();
      setShowAddForm(false);
      setNewAddress({
        name: '',
        city: '',
        block: '',
        street: '',
        houseNumber: '',
        floorNumber: '',
      });
      setFormError('');
    }
  }, [visible, token]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const data = await fetchAddresses(token);
      setAddresses(data);
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
    if (!selectedAddressId) return;
    const selectedAddress = addresses.find(
      addr => addr._id === selectedAddressId,
    );
    if (selectedAddress) {
      onSelectAddress(selectedAddress);
    }
  };

  const handleAddNewAddress = async () => {
    if (!newAddress.name.trim()) {
      setFormError(
        isRTL ? 'يرجى إدخال اسم العنوان *' : 'Please enter address name *',
      );
      return;
    }
    if (!newAddress.city.trim()) {
      setFormError(
        isRTL ? 'يرجى إدخال المنطقة / المدينة *' : 'Please enter area / city *',
      );
      return;
    }
    if (!newAddress.block.trim()) {
      setFormError(
        isRTL ? 'يرجى إدخال القطعة *' : 'Please enter block *',
      );
      return;
    }
    if (!newAddress.street.trim()) {
      setFormError(
        isRTL ? 'يرجى إدخال الشارع *' : 'Please enter street *',
      );
      return;
    }
    if (!newAddress.houseNumber.trim()) {
      setFormError(
        isRTL ? 'يرجى إدخال رقم المنزل *' : 'Please enter house number *',
      );
      return;
    }

    setIsAddingAddress(true);
    setFormError('');

    try {
      const createdAddress = await createAddress(token, {
        name: newAddress.name.trim(),
        city: newAddress.city.trim(),
        block: newAddress.block.trim(),
        street: newAddress.street.trim(),
        houseNumber: newAddress.houseNumber.trim(),
        floorNumber: newAddress.floorNumber.trim() || undefined,
        isDefault: addresses.length === 0,
      });

      setAddresses(prev => [...prev, createdAddress]);
      setSelectedAddressId(createdAddress._id);
      setShowAddForm(false);
      setNewAddress({
        name: '',
        city: '',
        block: '',
        street: '',
        houseNumber: '',
        floorNumber: '',
      });
    } catch (error: any) {
      setFormError(
        error.message ||
          (isRTL ? 'فشل في إضافة العنوان' : 'Failed to add address'),
      );
    } finally {
      setIsAddingAddress(false);
    }
  };

  const renderAddAddressForm = () => (
    <View style={styles.formContainer}>
      <View style={[styles.formHeader, isRTL && styles.formHeaderRTL]}>
        <TouchableOpacity
          onPress={() => setShowAddForm(false)}
          style={styles.backButton}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d={isRTL ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'}
              stroke={colors.primary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={[styles.formTitle, isRTL && styles.titleRTL]}>
          {isRTL ? 'إضافة عنوان جديد' : 'Add New Address'}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        style={styles.formScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name Input */}
        <Text style={[styles.inputLabel, isRTL && styles.inputLabelRTL]}>
          {isRTL ? 'اسم العنوان *' : 'Address Name *'}
        </Text>
        <View
          style={[
            styles.inputWrapper,
            isRTL && styles.inputWrapperRTL,
            activeField === 'name' && styles.inputWrapperActive,
          ]}
        >
          <Icon
            name="pricetag-outline"
            size={18}
            color={activeField === 'name' ? colors.primary : '#94A3B8'}
            style={[styles.inputIcon, isRTL && styles.inputIconRTL]}
          />
          <View style={[styles.inputDivider, isRTL && styles.inputDividerRTL]} />
          <TextInput
            style={[styles.textInput, isRTL && styles.textInputRTL]}
            placeholder={isRTL ? 'مثال: المنزل، العمل' : 'e.g. Home, Work'}
            placeholderTextColor="#94A3B8"
            value={newAddress.name}
            onChangeText={text =>
              setNewAddress(prev => ({ ...prev, name: text }))
            }
            onFocus={() => setActiveField('name')}
            onBlur={() => setActiveField(null)}
          />
        </View>

        {/* City/Area Input */}
        <Text style={[styles.inputLabel, isRTL && styles.inputLabelRTL]}>
          {isRTL ? 'المنطقة / المدينة *' : 'Area / City *'}
        </Text>
        <View
          style={[
            styles.inputWrapper,
            isRTL && styles.inputWrapperRTL,
            activeField === 'city' && styles.inputWrapperActive,
          ]}
        >
          <Icon
            name="location-outline"
            size={18}
            color={activeField === 'city' ? colors.primary : '#94A3B8'}
            style={[styles.inputIcon, isRTL && styles.inputIconRTL]}
          />
          <View style={[styles.inputDivider, isRTL && styles.inputDividerRTL]} />
          <TextInput
            style={[styles.textInput, isRTL && styles.textInputRTL]}
            placeholder={isRTL ? 'المنطقة أو المدينة' : 'Area or City'}
            placeholderTextColor="#94A3B8"
            value={newAddress.city}
            onChangeText={text =>
              setNewAddress(prev => ({ ...prev, city: text }))
            }
            onFocus={() => setActiveField('city')}
            onBlur={() => setActiveField(null)}
          />
        </View>

        {/* Block Input */}
        <Text style={[styles.inputLabel, isRTL && styles.inputLabelRTL]}>
          {isRTL ? 'القطعة *' : 'Block *'}
        </Text>
        <View
          style={[
            styles.inputWrapper,
            isRTL && styles.inputWrapperRTL,
            activeField === 'block' && styles.inputWrapperActive,
          ]}
        >
          <Icon
            name="grid-outline"
            size={18}
            color={activeField === 'block' ? colors.primary : '#94A3B8'}
            style={[styles.inputIcon, isRTL && styles.inputIconRTL]}
          />
          <View style={[styles.inputDivider, isRTL && styles.inputDividerRTL]} />
          <TextInput
            style={[styles.textInput, isRTL && styles.textInputRTL]}
            placeholder={isRTL ? 'رقم القطعة' : 'Block number'}
            placeholderTextColor="#94A3B8"
            value={newAddress.block}
            onChangeText={text =>
              setNewAddress(prev => ({ ...prev, block: text }))
            }
            onFocus={() => setActiveField('block')}
            onBlur={() => setActiveField(null)}
          />
        </View>

        {/* Street Input */}
        <Text style={[styles.inputLabel, isRTL && styles.inputLabelRTL]}>
          {isRTL ? 'الشارع *' : 'Street *'}
        </Text>
        <View
          style={[
            styles.inputWrapper,
            isRTL && styles.inputWrapperRTL,
            activeField === 'street' && styles.inputWrapperActive,
          ]}
        >
          <Icon
            name="map-outline"
            size={18}
            color={activeField === 'street' ? colors.primary : '#94A3B8'}
            style={[styles.inputIcon, isRTL && styles.inputIconRTL]}
          />
          <View style={[styles.inputDivider, isRTL && styles.inputDividerRTL]} />
          <TextInput
            style={[styles.textInput, isRTL && styles.textInputRTL]}
            placeholder={isRTL ? 'اسم أو رقم الشارع' : 'Street name or number'}
            placeholderTextColor="#94A3B8"
            value={newAddress.street}
            onChangeText={text =>
              setNewAddress(prev => ({ ...prev, street: text }))
            }
            onFocus={() => setActiveField('street')}
            onBlur={() => setActiveField(null)}
          />
        </View>

        {/* House Number Input */}
        <Text style={[styles.inputLabel, isRTL && styles.inputLabelRTL]}>
          {isRTL ? 'رقم المنزل *' : 'House Number *'}
        </Text>
        <View
          style={[
            styles.inputWrapper,
            isRTL && styles.inputWrapperRTL,
            activeField === 'houseNumber' && styles.inputWrapperActive,
          ]}
        >
          <Icon
            name="business-outline"
            size={18}
            color={activeField === 'houseNumber' ? colors.primary : '#94A3B8'}
            style={[styles.inputIcon, isRTL && styles.inputIconRTL]}
          />
          <View style={[styles.inputDivider, isRTL && styles.inputDividerRTL]} />
          <TextInput
            style={[styles.textInput, isRTL && styles.textInputRTL]}
            placeholder={isRTL ? 'رقم المنزل' : 'House number'}
            placeholderTextColor="#94A3B8"
            value={newAddress.houseNumber}
            onChangeText={text =>
              setNewAddress(prev => ({ ...prev, houseNumber: text }))
            }
            onFocus={() => setActiveField('houseNumber')}
            onBlur={() => setActiveField(null)}
          />
        </View>

        {/* Floor Number Input */}
        <Text style={[styles.inputLabel, isRTL && styles.inputLabelRTL]}>
          {isRTL ? 'رقم الطابق (اختياري)' : 'Floor Number (Optional)'}
        </Text>
        <View
          style={[
            styles.inputWrapper,
            isRTL && styles.inputWrapperRTL,
            activeField === 'floorNumber' && styles.inputWrapperActive,
          ]}
        >
          <Icon
            name="layers-outline"
            size={18}
            color={activeField === 'floorNumber' ? colors.primary : '#94A3B8'}
            style={[styles.inputIcon, isRTL && styles.inputIconRTL]}
          />
          <View style={[styles.inputDivider, isRTL && styles.inputDividerRTL]} />
          <TextInput
            style={[styles.textInput, isRTL && styles.textInputRTL]}
            placeholder={isRTL ? 'مثال: الطابق الأرضي، الثاني' : 'e.g. Ground, 2nd floor'}
            placeholderTextColor="#94A3B8"
            value={newAddress.floorNumber}
            onChangeText={text =>
              setNewAddress(prev => ({ ...prev, floorNumber: text }))
            }
            onFocus={() => setActiveField('floorNumber')}
            onBlur={() => setActiveField(null)}
          />
        </View>

        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
      </ScrollView>

      <View style={styles.formFooter}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            isAddingAddress && styles.saveButtonDisabled,
          ]}
          onPress={handleAddNewAddress}
          disabled={isAddingAddress}
        >
          {isAddingAddress ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isRTL ? 'حفظ العنوان' : 'Save Address'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {showAddForm ? (
            renderAddAddressForm()
          ) : (
            <>
              <View style={[styles.header, isRTL && styles.headerRTL]}>
                <Text style={[styles.title, isRTL && styles.titleRTL]}>
                  {isRTL ? 'اختر عنوان التسليم' : 'Select Delivery Address'}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : addresses.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text
                    style={[styles.emptyText, isRTL && styles.emptyTextRTL]}
                  >
                    {isRTL ? 'لا توجد عناوين محفوظة.' : 'No saved addresses.'}
                  </Text>
                  <TouchableOpacity
                    style={styles.addPrimaryButton}
                    onPress={() => setShowAddForm(true)}
                  >
                    <Text style={styles.addPrimaryButtonText}>
                      + {isRTL ? 'إضافة عنوان' : 'Add Address'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.listContainer}>
                  <ScrollView
                    style={styles.addressList}
                    showsVerticalScrollIndicator={false}
                  >
                    {addresses.map(address => (
                      <TouchableOpacity
                        key={address._id}
                        style={[
                          styles.addressCard,
                          isRTL && styles.addressCardRTL,
                          selectedAddressId === address._id &&
                            styles.addressCardSelected,
                        ]}
                        onPress={() => setSelectedAddressId(address._id)}
                      >
                        <View style={[styles.radioContainer, isRTL && styles.radioContainerRTL]}>
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
                        <View style={styles.addressDetails}>
                          <View
                            style={[
                              styles.nameRow,
                              isRTL && { flexDirection: 'row-reverse' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.addressName,
                                isRTL && styles.addressNameRTL,
                              ]}
                            >
                              {address.name}
                            </Text>
                            {address.isDefault && (
                              <View style={styles.defaultBadge}>
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
                            {address.block &&
                              `${isRTL ? 'القطعة' : 'Block'} ${address.block}, `}
                            {address.street}
                            {address.houseNumber &&
                              `, ${isRTL ? 'منزل' : 'House'} ${
                                address.houseNumber
                              }`}
                            {address.floorNumber &&
                              `, ${isRTL ? 'طابق' : 'Floor'} ${
                                address.floorNumber
                              }`}
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
                      style={styles.addButton}
                      onPress={() => setShowAddForm(true)}
                    >
                      <Text style={styles.addButtonText}>
                        + {isRTL ? 'إضافة عنوان جديد' : 'Add New Address'}
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              )}

              <View style={[styles.footer, isRTL && styles.footerRTL]}>
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
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '65%',
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.textDark },
  titleRTL: { textAlign: 'right' },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: { fontSize: 24, color: colors.textSecondary },
  loadingContainer: { padding: 40, alignItems: 'center' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  emptyTextRTL: { textAlign: 'right' },
  addPrimaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginTop: 20,
  },
  addPrimaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  listContainer: { flex: 1, minHeight: 0 },
  addressList: { paddingHorizontal: 20, paddingTop: 5 },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  addressCardRTL: {
    flexDirection: 'row-reverse',
  },
  addressCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5F4',
  },
  radioContainer: { marginRight: 12, paddingTop: 2 },
  radioContainerRTL: {
    marginRight: 0,
    marginLeft: 12,
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
  radioOuterSelected: { borderColor: colors.primary },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  addressDetails: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  addressName: { fontSize: 14, fontWeight: '700', color: colors.textDark },
  addressNameRTL: { textAlign: 'right' },
  addressText: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  addressTextRTL: { textAlign: 'right' },
  defaultBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: { fontSize: 9, fontWeight: '600', color: '#fff' },
  addButton: {
    backgroundColor: colors.backgroundLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerRTL: {
    flexDirection: 'row-reverse',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: colors.textDark },
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
  confirmButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  // Form styles
  formContainer: { flex: 1 },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  formHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formTitle: { fontSize: 16, fontWeight: '700', color: colors.textDark },
  formScroll: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 6,
    marginTop: 14,
  },
  inputLabelRTL: { textAlign: 'right' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    marginBottom: 4,
  },
  inputWrapperRTL: {
    flexDirection: 'row-reverse',
  },
  inputWrapperActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputIconRTL: {
    marginRight: 0,
    marginLeft: 10,
  },
  inputDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  inputDividerRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    color: colors.textDark,
    paddingVertical: 8,
    textAlign: 'left',
  },
  textInputRTL: {
    textAlign: 'right',
    fontFamily: 'System',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },
  formFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

export default AddressSelection;
