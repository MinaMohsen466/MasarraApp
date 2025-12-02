import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { styles } from './styles';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors } from '../../constants/colors';
import { signup } from '../../services/api';

// Country codes data with flags
const COUNTRY_CODES = [
  { code: '+965', name: 'Kuwait', label: 'Kuwait', flag: '🇰🇼' },
  { code: '+966', name: 'Saudi Arabia', label: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+971', name: 'United Arab Emirates', label: 'UAE', flag: '🇦🇪' },
  { code: '+974', name: 'Qatar', label: 'Qatar', flag: '🇶🇦' },
  { code: '+973', name: 'Bahrain', label: 'Bahrain', flag: '🇧🇭' },
  { code: '+968', name: 'Oman', label: 'Oman', flag: '🇴🇲' },
  { code: '+20', name: 'Egypt', label: 'Egypt', flag: '🇪🇬' },
  { code: '+212', name: 'Morocco', label: 'Morocco', flag: '🇲🇦' },
  { code: '+216', name: 'Tunisia', label: 'Tunisia', flag: '🇹🇳' },
  { code: '+213', name: 'Algeria', label: 'Algeria', flag: '🇩🇿' },
  { code: '+218', name: 'Libya', label: 'Libya', flag: '🇱🇾' },
  { code: '+249', name: 'Sudan', label: 'Sudan', flag: '🇸🇩' },
  { code: '+251', name: 'Ethiopia', label: 'Ethiopia', flag: '🇪🇹' },
  { code: '+44', name: 'United Kingdom', label: 'UK', flag: '🇬🇧' },
  { code: '+1', name: 'USA/Canada', label: 'USA/Canada', flag: '🇺🇸' },
  { code: '+91', name: 'India', label: 'India', flag: '🇮🇳' },
  { code: '+86', name: 'China', label: 'China', flag: '🇨🇳' },
  { code: '+81', name: 'Japan', label: 'Japan', flag: '🇯🇵' },
  { code: '+49', name: 'Germany', label: 'Germany', flag: '🇩🇪' },
  { code: '+33', name: 'France', label: 'France', flag: '🇫🇷' },
  { code: '+39', name: 'Italy', label: 'Italy', flag: '🇮🇹' },
  { code: '+34', name: 'Spain', label: 'Spain', flag: '🇪🇸' },
  { code: '+61', name: 'Australia', label: 'Australia', flag: '🇦🇺' },
  { code: '+27', name: 'South Africa', label: 'South Africa', flag: '🇿🇦' },
  { code: '+92', name: 'Pakistan', label: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', name: 'Bangladesh', label: 'Bangladesh', flag: '🇧🇩' },
  { code: '+60', name: 'Malaysia', label: 'Malaysia', flag: '🇲🇾' },
  { code: '+65', name: 'Singapore', label: 'Singapore', flag: '🇸🇬' },
  { code: '+63', name: 'Philippines', label: 'Philippines', flag: '🇵🇭' },
  { code: '+90', name: 'Turkey', label: 'Turkey', flag: '🇹🇷' },
  { code: '+964', name: 'Iraq', label: 'Iraq', flag: '🇮🇶' },
  { code: '+962', name: 'Jordan', label: 'Jordan', flag: '🇯🇴' },
  { code: '+963', name: 'Syria', label: 'Syria', flag: '🇸🇾' },
  { code: '+961', name: 'Lebanon', label: 'Lebanon', flag: '🇱🇧' },
  { code: '+967', name: 'Yemen', label: 'Yemen', flag: '🇾🇪' },
  { code: '+970', name: 'Palestine', label: 'Palestine', flag: '🇵🇸' },
];

interface MultiStepSignupProps {
  onBack: () => void;
  onSignupSuccess: (token: string, user?: any) => void;
}

const MultiStepSignup: React.FC<MultiStepSignupProps> = ({ onBack, onSignupSuccess }) => {
  const { isRTL } = useLanguage();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+965');
  const [phone, setPhone] = useState('');

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

  // Step 1 validation
  const validateStep1 = () => {
    if (!name.trim()) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'يرجى إدخال الاسم الكامل' : 'Please enter your full name');
      return false;
    }

    if (!email.trim()) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address');
      return false;
    }

    if (!password.trim()) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'يرجى إدخال كلمة المرور' : 'Please enter a password');
      return false;
    }

    if (password.length < 6) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return false;
    }

    if (!phone.trim()) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'يرجى إدخال رقم الهاتف' : 'Please enter your phone number');
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
      const response = await signup({
        name,
        email,
        password,
        phone: `${countryCode}${phone}`,
        role: 'customer',
      });

      if (response.userId) {
        setUserId(response.userId);
        setStep(2);
      }
    } catch (error) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        error instanceof Error ? error.message : isRTL ? 'حدث خطأ ما' : 'Something went wrong'
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
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال رمز 6 أرقام' : 'Please enter the 6-digit code'
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://10.0.2.2:3000/api/auth/verify-email', {
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
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        error instanceof Error ? error.message : isRTL ? 'فشل التحقق من الرمز' : 'Failed to verify code'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep3 = () => {
    if (!addressName.trim()) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'يرجى إدخال اسم العنوان' : 'Please enter address name');
      return false;
    }

    if (!street.trim()) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'يرجى إدخال الشارع' : 'Please enter street');
      return false;
    }

    if (!city.trim()) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'يرجى إدخال المدينة' : 'Please enter city');
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
      const response = await fetch('http://10.0.2.2:3000/api/addresses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(userToken && { 'Authorization': `Bearer ${userToken}` })
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
        phone: `${countryCode}${phone}`,
        role: 'customer' 
      });
    } catch (error) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        error instanceof Error ? error.message : isRTL ? 'حدث خطأ ما' : 'Something went wrong'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipAddress = () => {
    Alert.alert(
      isRTL ? 'تخطي العنوان' : 'Skip Address',
      isRTL ? 'هل تريد تخطي إضافة العنوان الآن؟ يمكنك إضافته لاحقاً من صفحة العناوين' : 'Would you like to skip adding address now? You can add it later from the Addresses page',
      [
        {
          text: isRTL ? 'الغاء' : 'Cancel',
          onPress: () => {},
          style: 'cancel'
        },
        {
          text: isRTL ? 'نعم، تخطي' : 'Yes, Skip',
          onPress: () => {
            // Complete signup without address
            onSignupSuccess(userToken, { 
              email, 
              name, 
              phone: `${countryCode}${phone}`,
              role: 'customer' 
            });
          },
          style: 'destructive'
        }
      ]
    );
  };

  const getCountryFlag = (code: string) => {
    const country = COUNTRY_CODES.find(c => c.code === code);
    return country?.flag || '🌍';
  };

  const renderCountryModal = () => (
    <Modal
      visible={showCountryModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowCountryModal(false)}>
      <View style={multiStepStyles.modalOverlay}>
        <View style={multiStepStyles.modalContent}>
          <View style={multiStepStyles.modalHeader}>
            <Text style={[multiStepStyles.modalTitle, isRTL && multiStepStyles.modalTitleRTL]}>
              {isRTL ? 'اختر مفتاح الدولة' : 'Select Country Code'}
            </Text>
            <TouchableOpacity onPress={() => setShowCountryModal(false)}>
              <Text style={multiStepStyles.modalCloseBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={COUNTRY_CODES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  multiStepStyles.countryItem,
                  countryCode === item.code && multiStepStyles.countryItemSelected,
                ]}
                onPress={() => {
                  setCountryCode(item.code);
                  setShowCountryModal(false);
                }}>
                <Text style={[multiStepStyles.countryFlag]}>
                  {item.flag}
                </Text>
                <Text style={[multiStepStyles.countryCode, countryCode === item.code && multiStepStyles.countryCodeSelected]}>
                  {item.code}
                </Text>
                <Text style={[multiStepStyles.countryName, countryCode === item.code && multiStepStyles.countryNameSelected]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const renderStep1 = () => (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      {/* Progress Indicator */}
      <View style={multiStepStyles.progressContainer}>
        <View style={[multiStepStyles.progressDot, multiStepStyles.progressDotActive]} />
        <View style={multiStepStyles.progressLine} />
        <View style={multiStepStyles.progressDot} />
        <View style={multiStepStyles.progressLine} />
        <View style={multiStepStyles.progressDot} />
      </View>

      <Text style={[styles.title, isRTL && styles.titleRTL]}>
        {isRTL ? 'إنشاء حساب' : 'Create Account'}
      </Text>

      <Text style={[multiStepStyles.stepNumber, isRTL && multiStepStyles.stepNumberRTL]}>
        {isRTL ? 'الخطوة 1 من 3: المعلومات الأساسية' : 'Step 1 of 3: Basic Information'}
      </Text>

      <View style={styles.formContainer}>
        {/* Full Name */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, isRTL && styles.labelRTL]}>
            {isRTL ? 'الاسم الكامل' : 'Full Name'}
          </Text>
          <TextInput
            ref={(ref) => { if (inputRefs.current) inputRefs.current[0] = ref; }}
            style={[styles.input, isRTL && styles.inputRTL]}
            value={name}
            onChangeText={setName}
            placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name'}
            placeholderTextColor="#999"
            textAlign={isRTL ? 'right' : 'left'}
            editable={!isLoading}
          />
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, isRTL && styles.labelRTL]}>
            {isRTL ? 'البريد الإلكتروني' : 'Email'}
          </Text>
          <TextInput
            ref={(ref) => { if (inputRefs.current) inputRefs.current[1] = ref; }}
            style={[styles.input, isRTL && styles.inputRTL]}
            value={email}
            onChangeText={setEmail}
            placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign={isRTL ? 'right' : 'left'}
            editable={!isLoading}
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, isRTL && styles.labelRTL]}>
            {isRTL ? 'كلمة المرور' : 'Password'}
          </Text>
          <View style={styles.passwordInputWrapper}>
            <TextInput
              ref={(ref) => { if (inputRefs.current) inputRefs.current[2] = ref; }}
              style={[styles.input, isRTL && styles.inputRTL]}
              value={password}
              onChangeText={setPassword}
              placeholder={isRTL ? 'أدخل كلمة المرور' : 'Enter your password'}
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              textAlign={isRTL ? 'right' : 'left'}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeIcon}>{showPassword ? '👁' : '👁‍🗨'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Country Code + Phone */}
        <View style={multiStepStyles.phoneContainer}>
          <View style={multiStepStyles.countryCodeInputContainer}>
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {isRTL ? 'الدولة' : 'Country'}
            </Text>
            <TouchableOpacity
              style={[multiStepStyles.countryCodeButton, isRTL && multiStepStyles.countryCodeButtonRTL]}
              onPress={() => setShowCountryModal(true)}
              disabled={isLoading}>
              <Text style={multiStepStyles.countryCodeText}>{getCountryFlag(countryCode)} {countryCode}</Text>
              <Text style={multiStepStyles.countryCodeArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={[multiStepStyles.phoneInputContainer, isRTL && multiStepStyles.phoneInputContainerRTL]}>
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {isRTL ? 'رقم الهاتف' : 'Phone'}
            </Text>
            <TextInput
              ref={(ref) => { if (inputRefs.current) inputRefs.current[3] = ref; }}
              style={[styles.input, isRTL && styles.inputRTL]}
              value={phone}
              onChangeText={setPhone}
              placeholder={isRTL ? 'أدخل رقم الهاتف' : 'Enter phone number'}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              textAlign={isRTL ? 'right' : 'left'}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleStep1Submit}
          disabled={isLoading}>
          <Text style={styles.submitButtonText}>
            {isLoading ? (isRTL ? 'جاري...' : 'Loading...') : isRTL ? 'التالي' : 'Next'}
          </Text>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={isLoading}>
          <Text style={[styles.backButtonText, isRTL && styles.backButtonTextRTL]}>
            {isRTL ? 'العودة' : 'Back'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderCountryModal()}
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      {/* Progress Indicator */}
      <View style={multiStepStyles.progressContainer}>
        <View style={[multiStepStyles.progressDot, multiStepStyles.progressDotActive]} />
        <View style={multiStepStyles.progressLine} />
        <View style={[multiStepStyles.progressDot, multiStepStyles.progressDotActive]} />
        <View style={multiStepStyles.progressLine} />
        <View style={multiStepStyles.progressDot} />
      </View>

      <Text style={[styles.title, isRTL && styles.titleRTL]}>
        {isRTL ? 'التحقق من البريد الإلكتروني' : 'Verify Email'}
      </Text>

      <Text style={[multiStepStyles.stepNumber, isRTL && multiStepStyles.stepNumberRTL]}>
        {isRTL ? 'الخطوة 2 من 3' : 'Step 2 of 3'}
      </Text>

      <View style={styles.formContainer}>
        <Text style={[multiStepStyles.description, isRTL && multiStepStyles.descriptionRTL]}>
          {isRTL
            ? `تم إرسال رمز مكون من 6 أرقام إلى\n${email}`
            : `A 6-digit code has been sent to\n${email}`}
        </Text>

        <View style={[multiStepStyles.otpContainer, isRTL && multiStepStyles.otpContainerRTL]}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { if (otpInputRefs.current) otpInputRefs.current[index] = ref; }}
              style={multiStepStyles.otpInput}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleOtpKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!isLoading}
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleVerifyEmail}
          disabled={isLoading}>
          <Text style={styles.submitButtonText}>
            {isLoading ? (isRTL ? 'جاري...' : 'Loading...') : isRTL ? 'التحقق' : 'Verify'}
          </Text>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setStep(1);
            setOtp(['', '', '', '', '', '']);
          }}
          disabled={isLoading}>
          <Text style={[styles.backButtonText, isRTL && styles.backButtonTextRTL]}>
            {isRTL ? 'رجوع' : 'Back'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      {/* Progress Indicator */}
      <View style={multiStepStyles.progressContainer}>
        <View style={[multiStepStyles.progressDot, multiStepStyles.progressDotActive]} />
        <View style={multiStepStyles.progressLine} />
        <View style={[multiStepStyles.progressDot, multiStepStyles.progressDotActive]} />
        <View style={multiStepStyles.progressLine} />
        <View style={[multiStepStyles.progressDot, multiStepStyles.progressDotActive]} />
      </View>

      <Text style={[styles.title, isRTL && styles.titleRTL]}>
        {isRTL ? 'إضافة عنوان' : 'Add Address'}
      </Text>

      <Text style={[multiStepStyles.stepNumber, isRTL && multiStepStyles.stepNumberRTL]}>
        {isRTL ? 'الخطوة 3 من 3: بيانات العنوان' : 'Step 3 of 3: Address Details'}
      </Text>

      <View style={styles.formContainer}>
        {/* Address Name */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, isRTL && styles.labelRTL]}>
            {isRTL ? 'اسم العنوان' : 'Address Name'}
          </Text>
          <TextInput
            style={[styles.input, isRTL && styles.inputRTL]}
            value={addressName}
            onChangeText={setAddressName}
            placeholder={isRTL ? 'مثلاً: المنزل، العمل' : 'e.g., Home, Work'}
            placeholderTextColor="#999"
            textAlign={isRTL ? 'right' : 'left'}
            editable={!isLoading}
          />
        </View>

        {/* Street */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, isRTL && styles.labelRTL]}>
            {isRTL ? 'الشارع' : 'Street'}
          </Text>
          <TextInput
            style={[styles.input, isRTL && styles.inputRTL]}
            value={street}
            onChangeText={setStreet}
            placeholder={isRTL ? 'أدخل الشارع' : 'Enter street name'}
            placeholderTextColor="#999"
            textAlign={isRTL ? 'right' : 'left'}
            editable={!isLoading}
          />
        </View>

        {/* House Number + Floor Number */}
        <View style={multiStepStyles.rowContainer}>
          <View style={multiStepStyles.halfInput}>
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {isRTL ? 'رقم المنزل' : 'House Number'}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              value={houseNumber}
              onChangeText={setHouseNumber}
              placeholder={isRTL ? 'رقم المنزل' : 'House number'}
              placeholderTextColor="#999"
              keyboardType="number-pad"
              textAlign={isRTL ? 'right' : 'left'}
              editable={!isLoading}
            />
          </View>

          <View style={multiStepStyles.halfInput}>
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {isRTL ? 'رقم الطابق' : 'Floor Number'}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              value={floorNumber}
              onChangeText={setFloorNumber}
              placeholder={isRTL ? 'رقم الطابق' : 'Floor number'}
              placeholderTextColor="#999"
              keyboardType="number-pad"
              textAlign={isRTL ? 'right' : 'left'}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* City */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, isRTL && styles.labelRTL]}>
            {isRTL ? 'المدينة' : 'City'}
          </Text>
          <TextInput
            style={[styles.input, isRTL && styles.inputRTL]}
            value={city}
            onChangeText={setCity}
            placeholder={isRTL ? 'أدخل المدينة' : 'Enter city name'}
            placeholderTextColor="#999"
            textAlign={isRTL ? 'right' : 'left'}
            editable={!isLoading}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleCompleteSignup}
          disabled={isLoading}>
          <Text style={styles.submitButtonText}>
            {isLoading ? (isRTL ? 'جاري...' : 'Loading...') : isRTL ? 'اكمل' : 'Complete Signup'}
          </Text>
        </TouchableOpacity>

        {/* Skip for Now Button */}
        <TouchableOpacity
          style={[styles.backButton]}
          onPress={handleSkipAddress}
          disabled={isLoading}>
          <Text style={[styles.backButtonText, isRTL && styles.backButtonTextRTL]}>
            {isRTL ? 'تخطي الآن' : 'Skip for Now'}
          </Text>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { marginTop: 8 }]}
          onPress={() => setStep(2)}
          disabled={isLoading}>
          <Text style={[styles.backButtonText, isRTL && styles.backButtonTextRTL]}>
            {isRTL ? 'رجوع' : 'Back'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}>
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </KeyboardAvoidingView>
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
  phoneContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  countryCodeInputContainer: {
    flex: 0.35,
  },
  countryCodeButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countryCodeButtonRTL: {
    flexDirection: 'row-reverse',
  },
  countryButtonFlag: {
    fontSize: 20,
    marginHorizontal: 8,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  countryCodeArrow: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  phoneInputContainer: {
    flex: 0.65,
  },
  phoneInputContainerRTL: {
    flex: 0.65,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'left',
  },
  modalTitleRTL: {
    textAlign: 'right',
  },
  modalCloseBtn: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  countryItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  countryItemSelected: {
    backgroundColor: '#E8F5F4',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginRight: 12,
    width: 50,
  },
  countryCodeSelected: {
    color: colors.primary,
  },
  countryName: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  countryNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
});

export default MultiStepSignup;
