import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  ImageBackground,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors } from '../../constants/colors';
import { getQRCodeSettings, generateQRCode, getDefaultBackgroundImage, getBackgroundImageUrl } from '../../services/qrCodeApi';
import { QRCodeResultModal } from './QRCodeResultModal';
import type { QRCodeCustomDetails, QRCodeSettings, QRCodeData } from '../../services/qrCodeApi';

interface QRFormModalProps {
  visible: boolean;
  booking: any;
  existingQRCode: any;
  onClose: () => void;
  onSuccess: () => void;
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
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState('1');
  const [showResultModal, setShowResultModal] = useState(false);
  const [generatedQRCode, setGeneratedQRCode] = useState<QRCodeData | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<QRCodeCustomDetails | null>(null);
  const [originalBackgroundId, setOriginalBackgroundId] = useState<string | null>(null);

  const [formData, setFormData] = useState<QRCodeCustomDetails>({
    name1: '',
    name2: '',
    eventDate: new Date().toISOString().split('T')[0],
    eventTime: '12:00',
    location: '',
    contact: '',
  });

  useEffect(() => {
    if (visible) {
      loadSettings();
      setIsUpdated(false); // Reset updated flag when modal opens
      
      if (existingQRCode?.customDetails) {
        // If editing existing QR code
        setFormData(existingQRCode.customDetails);
        setSelectedBackgroundId(existingQRCode.selectedBackgroundImage);
        // Store original data for change detection
        setOriginalFormData(existingQRCode.customDetails);
        setOriginalBackgroundId(existingQRCode.selectedBackgroundImage);
        setHasChanges(false);
      } else if (booking) {
        // Load booking data
        // Use eventTime.start for date to avoid timezone issues
        let eventDate = new Date().toISOString().split('T')[0];
        if (booking.eventTime?.start) {
          // Extract date from eventTime.start (which is a Date object)
          const startDate = new Date(booking.eventTime.start);
          // Format as YYYY-MM-DD
          const year = startDate.getFullYear();
          const month = String(startDate.getMonth() + 1).padStart(2, '0');
          const day = String(startDate.getDate()).padStart(2, '0');
          eventDate = `${year}-${month}-${day}`;
        }
        
        let eventTime = '12:00';
        if (booking.eventTime?.start) {
          const start = new Date(booking.eventTime.start);
          const hours = start.getHours();
          const minutes = start.getMinutes();
          eventTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }

        const locationText = booking.location || '';
        const services = booking.services || [];
        const serviceName = services.length > 0 ? services[0].name : '';

        setFormData({
          name1: serviceName,
          name2: '',
          eventDate,
          eventTime,
          location: locationText,
          contact: '',
        });
        setSelectedBackgroundId(null);
        setGuestCount(booking.guestLimit?.toString() || '1');
      } else {
        // Default empty state
        setFormData({
          name1: '',
          name2: '',
          eventDate: new Date().toISOString().split('T')[0],
          eventTime: '12:00',
          location: '',
          contact: '',
        });
        setSelectedBackgroundId(null);
        setGuestCount('1');
      }
    }
  }, [visible, existingQRCode, booking]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const fetchedSettings = await getQRCodeSettings(token);
      if (fetchedSettings) {
        setSettings(fetchedSettings);
        // Set default background if available
        if (!selectedBackgroundId && fetchedSettings.backgroundImages?.length > 0) {
          const defaultBg = fetchedSettings.backgroundImages.find(img => img.isDefault && img.isActive) 
            || fetchedSettings.backgroundImages[0];
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
      const formDataChanged = JSON.stringify(formData) !== JSON.stringify(originalFormData);
      const backgroundChanged = selectedBackgroundId !== originalBackgroundId;
      setHasChanges(formDataChanged || backgroundChanged);
    }
  }, [formData, selectedBackgroundId, existingQRCode, originalFormData, originalBackgroundId]);

