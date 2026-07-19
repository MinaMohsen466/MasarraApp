/* eslint-disable @typescript-eslint/no-explicit-any, react-native/no-inline-styles, react-native/no-unused-styles */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';
import { styles } from './styles';
import { FloatingLabelInput } from './FloatingLabelInput';
import { CustomAlert } from '../CustomAlert';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors } from '../../constants/colors';
import { signup } from '../../services/api';
import { API_URL } from '../../config/api.config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MultiStepSignupProps {
  onBack: () => void;
  onSignupSuccess: (token: string, user?: any) => void;
  onNavigate?: (route: string) => void;
}

const MultiStepSignup: React.FC<MultiStepSignupProps> = ({
  onBack,
  onSignupSuccess,
  onNavigate,
}) => {
  const { isRTL, language, setLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertCallback, setAlertCallback] = useState<(() => void) | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countryCode, setCountryCode] = useState('965');
  const [phone, setPhone] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2: Email Verification
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [userId, setUserId] = useState('');
  const [userToken, setUserToken] = useState('');

  // Step 3: Address
  const [addressName, setAddressName] = useState('');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [city, setCity] = useState('');

  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  // Focus states
  const [phoneActive, setPhoneActive] = useState(false);

  // Helper function to show custom alert
  const showAlert = (title: string, message: string, callback?: () => void) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertCallback(() => callback);
    setAlertVisible(true);
  };

  // Format phone number with space after country code
  const formatPhoneNumber = (value: string) => {
    // Remove any spaces
    const cleanValue = value.replace(/\s/g, '');
    // Add space after first 8 characters (country code 965 + 5 digits)
    if (cleanValue.length > 0) {
      return cleanValue;
    }
    return '';
  };

  const handlePhoneChange = (value: string) => {
    const formattedPhone = formatPhoneNumber(value);
    setPhone(formattedPhone);
  };

  // Password validation helpers
  const isPasswordLengthValid = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const isPasswordValid = isPasswordLengthValid && hasUppercase && hasLowercase;

  // Step 1 validation
  const validateStep1 = () => {
    if (!name.trim()) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال الاسم الكامل' : 'Please enter your full name',
      );
      return false;
    }

    if (!email.trim()) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email',
      );
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address',
      );
      return false;
    }

    // Check all password requirements without alerts
    if (
      !password.trim() ||
      !isPasswordValid ||
      !confirmPassword.trim() ||
      password !== confirmPassword
    ) {
      return false;
    }

    if (!phone.trim()) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال رقم الهاتف' : 'Please enter your phone number',
      );
      return false;
    }

    return true;
  };

  const handleStep1Submit = async () => {
    if (!validateStep1()) {
      return;
    }

    setIsLoading(true);
    try {
      // Format phone with space: +965 12345678
      const formattedPhone = `+${countryCode} ${phone}`;

      const response = await signup({
        name,
        email,
        password,
        phone: formattedPhone,
        role: 'customer',
      });

      if (response.userId) {
        setUserId(response.userId);
        setStep(2);
      }
    } catch (error) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        error instanceof Error
          ? error.message
          : isRTL
          ? 'حدث خطأ ما'
          : 'Something went wrong',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value && !/^\d+$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyEmail = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال رمز 6 أرقام' : 'Please enter the 6-digit code',
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, verificationCode: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Store token if returned from verification
      if (data.token) {
        setUserToken(data.token);
      }

      setStep(3);
    } catch (error) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        error instanceof Error
          ? error.message
          : isRTL
          ? 'فشل التحقق من الرمز'
          : 'Failed to verify code',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep3 = () => {
    if (!addressName.trim()) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال اسم العنوان' : 'Please enter address name',
      );
      return false;
    }

    if (!street.trim()) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال الشارع' : 'Please enter street',
      );
      return false;
    }

    if (!city.trim()) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال المدينة' : 'Please enter city',
      );
      return false;
    }

    return true;
  };

  const handleCompleteSignup = async () => {
    if (!validateStep3()) {
      return;
    }

    setIsLoading(true);
    try {
      // Save address for the newly created user
      const response = await fetch(`${API_URL}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userToken && { Authorization: `Bearer ${userToken}` }),
        },
        body: JSON.stringify({
          name: addressName,
          street,
          houseNumber: houseNumber || undefined,
          floorNumber: floorNumber || undefined,
          city,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save address');
      }

      // Success - no alert here, just call onSignupSuccess with token
      onSignupSuccess(userToken, {
        email,
        name,
        phone: `+${countryCode}${phone}`,
        role: 'customer',
      });
    } catch (error) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        error instanceof Error
          ? error.message
          : isRTL
          ? 'حدث خطأ ما'
          : 'Something went wrong',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipAddress = () => {
    setAlertTitle(isRTL ? 'تخطي العنوان' : 'Skip Address');
    setAlertMessage(
      isRTL
        ? 'هل تريد تخطي إضافة العنوان الآن؟ يمكنك إضافته لاحقاً من صفحة العناوين'
        : 'Would you like to skip adding address now? You can add it later from the Addresses page',
    );
    setAlertCallback(() => () => {
      // Complete signup without address
      onSignupSuccess(userToken, {
        email,
        name,
        phone: `+${countryCode}${phone}`,
        role: 'customer',
      });
    });
    setAlertVisible(true);
  };

  const renderStep1 = () => (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header Block with topographic wave lines */}
      <View style={styles.headerBlock}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 375 130"
          preserveAspectRatio="none"
          style={styles.topographicSvg}
        >
          <Path
            d="M-20 60 C80 120 180 20 300 80 T400 60"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1.5}
            fill="none"
          />
          <Path
            d="M-20 80 C80 140 180 40 300 100 T400 80"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1.5}
            fill="none"
          />
          <Path
            d="M-20 100 C80 160 180 60 300 120 T400 100"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={2}
            fill="none"
          />
          <Path
            d="M-20 120 C80 180 180 80 300 140 T400 120"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
            fill="none"
          />
          <Path
            d="M-20 140 C80 200 180 100 300 160 T400 140"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={1}
            fill="none"
          />
        </Svg>

        {/* Top Overlay Navigation/Back Button & Language Switcher */}
        <View
          style={[
            styles.headerOverlayBar,
            isRTL && styles.headerOverlayBarRTL,
            { paddingTop: insets.top > 24 ? insets.top - 12 : 8 },
          ]}
        >
          {onBack ? (
            <TouchableOpacity
              style={styles.headerBackButtonCircle}
              onPress={onBack}
              activeOpacity={0.8}
            >
              <Icon
                name={isRTL ? 'chevron-forward' : 'chevron-back'}
                size={20}
                color={colors.textWhite}
              />
            </TouchableOpacity>
          ) : (
            <View />
          )}

          <TouchableOpacity
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              height: 36,
            }}
            onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            activeOpacity={0.8}
          >
            <Icon
              name="globe-outline"
              size={16}
              color={colors.textWhite}
              style={{ marginRight: isRTL ? 0 : 6, marginLeft: isRTL ? 6 : 0 }}
            />
            <Text
              style={{
                color: colors.textWhite,
                fontSize: 13,
                fontWeight: '600',
                fontFamily: 'System',
              }}
            >
              {language === 'ar' ? 'English' : 'العربية'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Curved Wave Divider */}
      <View style={styles.curveDivider}>
        <Svg
          height="60"
          width="100%"
          viewBox="0 0 375 60"
          preserveAspectRatio="none"
        >
          <Path
            d="M0,40 C100,80 250,0 375,40 L375,60 L0,60 Z"
            fill={colors.background}
          />
        </Svg>
      </View>

      {/* Form Container */}
      <View style={styles.formWrapper}>
        {/* Header Title with Custom Accent Line */}
        <View
          style={[
            styles.formHeadingContainer,
            isRTL && styles.formHeadingContainerRTL,
          ]}
        >
          <Text style={[styles.formHeading, isRTL && styles.formHeadingRTL]}>
            {isRTL ? 'إنشاء حساب' : 'Create Account'}
          </Text>
          <View
            style={[
              styles.formHeadingUnderline,
              isRTL && styles.formHeadingUnderlineRTL,
            ]}
          />
        </View>

        <Text
          style={[
            styles.label,
            isRTL && styles.labelRTL,
            { marginBottom: 12, fontSize: 13, color: colors.textSecondary },
          ]}
        >
          {isRTL
            ? 'الخطوة 1 من 3: المعلومات الأساسية'
            : 'Step 1 of 3: Basic Information'}
        </Text>

        {/* Full Name */}
        <FloatingLabelInput
          ref={ref => {
            if (inputRefs.current) inputRefs.current[0] = ref;
          }}
          label={isRTL ? 'الاسم الكامل' : 'Full Name'}
          iconName="person-outline"
          isRTL={isRTL}
          value={name}
          onChangeText={setName}
          editable={!isLoading}
          returnKeyType="next"
          onSubmitEditing={() => inputRefs.current[1]?.focus()}
        />

        {/* Email */}
        <FloatingLabelInput
          ref={ref => {
            if (inputRefs.current) inputRefs.current[1] = ref;
          }}
          label={isRTL ? 'البريد الإلكتروني' : 'Email'}
          iconName="mail-outline"
          isRTL={isRTL}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
          returnKeyType="next"
          onSubmitEditing={() => inputRefs.current[2]?.focus()}
        />

        {/* Password */}
        <FloatingLabelInput
          ref={ref => {
            if (inputRefs.current) inputRefs.current[2] = ref;
          }}
          label={isRTL ? 'كلمة المرور' : 'Password'}
          iconName="lock-closed-outline"
          isRTL={isRTL}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!isLoading}
          returnKeyType="next"
          onSubmitEditing={() => inputRefs.current[3]?.focus()}
          rightElement={
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
              style={{ paddingHorizontal: 6 }}
            >
              <Icon
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={18}
                color="#6B7280"
              />
            </TouchableOpacity>
          }
        />
        {password.length > 0 && (
          <View
            style={[multiStepStyles.passwordRequirements, { marginBottom: 16 }]}
          >
            <Text
              style={[
                multiStepStyles.requirementText,
                isRTL && multiStepStyles.requirementTextRTL,
                isPasswordLengthValid
                  ? multiStepStyles.requirementValid
                  : multiStepStyles.requirementInvalid,
              ]}
            >
              {isRTL ? '• الحد الأدنى 8 أحرف' : '• Minimum 8 characters'}
            </Text>
            <Text
              style={[
                multiStepStyles.requirementText,
                isRTL && multiStepStyles.requirementTextRTL,
                hasUppercase
                  ? multiStepStyles.requirementValid
                  : multiStepStyles.requirementInvalid,
              ]}
            >
              {isRTL
                ? '• حرف كبير واحد على الأقل'
                : '• At least one uppercase letter'}
            </Text>
            <Text
              style={[
                multiStepStyles.requirementText,
                isRTL && multiStepStyles.requirementTextRTL,
                hasLowercase
                  ? multiStepStyles.requirementValid
                  : multiStepStyles.requirementInvalid,
              ]}
            >
              {isRTL
                ? '• حرف صغير واحد على الأقل'
                : '• At least one lowercase letter'}
            </Text>
          </View>
        )}

        {/* Confirm Password */}
        <FloatingLabelInput
          ref={ref => {
            if (inputRefs.current) inputRefs.current[3] = ref;
          }}
          label={isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
          iconName="lock-closed-outline"
          isRTL={isRTL}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          editable={!isLoading}
          returnKeyType="next"
          onSubmitEditing={() => inputRefs.current[4]?.focus()}
          rightElement={
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              activeOpacity={0.7}
              style={{ paddingHorizontal: 6 }}
            >
              <Icon
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                size={18}
                color="#6B7280"
              />
            </TouchableOpacity>
          }
        />
        {confirmPassword.length > 0 && (
          <View
            style={[multiStepStyles.passwordRequirements, { marginBottom: 16 }]}
          >
            <Text
              style={[
                multiStepStyles.requirementText,
                isRTL && multiStepStyles.requirementTextRTL,
                password === confirmPassword && confirmPassword.length > 0
                  ? multiStepStyles.requirementValid
                  : multiStepStyles.requirementInvalid,
              ]}
            >
              {isRTL ? '• كلمات المرور متطابقة' : '• Passwords match'}
            </Text>
          </View>
        )}

        {/* Phone Number */}
        <FloatingLabelInput
          ref={ref => {
            if (inputRefs.current) inputRefs.current[4] = ref;
          }}
          label={isRTL ? 'رقم الهاتف' : 'Phone Number'}
          iconName="call-outline"
          isRTL={isRTL}
          value={phone}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          onFocus={() => setPhoneActive(true)}
          onBlur={() => setPhoneActive(false)}
          editable={!isLoading}
          returnKeyType="done"
          onSubmitEditing={handleStep1Submit}
          leftElement={
            phoneActive || phone.length > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 15,
                    color: colors.textDark,
                    fontWeight: '600',
                    marginRight: 4,
                  }}
                >
                  +
                </Text>
                <TextInput
                  style={{
                    fontSize: 15,
                    color: colors.textDark,
                    fontWeight: '600',
                    padding: 0,
                    minWidth: 32,
                    textAlign: 'center',
                  }}
                  value={countryCode}
                  onChangeText={setCountryCode}
                  placeholder="965"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={4}
                  editable={!isLoading}
                />
                <Text
                  style={{
                    fontSize: 15,
                    color: '#E5E7EB',
                    marginHorizontal: 6,
                  }}
                >
                  |
                </Text>
              </View>
            ) : null
          }
        />

        {/* Next Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { borderRadius: 10, paddingVertical: 14, marginTop: 14 },
            isLoading && styles.submitButtonDisabled,
          ]}
          onPress={handleStep1Submit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonTextNew}>
            {isLoading
              ? isRTL
                ? 'جاري التحميل...'
                : 'Loading...'
              : isRTL
              ? 'التالي'
              : 'Next'}
          </Text>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={isLoading}
        >
          <Text
            style={[
              styles.backButtonText,
              isRTL && styles.backButtonTextRTL,
              { color: colors.primary, fontWeight: '600' },
            ]}
          >
            {isRTL ? 'العودة لتسجيل الدخول' : 'Back to Login'}
          </Text>
        </TouchableOpacity>

        {/* Become a Seller Button */}
        {onNavigate && (
          <TouchableOpacity
            style={[styles.backButton, { marginTop: 8 }]}
            onPress={() => onNavigate('become-seller')}
            disabled={isLoading}
          >
            <Text
              style={[
                styles.backButtonText,
                isRTL && styles.backButtonTextRTL,
                { color: colors.primary, fontWeight: '600' },
              ]}
            >
              {isRTL ? 'سجل كبائع' : 'Register as a Seller'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header Block with topographic wave lines */}
      <View style={styles.headerBlock}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 375 130"
          preserveAspectRatio="none"
          style={styles.topographicSvg}
        >
          <Path
            d="M-20 60 C80 120 180 20 300 80 T400 60"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1.5}
            fill="none"
          />
          <Path
            d="M-20 80 C80 140 180 40 300 100 T400 80"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1.5}
            fill="none"
          />
          <Path
            d="M-20 100 C80 160 180 60 300 120 T400 100"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={2}
            fill="none"
          />
          <Path
            d="M-20 120 C80 180 180 80 300 140 T400 120"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
            fill="none"
          />
          <Path
            d="M-20 140 C80 200 180 100 300 160 T400 140"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={1}
            fill="none"
          />
        </Svg>

        {/* Top Overlay Navigation/Back Button & Language Switcher */}
        <View
          style={[
            styles.headerOverlayBar,
            isRTL && styles.headerOverlayBarRTL,
            { paddingTop: insets.top > 24 ? insets.top - 12 : 8 },
          ]}
        >
          <TouchableOpacity
            style={styles.headerBackButtonCircle}
            onPress={() => {
              setStep(1);
              setOtp(['', '', '', '', '', '']);
            }}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Icon
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={20}
              color={colors.textWhite}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              height: 36,
            }}
            onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            activeOpacity={0.8}
          >
            <Icon
              name="globe-outline"
              size={16}
              color={colors.textWhite}
              style={{ marginRight: isRTL ? 0 : 6, marginLeft: isRTL ? 6 : 0 }}
            />
            <Text
              style={{
                color: colors.textWhite,
                fontSize: 13,
                fontWeight: '600',
                fontFamily: 'System',
              }}
            >
              {language === 'ar' ? 'English' : 'العربية'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Curved Wave Divider */}
      <View style={styles.curveDivider}>
        <Svg
          height="60"
          width="100%"
          viewBox="0 0 375 60"
          preserveAspectRatio="none"
        >
          <Path
            d="M0,40 C100,80 250,0 375,40 L375,60 L0,60 Z"
            fill={colors.background}
          />
        </Svg>
      </View>

      {/* Form Container */}
      <View style={styles.formWrapper}>
        {/* Header Title with Custom Accent Line */}
        <View
          style={[
            styles.formHeadingContainer,
            isRTL && styles.formHeadingContainerRTL,
          ]}
        >
          <Text style={[styles.formHeading, isRTL && styles.formHeadingRTL]}>
            {isRTL ? 'التحقق من البريد' : 'Verify Email'}
          </Text>
          <View
            style={[
              styles.formHeadingUnderline,
              isRTL && styles.formHeadingUnderlineRTL,
            ]}
          />
        </View>

        {/* Progress Indicator */}
        <View style={[multiStepStyles.progressContainer, { marginBottom: 20 }]}>
          <View
            style={[
              multiStepStyles.progressDot,
              multiStepStyles.progressDotActive,
            ]}
          />
          <View style={multiStepStyles.progressLine} />
          <View
            style={[
              multiStepStyles.progressDot,
              multiStepStyles.progressDotActive,
            ]}
          />
          <View style={multiStepStyles.progressLine} />
          <View style={multiStepStyles.progressDot} />
        </View>

        <Text
          style={[
            styles.label,
            isRTL && styles.labelRTL,
            { marginBottom: 16, fontSize: 13, color: colors.textSecondary },
          ]}
        >
          {isRTL
            ? 'الخطوة 2 من 3: أدخل رمز التحقق'
            : 'Step 2 of 3: Enter verification code'}
        </Text>

        <Text
          style={[
            multiStepStyles.description,
            isRTL && multiStepStyles.descriptionRTL,
            {
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 24,
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
        >
          {isRTL
            ? `تم إرسال رمز مكون من 6 أرقام إلى:\n${email}`
            : `A 6-digit code has been sent to:\n${email}`}
        </Text>

        <View
          style={[
            multiStepStyles.otpContainer,
            isRTL && multiStepStyles.otpContainerRTL,
          ]}
        >
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => {
                if (otpInputRefs.current) otpInputRefs.current[index] = ref;
              }}
              style={multiStepStyles.otpInput}
              value={digit}
              onChangeText={value => handleOtpChange(value, index)}
              onKeyPress={e => handleOtpKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!isLoading}
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { borderRadius: 10, paddingVertical: 14, marginTop: 10 },
            isLoading && styles.submitButtonDisabled,
          ]}
          onPress={handleVerifyEmail}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonTextNew}>
            {isLoading
              ? isRTL
                ? 'جاري التحقق...'
                : 'Verifying...'
              : isRTL
              ? 'التحقق'
              : 'Verify'}
          </Text>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setStep(1);
            setOtp(['', '', '', '', '', '']);
          }}
          disabled={isLoading}
        >
          <Text
            style={[
              styles.backButtonText,
              isRTL && styles.backButtonTextRTL,
              { color: colors.primary, fontWeight: '600' },
            ]}
          >
            {isRTL ? 'رجوع' : 'Back'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header Block with topographic wave lines */}
      <View style={styles.headerBlock}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 375 130"
          preserveAspectRatio="none"
          style={styles.topographicSvg}
        >
          <Path
            d="M-20 60 C80 120 180 20 300 80 T400 60"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1.5}
            fill="none"
          />
          <Path
            d="M-20 80 C80 140 180 40 300 100 T400 80"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1.5}
            fill="none"
          />
          <Path
            d="M-20 100 C80 160 180 60 300 120 T400 100"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={2}
            fill="none"
          />
          <Path
            d="M-20 120 C80 180 180 80 300 140 T400 120"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
            fill="none"
          />
          <Path
            d="M-20 140 C80 200 180 100 300 160 T400 140"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={1}
            fill="none"
          />
        </Svg>

        {/* Top Overlay Navigation/Back Button & Language Switcher */}
        <View
          style={[
            styles.headerOverlayBar,
            isRTL && styles.headerOverlayBarRTL,
            { paddingTop: insets.top > 24 ? insets.top - 12 : 8 },
          ]}
        >
          <TouchableOpacity
            style={styles.headerBackButtonCircle}
            onPress={() => setStep(2)}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Icon
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={20}
              color={colors.textWhite}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              height: 36,
            }}
            onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            activeOpacity={0.8}
          >
            <Icon
              name="globe-outline"
              size={16}
              color={colors.textWhite}
              style={{ marginRight: isRTL ? 0 : 6, marginLeft: isRTL ? 6 : 0 }}
            />
            <Text
              style={{
                color: colors.textWhite,
                fontSize: 13,
                fontWeight: '600',
                fontFamily: 'System',
              }}
            >
              {language === 'ar' ? 'English' : 'العربية'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Curved Wave Divider */}
      <View style={styles.curveDivider}>
        <Svg
          height="60"
          width="100%"
          viewBox="0 0 375 60"
          preserveAspectRatio="none"
        >
          <Path
            d="M0,40 C100,80 250,0 375,40 L375,60 L0,60 Z"
            fill={colors.background}
          />
        </Svg>
      </View>

      {/* Form Container */}
      <View style={styles.formWrapper}>
        {/* Header Title with Custom Accent Line */}
        <View
          style={[
            styles.formHeadingContainer,
            isRTL && styles.formHeadingContainerRTL,
          ]}
        >
          <Text style={[styles.formHeading, isRTL && styles.formHeadingRTL]}>
            {isRTL ? 'إضافة عنوان' : 'Add Address'}
          </Text>
          <View
            style={[
              styles.formHeadingUnderline,
              isRTL && styles.formHeadingUnderlineRTL,
            ]}
          />
        </View>

        {/* Progress Indicator */}
        <View style={[multiStepStyles.progressContainer, { marginBottom: 20 }]}>
          <View
            style={[
              multiStepStyles.progressDot,
              multiStepStyles.progressDotActive,
            ]}
          />
          <View style={multiStepStyles.progressLine} />
          <View
            style={[
              multiStepStyles.progressDot,
              multiStepStyles.progressDotActive,
            ]}
          />
          <View style={multiStepStyles.progressLine} />
          <View
            style={[
              multiStepStyles.progressDot,
              multiStepStyles.progressDotActive,
            ]}
          />
        </View>

        <Text
          style={[
            styles.label,
            isRTL && styles.labelRTL,
            { marginBottom: 16, fontSize: 13, color: colors.textSecondary },
          ]}
        >
          {isRTL
            ? 'الخطوة 3 من 3: بيانات العنوان'
            : 'Step 3 of 3: Address Details'}
        </Text>

        {/* Address Name */}
        <FloatingLabelInput
          label={isRTL ? 'اسم العنوان' : 'Address Name'}
          iconName="bookmark-outline"
          isRTL={isRTL}
          value={addressName}
          onChangeText={setAddressName}
          placeholder={isRTL ? 'مثلاً: المنزل، العمل' : 'e.g., Home, Work'}
          editable={!isLoading}
        />

        {/* Street */}
        <FloatingLabelInput
          label={isRTL ? 'الشارع' : 'Street'}
          iconName="location-outline"
          isRTL={isRTL}
          value={street}
          onChangeText={setStreet}
          placeholder={isRTL ? 'أدخل الشارع' : 'Enter street name'}
          editable={!isLoading}
        />

        {/* House Number + Floor Number */}
        <View style={multiStepStyles.rowContainer}>
          <View style={multiStepStyles.halfInput}>
            <FloatingLabelInput
              label={isRTL ? 'رقم المنزل' : 'House Number'}
              iconName="home-outline"
              isRTL={isRTL}
              value={houseNumber}
              onChangeText={setHouseNumber}
              placeholder={isRTL ? 'المنزل' : 'House'}
              keyboardType="number-pad"
              editable={!isLoading}
            />
          </View>

          <View style={multiStepStyles.halfInput}>
            <FloatingLabelInput
              label={isRTL ? 'رقم الطابق' : 'Floor Number'}
              iconName="layers-outline"
              isRTL={isRTL}
              value={floorNumber}
              onChangeText={setFloorNumber}
              placeholder={isRTL ? 'الطابق' : 'Floor'}
              keyboardType="number-pad"
              editable={!isLoading}
            />
          </View>
        </View>

        {/* City */}
        <FloatingLabelInput
          label={isRTL ? 'المدينة' : 'City'}
          iconName="business-outline"
          isRTL={isRTL}
          value={city}
          onChangeText={setCity}
          placeholder={isRTL ? 'أدخل المدينة' : 'Enter city name'}
          editable={!isLoading}
        />

        {/* Complete Signup Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { borderRadius: 10, paddingVertical: 14, marginTop: 14 },
            isLoading && styles.submitButtonDisabled,
          ]}
          onPress={handleCompleteSignup}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonTextNew}>
            {isLoading
              ? isRTL
                ? 'جاري الانتهاء...'
                : 'Completing...'
              : isRTL
              ? 'إنشاء الحساب'
              : 'Complete Signup'}
          </Text>
        </TouchableOpacity>

        {/* Skip for Now Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleSkipAddress}
          disabled={isLoading}
        >
          <Text
            style={[
              styles.backButtonText,
              isRTL && styles.backButtonTextRTL,
              { color: colors.primary, fontWeight: '600' },
            ]}
          >
            {isRTL ? 'تخطي إضافة العنوان الآن' : 'Skip adding address for now'}
          </Text>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { marginTop: 4 }]}
          onPress={() => setStep(2)}
          disabled={isLoading}
        >
          <Text
            style={[styles.backButtonText, isRTL && styles.backButtonTextRTL]}
          >
            {isRTL ? 'رجوع' : 'Back'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

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
        buttons={[
          {
            text: isRTL ? 'حسناً' : 'OK',
            onPress: alertCallback || undefined,
          },
        ]}
        onClose={() => setAlertVisible(false)}
      />
      <View style={{ flex: 1, backgroundColor: colors.primary }}>
        <View style={{ height: insets.top, backgroundColor: colors.primary }} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: colors.background }}
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </KeyboardAvoidingView>
      </View>
    </>
  );
};

const multiStepStyles = StyleSheet.create({
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ddd',
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressLine: {
    height: 2,
    flex: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 8,
  },
  stepNumber: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'left',
  },
  stepNumberRTL: {
    textAlign: 'right',
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  descriptionRTL: {
    textAlign: 'right',
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  phonePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  plusSign: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginRight: 4,
  },
  countryCodeInput: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    padding: 0,
    minWidth: 42,
    textAlign: 'center',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.textDark,
    minWidth: 0,
    marginLeft: 8,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  otpContainerRTL: {
    flexDirection: 'row-reverse',
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  passwordRequirements: {
    marginTop: 8,
    paddingLeft: 8,
  },
  requirementText: {
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 18,
  },
  requirementTextRTL: {
    textAlign: 'right',
    paddingLeft: 0,
    paddingRight: 8,
  },
  requirementValid: {
    color: '#10B981',
  },
  requirementInvalid: {
    color: '#EF4444',
  },
});

export default MultiStepSignup;
