import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { modalStyles } from '../EditProfile/modalStyles';
import { useLanguage } from '../../contexts/LanguageContext';
import { sendForgotPasswordCode, resetPasswordWithCode } from '../../utils/forgotPasswordUtils';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
}) => {
  const { isRTL } = useLanguage();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email'
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email'
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendForgotPasswordCode(email);

      if (result.success && result.userId) {
        setUserId(result.userId);
        setStep('reset');
        Alert.alert(
          isRTL ? 'تم الإرسال' : 'Code Sent',
          isRTL
            ? 'تم إرسال كود إعادة التعيين إلى بريدك الإلكتروني'
            : 'Reset code has been sent to your email'
        );
      } else {
        Alert.alert(
          isRTL ? 'خطأ' : 'Error',
          result.error || (isRTL ? 'فشل إرسال الكود' : 'Failed to send code')
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode || !newPassword || !confirmPassword) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'الرجاء ملء جميع الحقول' : 'Please fill all fields'
      );
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' : 'Password must be at least 6 characters'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPasswordWithCode(userId, resetCode, newPassword);

      if (result.success) {
        Alert.alert(
          isRTL ? 'نجح' : 'Success',
          isRTL ? 'تم إعادة تعيين كلمة المرور بنجاح' : 'Password reset successfully'
        );
        handleClose();
      } else {
        Alert.alert(
          isRTL ? 'خطأ' : 'Error',
          result.error || (isRTL ? 'فشل إعادة تعيين كلمة المرور' : 'Failed to reset password')
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setResetCode('');
    setUserId('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setStep('email');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.modal}>
          {/* Header */}
          <View style={modalStyles.header}>
            <View style={modalStyles.headerIcon}>
              <Text style={modalStyles.headerIconText}>🔓</Text>
            </View>
            <Text style={[modalStyles.title, isRTL && modalStyles.titleRTL]}>
              {isRTL ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
            </Text>
            <Text style={[modalStyles.subtitle, isRTL && modalStyles.subtitleRTL]}>
              {step === 'email'
                ? (isRTL ? 'أدخل بريدك الإلكتروني لتلقي الكود' : 'Enter your email to receive reset code')
                : (isRTL ? 'أدخل الكود وكلمة المرور الجديدة' : 'Enter code and new password')}
            </Text>
          </View>

          {/* Form */}
          <View style={modalStyles.form}>
            {step === 'email' ? (
              <>
                <View style={modalStyles.inputContainer}>
                  <Text style={[modalStyles.label, isRTL && modalStyles.labelRTL]}>
                    {isRTL ? 'البريد الإلكتروني' : 'Email'}
                  </Text>
                  <TextInput
                    style={[modalStyles.input, isRTL && modalStyles.inputRTL]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    editable={!isLoading}
                    autoCapitalize="none"
                  />
                  <Text style={[modalStyles.hint, isRTL && modalStyles.hintRTL]}>
                    {isRTL ? 'استخدم البريد المسجل بحسابك' : 'Use your registered email address'}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={modalStyles.inputContainer}>
                  <Text style={[modalStyles.label, isRTL && modalStyles.labelRTL]}>
                    {isRTL ? 'رمز إعادة التعيين' : 'Reset Code'}
                  </Text>
                  <TextInput
                    style={[modalStyles.input, isRTL && modalStyles.inputRTL]}
                    value={resetCode}
                    onChangeText={setResetCode}
                    placeholder={isRTL ? 'أدخل الرمز المرسل للإيميل' : 'Enter code sent to email'}
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!isLoading}
                  />
                  <Text style={[modalStyles.hint, isRTL && modalStyles.hintRTL]}>
                    {isRTL ? 'تحقق من بريدك الإلكتروني للحصول على رمز مكون من 6 أرقام' : 'Check your email for 6-digit code'}
                  </Text>
                </View>

                <View style={modalStyles.inputContainer}>
                  <Text style={[modalStyles.label, isRTL && modalStyles.labelRTL]}>
                    {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                  </Text>
                  <View style={modalStyles.passwordInputWrapper}>
                    <TextInput
                      style={[modalStyles.input, isRTL && modalStyles.inputRTL]}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder={isRTL ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
                      placeholderTextColor="#999"
                      secureTextEntry={!showNewPassword}
                      editable={!isLoading}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={modalStyles.eyeButton}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      disabled={isLoading}>
                      <Text style={modalStyles.eyeIcon}>{showNewPassword ? '👁' : '👁‍🗨'}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[modalStyles.hint, isRTL && modalStyles.hintRTL]}>
                    {isRTL ? 'يجب أن تكون 6 أحرف على الأقل' : 'Must be at least 6 characters'}
                  </Text>
                </View>

                <View style={modalStyles.inputContainer}>
                  <Text style={[modalStyles.label, isRTL && modalStyles.labelRTL]}>
                    {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  </Text>
                  <View style={modalStyles.passwordInputWrapper}>
                    <TextInput
                      style={[modalStyles.input, isRTL && modalStyles.inputRTL]}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder={isRTL ? 'أعد إدخال كلمة المرور الجديدة' : 'Re-enter new password'}
                      placeholderTextColor="#999"
                      secureTextEntry={!showConfirmPassword}
                      editable={!isLoading}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={modalStyles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}>
                      <Text style={modalStyles.eyeIcon}>{showConfirmPassword ? '👁' : '👁‍🗨'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Buttons */}
          <View style={modalStyles.buttons}>
            <TouchableOpacity
              style={[modalStyles.button, modalStyles.cancelButton]}
              onPress={handleClose}
              disabled={isLoading}
              activeOpacity={0.7}>
              <Text style={[modalStyles.cancelButtonText, isRTL && modalStyles.cancelButtonTextRTL]}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.button, modalStyles.submitButton]}
              onPress={step === 'email' ? handleSendCode : handleResetPassword}
              disabled={isLoading}
              activeOpacity={0.7}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[modalStyles.submitButtonText, isRTL && modalStyles.submitButtonTextRTL]}>
                  {step === 'email'
                    ? (isRTL ? 'إرسال الكود' : 'Send Code')
                    : (isRTL ? 'إعادة تعيين كلمة المرور' : 'Reset Password')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ForgotPasswordModal;
