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
  const { isRTL } = useLanguage();
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
  const [nameActive, setNameActive] = useState(false);
  const [emailActive, setEmailActive] = useState(false);
  const [passwordActive, setPasswordActive] = useState(false);
  const [confirmPasswordActive, setConfirmPasswordActive] = useState(false);
  const [phoneActive, setPhoneActive] = useState(false);
  const [addressNameActive, setAddressNameActive] = useState(false);
  const [streetActive, setStreetActive] = useState(false);
  const [houseNumberActive, setHouseNumberActive] = useState(false);
  const [floorNumberActive, setFloorNumberActive] = useState(false);
  const [cityActive, setCityActive] = useState(false);

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

        {/* Top Overlay Navigation/Back Button */}
        {onBack && (
          <View
            style={[
              styles.headerOverlayBar,
              isRTL && styles.headerOverlayBarRTL,
            ]}
          >
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
          </View>
        )}
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
        <Text
          style={[
            styles.label,
            isRTL && styles.labelRTL,
            { marginBottom: 6, fontSize: 13, color: '#6B7280' },
          ]}
        >
          {isRTL ? 'الاسم الكامل' : 'Full Name'}
        </Text>
        <View
          style={[
            styles.sleekInputWrapper,
            isRTL && styles.sleekInputWrapperRTL,
            nameActive && styles.sleekInputWrapperActive,
          ]}
        >
          <Icon
            name="person-outline"
            size={18}
            color={nameActive ? colors.primary : '#9CA3AF'}
            style={[styles.sleekInputIcon, isRTL && styles.sleekInputIconRTL]}
          />
          <View
            style={[
              styles.sleekInputDivider,
              isRTL && styles.sleekInputDividerRTL,
            ]}
          />
          <TextInput
            ref={ref => {
              if (inputRefs.current) inputRefs.current[0] = ref;
            }}
            style={[styles.sleekTextInput, isRTL && styles.sleekTextInputRTL]}
            value={name}
            onChangeText={setName}
            placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name'}
            placeholderTextColor="#9CA3AF"
            onFocus={() => setNameActive(true)}
            onBlur={() => setNameActive(false)}
            editable={!isLoading}
          />
        </View>

        {/* Email */}
        <Text
          style={[
            styles.label,
            isRTL && styles.labelRTL,
            { marginBottom: 6, fontSize: 13, color: '#6B7280' },
          ]}
        >
          {isRTL ? 'البريد الإلكتروني' : 'Email'}
        </Text>
        <View
          style={[
            styles.sleekInputWrapper,
            isRTL && styles.sleekInputWrapperRTL,
            emailActive && styles.sleekInputWrapperActive,
          ]}
        >
          <Icon
            name="mail-outline"
            size={18}
            color={emailActive ? colors.primary : '#9CA3AF'}
            style={[styles.sleekInputIcon, isRTL && styles.sleekInputIconRTL]}
          />
          <View
            style={[
              styles.sleekInputDivider,
              isRTL && styles.sleekInputDividerRTL,
            ]}
          />
          <TextInput
            ref={ref => {
              if (inputRefs.current) inputRefs.current[1] = ref;
            }}
            style={[styles.sleekTextInput, isRTL && styles.sleekTextInputRTL]}
            value={email}
            onChangeText={setEmail}
            placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setEmailActive(true)}
            onBlur={() => setEmailActive(false)}
            editable={!isLoading}
          />
        </View>

        {/* Password */}
        <Text
          style={[
            styles.label,
            isRTL && styles.labelRTL,
            { marginBottom: 6, fontSize: 13, color: '#6B7280' },
          ]}
        >
          {isRTL ? 'كلمة المرور' : 'Password'}
        </Text>
        <View
          style={[
            styles.sleekInputWrapper,
            isRTL && styles.sleekInputWrapperRTL,
            passwordActive && styles.sleekInputWrapperActive,
          ]}
        >
          <Icon
            name="lock-closed-outline"
            size={18}
            color={passwordActive ? colors.primary : '#9CA3AF'}
            style={[styles.sleekInputIcon, isRTL && styles.sleekInputIconRTL]}
          />
          <View
            style={[
              styles.sleekInputDivider,
              isRTL && styles.sleekInputDividerRTL,
            ]}
          />
          <TextInput
            ref={ref => {
              if (inputRefs.current) inputRefs.current[2] = ref;
            }}
            style={[styles.sleekTextInput, isRTL && styles.sleekTextInputRTL]}
            value={password}
            onChangeText={setPassword}
            placeholder={isRTL ? 'أدخل كلمة المرور' : 'Enter your password'}
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPassword}
            onFocus={() => setPasswordActive(true)}
            onBlur={() => setPasswordActive(false)}
            editable={!isLoading}
          />
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
        </View>
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
        <Text
          style={[
            styles.label,
            isRTL && styles.labelRTL,
            { marginBottom: 6, fontSize: 13, color: '#6B7280' },
          ]}
        >
          {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
        </Text>
        <View
          style={[
            styles.sleekInputWrapper,
            isRTL && styles.sleekInputWrapperRTL,
            confirmPasswordActive && styles.sleekInputWrapperActive,
          ]}
        >
          <Icon
            name="lock-closed-outline"
            size={18}
            color={confirmPasswordActive ? colors.primary : '#9CA3AF'}
            style={[styles.sleekInputIcon, isRTL && styles.sleekInputIconRTL]}
          />
          <View
            style={[
              styles.sleekInputDivider,
              isRTL && styles.sleekInputDividerRTL,
            ]}
          />
          <TextInput
            ref={ref => {
              if (inputRefs.current) inputRefs.current[3] = ref;
            }}
            style={[styles.sleekTextInput, isRTL && styles.sleekTextInputRTL]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={
              isRTL ? 'أعد إدخال كلمة المرور' : 'Re-enter your password'
            }
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showConfirmPassword}
            onFocus={() => setConfirmPasswordActive(true)}
            onBlur={() => setConfirmPasswordActive(false)}
            editable={!isLoading}
          />
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
        </View>
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
        <Text
          style={[
            styles.label,
            isRTL && styles.labelRTL,
            { marginBottom: 6, fontSize: 13, color: '#6B7280' },
          ]}
        >
          {isRTL ? 'رقم الهاتف' : 'Phone Number'}
        </Text>
        <View
          style={[
            styles.sleekInputWrapper,
            isRTL && styles.sleekInputWrapperRTL,
            phoneActive && styles.sleekInputWrapperActive,
          ]}
        >
          <Icon
            name="call-outline"
            size={18}
            color={phoneActive ? colors.primary : '#9CA3AF'}
            style={[styles.sleekInputIcon, isRTL && styles.sleekInputIconRTL]}
          />
          <View
            style={[
              styles.sleekInputDivider,
              isRTL && styles.sleekInputDividerRTL,
            ]}
          />

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
              style={{ fontSize: 15, color: '#E5E7EB', marginHorizontal: 6 }}
            >
              |
            </Text>
          </View>

          <TextInput
            ref={ref => {
              if (inputRefs.current) inputRefs.current[4] = ref;
            }}
            style={[styles.sleekTextInput, isRTL && styles.sleekTextInputRTL]}
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="12345678"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            onFocus={() => setPhoneActive(true)}
            onBlur={() => setPhoneActive(false)}
            editable={!isLoading}
          />
        </View>

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

        {/* Top Overlay Navigation/Back Button */}
        <View
          style={[styles.headerOverlayBar, isRTL && styles.headerOverlayBarRTL]}
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

        {/* Top Overlay Navigation/Back Button */}
        <View
          style={[styles.headerOverlayBar, isRTL && styles.headerOverlayBarRTL]}
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
        <Text
          style={[
            styles.label,
            isRTL && styles.labelRTL,
            { marginBottom: 6, fontSize: 13, color: '#6B7280' },
          ]}
        >
          {isRTL ? 'اسم العنوان' : 'Address Name'}
        </Text>
        <View
          style={[
            styles.sleekInputWrapper,
            isRTL && styles.sleekInputWrapperRTL,
            addressNameActive && styles.sleekInputWrapperActive,
          ]}
        >
          <Icon
            name="bookmark-outline"
            size={18}
            color={addressNameActive ? colors.primary : '#9CA3AF'}
            style={[styles.sleekInputIcon, isRTL && styles.sleekInputIconRTL]}
          />
          <View
            style={[
              styles.sleekInputDivider,
              isRTL && styles.sleekInputDividerRTL,
            ]}
          />
          <TextInput
            style={[styles.sleekTextInput, isRTL && styles.sleekTextInputRTL]}
            value={addressName}
            onChangeText={setAddressName}
            placeholder={isRTL ? 'مثلاً: المنزل، العمل' : 'e.g., Home, Work'}
            placeholderTextColor="#9CA3AF"
            onFocus={() => setAddressNameActive(true)}
            onBlur={() => setAddressNameActive(false)}
            editable={!isLoading}
          />
        </View>

        {/* Street */}
        <Text
          style={[
            styles.label,
            isRTL && styles.labelRTL,
            { marginBottom: 6, fontSize: 13, color: '#6B7280' },
          ]}
        >
          {isRTL ? 'الشارع' : 'Street'}
        </Text>
        <View
          style={[
            styles.sleekInputWrapper,
            isRTL && styles.sleekInputWrapperRTL,
            streetActive && styles.sleekInputWrapperActive,
          ]}
        >
          <Icon
            name="location-outline"
            size={18}
            color={streetActive ? colors.primary : '#9CA3AF'}
            style={[styles.sleekInputIcon, isRTL && styles.sleekInputIconRTL]}
          />
          <View
            style={[
              styles.sleekInputDivider,
              isRTL && styles.sleekInputDividerRTL,
            ]}
          />
          <TextInput
            style={[styles.sleekTextInput, isRTL && styles.sleekTextInputRTL]}
            value={street}
            onChangeText={setStreet}
            placeholder={isRTL ? 'أدخل الشارع' : 'Enter street name'}
            placeholderTextColor="#9CA3AF"
            onFocus={() => setStreetActive(true)}
            onBlur={() => setStreetActive(false)}
            editable={!isLoading}
          />
        </View>

        {/* House Number + Floor Number */}
        <View style={multiStepStyles.rowContainer}>
          <View style={multiStepStyles.halfInput}>
            <Text
              style={[
                styles.label,
                isRTL && styles.labelRTL,
                { marginBottom: 6, fontSize: 13, color: '#6B7280' },
              ]}
            >
              {isRTL ? 'رقم المنزل' : 'House Number'}
            </Text>
            <View
              style={[
                styles.sleekInputWrapper,
                isRTL && styles.sleekInputWrapperRTL,
                houseNumberActive && styles.sleekInputWrapperActive,
              ]}
            >
              <Icon
                name="home-outline"
                size={16}
                color={houseNumberActive ? colors.primary : '#9CA3AF'}
                style={[
                  styles.sleekInputIcon,
                  isRTL && styles.sleekInputIconRTL,
                ]}
              />
              <View
                style={[
                  styles.sleekInputDivider,
                  isRTL && styles.sleekInputDividerRTL,
                ]}
              />
              <TextInput
                style={[
                  styles.sleekTextInput,
                  isRTL && styles.sleekTextInputRTL,
                ]}
                value={houseNumber}
                onChangeText={setHouseNumber}
                placeholder={isRTL ? 'المنزل' : 'House'}
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                onFocus={() => setHouseNumberActive(true)}
                onBlur={() => setHouseNumberActive(false)}
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={multiStepStyles.halfInput}>
            <Text
              style={[
                styles.label,
                isRTL && styles.labelRTL,
                { marginBottom: 6, fontSize: 13, color: '#6B7280' },
              ]}
            >
              {isRTL ? 'رقم الطابق' : 'Floor Number'}
            </Text>
            <View
              style={[
                styles.sleekInputWrapper,
                isRTL && styles.sleekInputWrapperRTL,
                floorNumberActive && styles.sleekInputWrapperActive,
              ]}
            >
              <Icon
                name="layers-outline"
                size={16}
                color={floorNumberActive ? colors.primary : '#9CA3AF'}
                style={[
                  styles.sleekInputIcon,
                  isRTL && styles.sleekInputIconRTL,
                ]}
              />
              <View
                style={[
                  styles.sleekInputDivider,
                  isRTL && styles.sleekInputDividerRTL,
                ]}
              />
              <TextInput
                style={[
                  styles.sleekTextInput,
                  isRTL && styles.sleekTextInputRTL,
                ]}
                value={floorNumber}
                onChangeText={setFloorNumber}
                placeholder={isRTL ? 'الطابق' : 'Floor'}
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                onFocus={() => setFloorNumberActive(true)}
                onBlur={() => setFloorNumberActive(false)}
                editable={!isLoading}
              />
            </View>
          </View>
        </View>

        {/* City */}
        <Text
          style={[
            styles.label,
            isRTL && styles.labelRTL,
            { marginBottom: 6, fontSize: 13, color: '#6B7280' },
          ]}
        >
          {isRTL ? 'المدينة' : 'City'}
        </Text>
        <View
          style={[
            styles.sleekInputWrapper,
            isRTL && styles.sleekInputWrapperRTL,
            cityActive && styles.sleekInputWrapperActive,
          ]}
        >
          <Icon
            name="business-outline"
            size={18}
            color={cityActive ? colors.primary : '#9CA3AF'}
            style={[styles.sleekInputIcon, isRTL && styles.sleekInputIconRTL]}
          />
          <View
            style={[
              styles.sleekInputDivider,
              isRTL && styles.sleekInputDividerRTL,
            ]}
          />
          <TextInput
            style={[styles.sleekTextInput, isRTL && styles.sleekTextInputRTL]}
            value={city}
            onChangeText={setCity}
            placeholder={isRTL ? 'أدخل المدينة' : 'Enter city name'}
            placeholderTextColor="#9CA3AF"
            onFocus={() => setCityActive(true)}
            onBlur={() => setCityActive(false)}
            editable={!isLoading}
          />
        </View>

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
