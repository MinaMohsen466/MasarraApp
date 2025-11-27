import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, Linking } from 'react-native';
import { styles } from './styles';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { getImageUrl, login, signup, User } from '../../services/api';
import VerifyEmail from '../../screens/VerifyEmail';
import ForgotPasswordModal from './ForgotPasswordModal';

interface AuthProps {
  onBack?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onBack }) => {
  const { isRTL } = useLanguage();
  const { login: saveLogin } = useAuth();
  const { data: siteSettings } = useSiteSettings();
  const [isSignIn, setIsSignIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // OTP verification state
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string>('');

  // Handle navigation based on user role
  const handleRoleBasedNavigation = async (role: string) => {
    if (role === 'admin') {
      const adminUrl = 'http://localhost:5173/admin';
      try {
        console.log('🌐 Opening admin panel:', adminUrl);
        await Linking.openURL(adminUrl);
        console.log('✅ Successfully opened admin panel');
      } catch (error) {
        console.error('❌ Error opening admin panel:', error);
        Alert.alert(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'فشل فتح لوحة الإدارة. تأكد من تشغيل لوحة الإدارة على المنفذ 5173' : 'Failed to open admin panel. Make sure admin panel is running on port 5173'
        );
      }
    } else if (role === 'vendor') {
      // TODO: Navigate to vendor dashboard (could be browser or in-app)
      console.log('📊 Navigate to vendor dashboard');
      // For now, staying in app - you can implement vendor dashboard navigation here
    } else if (role === 'customer') {
      // Customer stays in the app - return to home
      console.log('🏠 Customer logged in - returning to home');
      // Close auth screen and return to home
      if (onBack) {
        onBack();
      }
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!email || !password) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password'
      );
      return;
    }

    if (!isSignIn && !name) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال الاسم' : 'Please enter your name'
      );
      return;
    }

    setIsLoading(true);
    
    try {
      if (isSignIn) {
        // Login
        try {
          const response = await login({ email, password });
          console.log('Logged in user:', response.user);
          console.log('Token:', response.token);
          // Store user data in AuthContext
          await saveLogin(response.user, response.token);
          // Navigate based on user role
          handleRoleBasedNavigation(response.user.role);
        } catch (err: any) {
          // If server requires email verification, show VerifyEmail screen
          if (err?.requiresVerification) {
            // Show verification screen without extra alert
            setPendingUserId(err.userId || '');
            setShowVerifyEmail(true);
            return;
          }
          throw err;
        }
      } else {
        // Signup
        const response = await signup({ 
          name, 
          email, 
          password, 
          phone: phone || undefined,
          role: 'customer' // Default role for signup
        });
        
        console.log('Signup response:', response);
        
        // Show OTP verification screen
        if (response.userId && response.requiresVerification) {
          setPendingUserId(response.userId);
          setShowVerifyEmail(true);
        } else {
          // Fallback if server doesn't require verification
          Alert.alert(
            isRTL ? 'نجح إنشاء الحساب' : 'Account Created',
            isRTL ? 'تم إنشاء حسابك بنجاح' : 'Your account has been created successfully'
          );
        }
      }
    } catch (error) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        error instanceof Error ? error.message : (isRTL ? 'حدث خطأ ما' : 'Something went wrong')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailVerified = async (token: string, user: User) => {
    // After email is verified, log the user in
    await saveLogin(user, token);
    setShowVerifyEmail(false);
    setPendingUserId('');
    
    // Navigate based on user role
    handleRoleBasedNavigation(user.role);
  };

  const handleBackFromVerify = () => {
    setShowVerifyEmail(false);
    setPendingUserId('');
    // Reset form
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
  };

  // Show OTP verification screen if needed
  if (showVerifyEmail) {
    return (
      <VerifyEmail
        email={email}
        userId={pendingUserId}
        onVerified={handleEmailVerified}
        onBack={handleBackFromVerify}
      />
    );
  }

  return (
    <>
      <ForgotPasswordModal
        visible={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      {/* Title */}
      <Text style={[styles.title, isRTL && styles.titleRTL]}>
        {isSignIn 
          ? (isRTL ? 'تسجيل الدخول' : 'Sign In')
          : (isRTL ? 'إنشاء حساب' : 'Create Account')}
      </Text>

      {/* Form */}
      <View style={styles.formContainer}>
        {!isSignIn && (
          <View style={styles.inputContainer}>
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {isRTL ? 'الاسم الكامل' : 'Full Name'}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              value={name}
              onChangeText={setName}
              placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name'}
              placeholderTextColor="#999"
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>
        )}

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

        {!isSignIn && (
          <View style={styles.inputContainer}>
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {isRTL ? 'رقم الهاتف' : 'Phone Number'}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              value={phone}
              onChangeText={setPhone}
              placeholder={isRTL ? 'أدخل رقم هاتفك' : 'Enter your phone number'}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>
        )}

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
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}>
              <Text style={styles.eyeIcon}>{showPassword ? '👁' : '👁‍🗨'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot Password Link - Only show on Sign In */}
        {isSignIn && (
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => setShowForgotPasswordModal(true)}
            activeOpacity={0.7}>
            <Text style={[styles.forgotPasswordText, isRTL && styles.forgotPasswordTextRTL]}>
              {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}>
          <Text style={styles.submitButtonText}>
            {isLoading 
              ? (isRTL ? 'جاري التحميل...' : 'Loading...')
              : isSignIn 
                ? (isRTL ? 'تسجيل الدخول' : 'Sign In')
                : (isRTL ? 'إنشاء حساب' : 'Create Account')}
          </Text>
        </TouchableOpacity>

        {/* Toggle Sign In/Register */}
        <View style={[styles.toggleContainer, isRTL && styles.toggleContainerRTL]}>
          <Text style={[styles.toggleText, isRTL && styles.toggleTextRTL]}>
            {isSignIn 
              ? (isRTL ? 'ليس لديك حساب؟' : "Don't have an account?")
              : (isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?')}
          </Text>
          <TouchableOpacity onPress={() => setIsSignIn(!isSignIn)}>
            <Text style={[styles.toggleLink, isRTL && styles.toggleLinkRTL]}>
              {isSignIn 
                ? (isRTL ? 'سجل الآن' : 'Register')
                : (isRTL ? 'سجل الدخول' : 'Sign In')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Back to Browse */}
        {onBack && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}>
            <Text style={[styles.backButtonText, isRTL && styles.backButtonTextRTL]}>
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
