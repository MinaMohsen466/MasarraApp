import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../constants/colors';
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
  const [currentActive, setCurrentActive] = useState(false);
  const [newActive, setNewActive] = useState(false);
  const [confirmActive, setConfirmActive] = useState(false);
  const [codeActive, setCodeActive] = useState(false);

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
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, isRTL && styles.titleRTL]}>
                {isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
              </Text>
              <View
                style={[
                  styles.titleUnderline,
                  isRTL && styles.titleUnderlineRTL,
                ]}
              />
            </View>
            <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
              {isRTL
                ? 'الرجاء إدخال كلمة المرور الحالية والجديدة'
                : 'Please enter your current and new password'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Current Password - Only show in normal mode */}
            {mode === 'normal' && (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, isRTL && styles.labelRTL]}>
                  {isRTL ? 'كلمة المرور الحالية' : 'Current Password'}
                </Text>
                <View
                  style={[
                    styles.sleekInputWrapper,
                    isRTL && styles.sleekInputWrapperRTL,
                    currentActive && styles.sleekInputWrapperActive,
                  ]}
                >
                  <Icon
                    name="lock-open-outline"
                    size={18}
                    color={currentActive ? colors.primary : '#9CA3AF'}
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
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder={
                      isRTL
                        ? 'أدخل كلمة المرور الحالية'
                        : 'Enter current password'
                    }
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                    onFocus={() => setCurrentActive(true)}
                    onBlur={() => setCurrentActive(false)}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <Icon
                      name={
                        showCurrentPassword ? 'eye-outline' : 'eye-off-outline'
                      }
                      size={18}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
                {/* Forgot Password Link */}
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  disabled={isLoading}
                  style={{ marginTop: 4 }}
                >
                  <Text
                    style={[
                      styles.forgotPasswordLink,
                      isRTL && styles.forgotPasswordLinkRTL,
                    ]}
                  >
                    {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Reset Code - Only show in forgot mode after OTP sent */}
            {mode === 'forgot' && otpSent && (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, isRTL && styles.labelRTL]}>
                  {isRTL ? 'رمز إعادة التعيين' : 'Reset Code'}
                </Text>
                <View
                  style={[
                    styles.sleekInputWrapper,
                    isRTL && styles.sleekInputWrapperRTL,
                    codeActive && styles.sleekInputWrapperActive,
                  ]}
                >
                  <Icon
                    name="key-outline"
                    size={18}
                    color={codeActive ? colors.primary : '#9CA3AF'}
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
                    value={resetCode}
                    onChangeText={setResetCode}
                    placeholder={
                      isRTL
                        ? 'أدخل الرمز المرسل للإيميل'
                        : 'Enter code sent to email'
                    }
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    onFocus={() => setCodeActive(true)}
                    onBlur={() => setCodeActive(false)}
                  />
                </View>
                <Text style={[styles.hint, isRTL && styles.hintRTL]}>
                  {isRTL
                    ? 'تحقق من بريدك الإلكتروني للحصول على رمز مكون من 6 أرقام'
                    : 'Check your email for 6-digit code'}
                </Text>
              </View>
            )}

            {/* New Password */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isRTL && styles.labelRTL]}>
                {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
              </Text>
              <View
                style={[
                  styles.sleekInputWrapper,
                  isRTL && styles.sleekInputWrapperRTL,
                  newActive && styles.sleekInputWrapperActive,
                ]}
              >
                <Icon
                  name="lock-closed-outline"
                  size={18}
                  color={newActive ? colors.primary : '#9CA3AF'}
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
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder={
                    isRTL ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'
                  }
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  onFocus={() => setNewActive(true)}
                  onBlur={() => setNewActive(false)}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Icon
                    name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
              <Text style={[styles.hint, isRTL && styles.hintRTL]}>
                {isRTL
                  ? 'يجب أن تكون 6 أحرف على الأقل'
                  : 'Must be at least 6 characters'}
              </Text>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isRTL && styles.labelRTL]}>
                {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </Text>
              <View
                style={[
                  styles.sleekInputWrapper,
                  isRTL && styles.sleekInputWrapperRTL,
                  confirmActive && styles.sleekInputWrapperActive,
                ]}
              >
                <Icon
                  name="lock-closed-outline"
                  size={18}
                  color={confirmActive ? colors.primary : '#9CA3AF'}
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
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={
                    isRTL
                      ? 'أعد إدخال كلمة المرور الجديدة'
                      : 'Re-enter new password'
                  }
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  onFocus={() => setConfirmActive(true)}
                  onBlur={() => setConfirmActive(false)}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon
                    name={
                      showConfirmPassword ? 'eye-outline' : 'eye-off-outline'
                    }
                    size={18}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={[styles.buttons, isRTL && styles.buttonsRTL]}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  isRTL && styles.cancelButtonTextRTL,
                ]}
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.submitButtonText,
                    isRTL && styles.submitButtonTextRTL,
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  titleRTL: {
    fontFamily: 'System',
  },
  titleUnderline: {
    width: 32,
    height: 2.5,
    backgroundColor: colors.primary,
    marginTop: 6,
    borderRadius: 1.5,
  },
  titleUnderlineRTL: {
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    paddingHorizontal: 10,
  },
  subtitleRTL: {
    fontFamily: 'System',
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  labelRTL: {
    textAlign: 'right',
    fontFamily: 'System',
  },
  sleekInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 4,
    width: '100%',
  },
  sleekInputWrapperRTL: {
    flexDirection: 'row-reverse',
  },
  sleekInputWrapperActive: {
    borderBottomColor: colors.primary,
  },
  sleekInputIcon: {
    marginRight: 8,
  },
  sleekInputIconRTL: {
    marginRight: 0,
    marginLeft: 8,
  },
  sleekInputDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginRight: 10,
  },
  sleekInputDividerRTL: {
    marginRight: 0,
    marginLeft: 10,
  },
  sleekTextInput: {
    flex: 1,
    fontSize: 14.5,
    color: colors.textDark,
    paddingVertical: 6,
    textAlign: 'left',
  },
  sleekTextInputRTL: {
    textAlign: 'right',
  },
  hint: {
    fontSize: 11.5,
    color: '#9CA3AF',
    marginTop: 6,
  },
  hintRTL: {
    fontFamily: 'System',
    textAlign: 'right',
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  eyeButton: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  forgotPasswordLink: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'left',
  },
  forgotPasswordLinkRTL: {
    textAlign: 'right',
    fontFamily: 'System',
  },
  buttons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 12,
    gap: 12,
  },
  buttonsRTL: {
    flexDirection: 'row-reverse',
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  cancelButtonTextRTL: {
    fontFamily: 'System',
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButtonTextRTL: {
    fontFamily: 'System',
  },
});

export default ChangePasswordModal;
