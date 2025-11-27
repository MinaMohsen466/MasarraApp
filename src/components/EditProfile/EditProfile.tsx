import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, TextInput, Alert, Platform, PermissionsAndroid, Linking, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { launchImageLibrary } from 'react-native-image-picker';
import { styles } from './styles';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import PasswordPromptModal from '../PasswordPromptModal/PasswordPromptModal';
import { API_URL } from '../../config/api.config';

interface EditProfileProps {
  onBack?: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ onBack }) => {
  const { isRTL } = useLanguage();
  const { user, updateUserProfile, changeUserPassword, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  
  // Form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone && user.phone.trim() !== '' ? user.phone : '');
  const [profileImage, setProfileImage] = useState<string | null>(user?.profilePicture || null);
  const [isLoading, setIsLoading] = useState(false);

  // Log user data on mount
  useEffect(() => {
    console.log('👤 EditProfile - User data:', {
      name: user?.name,
      email: user?.email,
      profilePicture: user?.profilePicture,
      profileImageState: profileImage
    });
  }, []);

  // Sync profileImage when user.profilePicture changes
  useEffect(() => {
    if (user?.profilePicture && user.profilePicture !== profileImage) {
      console.log('🔄 Syncing profileImage from user context:', user.profilePicture);
      setProfileImage(user.profilePicture);
    }
  }, [user?.profilePicture]);

  // Fetch latest user data from server on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;

        console.log('🔄 Fetching latest user data from:', `${API_URL}/auth/me`);
        
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('✅ Fresh user data from server:', {
            name: userData.name,
            email: userData.email,
            profilePicture: userData.profilePicture
          });

          // Update state with fresh data
          if (userData.name) setName(userData.name);
          if (userData.phone && userData.phone.trim() !== '') setPhone(userData.phone);
          if (userData.profilePicture) {
            console.log('📸 Setting profileImage from server:', userData.profilePicture);
            setProfileImage(userData.profilePicture);
          }
        } else {
          console.error('❌ Failed to fetch user data:', response.status);
        }
      } catch (error) {
        console.error('❌ Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleChoosePhoto = async () => {
    try {
      console.log('📸 Opening image picker...');
      
      // Request permissions for Android (handle Android 13+ separately)
      if (Platform.OS === 'android') {
        const sdk = typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : (Platform.Version as number);
        const permission = sdk >= 33 ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

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

          console.log('📱 Android permission result:', granted);

          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            // ok
          } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            Alert.alert(
              isRTL ? 'إذن مطلوب' : 'Permission Required',
              isRTL ? 'الرجاء السماح بالوصول إلى المعرض من إعدادات التطبيق' : 'Please allow access to photo library from app settings',
              [
                { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
                { text: 'OK', onPress: () => Linking.openSettings() }
              ]
            );
            return;
          } else {
            Alert.alert(
              isRTL ? 'إذن مطلوب' : 'Permission Required',
              isRTL ? 'الرجاء السماح بالوصول إلى المعرض' : 'Please allow access to photo library'
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
      });

      console.log('📷 Image picker result:', JSON.stringify(result, null, 2));

      if (result.didCancel) {
        console.log('❌ User cancelled image picker');
        return;
      }

      if (result.errorCode) {
        console.error('❌ ImagePicker Error:', result.errorCode, result.errorMessage);
        Alert.alert(
          isRTL ? 'خطأ' : 'Error',
          result.errorMessage || (isRTL ? 'فشل اختيار الصورة' : 'Failed to pick image')
        );
        return;
      }

      if (result.assets && result.assets[0] && result.assets[0].uri) {
        console.log('✅ Selected image URI:', result.assets[0].uri);
        setProfileImage(result.assets[0].uri);
      } else {
        console.log('⚠️ No image selected or invalid result');
      }
    } catch (error: any) {
      console.error('❌ Error picking image:', error);
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        error.message || (isRTL ? 'فشل اختيار الصورة' : 'Failed to pick image')
      );
    }
  };

  const handleSaveChanges = async () => {
    if (!name.trim()) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'الرجاء إدخال الاسم' : 'Please enter your name'
      );
      return;
    }

    setIsLoading(true);
    try {
      // Only send profileImage if it's a new local file (not a server path)
      let imageToSend: string | undefined = undefined;
      if (profileImage) {
        // Check if it's a local file URI (file://, content://, or no protocol for local picker)
        const isLocalFile = profileImage.startsWith('file://') || 
                           profileImage.startsWith('content://') || 
                           (!profileImage.startsWith('http') && !profileImage.startsWith('/public'));
        
        if (isLocalFile) {
          imageToSend = profileImage;
          console.log('📸 Sending new profile image:', profileImage);
        } else {
          console.log('ℹ️ Keeping existing server image, not re-uploading:', profileImage);
        }
      }

      await updateUserProfile(name.trim(), phone.trim(), imageToSend);

      Alert.alert(
        isRTL ? 'نجح' : 'Success',
        isRTL ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully'
      );
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile'
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

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
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
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      Alert.alert(
        isRTL ? 'تم الحذف' : 'Account Deleted',
        isRTL ? 'تم حذف حسابك بنجاح' : 'Your account has been deleted successfully',
        [
          {
            text: 'OK',
            onPress: async () => {
              // Clear all data and logout - this will navigate to home
              await logout();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        error instanceof Error ? error.message : isRTL ? 'فشل حذف الحساب' : 'Failed to delete account'
      );
    }
  };

  const getInitials = () => {
    if (!user?.name) return 'M';
    return user.name.charAt(0).toUpperCase();
  };

  const getImageUri = (uri: string | null | undefined) => {
    if (!uri) {
      console.log('⚠️ getImageUri: No URI provided');
      return null;
    }
    
    console.log('🔍 getImageUri input:', uri);
    
    // If it's already a full URI (starts with http, file, or content), return as is
    if (uri.startsWith('http') || uri.startsWith('file://') || uri.startsWith('content://')) {
      console.log('✅ Full URI, returning as-is');
      return uri;
    }
    
    // If it's a server path (starts with /public), prepend the base URL
    if (uri.startsWith('/public')) {
      const fullUrl = `${API_URL.replace('/api', '')}${uri}`;
      console.log('🔗 Backend path converted:', {
        original: uri,
        platform: Platform.OS,
        fullUrl: fullUrl
      });
      return fullUrl;
    }
    
    console.log('⚠️ Unknown URI format, returning as-is:', uri);
    return uri;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar 
        backgroundColor={colors.background} 
        barStyle="dark-content"
        translucent={false}
      />
  {/* Header background to extend into notch */}
  <View style={[styles.headerBackground, { height: insets.top + 72 }]} />

  {/* Header */}
  <View style={[styles.header, { height: insets.top + 72 }]}>
        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.backButtonText, isRTL && styles.backButtonTextRTL]}>
              {isRTL ? '‹' : '‹'}
            </Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
          {isRTL ? 'تعديل الملف الشخصي' : 'Edit Profile'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Personal Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>👤</Text>
              </View>
              <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
                {isRTL ? 'المعلومات الشخصية' : 'Personal Information'}
              </Text>
            </View>
            {!isEditing && (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
                activeOpacity={0.7}>
                <Text style={[styles.editButtonText, isRTL && styles.editButtonTextRTL]}>
                  {isRTL ? 'تعديل' : 'Edit'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {!isEditing ? (
            // View Mode
            <View style={styles.viewMode}>
              <View style={styles.fieldRow}>
                <View style={styles.fieldColumn}>
                  <Text style={[styles.fieldLabel, isRTL && styles.fieldLabelRTL]}>
                    {isRTL ? 'الاسم الكامل' : 'Full Name'}
                  </Text>
                  <Text style={[styles.fieldValue, isRTL && styles.fieldValueRTL]}>
                    {user?.name || 'Not provided'}
                  </Text>
                </View>
                <View style={styles.fieldColumn}>
                  <Text style={[styles.fieldLabel, isRTL && styles.fieldLabelRTL]}>
                    {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                  </Text>
                  <Text style={[styles.fieldValue, isRTL && styles.fieldValueRTL]}>
                    {user?.email || 'Not provided'}
                  </Text>
                </View>
              </View>
              <View style={styles.fieldSingle}>
                <Text style={[styles.fieldLabel, isRTL && styles.fieldLabelRTL]}>
                  {isRTL ? 'رقم الهاتف' : 'Phone Number'}
                </Text>
                <Text style={[styles.fieldValue, isRTL && styles.fieldValueRTL]}>
                  {user?.phone && user.phone.trim() !== '' ? user.phone : (isRTL ? 'غير متوفر' : 'Not provided')}
                </Text>
              </View>
            </View>
          ) : (
            // Edit Mode
            <View style={styles.editMode}>
              {/* Profile Photo */}
              <View style={styles.photoSection}>
                <Text style={[styles.photoLabel, isRTL && styles.photoLabelRTL]}>
                  {isRTL ? 'صورة الملف الشخصي' : 'Profile Photo'}
                </Text>
                <View style={styles.photoContainer}>
                  <View style={styles.photoCircle}>
                    {profileImage ? (
                      <Image 
                        source={{ uri: getImageUri(profileImage) || undefined }} 
                        style={styles.photoImage}
                        onLoad={() => {
                          console.log('✅ Profile image loaded successfully!');
                        }}
                        onError={(error) => {
                          console.error('❌ Profile image failed to load:', {
                            error: error.nativeEvent.error,
                            profileImage: profileImage,
                            uri: getImageUri(profileImage)
                          });
                        }}
                      />
                    ) : (
                      <Text style={styles.photoInitials}>{getInitials()}</Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.choosePhotoButton}
                    onPress={handleChoosePhoto}
                    activeOpacity={0.7}>
                    <Text style={[styles.choosePhotoText, isRTL && styles.choosePhotoTextRTL]}>
                      {isRTL ? 'اختر صورة' : 'Choose Photo'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.photoHint, isRTL && styles.photoHintRTL]}>
                  {isRTL ? 'JPG, PNG حتى 10 ميجابايت' : 'JPG, PNG up to 10MB'}
                </Text>
              </View>

              {/* Form Fields */}
              <View style={styles.formRow}>
                <View style={styles.formColumn}>
                  <Text style={[styles.inputLabel, isRTL && styles.inputLabelRTL]}>
                    {isRTL ? 'الاسم الكامل' : 'Full Name'}
                  </Text>
                  <TextInput
                    style={[styles.input, isRTL && styles.inputRTL]}
                    value={name}
                    onChangeText={setName}
                    placeholder={isRTL ? 'أدخل الاسم' : 'Enter name'}
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={styles.formColumn}>
                  <Text style={[styles.inputLabel, isRTL && styles.inputLabelRTL]}>
                    {isRTL ? 'رقم الهاتف' : 'Phone Number'}
                  </Text>
                  <TextInput
                    style={[styles.input, isRTL && styles.inputRTL]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder={isRTL ? 'أدخل رقم الهاتف' : 'Enter phone'}
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  activeOpacity={0.7}>
                  <Text style={[styles.cancelButtonText, isRTL && styles.cancelButtonTextRTL]}>
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSaveChanges}
                  disabled={isLoading}
                  activeOpacity={0.7}>
                  <Text style={[styles.saveButtonText, isRTL && styles.saveButtonTextRTL]}>
                    {isLoading ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ التغييرات' : 'Save Changes')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Change Password Section */}
        <View style={styles.passwordSection}>
          <View style={styles.passwordHeader}>
            <View style={styles.passwordIconContainer}>
              <Text style={styles.passwordIcon}>🔒</Text>
            </View>
            <View style={styles.passwordContent}>
              <Text style={[styles.passwordTitle, isRTL && styles.passwordTitleRTL]}>
                {isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
              </Text>
              <Text style={[styles.passwordHint, isRTL && styles.passwordHintRTL]}>
                {isRTL 
                  ? 'كلمة المرور الخاصة بك آمنة ومشفرة. انقر على "تغيير كلمة المرور" لتحديثها.' 
                  : 'Your password is secure and encrypted. Click "Change Password" to update it.'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.changePasswordButton}
              onPress={handleChangePassword}
              activeOpacity={0.7}>
              <Text style={[styles.changePasswordButtonText, isRTL && styles.changePasswordButtonTextRTL]}>
                {isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delete Account Section */}
        <View style={[styles.passwordSection, { backgroundColor: '#fff5f5', borderColor: '#ffcccc' }]}>
          <View style={styles.passwordHeader}>
            <View style={styles.passwordIconContainer}>
              <Text style={styles.passwordIcon}>⚠️</Text>
            </View>
            <View style={styles.passwordContent}>
              <Text style={[styles.passwordTitle, isRTL && styles.passwordTitleRTL, { color: '#d32f2f' }]}>
                {isRTL ? 'حذف الحساب' : 'Delete Account'}
              </Text>
              <Text style={[styles.passwordHint, isRTL && styles.passwordHintRTL]}>
                {isRTL 
                  ? 'حذف حسابك بشكل دائم. هذا الإجراء لا يمكن التراجع عنه' 
                  : 'Permanently delete your account. This action cannot be undone'}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.changePasswordButton, { backgroundColor: '#d32f2f' }]}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}>
              <Text style={[styles.changePasswordButtonText, isRTL && styles.changePasswordButtonTextRTL]}>
                {isRTL ? 'حذف الحساب' : 'Delete Account'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
        message={isRTL 
          ? 'لتأكيد حذف حسابك، يرجى إدخال كلمة المرور الخاصة بك. هذا الإجراء لا يمكن التراجع عنه'
          : 'To confirm account deletion, please enter your password. This action cannot be undone'}
        onConfirm={confirmDeleteAccount}
        onCancel={() => setShowDeleteAccountModal(false)}
      />
    </View>
  );
};

export default EditProfile;
