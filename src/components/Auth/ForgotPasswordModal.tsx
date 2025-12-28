import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { CustomAlert } from '../CustomAlert/CustomAlert';
import { modalStyles } from '../EditProfile/modalStyles';
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
    }> = [{text: isRTL ? 'حسناً' : 'OK'}],
  ) => {
    setAlertConfig({visible: true, title, message, buttons});
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({...prev, visible: false}));
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

  const validatePassword = (password: string): { valid: boolean; message: string } => {
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
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        passwordValidation.message,
      );
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
          [{
            text: isRTL ? 'حسناً' : 'OK',
            onPress: handleClose,
          }],
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
      <View style={modalStyles.overlay}>
        <View style={modalStyles.modal}>
          {/* Header */}
          <View style={modalStyles.header}>
            <Text style={[modalStyles.title, isRTL && modalStyles.titleRTL]}>
              {isRTL ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
            </Text>
            <Text
              style={[modalStyles.subtitle, isRTL && modalStyles.subtitleRTL]}
            >
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
          <View style={modalStyles.form}>
            {step === 'email' ? (
              <>
                <View style={modalStyles.inputContainer}>
                  <Text
                    style={[modalStyles.label, isRTL && modalStyles.labelRTL]}
                  >
                    {isRTL ? 'البريد الإلكتروني' : 'Email'}
                  </Text>
                  <TextInput
                    style={[modalStyles.input, isRTL && modalStyles.inputRTL]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder={
                      isRTL ? 'أدخل بريدك الإلكتروني' : 'Enter your email'
                    }
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    editable={!isLoading}
                    autoCapitalize="none"
                  />
                  <Text
                    style={[modalStyles.hint, isRTL && modalStyles.hintRTL]}
                  >
                    {isRTL
                      ? 'استخدم البريد المسجل بحسابك'
                      : 'Use your registered email address'}
                  </Text>
                </View>
              </>
            ) : (
              <>
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
                    editable={!isLoading}
                  />
                  <Text
                    style={[modalStyles.hint, isRTL && modalStyles.hintRTL]}
                  >
                    {isRTL
                      ? 'تحقق من بريدك الإلكتروني للحصول على رمز مكون من 6 أرقام'
                      : 'Check your email for 6-digit code'}
                  </Text>
                </View>

                <View style={modalStyles.inputContainer}>
                  <Text
                    style={[modalStyles.label, isRTL && modalStyles.labelRTL]}
                  >
                    {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                  </Text>
                  <View style={modalStyles.passwordInputWrapper}>
                    <TextInput
                      style={[modalStyles.input, isRTL && modalStyles.inputRTL]}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder={
                        isRTL
                          ? 'أدخل كلمة المرور الجديدة'
                          : 'Enter new password'
                      }
                      placeholderTextColor="#999"
                      secureTextEntry={!showNewPassword}
                      editable={!isLoading}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={modalStyles.eyeButton}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      disabled={isLoading}
                    >
                      <Icon
                        name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={22}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={modalStyles.passwordRequirements}>
                    <Text style={[modalStyles.requirementsTitle, isRTL && modalStyles.requirementsTitleRTL]}>
                      {isRTL ? 'شروط كلمة المرور:' : 'Password Requirements:'}
                    </Text>
                    <View style={modalStyles.requirement}>
                      <Icon
                        name={newPassword.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={newPassword.length >= 8 ? '#10b981' : '#999'}
                      />
                      <Text style={[modalStyles.requirementText, isRTL && modalStyles.requirementTextRTL]}>
                        {isRTL ? '8 أحرف على الأقل' : 'At least 8 characters'}
                      </Text>
                    </View>
                    <View style={modalStyles.requirement}>
                      <Icon
                        name={/[A-Z]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={/[A-Z]/.test(newPassword) ? '#10b981' : '#999'}
                      />
                      <Text style={[modalStyles.requirementText, isRTL && modalStyles.requirementTextRTL]}>
                        {isRTL ? 'حرف كبير واحد على الأقل' : 'One uppercase letter'}
                      </Text>
                    </View>
                    <View style={modalStyles.requirement}>
                      <Icon
                        name={/[a-z]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={/[a-z]/.test(newPassword) ? '#10b981' : '#999'}
                      />
                      <Text style={[modalStyles.requirementText, isRTL && modalStyles.requirementTextRTL]}>
                        {isRTL ? 'حرف صغير واحد على الأقل' : 'One lowercase letter'}
                      </Text>
                    </View>
                    <View style={modalStyles.requirement}>
                      <Icon
                        name={/[0-9]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={/[0-9]/.test(newPassword) ? '#10b981' : '#999'}
                      />
                      <Text style={[modalStyles.requirementText, isRTL && modalStyles.requirementTextRTL]}>
                        {isRTL ? 'رقم واحد على الأقل' : 'One number'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={modalStyles.inputContainer}>
                  <Text
                    style={[modalStyles.label, isRTL && modalStyles.labelRTL]}
                  >
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
                      editable={!isLoading}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={modalStyles.eyeButton}
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={isLoading}
                    >
                      <Icon
                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={22}
                        color="#666"
                      />
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
              onPress={step === 'email' ? handleSendCode : handleResetPassword}
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

export default ForgotPasswordModal;
