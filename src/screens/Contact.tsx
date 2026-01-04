import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { submitContactRequest } from '../services/api';
import { colors } from '../constants/colors';
import { styles as contactStyles } from './contactStyles';
import { CustomAlert } from '../components/CustomAlert';

const Contact: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const { data: siteSettings, isLoading: loadingSettings } = useSiteSettings();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CustomAlert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<
    Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>
  >([]);

  // Helper function to show custom alert
  const showAlert = (
    title: string,
    msg: string,
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>,
  ) => {
    setAlertTitle(title);
    setAlertMessage(msg);
    setAlertButtons(buttons || [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }]);
    setAlertVisible(true);
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'الرجاء إدخال اسمك' : 'Please enter your name',
      );
      return;
    }

    if (!email.trim()) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'الرجاء إدخال بريدك الإلكتروني' : 'Please enter your email',
      );
      return;
    }

    if (!phone.trim()) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'الرجاء إدخال رقم هاتفك' : 'Please enter your phone number',
      );
      return;
    }

    if (!message.trim()) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'الرجاء إدخال نص الرسالة' : 'Please enter message content',
      );
      return;
    }

    if (message.length < 10) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL
          ? 'الرجاء كتابة رسالة لا تقل عن 10 أحرف'
          : 'Please write a message with at least 10 characters',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await submitContactRequest(
        {
          title: subject.trim() || (isRTL ? 'استفسار عام' : 'General Inquiry'),
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          message: message.trim(),
        },
        token || undefined,
      );

      showAlert(
        isRTL ? 'نجح!' : 'Success!',
        isRTL
          ? 'تم إرسال رسالتك بنجاح'
          : 'Your message has been sent successfully',
        [
          {
            text: isRTL ? 'حسناً' : 'OK',
            onPress: () => {
              // Clear form
              setSubject('');
              setMessage('');
              if (!user) {
                setName('');
                setEmail('');
                setPhone('');
              }
              setAlertVisible(false);
            },
          },
        ],
      );
    } catch (error: any) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        error.message ||
          (isRTL ? 'فشل في إرسال الرسالة' : 'Failed to send message'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onClose={() => setAlertVisible(false)}
      />
      <View style={contactStyles.container}>
      <View style={[contactStyles.headerBar, { height: insets.top + 60 }]}>
        <TouchableOpacity
          onPress={() => onBack && onBack()}
          style={[
            contactStyles.backButton,
            {
              top: insets.top + 12,
              left: isRTL ? undefined : 12,
              right: isRTL ? 12 : undefined,
              position: 'absolute',
            },
          ]}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 20, color: colors.primary }}>
            {isRTL ? '›' : '‹'}
          </Text>
        </TouchableOpacity>
        <Text
          style={[contactStyles.headerTitle, { marginTop: insets.top + 8 }]}
        >
          {isRTL ? 'اتصل بنا' : 'Contact Us'}
        </Text>
      </View>

      <ScrollView
        style={contactStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Description Text */}
        <Text
          style={[
            contactStyles.descriptionText,
            isRTL && contactStyles.textRTL,
          ]}
        >
          {isRTL
            ? 'نحن هنا لمساعدتك. تواصل معنا عبر البريد الإلكتروني أو الهاتف'
            : 'We are here to help you. Contact us via email or phone'}
        </Text>

        {/* Contact Cards */}
        {loadingSettings ? (
          <View style={[contactStyles.contactCard, { alignItems: 'center' }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : siteSettings &&
          (siteSettings.contactEmail || siteSettings.contactPhone) ? (
          <View>
            {/* Email Card */}
            {siteSettings.contactEmail && (
              <TouchableOpacity
                style={contactStyles.contactCard}
                onPress={() =>
                  Linking.openURL(`mailto:${siteSettings.contactEmail}`)
                }
                activeOpacity={0.7}
              >
                <View style={contactStyles.contactTextContainer}>
                  <Text
                    style={[
                      contactStyles.contactLabel,
                      isRTL && contactStyles.textRTL,
                    ]}
                  >
                    {isRTL ? 'البريد الإلكتروني' : 'EMAIL'}
                  </Text>
                  <Text
                    style={[
                      contactStyles.contactValue,
                      isRTL && contactStyles.textRTL,
                    ]}
                  >
                    {siteSettings.contactEmail}
                  </Text>
                </View>
                <Text style={{ fontSize: 20, color: '#999' }}>›</Text>
              </TouchableOpacity>
            )}

            {/* Phone Card */}
            {siteSettings.contactPhone && (
              <TouchableOpacity
                style={contactStyles.contactCard}
                onPress={() =>
                  Linking.openURL(`tel:${siteSettings.contactPhone}`)
                }
                activeOpacity={0.7}
              >
                <View style={contactStyles.contactTextContainer}>
                  <Text
                    style={[
                      contactStyles.contactLabel,
                      isRTL && contactStyles.textRTL,
                    ]}
                  >
                    {isRTL ? 'الهاتف' : 'PHONE'}
                  </Text>
                  <Text
                    style={[
                      contactStyles.contactValue,
                      isRTL && contactStyles.textRTL,
                    ]}
                  >
                    {siteSettings.contactPhone}
                  </Text>
                </View>
                <Text style={{ fontSize: 20, color: '#999' }}>›</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* Additional Information */}
        <View style={contactStyles.additionalInfoContainer}>
          <Text
            style={[
              contactStyles.additionalInfoTitle,
              isRTL && contactStyles.textRTL,
            ]}
          >
            {isRTL ? 'معلومات إضافية' : 'Additional Information'}
          </Text>
          <Text
            style={[
              contactStyles.additionalInfoText,
              isRTL && contactStyles.textRTL,
            ]}
          >
            {' '}
            {isRTL
              ? 'يمكنك أيضاً التواصل معنا عبر نموذج الاتصال في التطبيق'
              : 'You can also reach us through the contact form in the app'}
          </Text>
        </View>

        {/* Contact Form Card */}
        <View style={contactStyles.formCard}>
          <Text
            style={[contactStyles.formTitle, isRTL && contactStyles.textRTL]}
          >
            {isRTL ? 'أرسل لنا رسالة' : 'Send us a Message'}
          </Text>

          {/* Name Input */}
          <View style={contactStyles.inputContainer}>
            <TextInput
              style={[contactStyles.input, isRTL && contactStyles.inputRTL]}
              value={name}
              onChangeText={setName}
              placeholder={isRTL ? 'الاسم *' : 'Name *'}
              placeholderTextColor="#999"
              editable={!isSubmitting}
              autoComplete="off"
            />
          </View>

          {/* Email Input */}
          <View style={contactStyles.inputContainer}>
            <TextInput
              style={[contactStyles.input, isRTL && contactStyles.inputRTL]}
              value={email}
              onChangeText={setEmail}
              placeholder={isRTL ? 'البريد الإلكتروني *' : 'Email *'}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
              autoComplete="off"
            />
          </View>

          {/* Phone Input */}
          <View style={contactStyles.inputContainer}>
            <TextInput
              style={[contactStyles.input, isRTL && contactStyles.inputRTL]}
              value={phone}
              onChangeText={setPhone}
              placeholder={isRTL ? 'رقم الهاتف *' : 'Phone Number *'}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              editable={!isSubmitting}
              autoComplete="off"
            />
          </View>

          {/* Subject Input */}
          <View style={contactStyles.inputContainer}>
            <TextInput
              style={[contactStyles.input, isRTL && contactStyles.inputRTL]}
              value={subject}
              onChangeText={setSubject}
              placeholder={isRTL ? 'الموضوع' : 'Subject'}
              placeholderTextColor="#999"
              editable={!isSubmitting}
              autoComplete="off"
            />
          </View>

          {/* Message Input */}
          <View style={contactStyles.inputContainer}>
            <TextInput
              style={[
                contactStyles.input,
                contactStyles.textArea,
                isRTL && contactStyles.inputRTL,
              ]}
              value={message}
              onChangeText={setMessage}
              placeholder={isRTL ? 'رسالتك *' : 'Your Message *'}
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000}
              editable={!isSubmitting}
              autoComplete="off"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              contactStyles.submitButton,
              isSubmitting && contactStyles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={contactStyles.submitButtonText}>
                {isRTL ? 'إرسال' : 'Submit'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
    </>
  );
};

export default Contact;
