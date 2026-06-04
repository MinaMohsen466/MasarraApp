import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import { styles } from './styles';
import {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { CustomAlert } from '../CustomAlert/CustomAlert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';

const Addresses: React.FC<{ onBack?: () => void; token?: string | null }> = ({
  onBack,
  token,
}) => {
  const insets = useSafeAreaInsets();
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    street: '',
    houseNumber: '',
    floorNumber: '',
    city: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<any>(null);
  const [activeField, setActiveField] = useState<string | null>(null);
  const pageStatusBar = (
    <StatusBar
      backgroundColor={colors.primary}
      barStyle="dark-content"
      translucent={false}
    />
  );

  useEffect(() => {
    const doLoad = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await fetchAddresses(token);
        setAddresses(data);
      } catch {
        // Error handling
      } finally {
        setLoading(false);
      }
    };
    doLoad();
  }, [token]);

  const handleSubmit = async () => {
    if (!token) return;
    if (!form.name || !form.street || !form.city) return;
    setLoading(true);
    try {
      if (editingId) {
        const updated = await updateAddress(token, editingId, form as any);
        setAddresses(prev =>
          prev.map(a => (a._id === updated._id ? updated : a)),
        );
      } else {
        const created = await createAddress(token, {
          ...form,
          isDefault: addresses.length === 0,
        });
        setAddresses(prev => [created, ...prev]);
      }

      setShowForm(false);
      setForm({
        name: '',
        street: '',
        houseNumber: '',
        floorNumber: '',
        city: '',
      });
      setEditingId(null);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (addr: any) => {
    setEditingId(addr._id);
    setForm({
      name: addr.name || '',
      street: addr.street || '',
      houseNumber: addr.houseNumber || '',
      floorNumber: addr.floorNumber || '',
      city: addr.city || '',
    });
    setShowForm(true);
  };

  const confirmDelete = (addr: any) => {
    setAddressToDelete(addr);
    setShowDeleteAlert(true);
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    setLoading(true);
    try {
      await deleteAddress(token, id);
      setAddresses(prev => prev.filter(a => a._id !== id));
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!token) return;
    setLoading(true);
    try {
      await setDefaultAddress(token, id);
      // Server returns address set as default; refresh list by reloading or updating items
      // Easiest: refetch addresses
      const data = await fetchAddresses(token);
      setAddresses(data);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  // Render empty-state similar to screenshot when no addresses
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.primary }}>
        {pageStatusBar}
        <View style={{ height: insets.top, backgroundColor: colors.primary }} />
        <View style={[styles.addressesContainer, { position: 'relative', flex: 1 }]}>
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
                {isRTL ? 'العناوين' : 'Addresses'}
              </Text>
              <View style={styles.headerSpacer} />
            </View>
          </View>

          {/* Curved Wave Divider */}
          <View style={styles.profileCurveDivider}>
            <Svg height="30" width="100%" viewBox="0 0 375 30" preserveAspectRatio="none">
              <Path d="M0,20 C100,40 250,0 375,20 L375,30 L0,30 Z" fill={colors.background} />
            </Svg>
          </View>

          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#00a19c" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      {pageStatusBar}
      <View style={{ height: insets.top, backgroundColor: colors.primary }} />
      <View style={[styles.addressesContainer, { position: 'relative', flex: 1 }]}>
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
              {isRTL ? 'العناوين' : 'Addresses'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* Curved Wave Divider */}
        <View style={styles.profileCurveDivider}>
          <Svg height="30" width="100%" viewBox="0 0 375 30" preserveAspectRatio="none">
            <Path d="M0,20 C100,40 250,0 375,20 L375,30 L0,30 Z" fill={colors.background} />
          </Svg>
        </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!addresses || addresses.length === 0 ? (
              <View style={styles.emptyBox}>
                <View style={styles.emptyIconWrap}>
                  <Icon
                    name="map-outline"
                    size={36}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {isRTL ? 'لم تضف عنوان بعد' : 'No addresses added yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {isRTL
                    ? 'أضف عناوينك لتسريع حجز الخدمات وتسهيلها'
                    : 'Add your addresses to make booking services faster and easier.'}
                </Text>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    setForm({
                      name: '',
                      street: '',
                      houseNumber: '',
                      floorNumber: '',
                      city: '',
                    });
                    setEditingId(null);
                    setShowForm(true);
                  }}
                >
                  <Text style={styles.primaryButtonText}>
                    {isRTL
                      ? '+ إضافة عنوانك الأول'
                      : '+ Add Your First Address'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {addresses.map(addr => (
                  <View key={addr._id} style={styles.addressCard}>
                    <View style={styles.addressCardInner}>
                      <View style={[styles.addressCardHeader, isRTL && styles.addressCardHeaderRTL]}>
                        <View style={[styles.addressHeaderLeft, isRTL && styles.addressHeaderLeftRTL]}>
                          {/* Location Pin Icon */}
                          <View style={[styles.addressIconContainer, isRTL && styles.addressIconContainerRTL]}>
                            <Icon
                              name="location-outline"
                              size={18}
                              color={colors.primary}
                            />
                          </View>
                          <View style={[styles.addressNameSection, isRTL && styles.addressNameSectionRTL]}>
                            <Text style={[styles.addressName, isRTL && styles.addressNameRTL]}>
                              {addr.name}
                            </Text>
                            {addr.isDefault && (
                              <View style={styles.defaultBadge}>
                                <Text style={styles.defaultBadgeText}>
                                  {isRTL ? 'الافتراضي' : 'Default'}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Actions: Edit & Delete */}
                        <View style={[styles.addressActionButtons, isRTL && styles.addressActionButtonsRTL]}>
                          <TouchableOpacity
                            onPress={() => startEdit(addr)}
                            style={[styles.cardIconButton, styles.editIconButton]}
                            activeOpacity={0.7}
                          >
                            <Icon name="create-outline" size={16} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => confirmDelete(addr)}
                            style={[styles.cardIconButton, styles.deleteIconButton]}
                            activeOpacity={0.7}
                          >
                            <Icon name="trash-outline" size={16} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Address Details Lines */}
                      <View style={[styles.addressDetailsContainer, isRTL && styles.addressDetailsContainerRTL]}>
                        <View style={[styles.addressLineWithIcon, isRTL && styles.addressLineWithIconRTL]}>
                          <Icon name="home-outline" size={14} color="#9E9E9E" style={{ marginHorizontal: 2 }} />
                          <Text style={[styles.addressLineText, isRTL && styles.addressLineTextRTL]}>
                            {addr.street} {addr.houseNumber} {addr.floorNumber ? `(طابق ${addr.floorNumber})` : ''}
                          </Text>
                        </View>
                        <View style={[styles.addressLineWithIcon, isRTL && styles.addressLineWithIconRTL]}>
                          <Icon name="location-outline" size={14} color="#9E9E9E" style={{ marginHorizontal: 2 }} />
                          <Text style={[styles.addressLineText, isRTL && styles.addressLineTextRTL]}>
                            {addr.city}
                          </Text>
                        </View>

                        {/* Set Default Action */}
                        {!addr.isDefault && (
                          <View style={[styles.setDefaultContainer, isRTL && styles.setDefaultContainerRTL]}>
                            <TouchableOpacity
                              onPress={() => handleSetDefault(addr._id)}
                              style={styles.setDefaultLink}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.setDefaultLinkText}>
                                {isRTL ? 'جعله افتراضي' : 'Set Default'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))}

                {/* Add button below the address list */}
                <TouchableOpacity
                  style={styles.bottomAddButton}
                  onPress={() => {
                    setForm({
                      name: '',
                      street: '',
                      houseNumber: '',
                      floorNumber: '',
                      city: '',
                    });
                    setEditingId(null);
                    setShowForm(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Icon name="add-circle-outline" size={20} color={colors.textWhite} />
                  <Text style={styles.bottomAddButtonText}>
                    {isRTL ? 'إضافة عنوان جديد' : 'Add New Address'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>

        {/* Form Modal */}
        <Modal
          visible={showForm}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {isRTL
                    ? editingId
                      ? 'تعديل العنوان'
                      : 'إضافة عنوان جديد'
                    : editingId
                    ? 'Edit Address'
                    : 'Add New Address'}
                </Text>
              </View>
              <View style={styles.modalBody}>
                <View
                  style={[
                    styles.modalInputWrapper,
                    isRTL && styles.modalInputWrapperRTL,
                    activeField === 'name' && styles.modalInputWrapperActive,
                  ]}
                >
                  <Icon
                    name="pricetag-outline"
                    size={18}
                    color={activeField === 'name' ? colors.primary : '#94A3B8'}
                    style={[styles.modalInputIcon, isRTL && styles.modalInputIconRTL]}
                  />
                  <View style={[styles.modalInputDivider, isRTL && styles.modalInputDividerRTL]} />
                  <TextInput
                    placeholder={isRTL ? 'الاسم (مثل: المنزل، العمل)' : 'Name (e.g. Home, Work)'}
                    value={form.name}
                    onChangeText={t => setForm(s => ({ ...s, name: t }))}
                    style={[styles.modalTextInput, isRTL && styles.modalTextInputRTL]}
                    placeholderTextColor="#94A3B8"
                    onFocus={() => setActiveField('name')}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
                <View
                  style={[
                    styles.modalInputWrapper,
                    isRTL && styles.modalInputWrapperRTL,
                    activeField === 'street' && styles.modalInputWrapperActive,
                  ]}
                >
                  <Icon
                    name="home-outline"
                    size={18}
                    color={activeField === 'street' ? colors.primary : '#94A3B8'}
                    style={[styles.modalInputIcon, isRTL && styles.modalInputIconRTL]}
                  />
                  <View style={[styles.modalInputDivider, isRTL && styles.modalInputDividerRTL]} />
                  <TextInput
                    placeholder={isRTL ? 'الشارع' : 'Street'}
                    value={form.street}
                    onChangeText={t => setForm(s => ({ ...s, street: t }))}
                    style={[styles.modalTextInput, isRTL && styles.modalTextInputRTL]}
                    placeholderTextColor="#94A3B8"
                    onFocus={() => setActiveField('street')}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
                <View
                  style={[
                    styles.modalInputWrapper,
                    isRTL && styles.modalInputWrapperRTL,
                    activeField === 'houseNumber' && styles.modalInputWrapperActive,
                  ]}
                >
                  <Icon
                    name="business-outline"
                    size={18}
                    color={activeField === 'houseNumber' ? colors.primary : '#94A3B8'}
                    style={[styles.modalInputIcon, isRTL && styles.modalInputIconRTL]}
                  />
                  <View style={[styles.modalInputDivider, isRTL && styles.modalInputDividerRTL]} />
                  <TextInput
                    placeholder={isRTL ? 'رقم المنزل' : 'House Number'}
                    value={form.houseNumber}
                    onChangeText={t => setForm(s => ({ ...s, houseNumber: t }))}
                    style={[styles.modalTextInput, isRTL && styles.modalTextInputRTL]}
                    placeholderTextColor="#94A3B8"
                    onFocus={() => setActiveField('houseNumber')}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
                <View
                  style={[
                    styles.modalInputWrapper,
                    isRTL && styles.modalInputWrapperRTL,
                    activeField === 'floorNumber' && styles.modalInputWrapperActive,
                  ]}
                >
                  <Icon
                    name="layers-outline"
                    size={18}
                    color={activeField === 'floorNumber' ? colors.primary : '#94A3B8'}
                    style={[styles.modalInputIcon, isRTL && styles.modalInputIconRTL]}
                  />
                  <View style={[styles.modalInputDivider, isRTL && styles.modalInputDividerRTL]} />
                  <TextInput
                    placeholder={isRTL ? 'رقم الطابق' : 'Floor Number'}
                    value={form.floorNumber}
                    onChangeText={t => setForm(s => ({ ...s, floorNumber: t }))}
                    style={[styles.modalTextInput, isRTL && styles.modalTextInputRTL]}
                    placeholderTextColor="#94A3B8"
                    onFocus={() => setActiveField('floorNumber')}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
                <View
                  style={[
                    styles.modalInputWrapper,
                    isRTL && styles.modalInputWrapperRTL,
                    activeField === 'city' && styles.modalInputWrapperActive,
                  ]}
                >
                  <Icon
                    name="location-outline"
                    size={18}
                    color={activeField === 'city' ? colors.primary : '#94A3B8'}
                    style={[styles.modalInputIcon, isRTL && styles.modalInputIconRTL]}
                  />
                  <View style={[styles.modalInputDivider, isRTL && styles.modalInputDividerRTL]} />
                  <TextInput
                    placeholder={isRTL ? 'المدينة' : 'City'}
                    value={form.city}
                    onChangeText={t => setForm(s => ({ ...s, city: t }))}
                    style={[styles.modalTextInput, isRTL && styles.modalTextInputRTL]}
                    placeholderTextColor="#94A3B8"
                    onFocus={() => setActiveField('city')}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
              </View>
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalSecondaryButton}
                  onPress={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                >
                  <Text style={styles.modalSecondaryButtonText}>
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalPrimaryButton}
                  onPress={handleSubmit}
                >
                  <Text style={styles.modalPrimaryButtonText}>
                    {isRTL
                      ? editingId
                        ? 'حفظ التعديلات'
                        : 'إضافة'
                      : editingId
                      ? 'Save'
                      : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={showDeleteAlert}
        title={isRTL ? 'حذف العنوان' : 'Delete address'}
        message={
          isRTL
            ? 'هل أنت متأكد من رغبتك في حذف هذا العنوان؟'
            : 'Are you sure you want to delete this address?'
        }
        buttons={[
          { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
          {
            text: isRTL ? 'حذف' : 'Delete',
            style: 'destructive',
            onPress: () => {
              if (addressToDelete) {
                handleDelete(addressToDelete._id);
              }
            },
          },
        ]}
        onClose={() => {
          setShowDeleteAlert(false);
          setAddressToDelete(null);
        }}
      />
        </View>
      </View>
    );
};

export default Addresses;
