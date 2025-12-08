import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../constants/colors';
import { API_URL } from '../config/api.config';

interface VerifyEmailProps {
  email: string;
  userId: string;
  onVerified: (token: string, user: any) => void;
  onBack: () => void;
}

const VerifyEmail: React.FC<VerifyEmailProps> = ({ email, userId, onVerified, onBack }) => {
  const { isRTL } = useLanguage();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال رمز OTP المكون من 6 أرقام' : 'Please enter the 6-digit OTP code'
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, verificationCode: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Call onVerified directly without alert
      onVerified(data.token, data.user);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        error instanceof Error ? error.message : isRTL ? 'فشل التحقق من الرمز' : 'Failed to verify OTP'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>{isRTL ? '→ رجوع' : '← Back'}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          {isRTL ? 'التحقق من البريد الإلكتروني' : 'Verify Email'}
        </Text>
        
        <Text style={styles.description}>
          {isRTL
            ? `تم إرسال رمز مكون من 6 أرقام إلى\n${email}`
            : `A 6-digit code has been sent to\n${email}`}
        </Text>

        <View style={[styles.otpContainer, isRTL && styles.otpContainerRTL]}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={styles.otpInput}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>
              {isRTL ? 'تحقق' : 'Verify'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backToSignupButton} onPress={onBack}>
          <Text style={styles.backToSignupText}>
            {isRTL ? 'العودة إلى التسجيل' : 'Back to Signup'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  otpContainerRTL: {
    flexDirection: 'row-reverse',
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  verifyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyButtonDisabled: {
    backgroundColor: colors.border,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backToSignupButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  backToSignupText: {
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});

export default VerifyEmail;
