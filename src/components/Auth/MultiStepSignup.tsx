import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { styles } from './styles';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors } from '../../constants/colors';
import { signup } from '../../services/api';
import { API_URL } from '../../config/api.config';

interface MultiStepSignupProps {
  onBack: () => void;
  onSignupSuccess: (token: string, user?: any) => void;
}

const MultiStepSignup: React.FC<MultiStepSignupProps> = ({ onBack, onSignupSuccess }) => {
  const { isRTL } = useLanguage();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('965');
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
        phone: `+${countryCode}${phone}`,
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
      const response = await fetch(`${API_URL}/addresses`, {
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
        phone: `+${countryCode}${phone}`,
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
              phone: `+${countryCode}${phone}`,
              role: 'customer' 
            });
          },
          style: 'destructive'
        }
      ]
    );
  };

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

        {/* Phone Number with Country Code */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, isRTL && styles.labelRTL]}>
            {isRTL ? 'رقم الهاتف' : 'Phone Number'}
          </Text>
          <View style={multiStepStyles.phoneInputWrapper}>
            <View style={multiStepStyles.phonePrefix}>
              <Text style={multiStepStyles.plusSign}>+</Text>
              <TextInput
                style={multiStepStyles.countryCodeInput}
                value={countryCode}
                onChangeText={setCountryCode}
                placeholder="965"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={4}
                editable={!isLoading}
              />
            </View>
            <TextInput
              ref={(ref) => { if (inputRefs.current) inputRefs.current[3] = ref; }}
              style={[multiStepStyles.phoneInput, isRTL && styles.inputRTL]}
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
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  phonePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
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
    width: 40,
    textAlign: 'center',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textDark,
    borderWidth: 0,
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
});

export default MultiStepSignup;
