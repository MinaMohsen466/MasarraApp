import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Platform,
  PermissionsAndroid,
  Linking,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../constants/colors';
import { launchImageLibrary } from 'react-native-image-picker';
import { styles } from './styles';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import PasswordPromptModal from '../PasswordPromptModal/PasswordPromptModal';
import { API_URL } from '../../config/api.config';
import { CustomAlert } from '../CustomAlert';

interface EditProfileProps {
  onBack?: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ onBack }) => {
  const { isRTL } = useLanguage();
  const { user, updateUserProfile, changeUserPassword, logout, refreshUser } =
    useAuth();
  const insets = useSafeAreaInsets();
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(
    user?.phone && user.phone.trim() !== '' ? user.phone : '',
  );
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.profilePicture || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [nameActive, setNameActive] = useState(false);
  const [phoneActive, setPhoneActive] = useState(false);

  // Alert states
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
  }>({ visible: false, title: '', message: '', buttons: [] });

  // Log user data on mount
  useEffect(() => {
    // User data logged
  }, []);

  // Sync profileImage when user.profilePicture changes
  useEffect(() => {
    if (user?.profilePicture && user.profilePicture !== profileImage) {
      setProfileImage(user.profilePicture);
    }
  }, [user?.profilePicture]);

  // Fetch latest user data from server on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;

        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();

          // Update state with fresh data
          if (userData.name) setName(userData.name);
          if (userData.phone && userData.phone.trim() !== '')
            setPhone(userData.phone);
          if (userData.profilePicture) {
            setProfileImage(userData.profilePicture);
          }
        }
      } catch (error) {
        // Error fetching user data
      }
    };

    fetchUserData();
  }, []);

  const showAlert = (
    title: string,
    message: string,
    buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>,
  ) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };

  const handleRemovePhoto = () => {
    showAlert(
      isRTL ? 'حذف الصورة' : 'Remove Photo',
      isRTL
        ? 'هل أنت متأكد من حذف صورة الملف الشخصي؟'
        : 'Are you sure you want to remove your profile photo?',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Remove',
          style: 'destructive',
          onPress: () => setProfileImage(null),
        },
      ],
    );
  };

  const handleChoosePhoto = async () => {
    try {
      // Request permissions for Android (handle Android 13+ separately)
      if (Platform.OS === 'android') {
        const sdk =
          typeof Platform.Version === 'string'
            ? parseInt(Platform.Version, 10)
            : (Platform.Version as number);
        const permission =
          sdk >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        // If permission is already granted, continue
        const already = await PermissionsAndroid.check(permission);
        if (!already) {
          const granted = await PermissionsAndroid.request(permission, {
            title: 'Photo Library Permission',
            message: 'App needs access to your photo library',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          });

          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            // ok
          } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            showAlert(
              isRTL ? 'إذن مطلوب' : 'Permission Required',
              isRTL
                ? 'الرجاء السماح بالوصول إلى المعرض من إعدادات التطبيق'
                : 'Please allow access to photo library from app settings',
              [
                { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
                { text: 'OK', onPress: () => Linking.openSettings() },
              ],
            );
            return;
          } else {
            showAlert(
              isRTL ? 'إذن مطلوب' : 'Permission Required',
              isRTL
                ? 'الرجاء السماح بالوصول إلى المعرض'
                : 'Please allow access to photo library',
              [{ text: 'OK' }],
            );
            return;
          }
        }
      }

      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000,
        selectionLimit: 1,
        includeBase64: false,
        presentationStyle: 'fullScreen',
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        // Handle specific error for missing photo picker
        if (
          result.errorCode === 'others' ||
          result.errorCode === 'camera_unavailable'
        ) {
          // Try again with different options as fallback
          try {
            const fallbackResult = await launchImageLibrary({
              mediaType: 'photo',
              quality: 0.8,
              maxWidth: 1000,
              maxHeight: 1000,
              selectionLimit: 1,
              includeBase64: false,
            });

            if (!fallbackResult.didCancel && fallbackResult.assets?.[0]?.uri) {
              setProfileImage(fallbackResult.assets[0].uri);
              return;
            }
          } catch (fallbackError) {
            // Fallback also failed
          }

          showAlert(
            isRTL ? 'خطأ' : 'Error',
            isRTL
              ? 'لا يوجد تطبيق لاختيار الصور. يرجى تثبيت Google Photos أو تطبيق معرض آخر.'
              : 'No image picker app found. Please install Google Photos or another gallery app.',
            [{ text: 'OK' }],
          );
          return;
        }

        showAlert(
          isRTL ? 'خطأ' : 'Error',
          result.errorMessage ||
            (isRTL ? 'فشل اختيار الصورة' : 'Failed to pick image'),
          [{ text: 'OK' }],
        );
        return;
      }

      if (result.assets && result.assets[0] && result.assets[0].uri) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (err: any) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        err.message || (isRTL ? 'فشل اختيار الصورة' : 'Failed to pick image'),
        [{ text: 'OK' }],
      );
    }
  };

  const handleSaveChanges = async () => {
    if (!name.trim()) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'الرجاء إدخال الاسم' : 'Please enter your name',
        [{ text: 'OK' }],
      );
      return;
    }

    setIsLoading(true);
    try {
      // Check if user wants to remove the profile picture
      const shouldRemoveImage = profileImage === null;

      // Only send profileImage if it's a new local file (not a server path)
      let imageToSend: string | undefined;
      if (profileImage && !shouldRemoveImage) {
        // Check if it's a local file URI (file://, content://, or no protocol for local picker)
        const isLocalFile =
          profileImage.startsWith('file://') ||
          profileImage.startsWith('content://') ||
          (!profileImage.startsWith('http') &&
            !profileImage.startsWith('/public'));

        if (isLocalFile) {
          imageToSend = profileImage;
        }
      }

      await updateUserProfile(
        name.trim(),
        phone.trim(),
        imageToSend,
        shouldRemoveImage,
      );

      // Refresh user data in AuthContext to sync across all pages
      await refreshUser();

      showAlert(
        isRTL ? 'نجح' : 'Success',
        isRTL ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully',
        [{ text: 'OK', onPress: () => setIsEditing(false) }],
      );
    } catch (error: any) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        error?.message ||
          (isRTL ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile'),
        [{ text: 'OK' }],
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setName(user?.name || '');
    setPhone(user?.phone && user.phone.trim() !== '' ? user.phone : '');
    setProfileImage(user?.profilePicture || null);
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
  };

  const handlePasswordChange = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    await changeUserPassword(currentPassword, newPassword);
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccountModal(true);
  };

  const confirmDeleteAccount = async (password: string) => {
    setShowDeleteAccountModal(false);

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      showAlert(
        isRTL ? 'تم الحذف' : 'Account Deleted',
        isRTL
          ? 'تم حذف حسابك بنجاح'
          : 'Your account has been deleted successfully',
        [
          {
            text: 'OK',
            onPress: async () => {
              // Clear all data and logout - this will navigate to home
              await logout();
            },
          },
        ],
      );
    } catch (error) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        error instanceof Error
          ? error.message
          : isRTL
          ? 'فشل حذف الحساب'
          : 'Failed to delete account',
        [{ text: 'OK' }],
      );
    }
  };

  const getInitials = () => {
    if (!user?.name) return 'M';
    return user.name.charAt(0).toUpperCase();
  };

  const getImageUri = (uri: string | null | undefined) => {
    if (!uri) {
      return null;
    }

    // If it's already a full URL (like S3), return as is
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }

    // If it's a local file URI, return as is
    if (uri.startsWith('file://') || uri.startsWith('content://')) {
      return uri;
    }

    // If it's a server path (starts with /public), prepend the base URL
    if (uri.startsWith('/public')) {
      return `${API_URL.replace('/api', '')}${uri}`;
    }

    return uri;
  };

  return (
    <>
      <StatusBar backgroundColor="#00a19c" barStyle="light-content" translucent={false} />
      <View style={{ flex: 1, backgroundColor: colors.primary }}>
        <View style={{ height: insets.top, backgroundColor: colors.primary }} />
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Curved Header Background Block with topographic waves & integrated navigation */}
            <View style={styles.profileHeaderBlock}>
              <Svg width="100%" height="100%" viewBox="0 0 375 110" preserveAspectRatio="none" style={styles.topographicSvg}>
                <Path d="M-20 20 C80 55 180 12 300 45 T400 35" stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} fill="none" />
                <Path d="M-20 35 C80 70 180 20 300 60 T400 50" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} fill="none" />
                <Path d="M-20 50 C80 85 180 28 300 75 T400 65" stroke="rgba(255,255,255,0.15)" strokeWidth={2} fill="none" />
              </Svg>

              {/* Overlay Navigation Bar */}
              <View style={[styles.headerOverlayBar, isRTL && styles.headerOverlayBarRTL]}>
                {onBack && (
                  <TouchableOpacity
                    style={styles.headerBackButtonCircle}
                    onPress={onBack}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name={isRTL ? 'chevron-forward' : 'chevron-back'}
                      size={20}
                      color={colors.textWhite}
                    />
                  </TouchableOpacity>
                )}
                <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
                  {isRTL ? 'تعديل الملف الشخصي' : 'Edit Profile'}
                </Text>
                <View style={styles.headerSpacer} />
              </View>
            </View>

            {/* Curved Wave Divider (Transitions header to page background colors.background) */}
            <View style={styles.profileCurveDivider}>
              <Svg height="30" width="100%" viewBox="0 0 375 30" preserveAspectRatio="none">
                <Path d="M0,20 C100,40 250,0 375,20 L375,30 L0,30 Z" fill={colors.background} />
              </Svg>
            </View>
            {/* Personal Information Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      isRTL && styles.sectionTitleRTL,
                    ]}
                  >
                    {isRTL ? 'المعلومات الشخصية' : 'Personal Information'}
                  </Text>
                </View>
                {!isEditing && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setIsEditing(true)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.editButtonText,
                        isRTL && styles.editButtonTextRTL,
                      ]}
                    >
                      {isRTL ? 'تعديل' : 'Edit'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {!isEditing ? (
                // View Mode
                <View style={styles.viewMode}>
                  {/* Full Name Row */}
                  <View style={[styles.infoRow, isRTL && styles.infoRowRTL]}>
                    <View style={[styles.infoIconContainer, isRTL && styles.infoIconContainerRTL]}>
                      <Icon name="person-outline" size={18} color={colors.primary} />
                    </View>
                    <View style={[styles.infoContent, isRTL && styles.infoContentRTL]}>
                      <Text style={[styles.infoLabel, isRTL && styles.infoLabelRTL]}>
                        {isRTL ? 'الاسم الكامل' : 'Full Name'}
                      </Text>
                      <Text style={[styles.infoValue, isRTL && styles.infoValueRTL]}>
                        {user?.name || (isRTL ? 'غير متوفر' : 'Not provided')}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.infoDivider, isRTL && styles.infoDividerRTL]} />

                  {/* Phone Number Row */}
                  <View style={[styles.infoRow, isRTL && styles.infoRowRTL]}>
                    <View style={[styles.infoIconContainer, isRTL && styles.infoIconContainerRTL]}>
                      <Icon name="call-outline" size={18} color={colors.primary} />
                    </View>
                    <View style={[styles.infoContent, isRTL && styles.infoContentRTL]}>
                      <Text style={[styles.infoLabel, isRTL && styles.infoLabelRTL]}>
                        {isRTL ? 'رقم الهاتف' : 'Phone Number'}
                      </Text>
                      <Text
                        style={[
                          styles.infoValue,
                          isRTL && styles.infoValueRTL,
                          (user?.phone && user.phone.trim() !== '') ? { textAlign: 'left', writingDirection: 'ltr' } : null
                        ]}
                      >
                        {user?.phone && user.phone.trim() !== ''
                          ? user.phone
                          : isRTL
                          ? 'غير متوفر'
                          : 'Not provided'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.infoDivider, isRTL && styles.infoDividerRTL]} />

                  {/* Email Address Row */}
                  <View style={[styles.infoRow, isRTL && styles.infoRowRTL]}>
                    <View style={[styles.infoIconContainer, isRTL && styles.infoIconContainerRTL]}>
                      <Icon name="mail-outline" size={18} color={colors.primary} />
                    </View>
                    <View style={[styles.infoContent, isRTL && styles.infoContentRTL]}>
                      <Text style={[styles.infoLabel, isRTL && styles.infoLabelRTL]}>
                        {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                      </Text>
                      <Text style={[styles.infoValue, isRTL && styles.infoValueRTL]}>
                        {user?.email || (isRTL ? 'غير متوفر' : 'Not provided')}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                // Edit Mode
                <View style={styles.editMode}>
                  {/* Profile Photo Area (Centered, Clean, No nested background) */}
                  <View style={styles.centeredPhotoContainer}>
                    <View style={styles.photoCircleWrapper}>
                      <TouchableOpacity
                        style={styles.photoCircle}
                        onPress={handleChoosePhoto}
                        activeOpacity={0.8}
                      >
                        {profileImage ? (
                          <Image
                            source={{
                              uri: getImageUri(profileImage) || undefined,
                            }}
                            style={styles.photoImage}
                          />
                        ) : (
                          <Text style={styles.photoInitials}>
                            {getInitials()}
                          </Text>
                        )}
                      </TouchableOpacity>
                      
                      {/* Camera upload overlay badge at bottom-right */}
                      <TouchableOpacity
                        style={styles.cameraBadge}
                        onPress={handleChoosePhoto}
                        activeOpacity={0.8}
                      >
                        <Icon name="camera" size={16} color={colors.textWhite} />
                      </TouchableOpacity>

                      {/* Remove photo icon at top-left */}
                      {profileImage && (
                        <TouchableOpacity
                          style={styles.removePhotoIcon}
                          onPress={handleRemovePhoto}
                          activeOpacity={0.8}
                        >
                          <Icon name="close" size={12} color={colors.textWhite} />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <Text style={[styles.photoHint, isRTL && styles.photoHintRTL]}>
                      {isRTL
                        ? 'انقر على الصورة لتغييرها (JPG, PNG حتى 10 ميجابايت)'
                        : 'Tap photo to change (JPG, PNG up to 10MB)'}
                    </Text>
                  </View>

                  {/* Form Fields */}
                  <View style={styles.formFieldsContainer}>
                    <View style={styles.formColumn}>
                      <Text
                        style={[
                          styles.inputLabel,
                          isRTL && styles.inputLabelRTL,
                          { marginBottom: 6, fontSize: 13, color: '#6B7280' }
                        ]}
                      >
                        {isRTL ? 'الاسم الكامل' : 'Full Name'}
                      </Text>
                      <View style={[styles.sleekInputWrapper, isRTL && styles.sleekInputWrapperRTL, nameActive && styles.sleekInputWrapperActive]}>
                        <Icon
                          name="person-outline"
                          size={18}
                          color={nameActive ? colors.primary : '#9CA3AF'}
                          style={[styles.sleekInputIcon, isRTL && styles.sleekInputIconRTL]}
                        />
                        <View style={[styles.sleekInputDivider, isRTL && styles.sleekInputDividerRTL]} />
                        <TextInput
                          style={[styles.sleekTextInput, isRTL && styles.sleekTextInputRTL]}
                          value={name}
                          onChangeText={setName}
                          placeholder={isRTL ? 'أدخل الاسم' : 'Enter name'}
                          placeholderTextColor="#9CA3AF"
                          onFocus={() => setNameActive(true)}
                          onBlur={() => setNameActive(false)}
                          editable={!isLoading}
                        />
                      </View>
                    </View>
                    <View style={styles.formColumn}>
                      <Text
                        style={[
                          styles.inputLabel,
                          isRTL && styles.inputLabelRTL,
                          { marginBottom: 6, fontSize: 13, color: '#6B7280' }
                        ]}
                      >
                        {isRTL ? 'رقم الهاتف' : 'Phone Number'}
                      </Text>
                      <View style={[styles.sleekInputWrapper, isRTL && styles.sleekInputWrapperRTL, phoneActive && styles.sleekInputWrapperActive]}>
                        <Icon
                          name="call-outline"
                          size={18}
                          color={phoneActive ? colors.primary : '#9CA3AF'}
                          style={[styles.sleekInputIcon, isRTL && styles.sleekInputIconRTL]}
                        />
                        <View style={[styles.sleekInputDivider, isRTL && styles.sleekInputDividerRTL]} />
                        <TextInput
                          style={[
                            styles.sleekTextInput,
                            { textAlign: 'left', writingDirection: 'ltr' }
                          ]}
                          value={phone}
                          onChangeText={setPhone}
                          placeholder={isRTL ? 'أدخل رقم الهاتف' : 'Enter phone'}
                          placeholderTextColor="#9CA3AF"
                          keyboardType="phone-pad"
                          onFocus={() => setPhoneActive(true)}
                          onBlur={() => setPhoneActive(false)}
                          editable={!isLoading}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleCancel}
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
                      style={styles.saveButton}
                      onPress={handleSaveChanges}
                      disabled={isLoading}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.saveButtonText,
                          isRTL && styles.saveButtonTextRTL,
                        ]}
                      >
                        {isLoading
                          ? isRTL
                            ? 'جاري الحفظ...'
                            : 'Saving...'
                          : isRTL
                          ? 'حفظ التغييرات'
                          : 'Save Changes'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Change Password Section */}
            <TouchableOpacity
              style={styles.settingsCard}
              onPress={handleChangePassword}
              activeOpacity={0.7}
            >
              <View style={[styles.settingsCardInner, isRTL && styles.settingsCardInnerRTL]}>
                <View style={[styles.settingsIconContainer, styles.passwordIconBg, isRTL && styles.settingsIconContainerRTL]}>
                  <Icon name="key-outline" size={20} color={colors.primary} />
                </View>
                <View style={[styles.settingsTextContainer, isRTL && styles.settingsTextContainerRTL]}>
                  <Text style={[styles.settingsTitle, isRTL && styles.settingsTitleRTL]}>
                    {isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
                  </Text>
                  <Text style={[styles.settingsSubtitle, isRTL && styles.settingsSubtitleRTL]}>
                    {isRTL
                      ? 'كلمة المرور الخاصة بك آمنة ومشفرة.'
                      : 'Your password is secure and encrypted.'}
                  </Text>
                </View>
                <Icon
                  name={isRTL ? 'chevron-back' : 'chevron-forward'}
                  size={20}
                  color="#94A3B8"
                />
              </View>
            </TouchableOpacity>

            {/* Delete Account Section */}
            <TouchableOpacity
              style={styles.settingsCard}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
            >
              <View style={[styles.settingsCardInner, isRTL && styles.settingsCardInnerRTL]}>
                <View style={[styles.settingsIconContainer, styles.deleteIconBg, isRTL && styles.settingsIconContainerRTL]}>
                  <Icon name="trash-outline" size={20} color={colors.error} />
                </View>
                <View style={[styles.settingsTextContainer, isRTL && styles.settingsTextContainerRTL]}>
                  <Text style={[styles.settingsTitle, styles.deleteTitleText, isRTL && styles.settingsTitleRTL]}>
                    {isRTL ? 'حذف الحساب' : 'Delete Account'}
                  </Text>
                  <Text style={[styles.settingsSubtitle, isRTL && styles.settingsSubtitleRTL]}>
                    {isRTL
                      ? 'حذف حسابك بشكل دائم. هذا الإجراء لا يمكن التراجع عنه'
                      : 'Permanently delete your account. This action cannot be undone'}
                  </Text>
                </View>
                <Icon
                  name={isRTL ? 'chevron-back' : 'chevron-forward'}
                  size={20}
                  color="#94A3B8"
                />
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* Change Password Modal */}
          <ChangePasswordModal
            visible={showChangePasswordModal}
            onClose={() => setShowChangePasswordModal(false)}
            onChangePassword={handlePasswordChange}
          />

          {/* Delete Account Modal */}
          <PasswordPromptModal
            visible={showDeleteAccountModal}
            title={isRTL ? 'حذف الحساب' : 'Delete Account'}
            message={
              isRTL
                ? 'لتأكيد حذف حسابك، يرجى إدخال كلمة المرور الخاصة بك. هذا الإجراء لا يمكن التراجع عنه'
                : 'To confirm account deletion, please enter your password. This action cannot be undone'
            }
            onConfirm={confirmDeleteAccount}
            onCancel={() => setShowDeleteAccountModal(false)}
          />

          {/* Custom Alert */}
          <CustomAlert
            visible={alertConfig.visible}
            title={alertConfig.title}
            message={alertConfig.message}
            buttons={alertConfig.buttons}
            onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
          />
        </View>
      </View>
    </>
  );
};

export default EditProfile;
