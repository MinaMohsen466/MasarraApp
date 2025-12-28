import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { styles } from './styles';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { login, User } from '../../services/api';
import { API_URL } from '../../config/api.config';
import VerifyEmail from '../../screens/VerifyEmail';
import ForgotPasswordModal from './ForgotPasswordModal';
import MultiStepSignup from './MultiStepSignup';

interface AuthProps {
  onBack?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onBack }) => {
  const { isRTL } = useLanguage();
  const { login: saveLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showMultiStepSignup, setShowMultiStepSignup] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Handle navigation based on user role
  const handleRoleBasedNavigation = async (role: string) => {
    if (role === 'admin') {
      try {
        await Linking.openURL('http://localhost:5173/admin');
      } catch {
        Alert.alert(
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
      Alert.alert(
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
        // Store user data in AuthContext
        await saveLogin(response.user, response.token);
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
          } catch (resendError) {
          }
          // Show verification screen directly without alert
          setShowVerifyEmail(true);
          return;
        }
        throw err;
      }
    } catch (error) {
      Alert.alert(
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
      Alert.alert(
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
      <ForgotPasswordModal
        visible={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Title */}
        <Text style={[styles.title, isRTL && styles.titleRTL]}>
          {isRTL ? 'تسجيل الدخول' : 'Sign In'}
        </Text>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {isRTL ? 'البريد الإلكتروني' : 'Email'}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              value={email}
              onChangeText={setEmail}
              placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {isRTL ? 'كلمة المرور' : 'Password'}
            </Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                value={password}
                onChangeText={setPassword}
                placeholder={isRTL ? 'أدخل كلمة المرور' : 'Enter your password'}
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                textAlign={isRTL ? 'right' : 'left'}
              />
              <TouchableOpacity
                style={[styles.eyeButton, isRTL && styles.eyeButtonRTL]}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Icon
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => setShowForgotPasswordModal(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.forgotPasswordText,
                isRTL && styles.forgotPasswordTextRTL,
              ]}
            >
              {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {isLoading
                ? isRTL
                  ? 'جاري التحميل...'
                  : 'Loading...'
                : isRTL
                ? 'تسجيل الدخول'
                : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Toggle to Register */}
          <View
            style={[styles.toggleContainer, isRTL && styles.toggleContainerRTL]}
          >
            <Text style={[styles.toggleText, isRTL && styles.toggleTextRTL]}>
              {isRTL ? 'ليس لديك حساب؟' : "Don't have an account?"}
            </Text>
            <TouchableOpacity onPress={() => setShowMultiStepSignup(true)}>
              <Text style={[styles.toggleLink, isRTL && styles.toggleLinkRTL]}>
                {isRTL ? 'سجل الآن' : 'Register'}
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
                ]}
              >
                {isRTL ? 'العودة إلى التصفح' : 'Back to Browse'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </>
  );
};

export default Auth;
