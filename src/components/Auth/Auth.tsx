import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Linking,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';
import { styles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { login, User } from '../../services/api';
import { API_URL } from '../../config/api.config';
import VerifyEmail from '../../screens/VerifyEmail';
import ForgotPasswordModal from './ForgotPasswordModal';
import MultiStepSignup from './MultiStepSignup';
import { CustomAlert } from '../CustomAlert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthProps {
  onBack?: () => void;
  onNavigate?: (route: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onBack, onNavigate }) => {
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { login: saveLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showMultiStepSignup, setShowMultiStepSignup] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailActive, setEmailActive] = useState(false);
  const [passwordActive, setPasswordActive] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved credentials on mount if Remember Me was checked
  React.useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedRememberMe = await AsyncStorage.getItem(
          'rememberMe_checked',
        );
        if (savedRememberMe === 'true') {
          const savedEmail = await AsyncStorage.getItem('remembered_email');
          const savedPassword = await AsyncStorage.getItem(
            'remembered_password',
          );
          setRememberMe(true);
          if (savedEmail) setEmail(savedEmail);
          if (savedPassword) setPassword(savedPassword);
        }
      } catch (error) {
        console.error('Error loading remembered credentials:', error);
      }
    };
    loadCredentials();
  }, []);

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

  // Helper function to show custom alert
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

  // Handle navigation based on user role
  const handleRoleBasedNavigation = async (role: string) => {
    if (role === 'admin') {
      try {
        await Linking.openURL('http://localhost:5173/admin');
      } catch {
        showAlert(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'فشل فتح لوحة الإدارة' : 'Failed to open admin panel',
        );
      }
    } else if (onBack) {
      onBack();
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!email || !password) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL
          ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور'
          : 'Please enter email and password',
      );
      return;
    }

    setIsLoading(true);

    try {
      // Login
      try {
        const response = await login({ email, password });

        // Block admin and vendor from logging in via the app
        if (response.user.role === 'admin' || response.user.role === 'vendor') {
          showAlert(
            isRTL ? 'غير مسموح' : 'Access Denied',
            isRTL
              ? 'هذا الحساب مخصص للإدارة فقط. يرجى تسجيل الدخول عبر المتصفح.'
              : 'This account is for administration only. Please log in via the web browser.',
          );
          return;
        }

        // Store user data in AuthContext
        await saveLogin(response.user, response.token);

        // Save or clear credentials based on rememberMe checkbox
        try {
          if (rememberMe) {
            await AsyncStorage.setItem('rememberMe_checked', 'true');
            await AsyncStorage.setItem('remembered_email', email);
            await AsyncStorage.setItem('remembered_password', password);
          } else {
            await AsyncStorage.removeItem('rememberMe_checked');
            await AsyncStorage.removeItem('remembered_email');
            await AsyncStorage.removeItem('remembered_password');
          }
        } catch (storageErr) {
          console.error('Error saving remembered credentials:', storageErr);
        }

        // Navigate based on user role
        handleRoleBasedNavigation(response.user.role);
      } catch (err: any) {
        // If server requires email verification, show VerifyEmail screen
        if (err?.requiresVerification) {
          const userId = err.userId || '';
          setPendingUserId(userId);

          // Resend verification code automatically
          try {
            await fetch(`${API_URL}/auth/resend-verification`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId }),
            });
          } catch (resendError) {}
          // Show verification screen directly without alert
          setShowVerifyEmail(true);
          return;
        }
        throw err;
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

  const handleEmailVerified = async (token: string, user: User) => {
    await saveLogin(user, token);
    setShowVerifyEmail(false);
    setPendingUserId('');
    handleRoleBasedNavigation(user.role);
  };

  const handleSignupSuccess = async (token: string, user?: any) => {
    try {
      setShowMultiStepSignup(false);
      setEmail('');
      setPassword('');

      if (token && user) {
        await saveLogin(user, token);
        handleRoleBasedNavigation(user.role || 'customer');
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
    }
  };

  // Show MultiStepSignup if needed
  if (showMultiStepSignup) {
    return (
      <MultiStepSignup
        onBack={() => {
          setShowMultiStepSignup(false);
        }}
        onSignupSuccess={handleSignupSuccess}
        onNavigate={onNavigate}
      />
    );
  }

  // Show OTP verification screen if needed
  if (showVerifyEmail) {
    return (
      <VerifyEmail
        email={email}
        userId={pendingUserId}
        onVerified={handleEmailVerified}
        onBack={() => {
          setShowVerifyEmail(false);
          setPendingUserId('');
          setEmail('');
          setPassword('');
        }}
      />
    );
  }

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
      <ForgotPasswordModal
        visible={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
      <View style={{ flex: 1, backgroundColor: colors.primary }}>
        <View style={{ height: insets.top, backgroundColor: colors.primary }} />
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

          {/* Curved Wave Divider (Concave curve matching the sign-in mockup) */}
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
              <Text
                style={[styles.formHeading, isRTL && styles.formHeadingRTL]}
              >
                {isRTL ? 'تسجيل الدخول' : 'Sign in'}
              </Text>
              <View
                style={[
                  styles.formHeadingUnderline,
                  isRTL && styles.formHeadingUnderlineRTL,
                ]}
              />
            </View>

            {/* Email input field */}
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
                value={email}
                onChangeText={setEmail}
                placeholder={
                  isRTL ? 'أدخل بريدك الإلكتروني' : 'Enter your email'
                }
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setEmailActive(true)}
                onBlur={() => setEmailActive(false)}
              />
            </View>

            {/* Password input field */}
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
                value={password}
                onChangeText={setPassword}
                placeholder={isRTL ? 'أدخل كلمة المرور' : 'Enter your password'}
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                onFocus={() => setPasswordActive(true)}
                onBlur={() => setPasswordActive(false)}
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

            {/* Remember me & Forgot Password */}
            <View
              style={[
                styles.rememberContainer,
                isRTL && styles.rememberContainerRTL,
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.rememberCheckboxRow,
                  isRTL && styles.rememberCheckboxRowRTL,
                ]}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <Icon
                  name={rememberMe ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={rememberMe ? colors.primary : '#9CA3AF'}
                />
                <Text
                  style={[
                    styles.rememberText,
                    isRTL && styles.rememberTextRTL,
                    { marginLeft: isRTL ? 0 : 4, marginRight: isRTL ? 4 : 0 },
                  ]}
                >
                  {isRTL ? 'تذكرني' : 'Remember Me'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowForgotPasswordModal(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.forgotText, isRTL && styles.forgotTextRTL]}
                >
                  {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { borderRadius: 10, paddingVertical: 14, marginTop: 10 },
                isLoading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonTextNew}>
                {isLoading
                  ? isRTL
                    ? 'جاري التحميل...'
                    : 'Loading...'
                  : isRTL
                  ? 'تسجيل الدخول'
                  : 'Login'}
              </Text>
            </TouchableOpacity>

            {/* Footer toggle to Sign Up */}
            <View
              style={[
                styles.footerToggleContainer,
                isRTL && styles.footerToggleContainerRTL,
              ]}
            >
              <Text
                style={[
                  styles.footerToggleText,
                  isRTL && styles.footerToggleTextRTL,
                ]}
              >
                {isRTL ? 'ليس لديك حساب؟' : "Don't have an Account?"}
              </Text>
              <TouchableOpacity onPress={() => setShowMultiStepSignup(true)}>
                <Text
                  style={[
                    styles.footerToggleLink,
                    isRTL && styles.footerToggleLinkRTL,
                  ]}
                >
                  {isRTL ? 'سجل الآن' : 'Sign up'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Back to Browse */}
            {onBack && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.backButtonText,
                    isRTL && styles.backButtonTextRTL,
                    { color: colors.primary, fontWeight: '600' },
                  ]}
                >
                  {isRTL ? 'العودة إلى التصفح' : 'Back to Browse'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
};

export default Auth;
