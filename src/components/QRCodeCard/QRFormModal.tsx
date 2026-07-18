import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  ImageBackground,
  ActivityIndicator,
  TextInput,
  Modal,
  Image,
  FlatList,
  Animated,
  Easing,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLanguage } from '../../contexts/LanguageContext';
import { getSecureToken } from '../../utils/secureStorage';
import { colors } from '../../constants/colors';
import { getQRCodeSettings, generateQRCode } from '../../services/qrCodeApi';
import { QRCodeResultModal } from './QRCodeResultModal';
import { CustomAlert } from '../CustomAlert/CustomAlert';
import type {
  QRCodeCustomDetails,
  QRCodeSettings,
  QRCodeData,
} from '../../services/qrCodeApi';

/** Convert a Date to a local YYYY-MM-DD string (avoids UTC timezone shift) */
const getLocalDateString = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const QRLoader: React.FC<{ isRTL: boolean }> = ({ isRTL }) => {
  const [scanAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [scanAnim]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  return (
    <View style={qrLoaderStyles.container}>
      <View style={qrLoaderStyles.qrBox}>
        {/* Corner squares to simulate QR code outline */}
        <View style={[qrLoaderStyles.corner, qrLoaderStyles.topLeft]} />
        <View style={[qrLoaderStyles.corner, qrLoaderStyles.topRight]} />
        <View style={[qrLoaderStyles.corner, qrLoaderStyles.bottomLeft]} />
        {/* Center dot pattern simulated */}
        <View style={qrLoaderStyles.innerSquare} />
        {/* Scanning laser line */}
        <Animated.View
          style={[qrLoaderStyles.scanLine, { transform: [{ translateY }] }]}
        />
      </View>
      <Text style={qrLoaderStyles.text}>
        {isRTL ? 'جاري تحميل الرمز...' : 'Loading QR Code...'}
      </Text>
    </View>
  );
};

const qrLoaderStyles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    width: '100%',
  },
  qrBox: {
    width: 140,
    height: 140,
    borderWidth: 2,
    borderColor: 'rgba(0, 161, 156, 0.4)',
    borderRadius: 16,
    padding: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderWidth: 4,
    borderColor: '#00a19c',
    backgroundColor: 'transparent',
    borderRadius: 6,
  },
  topLeft: {
    top: 12,
    left: 12,
  },
  topRight: {
    top: 12,
    right: 12,
  },
  bottomLeft: {
    bottom: 12,
    left: 12,
  },
  innerSquare: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(0, 161, 156, 0.3)',
    borderRadius: 4,
  },
  scanLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 10,
    height: 3,
    backgroundColor: '#00a19c',
    borderRadius: 2,
    shadowColor: '#00a19c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    marginTop: 24,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});

interface QRFormModalProps {
  visible: boolean;
  booking: any;
  existingQRCode: any;
  onClose: () => void;
  onSuccess: (updatedQR: any, updatedGuestCount: number) => void;
}

