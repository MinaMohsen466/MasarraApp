import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';

interface PasswordPromptModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}

const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  const { isRTL } = useLanguage();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordActive, setPasswordActive] = useState(false);

  const handleConfirm = () => {
    if (password.trim() === '') {
      return;
    }
    onConfirm(password);
    setPassword('');
  };

  const handleCancel = () => {
    setPassword('');
    setShowPassword(false);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Warning Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Icon
                name="alert-circle-outline"
                size={32}
                color={colors.error}
              />
            </View>
            <Text style={[styles.title, isRTL && styles.titleRTL]}>{title}</Text>
            <View style={[styles.titleUnderline, isRTL && styles.titleUnderlineRTL]} />
            <Text style={[styles.message, isRTL && styles.messageRTL]}>
              {message}
            </Text>
          </View>

          {/* Form Area */}
          <View style={styles.form}>
            <View style={[styles.sleekInputWrapper, isRTL && styles.sleekInputWrapperRTL, passwordActive && styles.sleekInputWrapperActive]}>
              <Icon
                name="lock-closed-outline"
                size={18}
                color={passwordActive ? colors.error : '#9CA3AF'}
                style={[styles.sleekInputIcon, isRTL && styles.sleekInputIconRTL]}
              />
              <View style={[styles.sleekInputDivider, isRTL && styles.sleekInputDividerRTL]} />
              <TextInput
                style={[styles.sleekTextInput, isRTL && styles.sleekTextInputRTL]}
                value={password}
                onChangeText={setPassword}
                placeholder={isRTL ? 'أدخل كلمة المرور' : 'Enter password'}
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                onFocus={() => setPasswordActive(true)}
                onBlur={() => setPasswordActive(false)}
                autoFocus
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={18}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={[styles.buttonContainer, isRTL && styles.buttonContainerRTL]}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, isRTL && styles.cancelButtonTextRTL]}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
              activeOpacity={0.7}
              disabled={password.trim() === ''}
            >
              <Text style={[styles.confirmButtonText, isRTL && styles.confirmButtonTextRTL]}>
                {isRTL ? 'حذف الحساب' : 'Delete Account'}
              </Text>
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
  modalContainer: {
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
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.error,
    textAlign: 'center',
  },
  titleRTL: {
    fontFamily: 'System',
  },
  titleUnderline: {
    width: 32,
    height: 2.5,
    backgroundColor: colors.error,
    marginTop: 6,
    borderRadius: 1.5,
    marginBottom: 12,
  },
  titleUnderlineRTL: {
    alignSelf: 'center',
  },
  message: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    paddingHorizontal: 10,
  },
  messageRTL: {
    fontFamily: 'System',
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
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
    borderBottomColor: colors.error,
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
  eyeButton: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 12,
    gap: 12,
  },
  buttonContainerRTL: {
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
  confirmButton: {
    backgroundColor: colors.error,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  confirmButtonTextRTL: {
    fontFamily: 'System',
  },
});

export default PasswordPromptModal;
