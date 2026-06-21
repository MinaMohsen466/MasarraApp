import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { CustomAlert } from '../CustomAlert/CustomAlert';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  sendForgotPasswordCode,
  resetPasswordWithCode,
} from '../../utils/forgotPasswordUtils';

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
  const [emailActive, setEmailActive] = useState(false);
  const [codeActive, setCodeActive] = useState(false);
  const [passwordActive, setPasswordActive] = useState(false);
  const [confirmPasswordActive, setConfirmPasswordActive] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [] as Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>,
  });

  const showAlert = (
    title: string,
    message: string,
    buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }> = [{ text: isRTL ? 'حسناً' : 'OK' }],
  ) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const handleSendCode = async () => {
    if (!email) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email',
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email',
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendForgotPasswordCode(email);

      if (result.success && result.userId) {
        setUserId(result.userId);
        setStep('reset');
        showAlert(
          isRTL ? 'تم الإرسال' : 'Code Sent',
          isRTL
            ? 'تم إرسال كود إعادة التعيين إلى بريدك الإلكتروني'
            : 'Reset code has been sent to your email',
        );
      } else {
        showAlert(
          isRTL ? 'خطأ' : 'Error',
          result.error || (isRTL ? 'فشل إرسال الكود' : 'Failed to send code'),
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (
    password: string,
  ): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return {
        valid: false,
        message: isRTL
          ? 'يجب أن تكون كلمة المرور 8 أحرف على الأقل'
          : 'Password must be at least 8 characters',
      };
    }
    if (!/[A-Z]/.test(password)) {
      return {
        valid: false,
        message: isRTL
          ? 'يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل'
          : 'Password must contain at least one uppercase letter',
      };
    }
    if (!/[a-z]/.test(password)) {
      return {
        valid: false,
        message: isRTL
          ? 'يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل'
          : 'Password must contain at least one lowercase letter',
      };
    }
    if (!/[0-9]/.test(password)) {
      return {
        valid: false,
        message: isRTL
          ? 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل'
          : 'Password must contain at least one number',
      };
    }
    return { valid: true, message: '' };
  };

  const handleResetPassword = async () => {
    if (!resetCode || !newPassword || !confirmPassword) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'الرجاء ملء جميع الحقول' : 'Please fill all fields',
      );
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      showAlert(isRTL ? 'خطأ' : 'Error', passwordValidation.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match',
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPasswordWithCode(
        userId,
        resetCode,
        newPassword,
      );

      if (result.success) {
        showAlert(
          isRTL ? 'نجح' : 'Success',
          isRTL
            ? 'تم إعادة تعيين كلمة المرور بنجاح'
            : 'Password reset successfully',
          [
            {
              text: isRTL ? 'حسناً' : 'OK',
              onPress: handleClose,
            },
          ],
        );
      } else {
        showAlert(
          isRTL ? 'خطأ' : 'Error',
          result.error ||
            (isRTL
              ? 'فشل إعادة تعيين كلمة المرور'
              : 'Failed to reset password'),
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
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, isRTL && styles.titleRTL]}>
                {isRTL ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
              </Text>
              <View
                style={[
                  styles.titleUnderline,
                  isRTL && styles.titleUnderlineRTL,
                ]}
              />
            </View>
            <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
              {step === 'email'
                ? isRTL
                  ? 'أدخل بريدك الإلكتروني لتلقي الكود'
                  : 'Enter your email to receive reset code'
                : isRTL
                ? 'أدخل الكود وكلمة المرور الجديدة'
                : 'Enter code and new password'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {step === 'email' ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, isRTL && styles.labelRTL]}>
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
                      editable={!isLoading}
                      autoCapitalize="none"
                      onFocus={() => setEmailActive(true)}
                      onBlur={() => setEmailActive(false)}
                    />
                  </View>
                  <Text style={[styles.hint, isRTL && styles.hintRTL]}>
                    {isRTL
                      ? 'استخدم البريد المسجل بحسابك'
                      : 'Use your registered email address'}
                  </Text>
                </View>
              </>
            ) : (
              <>
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
                      editable={!isLoading}
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

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, isRTL && styles.labelRTL]}>
                    {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
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
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder={
                        isRTL
                          ? 'أدخل كلمة المرور الجديدة'
                          : 'Enter new password'
                      }
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showNewPassword}
                      editable={!isLoading}
                      autoCapitalize="none"
                      onFocus={() => setPasswordActive(true)}
                      onBlur={() => setPasswordActive(false)}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      disabled={isLoading}
                    >
                      <Icon
                        name={
                          showNewPassword ? 'eye-outline' : 'eye-off-outline'
                        }
                        size={18}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.passwordRequirements}>
                    <Text
                      style={[
                        styles.requirementsTitle,
                        isRTL && styles.requirementsTitleRTL,
                      ]}
                    >
                      {isRTL ? 'شروط كلمة المرور:' : 'Password Requirements:'}
                    </Text>
                    <View
                      style={[
                        styles.requirement,
                        isRTL && styles.requirementRTL,
                      ]}
                    >
                      <Icon
                        name={
                          newPassword.length >= 8
                            ? 'checkmark-circle'
                            : 'ellipse-outline'
                        }
                        size={14}
                        color={newPassword.length >= 8 ? '#10b981' : '#9CA3AF'}
                      />
                      <Text
                        style={[
                          styles.requirementText,
                          isRTL && styles.requirementTextRTL,
                        ]}
                      >
                        {isRTL ? '8 أحرف على الأقل' : 'At least 8 characters'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.requirement,
                        isRTL && styles.requirementRTL,
                      ]}
                    >
                      <Icon
                        name={
                          /[A-Z]/.test(newPassword)
                            ? 'checkmark-circle'
                            : 'ellipse-outline'
                        }
                        size={14}
                        color={
                          /[A-Z]/.test(newPassword) ? '#10b981' : '#9CA3AF'
                        }
                      />
                      <Text
                        style={[
                          styles.requirementText,
                          isRTL && styles.requirementTextRTL,
                        ]}
                      >
                        {isRTL
                          ? 'حرف كبير واحد على الأقل'
                          : 'One uppercase letter'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.requirement,
                        isRTL && styles.requirementRTL,
                      ]}
                    >
                      <Icon
                        name={
                          /[a-z]/.test(newPassword)
                            ? 'checkmark-circle'
                            : 'ellipse-outline'
                        }
                        size={14}
                        color={
                          /[a-z]/.test(newPassword) ? '#10b981' : '#9CA3AF'
                        }
                      />
                      <Text
                        style={[
                          styles.requirementText,
                          isRTL && styles.requirementTextRTL,
                        ]}
                      >
                        {isRTL
                          ? 'حرف صغير واحد على الأقل'
                          : 'One lowercase letter'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.requirement,
                        isRTL && styles.requirementRTL,
                      ]}
                    >
                      <Icon
                        name={
                          /[0-9]/.test(newPassword)
                            ? 'checkmark-circle'
                            : 'ellipse-outline'
                        }
                        size={14}
                        color={
                          /[0-9]/.test(newPassword) ? '#10b981' : '#9CA3AF'
                        }
                      />
                      <Text
                        style={[
                          styles.requirementText,
                          isRTL && styles.requirementTextRTL,
                        ]}
                      >
                        {isRTL ? 'رقم واحد على الأقل' : 'One number'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, isRTL && styles.labelRTL]}>
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
                      editable={!isLoading}
                      autoCapitalize="none"
                      onFocus={() => setConfirmPasswordActive(true)}
                      onBlur={() => setConfirmPasswordActive(false)}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={isLoading}
                    >
                      <Icon
                        name={
                          showConfirmPassword
                            ? 'eye-outline'
                            : 'eye-off-outline'
                        }
                        size={18}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
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
              onPress={step === 'email' ? handleSendCode : handleResetPassword}
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
                  {step === 'email'
                    ? isRTL
                      ? 'إرسال الكود'
                      : 'Send Code'
                    : isRTL
                    ? 'إعادة تعيين كلمة المرور'
                    : 'Reset Password'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
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
  passwordRequirements: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  requirementsTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  requirementsTitleRTL: {
    fontFamily: 'System',
    textAlign: 'right',
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  requirementRTL: {
    flexDirection: 'row-reverse',
  },
  requirementText: {
    fontSize: 11.5,
    color: '#6B7280',
  },
  requirementTextRTL: {
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
    borderRadius: 10,
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

export default ForgotPasswordModal;