export const QRFormModal: React.FC<QRFormModalProps> = ({
  visible,
  booking,
  existingQRCode,
  onClose,
  onSuccess,
}) => {
  const { isRTL } = useLanguage();
  const [settings, setSettings] = useState<QRCodeSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<
    string | null
  >(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [generatedQRCode, setGeneratedQRCode] = useState<QRCodeData | null>(
    null,
  );
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [originalFormData, setOriginalFormData] =
    useState<QRCodeCustomDetails | null>(null);
  const [originalBackgroundId, setOriginalBackgroundId] = useState<
    string | null
  >(null);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }>;
  }>({ visible: false, title: '', message: '', buttons: [] });

  const [formData, setFormData] = useState<QRCodeCustomDetails>({
    name1: '',
    name2: '',
    eventDate: getLocalDateString(new Date()),
    eventTime: '12:00',
    location: '',
    contact: '',
    guestCount: '',
  });

  useEffect(() => {
    if (visible) {
      loadSettings();
      setIsUpdated(false); // Reset updated flag when modal opens

      if (existingQRCode?.customDetails) {
        // If QR code already exists, show it directly instead of edit form
        setGeneratedQRCode(existingQRCode);

        // Handle selectedBackgroundImage - could be object or string ID
        let backgroundId = null;
        if (existingQRCode.selectedBackgroundImage) {
          if (typeof existingQRCode.selectedBackgroundImage === 'object') {
            backgroundId =
              existingQRCode.selectedBackgroundImage.id ||
              existingQRCode.selectedBackgroundImage._id;
          } else {
            backgroundId = existingQRCode.selectedBackgroundImage;
          }
        }
        setSelectedBackgroundId(backgroundId);

        // Get base fields for merging if any are null/missing in existing QR customDetails
        let baseEventDate = '';
        if (booking?.eventDate) {
          try {
            baseEventDate = getLocalDateString(new Date(booking.eventDate));
          } catch (e) {}
        }
        if (!baseEventDate && booking?.eventTime?.start) {
          try {
            const startDate = new Date(booking.eventTime.start);
            const year = startDate.getFullYear();
            const month = String(startDate.getMonth() + 1).padStart(2, '0');
            const day = String(startDate.getDate()).padStart(2, '0');
            baseEventDate = `${year}-${month}-${day}`;
          } catch (e) {}
        }
        if (!baseEventDate) {
          baseEventDate = getLocalDateString(new Date());
        }

        let baseEventTime = '12:00';
        if (booking?.eventTime?.start) {
          try {
            const start = new Date(booking.eventTime.start);
            const hours = start.getHours();
            const minutes = start.getMinutes();
            baseEventTime = `${String(hours).padStart(2, '0')}:${String(
              minutes,
            ).padStart(2, '0')}`;
          } catch (e) {}
        }

        const baseDetails: QRCodeCustomDetails = {
          name1:
            existingQRCode.customDetails.name1 ??
            booking?.customer?.name ??
            booking?.customerName ??
            '',
          name2: existingQRCode.customDetails.name2 ?? '',
          eventDate: existingQRCode.customDetails.eventDate ?? baseEventDate,
          eventTime: existingQRCode.customDetails.eventTime ?? baseEventTime,
          location:
            existingQRCode.customDetails.location ??
            booking?.location ??
            booking?.venue ??
            '',
          contact:
            existingQRCode.customDetails.contact ??
            booking?.customer?.phone ??
            booking?.customer?.email ??
            booking?.customerPhone ??
            booking?.customerEmail ??
            '',
          guestCount:
            existingQRCode.customDetails.guestCount ??
            booking?.guestLimit?.toString() ??
            '',
        };

        setFormData(baseDetails);
        setOriginalFormData(baseDetails);
        setOriginalBackgroundId(backgroundId);
        setHasChanges(false);

        // Show result modal directly
        setShowResultModal(true);
        setIsPreviewMode(false);
      } else if (booking) {
        // Load booking data
        let eventDate = '';
        if (booking.eventDate) {
          try {
            eventDate = getLocalDateString(new Date(booking.eventDate));
          } catch (e) {}
        }
        if (!eventDate && booking.eventTime?.start) {
          try {
            const startDate = new Date(booking.eventTime.start);
            const year = startDate.getFullYear();
            const month = String(startDate.getMonth() + 1).padStart(2, '0');
            const day = String(startDate.getDate()).padStart(2, '0');
            eventDate = `${year}-${month}-${day}`;
          } catch (e) {}
        }
        if (!eventDate) {
          eventDate = getLocalDateString(new Date());
        }

        let eventTime = '12:00';
        if (booking.eventTime?.start) {
          try {
            const start = new Date(booking.eventTime.start);
            const hours = start.getHours();
            const minutes = start.getMinutes();
            eventTime = `${String(hours).padStart(2, '0')}:${String(
              minutes,
            ).padStart(2, '0')}`;
          } catch (e) {}
        }

        const customerName =
          booking.customer?.name || booking.customerName || '';
        const contactDetails =
          booking.customer?.phone ||
          booking.customer?.email ||
          booking.customerPhone ||
          booking.customerEmail ||
          '';
        const locationText = booking.location || booking.venue || '';
        const defaultGuestLimit = booking.guestLimit?.toString() || '';

        const initialDetails: QRCodeCustomDetails = {
          name1: customerName,
          name2: '',
          eventDate,
          eventTime,
          location: locationText,
          contact: contactDetails,
          guestCount: defaultGuestLimit,
        };

        setFormData(initialDetails);
        setSelectedBackgroundId(null);
      } else {
        // Default empty state
        setFormData({
          name1: '',
          name2: '',
          eventDate: getLocalDateString(new Date()),
          eventTime: '12:00',
          location: '',
          contact: '',
          guestCount: '',
        });
        setSelectedBackgroundId(null);
      }
    }
  }, [visible, existingQRCode, booking]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const token = await getSecureToken();
      if (!token) {
        setLoading(false);
        setAlertConfig({
          visible: true,
          title: isRTL ? 'خطأ في المصادقة' : 'Authentication Error',
          message: isRTL
            ? 'لم يتم العثور على رمز تسجيل الدخول. يرجى تسجيل الدخول مجدداً.'
            : 'Login session not found. Please log in again.',
          buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
        });
        return;
      }

      const fetchedSettings = await getQRCodeSettings(token);

      if (fetchedSettings) {
        setSettings(fetchedSettings);
        // Set default background if available
        if (
          !selectedBackgroundId &&
          fetchedSettings.backgroundImages?.length > 0
        ) {
          const defaultBg =
            fetchedSettings.backgroundImages.find(
              img => img.isDefault && img.isActive,
            ) || fetchedSettings.backgroundImages[0];
          setSelectedBackgroundId(defaultBg._id);
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Track changes in form data
  useEffect(() => {
    if (existingQRCode && originalFormData && originalBackgroundId) {
      const formDataChanged =
        JSON.stringify(formData) !== JSON.stringify(originalFormData);
      const backgroundChanged = selectedBackgroundId !== originalBackgroundId;
      setHasChanges(formDataChanged || backgroundChanged);
    }
  }, [
    formData,
    selectedBackgroundId,
    existingQRCode,
    originalFormData,
    originalBackgroundId,
  ]);

  const handleSubmit = async () => {
    if (!settings) return;

    const display = settings.displaySettings;

    // Validate required fields based on display settings
    if (display.showEventDate && !formData.eventDate) {
      setAlertConfig({
        visible: true,
        title: isRTL ? 'خطأ' : 'Error',
        message: isRTL ? 'الرجاء اختيار التاريخ' : 'Please select event date',
        buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
      });
      return;
    }
    if (display.showEventTime && !formData.eventTime) {
      setAlertConfig({
        visible: true,
        title: isRTL ? 'خطأ' : 'Error',
        message: isRTL ? 'الرجاء اختيار الوقت' : 'Please select event time',
        buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
      });
      return;
    }
    if (display.showLocation && !formData.location?.trim()) {
      setAlertConfig({
        visible: true,
        title: isRTL ? 'خطأ' : 'Error',
        message: isRTL ? 'الرجاء إدخال الموقع' : 'Please enter location',
        buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
      });
      return;
    }
    if (display.showContactInfo && !formData.contact?.trim()) {
      setAlertConfig({
        visible: true,
        title: isRTL ? 'خطأ' : 'Error',
        message: isRTL ? 'الرجاء إدخال رقم الاتصال' : 'Please enter contact',
        buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
      });
      return;
    }
    if (!selectedBackgroundId) {
      setAlertConfig({
        visible: true,
        title: isRTL ? 'خطأ' : 'Error',
        message: isRTL
          ? 'الرجاء اختيار تصميم البطاقة'
          : 'Please select a card design',
        buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
      });
      return;
    }

    setSubmitting(true);
    try {
      const token = await getSecureToken();
      if (!token) {
        setAlertConfig({
          visible: true,
          title: isRTL ? 'انتهت الجلسة' : 'Session Expired',
          message: isRTL
            ? 'انتهت صلاحية جلسة تسجيل الدخول. يرجى تسجيل الدخول مجدداً.'
            : 'Your login session has expired. Please log in again.',
          buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
        });
        return;
      }

      // Get first service ID if available
      const serviceId =
        booking?.services?.[0]?.service?._id || booking?.services?.[0]?.service;

      const result = await generateQRCode(
        token,
        booking._id,
        formData,
        selectedBackgroundId,
        serviceId,
        parseInt(formData.guestCount || '0', 10) || undefined,
      );

      // Store the generated QR code data
      // If updating and API doesn't return qrCodeImage, preserve it from generatedQRCode (set at initial load)
      const previousQRImage =
        generatedQRCode?.qrCode ||
        generatedQRCode?.qrCodeImage ||
        existingQRCode?.qrCode ||
        existingQRCode?.qrCodeImage;
      const qrCodeData = {
        ...result,
        customDetails: formData,
        updateTimestamp: Date.now(),
        qrCode: result.qrCode || result.qrCodeImage || previousQRImage,
        qrCodeImage: result.qrCodeImage || result.qrCode || previousQRImage,
      };
      setGeneratedQRCode(qrCodeData);
      setShowResultModal(true);
      setIsPreviewMode(false);

      // If this is an update, mark as updated and reset changes
      if (existingQRCode) {
        setIsUpdated(true);
        setHasChanges(false);
        setOriginalFormData(formData);
        setOriginalBackgroundId(selectedBackgroundId);
      }
    } catch (error: any) {
      setAlertConfig({
        visible: true,
        title: isRTL ? 'خطأ' : 'Error',
        message:
          error.message ||
          (isRTL ? 'فشل إنشاء QR Code' : 'Failed to generate QR code'),
        buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  const selectedImage = settings?.backgroundImages?.find(
    img => img._id === selectedBackgroundId,
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {loading ? (
          <QRLoader isRTL={isRTL} />
        ) : (
          <View style={styles.modal}>
            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Select Card Design Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {isRTL ? 'اختر تصميم البطاقة' : 'Select Card Design'}
                </Text>

                {/* Main Card Preview */}
                <View style={styles.cardPreviewContainer}>
                  {selectedImage ? (
                    <ImageBackground
                      source={{ uri: selectedImage.url || selectedImage.path }}
                      style={styles.cardPreview}
                      resizeMode="cover"
                      onError={_error => {}}
                      onLoad={() => {}}
                    >
                      <View style={styles.qrPlaceholder}>
                        <Text style={styles.qrPlaceholderText}>QR</Text>
                      </View>
                    </ImageBackground>
                  ) : (
                    <View style={[styles.cardPreview, styles.emptyCard]}>
                      <View style={styles.qrPlaceholder}>
                        <Text style={styles.qrPlaceholderText}>QR</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Background Images Selector */}
                {settings?.backgroundImages &&
                  settings.backgroundImages.length > 0 && (
                    <View style={styles.imagesSelector}>
                      <FlatList
                        data={settings.backgroundImages}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={item => item._id}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={[
                              styles.imageThumbnail,
                              selectedBackgroundId === item._id &&
                                styles.imageThumbnailActive,
                            ]}
                            onPress={() => {
                              setSelectedBackgroundId(item._id);
                            }}
                          >
                            <Image
                              source={{ uri: item.url || item.path }}
                              style={styles.imageThumbnailImage}
                              resizeMode="cover"
                              onError={_error => {}}
                            />
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  )}
              </View>

              {/* Enter Name Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {isRTL ? 'اسم المنظمين' : 'Enter Name'}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {isRTL ? 'أدخل اسم العريس' : 'Enter Grooms Name'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={isRTL ? 'اسم العريس' : 'Groom Name'}
                  value={formData.name1}
                  onChangeText={text =>
                    setFormData(prev => ({ ...prev, name1: text }))
                  }
                  placeholderTextColor="#999"
                />

                <Text style={styles.sectionSubtitle}>
                  {isRTL ? 'أدخل اسم العروس' : 'Enter Brides Name'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={isRTL ? 'اسم العروس' : 'Bride Name'}
                  value={formData.name2}
                  onChangeText={text =>
                    setFormData(prev => ({ ...prev, name2: text }))
                  }
                  placeholderTextColor="#999"
                />
              </View>

              {/* Enter Event Info Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {isRTL ? 'بيانات الحدث' : 'Enter Event Info'}
                </Text>

                <Text style={styles.label}>
                  {isRTL ? 'تاريخ الحدث' : 'Event Date'} *
                </Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateInputText}>{formData.eventDate}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={(() => {
                      const [y, m, d] = formData.eventDate
                        .split('-')
                        .map(Number);
                      return new Date(y, m - 1, d);
                    })()}
                    mode="date"
                    display="default"
                    onChange={(_e, date) => {
                      setShowDatePicker(false);
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(
                          2,
                          '0',
                        );
                        const day = String(date.getDate()).padStart(2, '0');
                        setFormData(prev => ({
                          ...prev,
                          eventDate: `${year}-${month}-${day}`,
                        }));
                      }
                    }}
                  />
                )}

                <Text style={styles.label}>
                  {isRTL ? 'وقت الحدث' : 'Event Time'} *
                </Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.dateInputText}>{formData.eventTime}</Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={(() => {
                      const [hours, minutes] = formData.eventTime
                        .split(':')
                        .map(Number);
                      const d = new Date();
                      d.setHours(hours, minutes, 0, 0);
                      return d;
                    })()}
                    mode="time"
                    display="default"
                    onChange={(_e, time) => {
                      setShowTimePicker(false);
                      if (time) {
                        const hours = String(time.getHours()).padStart(2, '0');
                        const minutes = String(time.getMinutes()).padStart(
                          2,
                          '0',
                        );
                        setFormData(prev => ({
                          ...prev,
                          eventTime: `${hours}:${minutes}`,
                        }));
                      }
                    }}
                  />
                )}

                <Text style={styles.label}>
                  {isRTL ? 'الموقع' : 'Location'} *
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={isRTL ? 'أدخل الموقع' : 'Enter location'}
                  value={formData.location}
                  onChangeText={text =>
                    setFormData(prev => ({ ...prev, location: text }))
                  }
                  placeholderTextColor="#999"
                />

                <Text style={styles.label}>
                  {isRTL ? 'رقم الاتصال' : 'Contact'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={
                    isRTL ? 'أدخل رقم الاتصال أو البريد' : 'Phone or email'
                  }
                  value={formData.contact}
                  onChangeText={text =>
                    setFormData(prev => ({ ...prev, contact: text }))
                  }
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Guest List Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {isRTL ? 'قائمة الضيوف' : 'Guest List'}
                </Text>
                <Text style={styles.label}>
                  {isRTL ? 'عدد الضيوف' : 'Enter Number of guests'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="100"
                  value={formData.guestCount || ''}
                  onChangeText={text =>
                    setFormData(prev => ({ ...prev, guestCount: text }))
                  }
                  keyboardType="number-pad"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Action Button - Update and Review */}
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.generateButton,
                  (submitting ||
                    (existingQRCode && (!hasChanges || isUpdated))) &&
                    styles.disabledButton,
                ]}
                onPress={() => {
                  handleSubmit();
                }}
                disabled={
                  submitting || (existingQRCode && (!hasChanges || isUpdated))
                }
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : isUpdated && existingQRCode ? (
                  <Text style={styles.generateButtonText}>
                    {isRTL ? '✓ تم التحديث' : '✓ Updated'}
                  </Text>
                ) : existingQRCode && !hasChanges ? (
                  <Text style={styles.generateButtonText}>
                    {isRTL ? 'لا توجد تغييرات' : 'No Changes'}
                  </Text>
                ) : existingQRCode ? (
                  <Text style={styles.generateButtonText}>
                    {isRTL ? 'تحديث والمراجعة' : 'Update & Review'}
                  </Text>
                ) : (
                  <Text style={styles.generateButtonText}>
                    {isRTL ? 'إنشاء والمراجعة' : 'Create & Review'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButtonBottom}
                onPress={onClose}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonBottomText}>
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.footnote}>
                {isRTL ? '*المعلومات المطلوبة' : '*Required fields'}
              </Text>
            </ScrollView>
          </View>
        )}
      </View>

      {/* QR Code Result Modal */}
      <QRCodeResultModal
        visible={showResultModal}
        qrCode={generatedQRCode}
        backgroundImage={settings?.backgroundImages?.find(
          img => img._id === selectedBackgroundId,
        )}
        onClose={() => {
          setShowResultModal(false);
          if (!isPreviewMode) {
            onSuccess(
              generatedQRCode,
              parseInt(formData.guestCount || '0', 10) || 1,
            );
            onClose();
          }
        }}
        onEdit={() => {
          setShowResultModal(false);
          setIsPreviewMode(false);
        }}
      />

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '95%',
    maxHeight: '95%',
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 0,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  // Sections
  section: {
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },

  // Card Design Section
  cardPreviewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cardPreview: {
    width: 120,
    height: 160,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  emptyCard: {
    backgroundColor: '#e8f5f8',
    borderStyle: 'dashed',
  },
  qrPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Images Selector
  imagesSelector: {
    marginTop: 12,
  },
  imageThumbnail: {
    width: 80,
    height: 100,
    marginRight: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ddd',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  imageThumbnailActive: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  imageThumbnailImage: {
    width: '100%',
    height: '100%',
  },

  // Input Fields
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  dateInputText: {
    fontSize: 14,
    color: '#333',
  },

  // Buttons
  button: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  generateButton: {
    backgroundColor: colors.primary,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButtonBottom: {
    paddingVertical: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  cancelButtonBottomText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#999',
  },

  // Footnote
  footnote: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});
