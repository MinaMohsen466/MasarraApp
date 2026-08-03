/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Linking,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { submitContactRequest } from '../services/api';
import { colors } from '../constants/colors';
import { styles as contactStyles } from './contactStyles';
import { CustomAlert } from '../components/CustomAlert';
import Chat from './Chat';

interface ContactProps {
  onBack?: () => void;
  onShowChat?: () => void;
  onHideChat?: () => void;
  onNavigate?: (route: string) => void;
}

const Contact: React.FC<ContactProps> = ({
  onBack,
  onShowChat,
  onHideChat,
  onNavigate,
}) => {
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn } = useAuth();
  const { data: siteSettings, isLoading: loadingSettings } = useSiteSettings();
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const checkOpenChat = async () => {
      try {
        const flag = await AsyncStorage.getItem('openChat');
        if (flag === '1') {
          await AsyncStorage.removeItem('openChat');
          setShowChat(true);
          onShowChat?.();
        }
      } catch {
        // Error checking flag
      }
    };
    checkOpenChat();
  }, [onShowChat]);

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
    setAlertButtons(
      buttons || [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
    );
    setAlertVisible(true);
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال الاسم' : 'Please enter your name',
      );
      return;
    }
    if (!email.trim()) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL
          ? 'يرجى إدخال البريد الإلكتروني'
          : 'Please enter your email',
      );
      return;
    }
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL
          ? 'يرجى إدخال بريد إلكتروني صحيح'
          : 'Please enter a valid email address',
      );
      return;
    }

    if (!phone.trim()) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال رقم الهاتف' : 'Please enter your phone number',
      );
      return;
    }

    if (!message.trim()) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال الرسالة' : 'Please enter your message',
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await submitContactRequest({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      if (res && res.success) {
        showAlert(
          isRTL ? 'تم الإرسال' : 'Success',
          isRTL
            ? 'تم إرسال رسالتك بنجاح. سنتواصل معك في أقرب وقت.'
            : 'Your message has been sent successfully. We will contact you soon.',
        );
        setName('');
        setEmail('');
        setPhone('');
        setSubject('');
        setMessage('');
      } else {
        showAlert(
          isRTL ? 'خطأ' : 'Error',
          (res && res.message) ||
            (isRTL
              ? 'حدث خطأ أثناء إرسال الرسالة'
              : 'An error occurred while sending the message'),
        );
      }
    } catch (err) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        (err instanceof Error ? err.message : undefined) ||
          (isRTL ? 'حدث خطأ في الاتصال بالسيرفر' : 'Server connection error'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <StatusBar
        backgroundColor={colors.backgroundCard}
        barStyle="dark-content"
        translucent={false}
      />
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onClose={() => setAlertVisible(false)}
      />
      <View style={contactStyles.container}>
        <View
          style={{
            height: insets.top,
            backgroundColor: colors.backgroundCard,
          }}
        />

        {/* Clean Header Bar */}
        <View style={contactStyles.cleanHeaderBar}>
          <TouchableOpacity
            style={contactStyles.headerBackButtonCircle}
            onPress={() => onBack && onBack()}
            activeOpacity={0.8}
          >
            <Icon
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={20}
              color="#0F172A"
            />
          </TouchableOpacity>

          <Text style={contactStyles.headerBarTitle}>
            {isRTL ? 'اتصل بنا' : 'Contact Us'}
          </Text>

          <View style={{ width: 42 }} />
        </View>

        <ScrollView
          style={contactStyles.content}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Description Subtitle */}
          <Text
            style={[
              contactStyles.descriptionText,
              isRTL && contactStyles.textRTL,
            ]}
          >
            {isRTL
              ? 'نحن هنا لمساعدتك. تواصل معنا عبر البريد الإلكتروني، الهاتف أو النموذج أدناه'
              : 'We are here to help you. Contact us via email, phone, or the form below'}
          </Text>

          {/* Contact Information Cards */}
          {loadingSettings ? (
            <View style={contactStyles.contactCard}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : siteSettings &&
            (siteSettings.contactEmail || siteSettings.contactPhone) ? (
            <View>
              {/* Email Card */}
              {siteSettings.contactEmail && (
                <TouchableOpacity
                  style={[
                    contactStyles.contactCard,
                    isRTL && contactStyles.rowReverse,
                  ]}
                  onPress={() =>
                    Linking.openURL(`mailto:${siteSettings.contactEmail}`)
                  }
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      contactStyles.contactIconContainer,
                      isRTL && contactStyles.contactIconContainerRTL,
                    ]}
                  >
                    <Icon name="mail-outline" size={20} color={colors.primary} />
                  </View>
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
                  <View style={contactStyles.arrowCircle}>
                    <Icon
                      name={isRTL ? 'chevron-back' : 'chevron-forward'}
                      size={16}
                      color={colors.primary}
                    />
                  </View>
                </TouchableOpacity>
              )}

              {/* Phone Card */}
              {siteSettings.contactPhone && (
                <TouchableOpacity
                  style={[
                    contactStyles.contactCard,
                    isRTL && contactStyles.rowReverse,
                  ]}
                  onPress={() =>
                    Linking.openURL(`tel:${siteSettings.contactPhone}`)
                  }
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      contactStyles.contactIconContainer,
                      isRTL && contactStyles.contactIconContainerRTL,
                    ]}
                  >
                    <Icon name="call-outline" size={20} color={colors.primary} />
                  </View>
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
                  <View style={contactStyles.arrowCircle}>
                    <Icon
                      name={isRTL ? 'chevron-back' : 'chevron-forward'}
                      size={16}
                      color={colors.primary}
                    />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {/* Become a Seller Promo Banner */}
          {(!isLoggedIn || (user && user.role === 'customer')) && (
            <TouchableOpacity
              style={[
                contactStyles.vendorBanner,
                isRTL && contactStyles.vendorBannerRTL,
              ]}
              onPress={() => onNavigate && onNavigate('become-seller')}
              activeOpacity={0.8}
            >
              <View
                style={[
                  contactStyles.vendorBannerLeft,
                  isRTL && contactStyles.vendorBannerLeftRTL,
                ]}
              >
                <View style={contactStyles.vendorIconContainer}>
                  <Icon name="storefront-outline" size={22} color={colors.primary} />
                </View>
                <View
                  style={[
                    contactStyles.vendorBannerTextContainer,
                    isRTL && contactStyles.vendorBannerTextContainerRTL,
                  ]}
                >
                  <Text
                    style={[
                      contactStyles.vendorBannerTitle,
                      isRTL && contactStyles.textRTL,
                    ]}
                  >
                    {isRTL ? 'سجل كمزود خدمة' : 'Register as a Vendor'}
                  </Text>
                  <Text
                    style={[
                      contactStyles.vendorBannerSubtitle,
                      isRTL && contactStyles.textRTL,
                    ]}
                  >
                    {isRTL
                      ? 'ابدأ في تقديم خدماتك وحقق أرباحاً معنا'
                      : 'Start offering your services & earn with us'}
                  </Text>
                </View>
              </View>
              <Icon
                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}

          {/* Additional Information Header */}
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
              {isRTL
                ? 'يمكنك أيضاً التواصل معنا مباشرة من خلال إرسال رسالة باستخدام النموذج أدناه'
                : 'You can also reach us directly by submitting a message using the form below'}
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
                placeholderTextColor="#94A3B8"
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
                placeholderTextColor="#94A3B8"
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
                placeholderTextColor="#94A3B8"
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
                placeholderTextColor="#94A3B8"
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
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={5}
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
                  {isRTL ? 'إرسال الرسالة' : 'Send Message'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Floating Chat Icon - Only for logged in users */}
        {isLoggedIn && (
          <TouchableOpacity
            style={[
              contactStyles.floatingChatButton,
              isRTL
                ? contactStyles.floatingChatButtonRTL
                : contactStyles.floatingChatButtonLTR,
              { bottom: insets.bottom + 80 },
            ]}
            onPress={() => {
              setShowChat(true);
              onShowChat?.();
            }}
            activeOpacity={0.85}
          >
            <View style={contactStyles.chatIconWrapper}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 2C6.477 2 2 6.03 2 11c0 2.12.83 4.07 2.22 5.57L3 21l4.83-1.42C9.28 20.08 10.6 20.4 12 20.4c5.523 0 10-4.03 10-9.4S17.523 2 12 2z"
                  fill="rgba(255, 255, 255, 0.15)"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M8 11.5h.01M12 11.5h.01M16 11.5h.01"
                  stroke="#FFFFFF"
                  strokeWidth={2.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <View style={contactStyles.onlineStatusBadge} />
          </TouchableOpacity>
        )}
      </View>

      {/* Chat Modal - Full screen overlay covering bottom nav */}
      {showChat && (
        <View style={contactStyles.chatModalContainer}>
          <Chat
            onBack={() => {
              setShowChat(false);
              onHideChat?.();
            }}
          />
        </View>
      )}
    </>
  );
};

export default Contact;
