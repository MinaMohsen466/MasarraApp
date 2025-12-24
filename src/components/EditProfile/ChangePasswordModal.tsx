import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { modalStyles } from './modalStyles';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config/api.config';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onChangePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
  onChangePassword,
}) => {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const [mode, setMode] = useState<'normal' | 'forgot'>('normal'); // normal = with old password, forgot = OTP flow
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [userId, setUserId] = useState<string>(''); // Store userId from forgot-password response

  const handleForgotPassword = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user?.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset code');
      }

      // Save userId from response
      if (data.userId) {
        setUserId(data.userId);
      }

      setOtpSent(true);
      setMode('forgot');
      Alert.alert(
        isRTL ? 'تم الإرسال' : 'Code Sent',
        isRTL
          ? 'تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
          : 'A password reset code has been sent to your email',
      );
    } catch (error) {
      console.error('Error sending reset code:', error);
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        error instanceof Error
          ? error.message
          : isRTL
          ? 'فشل إرسال الرمز'
          : 'Failed to send reset code',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitWithOTP = async () => {
    // Validation for OTP mode
    if (!resetCode || !newPassword || !confirmPassword) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'الرجاء ملء جميع الحقول' : 'Please fill all fields',
      );
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL
          ? 'يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل'
          : 'New password must be at least 6 characters',
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL
          ? 'كلمات المرور الجديدة غير متطابقة'
          : 'New passwords do not match',
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId, // Use userId instead of email
          resetCode: resetCode,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      Alert.alert(
        isRTL ? 'نجح' : 'Success',
        isRTL ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully',
      );
      handleClose();
    } catch (error: any) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        error.message ||
          (isRTL ? 'فشل تغيير كلمة المرور' : 'Failed to change password'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    // If in forgot mode with OTP, use different handler
    if (mode === 'forgot' && otpSent) {
      return handleSubmitWithOTP();
    }

    // Normal mode validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'الرجاء ملء جميع الحقول' : 'Please fill all fields',
      );
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL
          ? 'يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل'
          : 'New password must be at least 6 characters',
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL
          ? 'كلمات المرور الجديدة غير متطابقة'
          : 'New passwords do not match',
      );
      return;
    }

    setIsLoading(true);
    try {
      await onChangePassword(currentPassword, newPassword);
      Alert.alert(
        isRTL ? 'نجح' : 'Success',
        isRTL ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully',
      );
      handleClose();
    } catch (error: any) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        error.message ||
          (isRTL ? 'فشل تغيير كلمة المرور' : 'Failed to change password'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setResetCode('');
    setUserId('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setMode('normal');
    setOtpSent(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.modal}>
          {/* Header */}
          <View style={modalStyles.header}>
            <Text style={[modalStyles.title, isRTL && modalStyles.titleRTL]}>
              {isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
            </Text>
            <Text
              style={[modalStyles.subtitle, isRTL && modalStyles.subtitleRTL]}
            >
              {isRTL
                ? 'الرجاء إدخال كلمة المرور الحالية والجديدة'
                : 'Please enter your current and new password'}
            </Text>
          </View>

          {/* Form */}
          <View style={modalStyles.form}>
            {/* Current Password - Only show in normal mode */}
            {mode === 'normal' && (
              <View style={modalStyles.inputContainer}>
                <Text
                  style={[modalStyles.label, isRTL && modalStyles.labelRTL]}
                >
                  {isRTL ? 'كلمة المرور الحالية' : 'Current Password'}
                </Text>
                <View style={modalStyles.passwordInputWrapper}>
                  <TextInput
                    style={[modalStyles.input, isRTL && modalStyles.inputRTL]}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder={
                      isRTL
                        ? 'أدخل كلمة المرور الحالية'
                        : 'Enter current password'
                    }
                    placeholderTextColor="#999"
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={[
                      modalStyles.eyeButton,
                      isRTL && modalStyles.eyeButtonRTL,
                    ]}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <Text style={modalStyles.eyeIcon}>
                      {showCurrentPassword ? '○' : '●'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {/* Forgot Password Link */}
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  disabled={isLoading}
                  style={{ marginTop: 8 }}
                >
                  <Text
                    style={[
                      modalStyles.forgotPasswordLink,
                      isRTL && modalStyles.forgotPasswordLinkRTL,
                    ]}
                  >
                    {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Reset Code - Only show in forgot mode after OTP sent */}
            {mode === 'forgot' && otpSent && (
              <View style={modalStyles.inputContainer}>
                <Text
                  style={[modalStyles.label, isRTL && modalStyles.labelRTL]}
                >
                  {isRTL ? 'رمز إعادة التعيين' : 'Reset Code'}
                </Text>
                <TextInput
                  style={[modalStyles.input, isRTL && modalStyles.inputRTL]}
                  value={resetCode}
                  onChangeText={setResetCode}
                  placeholder={
                    isRTL
                      ? 'أدخل الرمز المرسل للإيميل'
                      : 'Enter code sent to email'
                  }
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Text style={[modalStyles.hint, isRTL && modalStyles.hintRTL]}>
                  {isRTL
                    ? 'تحقق من بريدك الإلكتروني للحصول على رمز مكون من 6 أرقام'
                    : 'Check your email for 6-digit code'}
                </Text>
              </View>
            )}

            {/* New Password */}
            <View style={modalStyles.inputContainer}>
              <Text style={[modalStyles.label, isRTL && modalStyles.labelRTL]}>
                {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
              </Text>
              <View style={modalStyles.passwordInputWrapper}>
                <TextInput
                  style={[modalStyles.input, isRTL && modalStyles.inputRTL]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder={
                    isRTL ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'
                  }
                  placeholderTextColor="#999"
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[
                    modalStyles.eyeButton,
                    isRTL && modalStyles.eyeButtonRTL,
                  ]}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Text style={modalStyles.eyeIcon}>
                    {showNewPassword ? '○' : '●'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={[modalStyles.hint, isRTL && modalStyles.hintRTL]}>
                {isRTL
                  ? 'يجب أن تكون 6 أحرف على الأقل'
                  : 'Must be at least 6 characters'}
              </Text>
            </View>

            {/* Confirm Password */}
            <View style={modalStyles.inputContainer}>
              <Text style={[modalStyles.label, isRTL && modalStyles.labelRTL]}>
                {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </Text>
              <View style={modalStyles.passwordInputWrapper}>
                <TextInput
                  style={[modalStyles.input, isRTL && modalStyles.inputRTL]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={
                    isRTL
                      ? 'أعد إدخال كلمة المرور الجديدة'
                      : 'Re-enter new password'
                  }
                  placeholderTextColor="#999"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[
                    modalStyles.eyeButton,
                    isRTL && modalStyles.eyeButtonRTL,
                  ]}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={modalStyles.eyeIcon}>
                    {showConfirmPassword ? '○' : '●'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={modalStyles.buttons}>
            <TouchableOpacity
              style={[modalStyles.button, modalStyles.cancelButton]}
              onPress={handleClose}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  modalStyles.cancelButtonText,
                  isRTL && modalStyles.cancelButtonTextRTL,
                ]}
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.button, modalStyles.submitButton]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    modalStyles.submitButtonText,
                    isRTL && modalStyles.submitButtonTextRTL,
                  ]}
                >
                  {isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ChangePasswordModal;
