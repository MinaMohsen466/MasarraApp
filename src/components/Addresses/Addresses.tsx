/* eslint-disable no-console */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
  PermissionsAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { styles } from './styles';
import {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { CustomAlert } from '../CustomAlert/CustomAlert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { WebView } from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';

import { MAP_VIEW_HTML } from '../../constants/mapHtml';

interface Address {
  _id: string;
  name: string;
  city: string;
  block?: string;
  street: string;
  lane?: string;
  houseNumber?: string;
  floorNumber?: string;
  apartmentNumber?: string;
  isDefault?: boolean;
}

const Addresses: React.FC<{
  onBack?: () => void;
  token?: string | null;
  onShowMapPicker?: () => void;
  onHideMapPicker?: () => void;
}> = ({
  onBack,
  token,
  onShowMapPicker,
  onHideMapPicker,
}) => {
    const insets = useSafeAreaInsets();
    const { isRTL } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [addresses, setAddresses] = useState<Address[]>([]);
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
    const [editingId, setEditingId] = useState<string | null>(null);

    const topMapRef = React.useRef<WebView>(null);

    const handleAddAddressClick = () => {
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
      setEditingId(null);

      // Immediately remove any existing address marker/popup from the map
      // BEFORE switching to the form view, so the old label (e.g. "Work")
      // doesn't linger while waiting for the user's GPS location.
      topMapRef.current?.postMessage(JSON.stringify({ type: 'CLEAR_MARKERS' }));

      setShowForm(true);
    };

    const handleCloseForm = () => {
      setShowForm(false);
      setEditingId(null);
      if (addresses && addresses.length > 0) {
        const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
        if (defaultAddr) {
          geocodeAndPan(defaultAddr);
        }
      }
    };

    const geocodeAndPan = async (addr: Address) => {
      if (!addr) return;
      try {
        const query = `${addr.street}, ${addr.city}`;
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
          headers: {
            'User-Agent': 'MasarraApp/1.0'
          }
        });
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);

          topMapRef.current?.postMessage(JSON.stringify({
            type: 'PAN_TO',
            lat: lat,
            lng: lon,
            label: addr.name
          }));
        }
      } catch (error) {
        if (__DEV__) console.error('Error geocoding address:', error);
      }
    };

    React.useEffect(() => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      // Only auto-pan to the default address when the form is NOT open.
      // Without this guard, the 1200 ms timer can fire *after* the 400 ms
      // SHOW_PIN message, re-creating the old marker (with its popup label)
      // on top of the center pin that the user is about to use.
      if (!showForm && addresses && addresses.length > 0) {
        const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
        if (defaultAddr) {
          timer = setTimeout(() => {
            geocodeAndPan(defaultAddr);
          }, 1200);
        }
      }
      return () => {
        if (timer) clearTimeout(timer);
      };
    }, [addresses, showForm]);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
    const [activeField, setActiveField] = useState<string | null>(null);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertButtons, setAlertButtons] = useState<Array<{ text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }>>([]);

    // Map States
    const [mapLoadingAddress, setMapLoadingAddress] = useState(false);

    React.useEffect(() => {
      if (showForm) {
        onShowMapPicker?.();
      } else {
        onHideMapPicker?.();
      }
    }, [showForm, onShowMapPicker, onHideMapPicker]);

    React.useEffect(() => {
      const timer = setTimeout(() => {
        topMapRef.current?.postMessage(JSON.stringify({
          type: 'SHOW_PIN',
          show: showForm
        }));
      }, 400);
      return () => clearTimeout(timer);
    }, [showForm]);

    const handleMapMessage = async (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'LOCATION_SELECTED') {
          const { lat, lng } = data;
          setMapLoadingAddress(true);
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${isRTL ? 'ar' : 'en'}`, {
            headers: {
              'User-Agent': 'MasarraApp/1.0'
            }
          });
          const result = await response.json();
          setMapLoadingAddress(false);
          if (result && result.address) {
            const addr = result.address;
            const road = addr.road || '';
            const suburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '';
            const city = addr.city || addr.town || addr.village || addr.county || '';

            // Pre-populate form fields
            setForm(prev => ({
              ...prev,
              city: city || suburb || '',
              street: road || suburb || '',
              block: addr.neighbourhood || addr.quarter || addr.city_district || '',
              houseNumber: addr.house_number || '',
            }));
          }
        } else if (data.type === 'REQUEST_LOCATION') {
          setMapLoadingAddress(true);
          const getGeoLocation = (highAccuracy: boolean) => {
            Geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                topMapRef.current?.injectJavaScript(
                  `window.receiveLocation(${latitude}, ${longitude}); true;`
                );
              },
              (error) => {
                if (__DEV__) console.log(`Geolocation error (highAccuracy: ${highAccuracy}):`, error);
                if (highAccuracy) {
                  // Fallback to low accuracy (WiFi/Cell tower)
                  getGeoLocation(false);
                } else {
                  setMapLoadingAddress(false);
                  topMapRef.current?.injectJavaScript(
                    `window.receiveLocationError(); true;`
                  );
                }
              },
              {
                enableHighAccuracy: highAccuracy,
                timeout: highAccuracy ? 15000 : 25000,
                maximumAge: highAccuracy ? 300000 : 600000, // 5 to 10 minutes cache to prevent indoor timeouts
              }
            );
          };

          const checkAndGetLocation = async () => {
            let hasPermission = false;
            if (Platform.OS === 'android') {
              try {
                const fineGranted = await PermissionsAndroid.check(
                  PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                const coarseGranted = await PermissionsAndroid.check(
                  PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
                );
                
                if (fineGranted || coarseGranted) {
                  hasPermission = true;
                } else {
                  const status = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                  ]);
                  if (
                    status[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ||
                    status[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
                  ) {
                    hasPermission = true;
                  }
                }
              } catch (err) {
                if (__DEV__) console.warn('Error checking/requesting Android permissions:', err);
              }
            } else if (Platform.OS === 'ios') {
              try {
                Geolocation.requestAuthorization();
                hasPermission = true;
              } catch {
                hasPermission = true;
              }
            } else {
              hasPermission = true;
            }

            if (hasPermission) {
              getGeoLocation(true);
            } else {
              setMapLoadingAddress(false);
              topMapRef.current?.injectJavaScript(
                `window.receiveLocationError(); true;`
              );
            }
          };

          checkAndGetLocation();
        } else if (data.type === 'GEOLOCATION_FAILED') {
          setAlertTitle(isRTL ? 'تحديد الموقع' : 'Location Services');
          setAlertMessage(
            isRTL
              ? 'تعذر تحديد موقعك الحالي تلقائياً. يرجى التأكد من تفعيل خدمة الموقع (GPS) في جهازك ومنح الإذن للتطبيق.'
              : 'Could not retrieve your location automatically. Please ensure location services (GPS) are enabled and permissions are granted.'
          );
          setAlertButtons([{ text: isRTL ? 'موافق' : 'OK' }]);
          setAlertVisible(true);
        }
      } catch (error) {
        if (__DEV__) console.error('Error fetching address:', error);
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
      const hasValue = value !== undefined && value !== null && value.toString().trim().length > 0;
      const showLabel = isActive || hasValue;

      return (
        <View style={styles.inputFieldContainer}>
          <View
            style={[
              styles.modalInputWrapper,
              isActive && styles.modalInputWrapperActive,
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
              placeholder={!showLabel ? label + (required ? ' *' : '') : placeholder}
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

    const pageStatusBar = (
      <StatusBar
        backgroundColor="#00a19c"
        barStyle="light-content"
        translucent={false}
      />
    );

    useEffect(() => {
      const doLoad = async () => {
        if (!token) return;
        setLoading(true);
        try {
          const data = await fetchAddresses(token);
          setAddresses(data);
        } catch {
          // Error handling
        } finally {
          setLoading(false);
        }
      };
      doLoad();
    }, [token]);

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
        setAlertButtons([{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }]);
        setAlertVisible(true);
        return;
      }

      setLoading(true);
      try {
        if (editingId) {
          const updated = await updateAddress(token, editingId, form);
          setAddresses(prev =>
            prev.map(a => (a._id === updated._id ? updated : a)),
          );
        } else {
          const created = await createAddress(token, {
            ...form,
            isDefault: addresses.length === 0,
          });
          setAddresses(prev => [created, ...prev]);
        }

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
        setEditingId(null);
      } catch {
        // Error handling
      } finally {
        setLoading(false);
      }
    };

    const startEdit = (addr: Address) => {
      setEditingId(addr._id);
      setForm({
        name: addr.name || '',
        city: addr.city || '',
        block: addr.block || '',
        street: addr.street || '',
        lane: addr.lane || '',
        houseNumber: addr.houseNumber || '',
        floorNumber: addr.floorNumber || '',
        apartmentNumber: addr.apartmentNumber || '',
      });
      setShowForm(true);
      geocodeAndPan(addr);
    };

    const confirmDelete = (addr: Address) => {
      setAddressToDelete(addr);
      setShowDeleteAlert(true);
    };

    const handleDelete = async (id: string) => {
      if (!token) return;
      setLoading(true);
      try {
        await deleteAddress(token, id);
        setAddresses(prev => prev.filter(a => a._id !== id));
      } catch {
        // Error handling
      } finally {
        setLoading(false);
      }
    };

    const handleSetDefault = async (id: string) => {
      if (!token) return;
      setLoading(true);
      try {
        await setDefaultAddress(token, id);
        // Server returns address set as default; refresh list by reloading or updating items
        // Easiest: refetch addresses
        const data = await fetchAddresses(token);
        setAddresses(data);
      } catch {
        // Error handling
      } finally {
        setLoading(false);
      }
    };

    return (
      <View style={styles.containerWhite}>
        {pageStatusBar}

        {/* Top Map Section (38% of screen height) */}
        <View style={styles.mapContainer}>
          <WebView
            ref={topMapRef}
            originWhitelist={['*']}
            source={{
              html: MAP_VIEW_HTML
                .replace('__RTL_CLASS__', isRTL ? 'rtl' : 'ltr')
                .replace('__SEARCH_PLACEHOLDER__', isRTL ? 'البحث عن موقع...' : 'Search for location...')
            }}
            style={styles.flex1}
            onMessage={handleMapMessage}
            geolocationEnabled={true}
            domStorageEnabled={true}
          />
          {/* Floating Back Button */}
          {onBack && (
            <TouchableOpacity
              style={[
                styles.floatingBackButton,
                { top: insets.top + 10 },
                isRTL ? styles.floatingBackButtonRTL : styles.floatingBackButtonLTR,
              ]}
              onPress={onBack}
              activeOpacity={0.8}
            >
              <Icon
                name={isRTL ? 'chevron-forward' : 'chevron-back'}
                size={22}
                color={colors.textDark}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Addresses Sheet Container (62% height of screen) */}
        <View style={styles.bottomSheetContainer}>
          {/* Drag handle / grab bar */}
          <View style={styles.bottomSheetIndicator} />

          {showForm ? (
            // Add/Edit Address Form inside the bottom sheet
            <View style={styles.flex1}>
              {/* Header section with Title and Close button */}
              <View style={[styles.modalHeaderRow, isRTL && styles.modalHeaderRowRTL]}>
                <Text style={styles.modalHeaderTitleText}>
                  {isRTL
                    ? editingId
                      ? 'تعديل العنوان'
                      : 'إضافة عنوان جديد'
                    : editingId
                      ? 'Edit Address'
                      : 'Add New Address'}
                </Text>
                <TouchableOpacity
                  onPress={handleCloseForm}
                >
                  <Icon name="close-outline" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <KeyboardAvoidingView
                style={styles.flex1}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}
              >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View style={styles.flex1}>
                    <ScrollView
                      style={styles.scrollContainer}
                      contentContainerStyle={styles.scrollContentContainer}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
                      {/* Active Address Geocode Loading Notification */}
                      {mapLoadingAddress && (
                        <View style={[styles.successBanner, isRTL && styles.successBannerRTL]}>
                          <ActivityIndicator size="small" color={colors.primary} style={isRTL ? styles.successIconMarginLTR : styles.successIconMarginRTL} />
                          <Text style={styles.successBannerText}>
                            {isRTL ? 'جاري تحديد تفاصيل موقع الخريطة...' : 'Resolving map address...'}
                          </Text>
                        </View>
                      )}

                      {/* Row 1: Name */}
                      <View style={[styles.modalInputRow, isRTL && styles.modalInputRowRTL]}>
                        {renderInputField(
                          isRTL ? 'اسم العنوان' : 'Address Name',
                          form.name,
                          t => setForm(s => ({ ...s, name: t })),
                          'name',
                          true,
                          1,
                          isRTL ? 'اسم العنوان (مثل: المنزل، العمل)' : 'Address Name (e.g. Home, Work)'
                        )}
                      </View>

                      {/* Row 2: City & Block */}
                      <View style={[styles.modalInputRow, isRTL && styles.modalInputRowRTL]}>
                        {renderInputField(
                          isRTL ? 'المنطقة' : 'Area',
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
                          isRTL ? 'المنزل' : 'House',
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
                          isRTL ? 'الطابق' : 'Floor',
                          form.floorNumber,
                          t => setForm(s => ({ ...s, floorNumber: t })),
                          'floorNumber',
                          false,
                          1,
                          isRTL ? 'الطابق (اختياري)' : 'Floor (Optional)'
                        )}
                        {renderInputField(
                          isRTL ? 'الشقة' : 'Apartment',
                          form.apartmentNumber,
                          t => setForm(s => ({ ...s, apartmentNumber: t })),
                          'apartmentNumber',
                          false,
                          1,
                          isRTL ? 'الشقة (اختياري)' : 'Apartment (Optional)'
                        )}
                      </View>
                    </ScrollView>

                    {/* Form Action Buttons */}
                    <View
                      style={[
                        styles.modalButtonsRow,
                        isRTL && styles.modalButtonsRowRTL,
                        {
                          paddingBottom: Math.max(16, 12 + insets.bottom),
                        }
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.modalSecondaryButton}
                        onPress={handleCloseForm}
                      >
                        <Text style={styles.modalSecondaryButtonText}>
                          {isRTL ? 'إلغاء' : 'Cancel'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.modalPrimaryButton}
                        onPress={handleSubmit}
                      >
                        <Text style={styles.modalPrimaryButtonText}>
                          {isRTL
                            ? editingId
                              ? 'حفظ التعديلات'
                              : 'إضافة'
                            : editingId
                              ? 'Save'
                              : 'Add'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </KeyboardAvoidingView>
            </View>
          ) : (
            // Saved Addresses List View
            <View style={styles.flex1}>
              {/* Header section with Title and Add New button */}
              <View style={[styles.listHeaderRow, isRTL && styles.listHeaderRowRTL]}>
                <Text style={styles.listHeaderTitleText}>
                  {isRTL ? 'العناوين المسجلة' : 'Saved Addresses'}
                </Text>
                <TouchableOpacity
                  style={[styles.listHeaderAddButton, isRTL && styles.listHeaderAddButtonRTL]}
                  onPress={handleAddAddressClick}
                  activeOpacity={0.8}
                >
                  <Icon name="add-outline" size={16} color={colors.primary} />
                  <Text style={styles.listHeaderAddButtonText}>
                    {isRTL ? 'إضافة جديد' : 'Add New'}
                  </Text>
                </TouchableOpacity>
              </View>

              <KeyboardAvoidingView
                style={styles.flex1}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}
              >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <ScrollView
                    contentContainerStyle={styles.savedAddressesList}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    {loading ? (
                      <View style={styles.emptyListContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                      </View>
                    ) : !addresses || addresses.length === 0 ? (
                      <View style={styles.emptyBox}>
                        <View style={styles.emptyIconWrap}>
                          <Icon name="map-outline" size={36} color={colors.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>
                          {isRTL ? 'لم تضف عنوان بعد' : 'No addresses added yet'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                          {isRTL
                            ? 'أضف عناوينك لتسريع حجز الخدمات وتسهيلها'
                            : 'Add your addresses to make booking services faster and easier.'}
                        </Text>

                        <TouchableOpacity
                          style={styles.primaryButton}
                          onPress={handleAddAddressClick}
                        >
                          <Text style={styles.primaryButtonText}>
                            {isRTL
                              ? '+ إضافة عنوانك الأول'
                              : '+ Add Your First Address'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        {addresses.map(addr => {
                          const isHome = addr.name.toLowerCase().includes('home') || addr.name.includes('بيت') || addr.name.includes('منزل');
                          const isWork = addr.name.toLowerCase().includes('work') || addr.name.includes('عمل');
                          const iconName = isHome ? 'home' : isWork ? 'business' : 'location';

                          return (
                            <TouchableOpacity
                              key={addr._id}
                              style={addr.isDefault ? styles.addressCardDefault : styles.addressCard}
                              onPress={() => geocodeAndPan(addr)}
                              activeOpacity={0.9}
                            >
                              <View style={styles.addressCardInner}>
                                <View
                                  style={[
                                    styles.addressCardHeader,
                                    isRTL && styles.addressCardHeaderRTL,
                                  ]}
                                >
                                  <View
                                    style={[
                                      styles.addressHeaderLeft,
                                      isRTL && styles.addressHeaderLeftRTL,
                                    ]}
                                  >
                                    <View
                                      style={[
                                        styles.addressIconContainer,
                                        addr.isDefault && styles.addressIconContainerDefault,
                                        isRTL && styles.addressIconContainerRTL,
                                      ]}
                                    >
                                      <Icon
                                        name={iconName}
                                        size={18}
                                        color={addr.isDefault ? '#FFFFFF' : colors.primary}
                                      />
                                    </View>
                                    <View
                                      style={[
                                        styles.addressNameSection,
                                        isRTL && styles.addressNameSectionRTL,
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.addressName,
                                          isRTL && styles.addressNameRTL,
                                        ]}
                                      >
                                        {addr.name}
                                      </Text>
                                      {addr.isDefault ? (
                                        <View style={styles.defaultBadge}>
                                          <Text style={styles.defaultBadgeText}>
                                            {isRTL ? 'الافتراضي' : 'Default'}
                                          </Text>
                                        </View>
                                      ) : (
                                        <TouchableOpacity
                                          onPress={() => handleSetDefault(addr._id)}
                                          style={styles.setDefaultBadgeInline}
                                          activeOpacity={0.7}
                                        >
                                          <Text style={styles.setDefaultBadgeInlineText}>
                                            {isRTL ? 'جعله افتراضي' : 'Set Default'}
                                          </Text>
                                        </TouchableOpacity>
                                      )}
                                    </View>
                                  </View>

                                  <View
                                    style={[
                                      styles.addressActionButtons,
                                      isRTL && styles.addressActionButtonsRTL,
                                    ]}
                                  >
                                    <TouchableOpacity
                                      onPress={() => startEdit(addr)}
                                      style={[
                                        styles.cardIconButton,
                                        styles.editIconButton,
                                      ]}
                                      activeOpacity={0.7}
                                    >
                                      <Icon
                                        name="create-outline"
                                        size={16}
                                        color="#475569"
                                      />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      onPress={() => confirmDelete(addr)}
                                      style={[
                                        styles.cardIconButton,
                                        styles.deleteIconButton,
                                      ]}
                                      activeOpacity={0.7}
                                    >
                                      <Icon
                                        name="trash-outline"
                                        size={16}
                                        color="#EF4444"
                                      />
                                    </TouchableOpacity>
                                  </View>
                                </View>

                                <View
                                  style={[
                                    styles.addressDetailsContainer,
                                    isRTL && styles.addressDetailsContainerRTL,
                                  ]}
                                >
                                  <View
                                    style={[
                                      styles.addressLineWithIcon,
                                      isRTL && styles.addressLineWithIconRTL,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.addressLineText,
                                        isRTL && styles.addressLineTextRTL,
                                      ]}
                                    >
                                      {addr.block &&
                                        `${isRTL ? 'القطعة' : 'Block'} ${addr.block
                                        }, `}
                                      {addr.street}
                                      {addr.lane &&
                                        `, ${isRTL ? 'جادة' : 'Lane'} ${addr.lane}`}
                                      {addr.houseNumber &&
                                        `, ${isRTL ? 'منزل' : 'House'} ${addr.houseNumber
                                        }`}
                                      {addr.floorNumber &&
                                        `, ${isRTL ? 'طابق' : 'Floor'} ${addr.floorNumber
                                        }`}
                                      {addr.apartmentNumber &&
                                        `, ${isRTL ? 'شقة' : 'Apt'} ${addr.apartmentNumber
                                        }`}
                                    </Text>
                                  </View>
                                  <View
                                    style={[
                                      styles.addressLineWithIcon,
                                      isRTL && styles.addressLineWithIconRTL,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.addressLineText,
                                        isRTL && styles.addressLineTextRTL,
                                        styles.addressCityText,
                                      ]}
                                    >
                                      {addr.city}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </>
                    )}
                  </ScrollView>
                </TouchableWithoutFeedback>
              </KeyboardAvoidingView>
            </View>
          )}
        </View>

        <CustomAlert
          visible={showDeleteAlert}
          title={isRTL ? 'حذف العنوان' : 'Delete address'}
          message={
            isRTL
              ? 'هل أنت متأكد من رغبتك في حذف هذا العنوان؟'
              : 'Are you sure you want to delete this address?'
          }
          buttons={[
            { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
            {
              text: isRTL ? 'حذف' : 'Delete',
              style: 'destructive',
              onPress: () => {
                if (addressToDelete) {
                  handleDelete(addressToDelete._id);
                }
              },
            },
          ]}
          onClose={() => {
            setShowDeleteAlert(false);
            setAddressToDelete(null);
          }}
        />

        <CustomAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          buttons={alertButtons}
          onClose={() => setAlertVisible(false)}
        />
      </View>
    );
  };

export default Addresses;