  const handleSubmit = async () => {
    if (!settings) return;

    const display = settings.displaySettings;
    
    // Validate required fields based on display settings
    if (display.showEventDate && !formData.eventDate) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'الرجاء اختيار التاريخ' : 'Please select event date');
      return;
    }
    if (display.showEventTime && !formData.eventTime) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'الرجاء اختيار الوقت' : 'Please select event time');
      return;
    }
    if (display.showLocation && !formData.location?.trim()) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'الرجاء إدخال الموقع' : 'Please enter location');
      return;
    }
    if (display.showContactInfo && !formData.contact?.trim()) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'الرجاء إدخال رقم الاتصال' : 'Please enter contact');
      return;
    }
    if (!selectedBackgroundId) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'الرجاء اختيار تصميم البطاقة' : 'Please select a card design');
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      // Get first service ID if available
      const serviceId = booking?.services?.[0]?.service?._id || booking?.services?.[0]?.service;

      const result = await generateQRCode(token, booking._id, formData, selectedBackgroundId, serviceId);
      
      // Store the generated QR code data
      setGeneratedQRCode(result);
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
      Alert.alert(
        isRTL ? 'خطأ' : 'Error', 
        error.message || (isRTL ? 'فشل إنشاء QR Code' : 'Failed to generate QR code')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = () => {
    if (!selectedBackgroundId) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'الرجاء اختيار تصميم البطاقة' : 'Please select a card design');
      return;
    }
    
    // Create a preview QR code object
    const previewQR: QRCodeData = {
      _id: 'preview',
      booking: booking._id,
      qrToken: 'preview-token',
      status: 'active',
      expiresAt: null,
      scanCount: 0,
      isApproved: false,
      customDetails: formData,
      selectedBackgroundImage: selectedBackgroundId,
      generatedAt: new Date().toISOString(),
      qrCodeImage: undefined, // Will show placeholder in preview
      qrUrl: undefined,
    };
    
    setGeneratedQRCode(previewQR);
    setShowResultModal(true);
    setIsPreviewMode(true);
  };

  if (!visible) return null;

  const selectedImage = settings?.backgroundImages?.find(img => img._id === selectedBackgroundId);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Select Card Design Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{isRTL ? 'اختر تصميم البطاقة' : 'Select Card Design'}</Text>
                
                {/* Main Card Preview */}
                <View style={styles.cardPreviewContainer}>
                  {selectedImage ? (
                    <ImageBackground
                      source={{ uri: getBackgroundImageUrl(selectedImage.path) }}
                      style={styles.cardPreview}
                      resizeMode="cover"
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
                {settings?.backgroundImages && settings.backgroundImages.length > 0 && (
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
                            selectedBackgroundId === item._id && styles.imageThumbnailActive
                          ]}
                          onPress={() => setSelectedBackgroundId(item._id)}
                        >
                          <Image
                            source={{ uri: getBackgroundImageUrl(item.path) }}
                            style={styles.imageThumbnailImage}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                )}
              </View>

              {/* Enter Name Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{isRTL ? 'اسم المنظمين' : 'Enter Name'}</Text>
                <Text style={styles.sectionSubtitle}>{isRTL ? 'أدخل اسم العريس' : 'Enter Grooms Name'}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={isRTL ? 'اسم العريس' : 'Groom Name'}
                  value={formData.name1}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name1: text }))}
                  placeholderTextColor="#999"
                />
                
                <Text style={styles.sectionSubtitle}>{isRTL ? 'أدخل اسم العروس' : 'Enter Brides Name'}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={isRTL ? 'اسم العروس' : 'Bride Name'}
                  value={formData.name2}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name2: text }))}
                  placeholderTextColor="#999"
                />
              </View>

              {/* Enter Event Info Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{isRTL ? 'بيانات الحدث' : 'Enter Event Info'}</Text>
                
                <Text style={styles.label}>{isRTL ? 'تاريخ الحدث' : 'Event Date'} *</Text>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateInputText}>{formData.eventDate}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={new Date(formData.eventDate)}
                    mode="date"
                    display="default"
                    onChange={(e, date) => {
                      setShowDatePicker(false);
                      if (date) setFormData(prev => ({ ...prev, eventDate: date.toISOString().split('T')[0] }));
                    }}
                  />
                )}

                <Text style={styles.label}>{isRTL ? 'وقت الحدث' : 'Event Time'} *</Text>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowTimePicker(true)}>
                  <Text style={styles.dateInputText}>{formData.eventTime}</Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={new Date(`2024-01-01T${formData.eventTime}`)}
                    mode="time"
                    display="default"
                    onChange={(e, time) => {
                      setShowTimePicker(false);
                      if (time) setFormData(prev => ({ ...prev, eventTime: time.toTimeString().slice(0, 5) }));
                    }}
                  />
                )}

                <Text style={styles.label}>{isRTL ? 'الموقع' : 'Location'} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={isRTL ? 'أدخل الموقع' : 'Enter location'}
                  value={formData.location}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                  placeholderTextColor="#999"
                />

                <Text style={styles.label}>{isRTL ? 'رقم الاتصال' : 'Contact'}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={isRTL ? 'أدخل رقم الاتصال أو البريد' : 'Phone or email'}
                  value={formData.contact}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, contact: text }))}
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Guest List Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{isRTL ? 'قائمة الضيوف' : 'Guest List'}</Text>
                <Text style={styles.label}>{isRTL ? 'عدد الضيوف' : 'Enter Number of guests'}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="100"
                  value={guestCount}
                  onChangeText={setGuestCount}
                  keyboardType="number-pad"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Action Button - Update and Review */}
              <TouchableOpacity
                style={[
                  styles.button, 
                  styles.generateButton, 
                  (submitting || (existingQRCode && (!hasChanges || isUpdated))) && styles.disabledButton
                ]}
                onPress={() => {
                  handleSubmit().then(() => {
                    setTimeout(() => {
                      handlePreview();
                    }, 500);
                  });
                }}
                disabled={submitting || (existingQRCode && (!hasChanges || isUpdated))}
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
                ) : (
                  <Text style={styles.generateButtonText}>
                    {isRTL ? 'تحديث والمراجعة' : 'Update & Review'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButtonBottom} 
                onPress={onClose}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonBottomText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
              </TouchableOpacity>

              <Text style={styles.footnote}>
                {isRTL ? '*المعلومات المطلوبة' : '*Required fields'}
              </Text>
            </ScrollView>
          )}
        </View>
      </View>

      {/* QR Code Result Modal */}
      <QRCodeResultModal
        visible={showResultModal}
        qrCode={generatedQRCode}
        backgroundImage={settings?.backgroundImages?.find(img => img._id === selectedBackgroundId)}
        onClose={() => {
          setShowResultModal(false);
          if (!isPreviewMode) {
            onSuccess();
            onClose();
          }
        }}
        onEdit={() => {
          setShowResultModal(false);
          setIsPreviewMode(false);
        }}
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
