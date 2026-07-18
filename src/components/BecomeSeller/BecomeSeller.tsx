import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Linking,
  StatusBar,
  Image,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { submitVendorApplication } from '../../services/api';
import { colors } from '../../constants/colors';
import { styles } from './styles';
import { CustomAlert } from '../CustomAlert';
import Terms from '../Terms';

interface BecomeSellerProps {
  onBack?: () => void;
}

const BecomeSeller: React.FC<BecomeSellerProps> = ({ onBack }) => {
  const { isRTL, t } = useLanguage();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [licenseImageUri, setLicenseImageUri] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameActive, setNameActive] = useState(false);
  const [emailActive, setEmailActive] = useState(false);
  const [phoneActive, setPhoneActive] = useState(false);

  // Terms agreement state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // CustomAlert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<
    Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>
  >([]);

  const showAlert = (
    title: string,
    message: string,
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>,
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertButtons(
      buttons || [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
    );
    setAlertVisible(true);
  };

  const handleChoosePhoto = async () => {
    try {
      if (Platform.OS === 'android') {
        const sdk =
          typeof Platform.Version === 'string'
            ? parseInt(Platform.Version, 10)
            : (Platform.Version as number);
        const permission =
          sdk >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const already = await PermissionsAndroid.check(permission);
        if (!already) {
          const granted = await PermissionsAndroid.request(permission, {
            title: isRTL ? 'إذن الوصول للصور' : 'Photo Library Permission',
            message: isRTL
              ? 'يحتاج التطبيق للوصول إلى معرض الصور لاختيار رخصة العمل'
              : 'App needs access to your photo library to pick your business license.',
            buttonNeutral: isRTL ? 'اسألني لاحقاً' : 'Ask Me Later',
            buttonNegative: isRTL ? 'إلغاء' : 'Cancel',
            buttonPositive: isRTL ? 'موافق' : 'OK',
          });

          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
              showAlert(
                isRTL ? 'إذن مطلوب' : 'Permission Required',
                isRTL
                  ? 'يرجى السماح بالوصول إلى المعرض من إعدادات التطبيق.'
                  : 'Please allow access to photo library from app settings.',
                [
                  { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
                  {
                    text: isRTL ? 'الإعدادات' : 'Settings',
                    onPress: () => Linking.openSettings(),
                  },
                ],
              );
            } else {
              showAlert(
                isRTL ? 'إذن مطلوب' : 'Permission Required',
                isRTL
                  ? 'يرجى السماح بالوصول إلى المعرض لاختيار الصورة.'
                  : 'Please allow access to photo library to select the image.',
              );
            }
            return;
          }
        }
      }

      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1600,
        maxHeight: 1600,
        selectionLimit: 1,
        includeBase64: false,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        showAlert(
          isRTL ? 'خطأ' : 'Error',
          result.errorMessage ||
            (isRTL ? 'فشل اختيار الصورة' : 'Failed to pick image'),
        );
        return;
      }

      if (result.assets && result.assets[0] && result.assets[0].uri) {
        setLicenseImageUri(result.assets[0].uri);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        errorMsg || (isRTL ? 'فشل اختيار الصورة' : 'Failed to pick image'),
      );
    }
  };

  const handleRemovePhoto = () => {
    setLicenseImageUri(null);
  };

  const handleSubmit = async () => {
    // Validation
    if (!businessName.trim()) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'الرجاء إدخال اسم المتجر' : 'Please enter business name',
      );
      return;
    }

    if (!email.trim()) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'الرجاء إدخال البريد الإلكتروني' : 'Please enter email address',
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address',
      );
      return;
    }

    if (!phone.trim()) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'الرجاء إدخال رقم الهاتف' : 'Please enter phone number',
      );
      return;
    }

    if (!licenseImageUri) {
      showAlert(isRTL ? 'خطأ' : 'Error', t('businessLicenseImageRequired'));
      return;
    }

    if (!termsAccepted) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL
          ? 'يجب الموافقة على الشروط والأحكام للمتابعة'
          : 'You must agree to the Terms & Conditions to proceed',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await submitVendorApplication(
        businessName.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        licenseImageUri,
      );

      showAlert(t('applySuccessTitle'), t('applySuccessMessage'), [
        {
          text: isRTL ? 'موافق' : 'OK',
          onPress: () => {
            setAlertVisible(false);
            if (onBack) {
              onBack();
            }
          },
        },
      ]);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        errorMsg ||
          (isRTL ? 'فشل إرسال طلب الانضمام' : 'Failed to submit application'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <StatusBar
        backgroundColor="#00a19c"
        barStyle="light-content"
        translucent={false}
      />
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onClose={() => setAlertVisible(false)}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header Bar */}
        <View
          style={[
            styles.headerBar,
            { height: insets.top + 56, paddingTop: insets.top },
          ]}
        >
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backButton,
              isRTL ? styles.backButtonRTL : styles.backButtonLTR,
              {
                top: insets.top + 9,
              },
            ]}
            activeOpacity={0.8}
          >
            <Icon
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={24}
              color={colors.textWhite}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('becomeSeller')}</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.descriptionText, isRTL && styles.textRTL]}>
            {isRTL
              ? 'سجل متجرك معنا الآن وابدأ في بيع خدماتك وباقاتك للعملاء بسهولة.'
              : 'Register your shop with us now and start selling your services and packages to clients easily.'}
          </Text>

          <View style={styles.formCard}>
            {/* Business / Shop Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>
                {t('businessName')}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  isRTL && styles.flexRowRTL,
                  nameActive && styles.inputWrapperActive,
                ]}
              >
                <Icon
                  name="business-outline"
                  size={20}
                  color={nameActive ? colors.primary : '#9CA3AF'}
                  style={[styles.inputIcon, isRTL && styles.inputIconRTL]}
                />
                <View
                  style={[styles.inputDivider, isRTL && styles.inputDividerRTL]}
                />
                <TextInput
                  style={[styles.input, isRTL && styles.inputRTL]}
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder={isRTL ? 'اسم متجرك' : 'Enter your shop name'}
                  placeholderTextColor="#9CA3AF"
                  onFocus={() => setNameActive(true)}
                  onBlur={() => setNameActive(false)}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>
                {t('email')}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  isRTL && styles.flexRowRTL,
                  emailActive && styles.inputWrapperActive,
                ]}
              >
                <Icon
                  name="mail-outline"
                  size={20}
                  color={emailActive ? colors.primary : '#9CA3AF'}
                  style={[styles.inputIcon, isRTL && styles.inputIconRTL]}
                />
                <View
                  style={[styles.inputDivider, isRTL && styles.inputDividerRTL]}
                />
                <TextInput
                  style={[
                    styles.input,
                    isRTL && styles.inputRTL,
                    user?.email && { color: '#9CA3AF' },
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={
                    isRTL ? 'البريد الإلكتروني' : 'Enter email address'
                  }
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setEmailActive(true)}
                  onBlur={() => setEmailActive(false)}
                  editable={!isSubmitting && !user?.email}
                />
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>
                {t('phone')}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  isRTL && styles.flexRowRTL,
                  phoneActive && styles.inputWrapperActive,
                ]}
              >
                <Icon
                  name="call-outline"
                  size={20}
                  color={phoneActive ? colors.primary : '#9CA3AF'}
                  style={[styles.inputIcon, isRTL && styles.inputIconRTL]}
                />
                <View
                  style={[styles.inputDivider, isRTL && styles.inputDividerRTL]}
                />
                <TextInput
                  style={[styles.input, isRTL && styles.inputRTL]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={isRTL ? 'رقم الهاتف' : 'Enter phone number'}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  onFocus={() => setPhoneActive(true)}
                  onBlur={() => setPhoneActive(false)}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Business License Image Upload */}
            <View style={styles.imageUploadContainer}>
              <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>
                {t('businessLicense')}
              </Text>

              {licenseImageUri ? (
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: licenseImageUri }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageBadge}
                    onPress={handleRemovePhoto}
                    activeOpacity={0.8}
                    disabled={isSubmitting}
                  >
                    <Icon name="close" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.dashedUploadButton,
                    isSubmitting && styles.submitButtonDisabled,
                  ]}
                  onPress={handleChoosePhoto}
                  activeOpacity={0.8}
                  disabled={isSubmitting}
                >
                  <View style={styles.uploadIconContainer}>
                    <Icon
                      name="cloud-upload-outline"
                      size={32}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.uploadText, isRTL && styles.textRTL]}>
                    {t('selectLicenseImage')}
                  </Text>
                  <Text style={[styles.uploadHint, isRTL && styles.textRTL]}>
                    {isRTL
                      ? 'صيغة صور فقط (PNG, JPG) حتى 20 ميجابايت'
                      : 'Image formats only (PNG, JPG) up to 20MB'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Terms & Conditions Checkbox */}
            <View
              style={[styles.termsContainer, isRTL && styles.termsContainerRTL]}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setTermsAccepted(prev => !prev)}
                style={[
                  styles.checkbox,
                  termsAccepted && styles.checkboxActive,
                ]}
                disabled={isSubmitting}
              >
                {termsAccepted && (
                  <Text style={styles.checkboxCheckmark}>✓</Text>
                )}
              </TouchableOpacity>

              <View
                style={[
                  styles.termsTextContainer,
                  isRTL && styles.termsTextContainerRTL,
                ]}
              >
                <Text style={styles.termsText}>
                  {isRTL ? 'أوافق على ' : 'I agree to the '}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowTermsModal(true)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.termsLink}>
                    {isRTL ? 'الشروط والأحكام' : 'Terms & Conditions'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (isSubmitting ||
                  !licenseImageUri ||
                  !businessName.trim() ||
                  !email.trim() ||
                  !phone.trim() ||
                  !termsAccepted) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={
                isSubmitting ||
                !licenseImageUri ||
                !businessName.trim() ||
                !email.trim() ||
                !phone.trim() ||
                !termsAccepted
              }
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {t('submitApplication')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Terms & Conditions Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={false}
        statusBarTranslucent={true}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <Terms onBack={() => setShowTermsModal(false)} />
      </Modal>
    </>
  );
};

export default BecomeSeller;
