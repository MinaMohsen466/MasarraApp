import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  PermissionsAndroid,
} from 'react-native';
import { fetchAddresses, createAddress } from '../../services/api';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { CustomAlert } from '../CustomAlert/CustomAlert';
import { BottomSheet } from '../common/BottomSheet';
import { WebView } from 'react-native-webview';
import { MAP_VIEW_HTML } from '../../constants/mapHtml';
import { styles } from './styles';


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

  // Map & Location permission states
  const topMapRef = useRef<WebView>(null);
  const [mapLoadingAddress, setMapLoadingAddress] = useState(false);

  const handleOpenForm = async () => {
    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: isRTL ? 'إذن الوصول للموقع' : 'Location Permission',
            message: isRTL
              ? 'يحتاج التطبيق للوصول إلى موقعك لعرضه على الخريطة.'
              : 'This app needs access to your location to show it on the map.',
            buttonNeutral: isRTL ? 'اسألني لاحقاً' : 'Ask Me Later',
            buttonNegative: isRTL ? 'إلغاء' : 'Cancel',
            buttonPositive: isRTL ? 'موافق' : 'OK',
          }
        );
      } catch (err) {
        console.warn(err);
      }
    }
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
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      topMapRef.current?.postMessage(
        JSON.stringify({
          type: 'SHOW_PIN',
          show: showForm,
        })
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [showForm]);

  const handleMapMessage = async (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'LOCATION_SELECTED') {
        const { lat, lng } = data;
        setMapLoadingAddress(true);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${
            isRTL ? 'ar' : 'en'
          }`,
          {
            headers: {
              'User-Agent': 'MasarraApp/1.0',
            },
          }
        );
        const result = await response.json();
        setMapLoadingAddress(false);
        if (result && result.address) {
          const addr = result.address;
          const road = addr.road || '';
          const suburb =
            addr.suburb ||
            addr.neighbourhood ||
            addr.quarter ||
            addr.city_district ||
            '';
          const city =
            addr.city || addr.town || addr.village || addr.county || '';

          // Pre-populate form fields
          setForm(prev => ({
            ...prev,
            city: city || suburb || '',
            street: road || suburb || '',
            block:
              addr.neighbourhood ||
              addr.quarter ||
              addr.city_district ||
              '',
            houseNumber: addr.house_number || '',
          }));
        }
      } else if (data.type === 'GEOLOCATION_FAILED') {
        setAlertTitle(isRTL ? 'تحديد الموقع' : 'Location Services');
        setAlertMessage(
          isRTL
            ? 'تعذر تحديد موقعك الحالي تلقائياً. يرجى التأكد من تفعيل خدمة الموقع (GPS) في جهازك ومنح الإذن للتطبيق.'
            : 'Could not retrieve your location automatically. Please ensure location services (GPS) are enabled and permissions are granted.'
        );
        setAlertVisible(true);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setMapLoadingAddress(false);
    }
  };

  const renderInputField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    fieldKey: string,
    required: boolean = false,
    _flex: number = 1,
    placeholder: string = ''
  ) => {
    const isActive = activeField === fieldKey;
    const hasValue =
      value !== undefined &&
      value !== null &&
      value.toString().trim().length > 0;
    const showLabel = isActive || hasValue;

    return (
      <View style={styles.inputFieldContainer}>
        <View
          style={[
            styles.modalInputWrapper,
            isActive && styles.modalInputWrapperActive,
            isRTL && styles.modalInputWrapperRTL,
          ]}
        >
          {showLabel && (
            <Text
              style={[
                styles.modalInputLabel,
                isRTL && styles.modalInputLabelRTL,
                isActive && styles.modalInputLabelActive,
              ]}
              numberOfLines={1}
            >
              {label}
              {required && <Text style={styles.requiredStar}>*</Text>}
            </Text>
          )}
          <TextInput
            placeholder={
              !showLabel ? label + (required ? ' *' : '') : placeholder
            }
            value={value}
            onChangeText={onChangeText}
            style={[
              styles.modalTextInput,
              isRTL && styles.modalTextInputRTL,
            ]}
            placeholderTextColor="#94A3B8"
            onFocus={() => setActiveField(fieldKey)}
            onBlur={() => setActiveField(null)}
          />
        </View>
      </View>
    );
  };


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
        <View style={styles.formContainer}>
          {/* Active Address Geocode Loading Notification */}
          {mapLoadingAddress && (
            <View style={styles.mapLoadingBanner}>
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={isRTL ? styles.successIconMarginLTR : styles.successIconMarginRTL}
              />
              <Text style={styles.mapLoadingBannerText}>
                {isRTL
                  ? 'جاري تحديد تفاصيل موقع الخريطة...'
                  : 'Resolving map address...'}
              </Text>
            </View>
          )}

          {/* Form Map Section */}
          <View style={styles.formMapWrapper}>
            <WebView
              ref={topMapRef}
              originWhitelist={['*']}
              source={{
                html: MAP_VIEW_HTML.replace(
                  '__RTL_CLASS__',
                  isRTL ? 'rtl' : 'ltr'
                ).replace(
                  '__SEARCH_PLACEHOLDER__',
                  isRTL ? 'البحث عن موقع...' : 'Search for location...'
                ),
              }}
              style={styles.flex1}
              onMessage={handleMapMessage}
              geolocationEnabled={true}
            />
          </View>

          <KeyboardAvoidingView
            style={styles.flex1}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.flex1}>
                <ScrollView
                  style={styles.addressList}
                  contentContainerStyle={styles.scrollContentContainer}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Row 1: Name */}
                  <View style={[styles.modalInputRow, isRTL && styles.modalInputRowRTL]}>
                    {renderInputField(
                      isRTL ? 'اسم العنوان' : 'Address Name',
                      form.name,
                      t => setForm(s => ({ ...s, name: t })),
                      'name',
                      true,
                      1,
                      isRTL
                        ? 'اسم العنوان (مثل: المنزل، العمل)'
                        : 'Address Name (e.g. Home, Work)'
                    )}
                  </View>

                  {/* Row 2: City & Block */}
                  <View style={[styles.modalInputRow, isRTL && styles.modalInputRowRTL]}>
                    {renderInputField(
                      isRTL ? 'المنطقة / المدينة' : 'Area / City',
                      form.city,
                      t => setForm(s => ({ ...s, city: t })),
                      'city',
                      true,
                      1,
                      isRTL ? 'المنطقة / المدينة' : 'Area / City'
                    )}
                    {renderInputField(
                      isRTL ? 'القطعة' : 'Block',
                      form.block,
                      t => setForm(s => ({ ...s, block: t })),
                      'block',
                      true,
                      1,
                      isRTL ? 'القطعة' : 'Block'
                    )}
                  </View>

                  {/* Row 3: Street & Lane */}
                  <View style={[styles.modalInputRow, isRTL && styles.modalInputRowRTL]}>
                    {renderInputField(
                      isRTL ? 'الشارع' : 'Street',
                      form.street,
                      t => setForm(s => ({ ...s, street: t })),
                      'street',
                      true,
                      1,
                      isRTL ? 'الشارع' : 'Street'
                    )}
                    {renderInputField(
                      isRTL ? 'الجادة' : 'Lane',
                      form.lane,
                      t => setForm(s => ({ ...s, lane: t })),
                      'lane',
                      false,
                      1,
                      isRTL ? 'الجادة (اختياري)' : 'Lane (Optional)'
                    )}
                  </View>

                  {/* Row 4: House Number */}
                  <View style={[styles.modalInputRow, isRTL && styles.modalInputRowRTL]}>
                    {renderInputField(
                      isRTL ? 'رقم المنزل' : 'House Number',
                      form.houseNumber,
                      t => setForm(s => ({ ...s, houseNumber: t })),
                      'houseNumber',
                      true,
                      1,
                      isRTL ? 'رقم المنزل' : 'House Number'
                    )}
                  </View>

                  {/* Row 5: Floor & Apartment */}
                  <View style={[styles.modalInputRow, isRTL && styles.modalInputRowRTL]}>
                    {renderInputField(
                      isRTL ? 'رقم الطابق' : 'Floor Number',
                      form.floorNumber,
                      t => setForm(s => ({ ...s, floorNumber: t })),
                      'floorNumber',
                      false,
                      1,
                      isRTL ? 'رقم الطابق (اختياري)' : 'Floor Number (Optional)'
                    )}
                    {renderInputField(
                      isRTL ? 'رقم الشقة' : 'Apartment Number',
                      form.apartmentNumber,
                      t => setForm(s => ({ ...s, apartmentNumber: t })),
                      'apartmentNumber',
                      false,
                      1,
                      isRTL
                        ? 'رقم الشقة (اختياري)'
                        : 'Apartment Number (Optional)'
                    )}
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
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
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
            onPress={handleOpenForm}
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
                    isRTL && styles.flexDirectionRTL,
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
            onPress={handleOpenForm}
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
    <BottomSheet visible={visible} onClose={onClose}>
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

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        buttons={[{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }]}
        onClose={() => setAlertVisible(false)}
      />
    </BottomSheet>
  );
};

export default AddressSelection;
