import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
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

  const handleConfirm = () => {
    if (password.trim() === '') {
      return;
    }
    onConfirm(password);
    setPassword('');
  };

  const handleCancel = () => {
    setPassword('');
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
          <Text style={[styles.title, isRTL && styles.titleRTL]}>{title}</Text>
          <Text style={[styles.message, isRTL && styles.messageRTL]}>
            {message}
          </Text>

          <TextInput
            style={[styles.input, isRTL && styles.inputRTL]}
            value={password}
            onChangeText={setPassword}
            placeholder={isRTL ? 'أدخل كلمة المرور' : 'Enter password'}
            placeholderTextColor="#999"
            secureTextEntry
            autoFocus
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
              activeOpacity={0.7}
              disabled={password.trim() === ''}
            >
              <Text style={styles.confirmButtonText}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'left',
  },
  titleRTL: {
    textAlign: 'right',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'left',
  },
  messageRTL: {
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'left',
  },
  inputRTL: {
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: '#d32f2f',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PasswordPromptModal;
