import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { fetchAddresses, createAddress } from '../../services/api';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { CustomAlert } from '../CustomAlert/CustomAlert';

interface Address {
  _id: string;
  name: string;
  street: string;
  block?: string;
  lane?: string;
  houseNumber?: string;
  floorNumber?: string;
  apartmentNumber?: string;
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

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    city: '',
    block: '',
    street: '',
    lane: '',
    houseNumber: '',
    floorNumber: '',
    apartmentNumber: '',
  });
  const [activeField, setActiveField] = useState<string | null>(null);

  // Custom Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const handleSubmit = async () => {
    if (!token) return;

    // Validate required fields (name, city, block, street, houseNumber)
    if (
      !form.name.trim() ||
      !form.city.trim() ||
      !form.block.trim() ||
      !form.street.trim() ||
      !form.houseNumber.trim()
    ) {
      setAlertTitle(isRTL ? 'حقول مطلوبة' : 'Required Fields');
      setAlertMessage(
        isRTL
          ? 'يرجى ملء جميع الحقول المطلوبة: الاسم، المدينة، القطعة، الشارع، ورقم المنزل'
          : 'Please fill in all required fields: Name, City, Block, Street, and House Number',
      );
      setAlertVisible(true);
      return;
    }

    setLoading(true);
    try {
      const created = await createAddress(token, {
        ...form,
        isDefault: addresses.length === 0,
      });
      setAddresses(prev => [created, ...prev]);
      setSelectedAddressId(created._id);
      setShowForm(false);
      setForm({
        name: '',
        city: '',
        block: '',
        street: '',
        lane: '',
        houseNumber: '',
        floorNumber: '',
        apartmentNumber: '',
      });
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  const loadAddresses = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    if (visible && token) {
      loadAddresses();
    }
  }, [visible, token, loadAddresses]);

  const handleConfirm = () => {
    if (!selectedAddressId) return;
    const selectedAddress = addresses.find(
      addr => addr._id === selectedAddressId,
    );
    if (selectedAddress) {
      onSelectAddress(selectedAddress);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (showForm) {
      return (
        <View style={styles.listContainer}>
          <ScrollView
            style={styles.addressList}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Name Input */}
            <View
              style={[
                styles.modalInputWrapper,
                isRTL && styles.modalInputWrapperRTL,
                activeField === 'name' && styles.modalInputWrapperActive,
              ]}
            >
              <Icon
                name="pricetag-outline"
                size={18}
                color={
                  activeField === 'name' ? colors.primary : '#94A3B8'
                }
                style={[
                  styles.modalInputIcon,
                  isRTL && styles.modalInputIconRTL,
                ]}
              />
              <View
                style={[
                  styles.modalInputDivider,
                  isRTL && styles.modalInputDividerRTL,
                ]}
              />
              <TextInput
                placeholder={
                  isRTL
                    ? 'الاسم (مثل: المنزل، العمل) *'
                    : 'Name (e.g. Home, Work) *'
                }
                value={form.name}
                onChangeText={t => setForm(s => ({ ...s, name: t }))}
                style={[
                  styles.modalTextInput,
                  isRTL && styles.modalTextInputRTL,
                ]}
                placeholderTextColor="#94A3B8"
                onFocus={() => setActiveField('name')}
                onBlur={() => setActiveField(null)}
              />
            </View>

            {/* City Input */}
            <View
              style={[
                styles.modalInputWrapper,
                isRTL && styles.modalInputWrapperRTL,
                activeField === 'city' && styles.modalInputWrapperActive,
              ]}
            >
              <Icon
                name="location-outline"
                size={18}
                color={
                  activeField === 'city' ? colors.primary : '#94A3B8'
                }
                style={[
                  styles.modalInputIcon,
                  isRTL && styles.modalInputIconRTL,
                ]}
              />
              <View
                style={[
                  styles.modalInputDivider,
                  isRTL && styles.modalInputDividerRTL,
                ]}
              />
              <TextInput
                placeholder={
                  isRTL ? 'المنطقة / المدينة *' : 'Area / City *'
                }
                value={form.city}
                onChangeText={t => setForm(s => ({ ...s, city: t }))}
                style={[
                  styles.modalTextInput,
                  isRTL && styles.modalTextInputRTL,
                ]}
                placeholderTextColor="#94A3B8"
                onFocus={() => setActiveField('city')}
                onBlur={() => setActiveField(null)}
              />
            </View>

            {/* Block Input */}
            <View
              style={[
                styles.modalInputWrapper,
                isRTL && styles.modalInputWrapperRTL,
                activeField === 'block' && styles.modalInputWrapperActive,
              ]}
            >
              <Icon
                name="grid-outline"
                size={18}
                color={
                  activeField === 'block' ? colors.primary : '#94A3B8'
                }
                style={[
                  styles.modalInputIcon,
                  isRTL && styles.modalInputIconRTL,
                ]}
              />
              <View
                style={[
                  styles.modalInputDivider,
                  isRTL && styles.modalInputDividerRTL,
                ]}
              />
              <TextInput
                placeholder={isRTL ? 'القطعة *' : 'Block *'}
                value={form.block}
                onChangeText={t => setForm(s => ({ ...s, block: t }))}
                style={[
                  styles.modalTextInput,
                  isRTL && styles.modalTextInputRTL,
                ]}
                placeholderTextColor="#94A3B8"
                onFocus={() => setActiveField('block')}
                onBlur={() => setActiveField(null)}
              />
            </View>

            {/* Street Input */}
            <View
              style={[
                styles.modalInputWrapper,
                isRTL && styles.modalInputWrapperRTL,
                activeField === 'street' &&
                  styles.modalInputWrapperActive,
              ]}
            >
              <Icon
                name="home-outline"
                size={18}
                color={
                  activeField === 'street' ? colors.primary : '#94A3B8'
                }
                style={[
                  styles.modalInputIcon,
                  isRTL && styles.modalInputIconRTL,
                ]}
              />
              <View
                style={[
                  styles.modalInputDivider,
                  isRTL && styles.modalInputDividerRTL,
                ]}
              />
              <TextInput
                placeholder={isRTL ? 'الشارع *' : 'Street *'}
                value={form.street}
                onChangeText={t => setForm(s => ({ ...s, street: t }))}
                style={[
                  styles.modalTextInput,
                  isRTL && styles.modalTextInputRTL,
                ]}
                placeholderTextColor="#94A3B8"
                onFocus={() => setActiveField('street')}
                onBlur={() => setActiveField(null)}
              />
            </View>

            {/* Lane Input */}
            <View
              style={[
                styles.modalInputWrapper,
                isRTL && styles.modalInputWrapperRTL,
                activeField === 'lane' &&
                  styles.modalInputWrapperActive,
              ]}
            >
              <Icon
                name="trail-sign-outline"
                size={18}
                color={
                  activeField === 'lane' ? colors.primary : '#94A3B8'
                }
                style={[
                  styles.modalInputIcon,
                  isRTL && styles.modalInputIconRTL,
                ]}
              />
              <View
                style={[
                  styles.modalInputDivider,
                  isRTL && styles.modalInputDividerRTL,
                ]}
              />
              <TextInput
                placeholder={isRTL ? 'الجادة (اختياري)' : 'Lane (Optional)'}
                value={form.lane}
                onChangeText={t => setForm(s => ({ ...s, lane: t }))}
                style={[
                  styles.modalTextInput,
                  isRTL && styles.modalTextInputRTL,
                ]}
                placeholderTextColor="#94A3B8"
                onFocus={() => setActiveField('lane')}
                onBlur={() => setActiveField(null)}
              />
            </View>

            {/* House Number Input */}
            <View
              style={[
                styles.modalInputWrapper,
                isRTL && styles.modalInputWrapperRTL,
                activeField === 'houseNumber' &&
                  styles.modalInputWrapperActive,
              ]}
            >
              <Icon
                name="business-outline"
                size={18}
                color={
                  activeField === 'houseNumber'
                    ? colors.primary
                    : '#94A3B8'
                }
                style={[
                  styles.modalInputIcon,
                  isRTL && styles.modalInputIconRTL,
                ]}
              />
              <View
                style={[
                  styles.modalInputDivider,
                  isRTL && styles.modalInputDividerRTL,
                ]}
              />
              <TextInput
                placeholder={isRTL ? 'رقم المنزل *' : 'House Number *'}
                value={form.houseNumber}
                onChangeText={t =>
                  setForm(s => ({ ...s, houseNumber: t }))
                }
                style={[
                  styles.modalTextInput,
                  isRTL && styles.modalTextInputRTL,
                ]}
                placeholderTextColor="#94A3B8"
                onFocus={() => setActiveField('houseNumber')}
                onBlur={() => setActiveField(null)}
              />
            </View>

            {/* Floor Number Input */}
            <View
              style={[
                styles.modalInputWrapper,
                isRTL && styles.modalInputWrapperRTL,
                activeField === 'floorNumber' &&
                  styles.modalInputWrapperActive,
              ]}
            >
              <Icon
                name="layers-outline"
                size={18}
                color={
                  activeField === 'floorNumber'
                    ? colors.primary
                    : '#94A3B8'
                }
                style={[
                  styles.modalInputIcon,
                  isRTL && styles.modalInputIconRTL,
                ]}
              />
              <View
                style={[
                  styles.modalInputDivider,
                  isRTL && styles.modalInputDividerRTL,
                ]}
              />
              <TextInput
                placeholder={
                  isRTL
                    ? 'رقم الطابق (اختياري)'
                    : 'Floor Number (Optional)'
                }
                value={form.floorNumber}
                onChangeText={t =>
                  setForm(s => ({ ...s, floorNumber: t }))
                }
                style={[
                  styles.modalTextInput,
                  isRTL && styles.modalTextInputRTL,
                ]}
                placeholderTextColor="#94A3B8"
                onFocus={() => setActiveField('floorNumber')}
                onBlur={() => setActiveField(null)}
              />
            </View>

            {/* Apartment Number Input */}
            <View
              style={[
                styles.modalInputWrapper,
                isRTL && styles.modalInputWrapperRTL,
                activeField === 'apartmentNumber' &&
                  styles.modalInputWrapperActive,
              ]}
            >
              <Icon
                name="home-outline"
                size={18}
                color={
                  activeField === 'apartmentNumber'
                    ? colors.primary
                    : '#94A3B8'
                }
                style={[
                  styles.modalInputIcon,
                  isRTL && styles.modalInputIconRTL,
                ]}
              />
              <View
                style={[
                  styles.modalInputDivider,
                  isRTL && styles.modalInputDividerRTL,
                ]}
              />
              <TextInput
                placeholder={
                  isRTL
                    ? 'رقم الشقة (اختياري)'
                    : 'Apartment Number (Optional)'
                }
                value={form.apartmentNumber}
                onChangeText={t =>
                  setForm(s => ({ ...s, apartmentNumber: t }))
                }
                style={[
                  styles.modalTextInput,
                  isRTL && styles.modalTextInputRTL,
                ]}
                placeholderTextColor="#94A3B8"
                onFocus={() => setActiveField('apartmentNumber')}
                onBlur={() => setActiveField(null)}
              />
            </View>
          </ScrollView>

          <View style={[styles.footer, isRTL && styles.footerRTL]}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                if (addresses.length === 0) {
                  onClose();
                } else {
                  setShowForm(false);
                }
              }}
            >
              <Text style={styles.cancelButtonText}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleSubmit}
            >
              <Text style={styles.confirmButtonText}>
                {isRTL ? 'إضافة' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (addresses.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text
            style={[styles.emptyText, isRTL && styles.emptyTextRTL]}
          >
            {isRTL
              ? 'لا توجد عناوين محفوظة. يرجى إضافة عنوان للبدء.'
              : 'No saved addresses. Please add an address to proceed.'}
          </Text>
          <TouchableOpacity
            style={styles.addPrimaryButton}
            onPress={() => {
              setForm({
                name: '',
                city: '',
                block: '',
                street: '',
                lane: '',
                houseNumber: '',
                floorNumber: '',
                apartmentNumber: '',
              });
              setShowForm(true);
            }}
          >
            <Text style={styles.addPrimaryButtonText}>
              {isRTL ? '+ إضافة عنوان جديد' : '+ Add New Address'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
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
              <View
                style={[
                  styles.radioContainer,
                  isRTL && styles.radioContainerRTL,
                ]}
              >
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
                    `${isRTL ? 'القطعة' : 'Block'} ${
                      address.block
                    }, `}
                  {address.street}
                  {address.lane &&
                    `, ${isRTL ? 'جادة' : 'Lane'} ${
                      address.lane
                    }`}
                  {address.houseNumber &&
                    `, ${isRTL ? 'منزل' : 'House'} ${
                      address.houseNumber
                    }`}
                  {address.floorNumber &&
                    `, ${isRTL ? 'طابق' : 'Floor'} ${
                      address.floorNumber
                    }`}
                  {address.apartmentNumber &&
                    `, ${isRTL ? 'شقة' : 'Apt'} ${
                      address.apartmentNumber
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
          
          {/* Add Address button inside the scrollable list */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setForm({
                name: '',
                city: '',
                block: '',
                street: '',
                lane: '',
                houseNumber: '',
                floorNumber: '',
                apartmentNumber: '',
              });
              setShowForm(true);
            }}
          >
            <Text style={styles.addButtonText}>
              {isRTL ? '+ إضافة عنوان جديد' : '+ Add New Address'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

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
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (showForm && addresses.length > 0) {
          setShowForm(false);
        } else {
          onClose();
        }
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={[styles.header, isRTL && styles.headerRTL]}>
            <Text style={[styles.title, isRTL && styles.titleRTL]}>
              {showForm
                ? isRTL ? 'إضافة عنوان جديد' : 'Add New Address'
                : isRTL ? 'اختر عنوان التسليم' : 'Select Delivery Address'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (showForm && addresses.length > 0) {
                  setShowForm(false);
                } else {
                  onClose();
                }
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {renderContent()}
        </View>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        buttons={[{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }]}
        onClose={() => setAlertVisible(false)}
      />
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
    backgroundColor: colors.textWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  listContainer: { flexShrink: 1, minHeight: 0 },
  addressList: { paddingHorizontal: 20, paddingTop: 5 },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
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
    backgroundColor: colors.textWhite,
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
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 48,
  },
  modalInputWrapperRTL: {
    flexDirection: 'row-reverse',
  },
  modalInputWrapperActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  modalInputIcon: {
    marginRight: 10,
  },
  modalInputIconRTL: {
    marginRight: 0,
    marginLeft: 10,
  },
  modalInputDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  modalInputDividerRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 14.5,
    color: colors.textDark,
    paddingVertical: 8,
    textAlign: 'left',
  },
  modalTextInputRTL: {
    textAlign: 'right',
    fontFamily: 'System',
  },
});

export default AddressSelection;
