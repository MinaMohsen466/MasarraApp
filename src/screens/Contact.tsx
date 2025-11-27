import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../constants/colors';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { styles } from './contactStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api.config';

interface ContactProps {
  onBack: () => void;
}

const Contact: React.FC<ContactProps> = ({ onBack }) => {
  const { isRTL, t } = useLanguage();
  const { data: siteSettings, isLoading } = useSiteSettings();
  const insets = useSafeAreaInsets();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleCallPress = (phone: string) => {
    const phoneUrl = `tel:${phone}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Could not open phone dialer');
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Could not open phone dialer');
      });
  };

  const handleEmailPress = (email: string) => {
    const emailUrl = `mailto:${email}`;
    Linking.canOpenURL(emailUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(emailUrl);
        } else {
          Alert.alert('Error', 'Could not open email client');
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Could not open email client');
      });
  };

  const handleSubmitForm = async () => {
    // Validate form
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.message.trim()) {
      Alert.alert(isRTL ? 'تنبيه' : 'Alert', isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('userToken');

      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          title: formData.subject || 'General Inquiry',
          message: formData.message
        })
      });

      if (response.ok) {
        Alert.alert(
          isRTL ? 'نجح' : 'Success',
          isRTL ? 'تم إرسال رسالتك بنجاح' : 'Your message has been sent successfully',
          [
            {
              text: isRTL ? 'حسناً' : 'OK',
              onPress: () => {
                // Clear form
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  subject: '',
                  message: ''
                });
              }
            }
          ]
        );
      } else {
        const errorData = await response.json();
        Alert.alert(isRTL ? 'خطأ' : 'Error', errorData.message || (isRTL ? 'فشل إرسال الرسالة' : 'Failed to send message'));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'حدث خطأ في الإرسال' : 'An error occurred while sending');
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    {
      id: 'email',
      icon: (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
            stroke={colors.primary}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M22 6l-10 7L2 6"
            stroke={colors.primary}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
      label: isRTL ? 'البريد الإلكتروني' : 'Email',
      value: siteSettings?.contactEmail || 'N/A',
      onPress: () => {
        if (siteSettings?.contactEmail) {
          handleEmailPress(siteSettings.contactEmail);
        }
      },
    },
    {
      id: 'phone',
      icon: (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
          <Path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
            stroke={colors.primary}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      ),
      label: isRTL ? 'رقم الهاتف' : 'Phone',
      value: siteSettings?.contactPhone || 'N/A',
      onPress: () => {
        if (siteSettings?.contactPhone) {
          handleCallPress(siteSettings.contactPhone);
        }
      },
    },
  ];

  return (
    <View style={[styles.fullPageContainer, { paddingTop: insets.top }]}>
      {/* Header Background */}
      <View style={[styles.headerBackground, { height: insets.top + 66 }]} />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.headerBackInline}
          activeOpacity={0.7}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d={isRTL ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'}
              stroke={colors.primary}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
          {isRTL ? 'اتصل بنا' : 'Contact Us'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}>
          {/* Intro Section */}
          <View style={styles.introSection}>
            <Text style={[styles.introText, isRTL && styles.introTextRTL]}>
              {isRTL
                ? 'نحن هنا لمساعدتك. اتصل بنا عبر البريد الإلكتروني أو الهاتف'
                : 'We are here to help you. Contact us via email or phone'}
            </Text>
          </View>

          {/* Contact Info Cards */}
          <View style={styles.contactCardsContainer}>
            {contactInfo.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.contactCard}
                onPress={item.onPress}
                activeOpacity={0.7}>
                {/* Icon Container */}
                <View style={styles.iconContainer}>
                  {item.icon}
                </View>

                {/* Contact Details */}
                <View style={[styles.contactDetails, isRTL && styles.contactDetailsRTL]}>
                  <Text style={[styles.contactLabel, isRTL && styles.contactLabelRTL]}>
                    {item.label}
                  </Text>
                  <Text
                    style={[styles.contactValue, isRTL && styles.contactValueRTL]}
                    numberOfLines={2}
                    selectable>
                    {item.value}
                  </Text>
                </View>

                {/* Arrow Icon */}
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d={isRTL ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}
                    stroke={colors.primary}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            ))}
          </View>

          {/* Additional Info */}
          <View style={styles.additionalSection}>
            <Text style={[styles.additionalTitle, isRTL && styles.additionalTitleRTL]}>
              {isRTL ? 'معلومات إضافية' : 'Additional Information'}
            </Text>
            <Text style={[styles.additionalText, isRTL && styles.additionalTextRTL]}>
              {isRTL
                ? 'يمكنك أيضاً التواصل معنا من خلال نموذج الاتصال في التطبيق'
                : 'You can also reach us through the contact form in the app'}
            </Text>
          </View>

          {/* Contact Form Section */}
          {/* @ts-ignore */}
          <View style={styles.formSection}>
            <Text style={[styles.formTitle, isRTL && styles.formTitleRTL]}>
              {isRTL ? 'أرسل لنا رسالة' : 'Send us a Message'}
            </Text>

            {/* Name Input */}
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder={isRTL ? 'الاسم *' : 'Name *'}
              placeholderTextColor="#999"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              editable={!submitting}
            />

            {/* Email Input */}
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder={isRTL ? 'البريد الإلكتروني *' : 'Email *'}
              placeholderTextColor="#999"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              editable={!submitting}
            />

            {/* Phone Input */}
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder={isRTL ? 'رقم الهاتف *' : 'Phone Number *'}
              placeholderTextColor="#999"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
              editable={!submitting}
            />

            {/* Subject Input */}
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder={isRTL ? 'الموضوع' : 'Subject'}
              placeholderTextColor="#999"
              value={formData.subject}
              onChangeText={(text) => setFormData({ ...formData, subject: text })}
              editable={!submitting}
            />

            {/* Message Input */}
            <TextInput
              style={[styles.messageInput, isRTL && styles.messageInputRTL]}
              placeholder={isRTL ? 'رسالتك *' : 'Your Message *'}
              placeholderTextColor="#999"
              value={formData.message}
              onChangeText={(text) => setFormData({ ...formData, message: text })}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!submitting}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                submitting && styles.submitButtonDisabled
              ]}
              onPress={handleSubmitForm}
              disabled={submitting}
              activeOpacity={0.7}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isRTL ? 'إرسال الرسالة' : 'Send Message'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default Contact;
