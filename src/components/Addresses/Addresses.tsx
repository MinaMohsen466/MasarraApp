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
import { colors, colorUtils } from '../../constants/colors';
import { WebView } from 'react-native-webview';

const MAP_VIEW_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    body, html, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #f8fafc;
    }
    #center-marker {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -100%);
      z-index: 1000;
      pointer-events: none;
      transition: all 0.2s ease-out;
      display: none;
    }
    .custom-leaflet-marker {
      background: none !important;
      border: none !important;
    }
    .leaflet-popup-content-wrapper {
      background: #00a19c !important;
      color: #ffffff !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      font-weight: 700;
      border-radius: 20px !important;
      box-shadow: 0 4px 15px rgba(0, 161, 156, 0.25) !important;
      border: none !important;
      padding: 0px !important;
    }
    .leaflet-popup-content {
      margin: 6px 14px !important;
      text-align: center;
    }
    .leaflet-popup-tip {
      background: #00a19c !important;
      border: none !important;
      box-shadow: none !important;
    }
    /* Address pin pulse */
    .address-marker-pulse {
      position: absolute;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: rgba(0, 161, 156, 0.35);
      z-index: 1;
      animation: addressPulse 2s infinite ease-out;
    }
    @keyframes addressPulse {
      0% {
        transform: scale(1);
        opacity: 0.9;
      }
      100% {
        transform: scale(3.5);
        opacity: 0;
      }
    }
    /* Modern Zoom Controls */
    .leaflet-bottom {
      bottom: 58px !important;
    }
    .leaflet-bar {
      border: 1px solid rgba(0, 161, 156, 0.15) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
      border-radius: 12px !important;
      overflow: hidden;
    }
    .leaflet-bar a {
      background-color: #ffffff !important;
      color: #00a19c !important;
      border-bottom: 1px solid #f1f5f9 !important;
      width: 36px !important;
      height: 36px !important;
      line-height: 36px !important;
      font-size: 18px !important;
      transition: background-color 0.2s ease;
    }
    .leaflet-bar a:hover, .leaflet-bar a:active {
      background-color: #f1f5f9 !important;
    }
    /* Locate Button */
    #locate-btn {
      position: absolute;
      bottom: 58px;
      left: 20px;
      width: 44px;
      height: 44px;
      border-radius: 22px;
      background: #ffffff;
      border: 1px solid rgba(0, 161, 156, 0.15);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
      outline: none;
      transition: transform 0.2s ease, background-color 0.2s ease;
    }
    #locate-btn:active {
      transform: scale(0.92);
      background-color: #f1f5f9;
    }
    /* User pulsing location marker */
    .user-pulse-marker {
      position: relative;
    }
    .user-pulse-marker .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #007aff;
      border: 2px solid #ffffff;
      box-shadow: 0 0 6px rgba(0, 122, 255, 0.4);
    }
    .user-pulse-marker .pulse {
      position: absolute;
      top: -5px;
      left: -5px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(0, 122, 255, 0.2);
      animation: mapPulse 2s infinite ease-out;
    }
    @keyframes mapPulse {
      0% {
        transform: scale(0.8);
        opacity: 0.8;
      }
      100% {
        transform: scale(2.5);
        opacity: 0;
      }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="center-marker">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="#00a19c"/>
      <circle cx="12" cy="9" r="3" fill="#ffffff"/>
    </svg>
  </div>
  <div id="search-container" class="__RTL_CLASS__">
    <input type="text" id="search-input" placeholder="__SEARCH_PLACEHOLDER__" onkeypress="handleSearchKeyPress(event)" />
    <button id="search-btn" onclick="searchLocation()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 21L16.65 16.65" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
  <button id="locate-btn" onclick="locateUser()">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" stroke="#00a19c" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="#00a19c"/>
      <path d="M12 2V4M12 20V22M2 12H4M20 12H22" stroke="#00a19c" stroke-width="2" stroke-linecap="round"/>
    </svg>
  </button>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([29.3759, 47.9774], 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    var currentMarker = null;
    var userLocationMarker = null;
    var showPin = false;

    function showPulsingUserLocation(lat, lng) {
      if (userLocationMarker) {
        map.removeLayer(userLocationMarker);
      }
      var pulseIcon = L.divIcon({
        html: '<div class="user-pulse-marker"><div class="dot"></div><div class="pulse"></div></div>',
        className: 'leaflet-user-pulse',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      userLocationMarker = L.marker([lat, lng], { icon: pulseIcon }).addTo(map);
    }

    function locateUser() {
      if (navigator.geolocation) {
        document.getElementById('locate-btn').style.transform = 'scale(0.92)';
        
        var getOptions = {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 10000
        };
        
        function success(pos) {
          document.getElementById('locate-btn').style.transform = 'none';
          var lat = pos.coords.latitude;
          var lng = pos.coords.longitude;
          map.setView([lat, lng], 16);
          showPulsingUserLocation(lat, lng);
        }
        
        function error(err) {
          document.getElementById('locate-btn').style.transform = 'none';
          console.warn('High accuracy geolocation failed, trying low accuracy...', err);
          navigator.geolocation.getCurrentPosition(
            success,
            function(err2) {
              console.warn('Geolocation failed completely:', err2);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'GEOLOCATION_FAILED',
                code: err2.code,
                message: err2.message
              }));
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 10000
            }
          );
        }
        
        navigator.geolocation.getCurrentPosition(success, error, getOptions);
      }
    }

    async function searchLocation() {
      var query = document.getElementById('search-input').value;
      if (!query || query.trim() === '') return;
      
      try {
        var response = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(query));
        var data = await response.json();
        if (data && data.length > 0) {
          var lat = parseFloat(data[0].lat);
          var lng = parseFloat(data[0].lon);
          map.setView([lat, lng], 16);
          if (!showPin) {
            showPulsingUserLocation(lat, lng);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    function handleSearchKeyPress(e) {
      if (e.key === 'Enter') {
        searchLocation();
      }
    }

    function handleMessage(event) {
      try {
        var data = event.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch(e) {
            return;
          }
        }
        if (!data) return;

        if (data.type === 'PAN_TO') {
          var lat = data.lat;
          var lng = data.lng;
          map.setView([lat, lng], 15);
          
          if (currentMarker) {
            map.removeLayer(currentMarker);
          }
          var customIcon = L.divIcon({
            html: '<div style="position: relative; width: 40px; height: 40px; justify-content: center; align-items: center; display: flex;"><div class="address-marker-pulse"></div><svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="z-index: 2;"><path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="#00a19c"/><circle cx="12" cy="9" r="3" fill="#ffffff"/></svg></div>',
            className: 'custom-leaflet-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -28]
          });
          currentMarker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
          if (data.label) {
            currentMarker.bindPopup('<div style="font-size: 13px; font-weight: 700; color: #ffffff;">' + data.label + '</div>', {
              closeButton: false,
              offset: [0, -5]
            }).openPopup();
          }
        } else if (data.type === 'SHOW_PIN') {
          showPin = data.show;
          document.getElementById('center-marker').style.display = showPin ? 'block' : 'none';
          if (showPin && currentMarker) {
            map.removeLayer(currentMarker);
            currentMarker = null;
          }
          if (showPin) {
            locateUser();
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage);

    map.on('movestart', function() {
      if (showPin) {
        document.getElementById('center-marker').style.transform = 'translate(-50%, -120%) scale(1.1)';
      }
    });

    map.on('moveend', function() {
      if (showPin) {
        document.getElementById('center-marker').style.transform = 'translate(-50%, -100%) scale(1.0)';
        var center = map.getCenter();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'LOCATION_SELECTED',
          lat: center.lat,
          lng: center.lng
        }));
      }
    });

    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
  </script>
</body>
</html>
`;

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
    const [addresses, setAddresses] = useState<any[]>([]);
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

    const handleAddAddressClick = async () => {
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
      setEditingId(null);
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

    const geocodeAndPan = async (addr: any) => {
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
        console.error('Error geocoding address:', error);
      }
    };

    React.useEffect(() => {
      let timer: any;
      if (addresses && addresses.length > 0) {
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
    }, [addresses]);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [addressToDelete, setAddressToDelete] = useState<any>(null);
    const [activeField, setActiveField] = useState<string | null>(null);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertButtons, setAlertButtons] = useState<any[]>([]);

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

    const handleMapMessage = async (event: any) => {
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
      flex: number = 1,
      placeholder: string = ''
    ) => {
      const isActive = activeField === fieldKey;
      const hasValue = value !== undefined && value !== null && value.toString().trim().length > 0;
      const showLabel = isActive || hasValue;

      return (
        <View
          style={{
            flex: flex,
            paddingHorizontal: 6,
            marginBottom: 14,
          }}
        >
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
                {required && <Text style={{ color: '#EF4444' }}>*</Text>}
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
          const updated = await updateAddress(token, editingId, form as any);
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

    const startEdit = (addr: any) => {
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

    const confirmDelete = (addr: any) => {
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
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {pageStatusBar}

        {/* Top Map Section (38% of screen height) */}
        <View style={{ height: '38%', width: '100%', position: 'relative' }}>
          <WebView
            ref={topMapRef}
            originWhitelist={['*']}
            source={{
              html: MAP_VIEW_HTML
                .replace('__RTL_CLASS__', isRTL ? 'rtl' : 'ltr')
                .replace('__SEARCH_PLACEHOLDER__', isRTL ? 'البحث عن موقع...' : 'Search for location...')
            }}
            style={{ flex: 1 }}
            onMessage={handleMapMessage}
            geolocationEnabled={true}
          />
          {/* Floating Back Button */}
          {onBack && (
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: insets.top + 10,
                left: isRTL ? undefined : 16,
                right: isRTL ? 16 : undefined,
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: '#FFFFFF',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 4,
                zIndex: 10,
              }}
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
        <View
          style={{
            flex: 1,
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            marginTop: -28, // Overlap the map
            paddingTop: 10,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 10,
            zIndex: 5,
          }}
        >
          {/* Drag handle / grab bar */}
          <View
            style={{
              width: 38,
              height: 5,
              borderRadius: 3,
              backgroundColor: '#E2E8F0',
              alignSelf: 'center',
              marginBottom: 12,
            }}
          />

          {showForm ? (
            // Add/Edit Address Form inside the bottom sheet
            <View style={{ flex: 1 }}>
              {/* Header section with Title and Close button */}
              <View
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: colors.primaryDark,
                  }}
                >
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
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}
              >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View style={{ flex: 1 }}>
                    <ScrollView
                      style={{ flex: 1, paddingHorizontal: 16 }}
                      contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
                      {/* Active Address Geocode Loading Notification */}
                      {mapLoadingAddress && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                          <ActivityIndicator size="small" color={colors.primary} style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }} />
                          <Text style={{ fontSize: 12, color: '#15803d', fontWeight: '600' }}>
                            {isRTL ? 'جاري تحديد تفاصيل موقع الخريطة...' : 'Resolving map address...'}
                          </Text>
                        </View>
                      )}

                      {/* Row 1: Name */}
                      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', marginHorizontal: -6 }}>
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
                      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', marginHorizontal: -6 }}>
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
                      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', marginHorizontal: -6 }}>
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
                      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', marginHorizontal: -6 }}>
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
                      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', marginHorizontal: -6 }}>
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
                          paddingHorizontal: 16,
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
            <View style={{ flex: 1 }}>
              {/* Header section with Title and Add New button */}
              <View
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  marginBottom: 14,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: colors.primaryDark,
                  }}
                >
                  {isRTL ? 'العناوين المسجلة' : 'Saved Addresses'}
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    backgroundColor: colorUtils.addOpacity(colors.primary, 0.08),
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: colorUtils.addOpacity(colors.primary, 0.15),
                  }}
                  onPress={handleAddAddressClick}
                  activeOpacity={0.8}
                >
                  <Icon name="add-outline" size={16} color={colors.primary} />
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 12,
                      fontWeight: '700',
                      marginHorizontal: 4,
                    }}
                  >
                    {isRTL ? 'إضافة جديد' : 'Add New'}
                  </Text>
                </TouchableOpacity>
              </View>

              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}
              >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    {loading ? (
                      <View
                        style={{
                          flex: 1,
                          justifyContent: 'center',
                          alignItems: 'center',
                          minHeight: 200,
                        }}
                      >
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
                                        { color: '#94A3B8', marginTop: 2 }
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
