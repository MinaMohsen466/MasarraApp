import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fetchAddresses, createAddress } from '../../services/api';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';

interface Address {
    _id: string;
    name: string;
    street: string;
    houseNumber?: string;
    floorNumber?: string;
    city: string;
    isDefault?: boolean;
}

interface AddressSelectionProps {
    visible: boolean;
    onClose: () => void;
    onSelectAddress: (address: Address) => void;
    onAddAddress: () => void;
    token: string;
}

const AddressSelection: React.FC<AddressSelectionProps> = ({
    visible,
    onClose,
    onSelectAddress,
    // onAddAddress kept for backwards compatibility
    onAddAddress: _onAddAddress,
    token,
}) => {
    const { isRTL } = useLanguage();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

    // New address form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({
        name: '',
        street: '',
        houseNumber: '',
        floorNumber: '',
        city: '',
    });
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (visible && token) {
            loadAddresses();
            setShowAddForm(false);
            setNewAddress({ name: '', street: '', houseNumber: '', floorNumber: '', city: '' });
            setFormError('');
        }
    }, [visible, token]);

    const loadAddresses = async () => {
        setLoading(true);
        try {
            const data = await fetchAddresses(token);
            setAddresses(data);
            const defaultAddr = data.find((addr: Address) => addr.isDefault);
            if (defaultAddr) {
                setSelectedAddressId(defaultAddr._id);
            }
        } catch {
            // Error handling
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (!selectedAddressId) return;
        const selectedAddress = addresses.find(addr => addr._id === selectedAddressId);
        if (selectedAddress) {
            onSelectAddress(selectedAddress);
        }
    };

    const handleAddNewAddress = async () => {
        if (!newAddress.name.trim()) {
            setFormError(isRTL ? 'يرجى إدخال اسم العنوان' : 'Please enter address name');
            return;
        }
        if (!newAddress.street.trim()) {
            setFormError(isRTL ? 'يرجى إدخال الشارع' : 'Please enter street');
            return;
        }
        if (!newAddress.city.trim()) {
            setFormError(isRTL ? 'يرجى إدخال المدينة' : 'Please enter city');
            return;
        }

        setIsAddingAddress(true);
        setFormError('');

        try {
            const createdAddress = await createAddress(token, {
                name: newAddress.name.trim(),
                street: newAddress.street.trim(),
                houseNumber: newAddress.houseNumber.trim() || undefined,
                floorNumber: newAddress.floorNumber.trim() || undefined,
                city: newAddress.city.trim(),
                isDefault: addresses.length === 0,
            });

            setAddresses(prev => [...prev, createdAddress]);
            setSelectedAddressId(createdAddress._id);
            setShowAddForm(false);
            setNewAddress({ name: '', street: '', houseNumber: '', floorNumber: '', city: '' });
        } catch (error: any) {
            setFormError(error.message || (isRTL ? 'فشل في إضافة العنوان' : 'Failed to add address'));
        } finally {
            setIsAddingAddress(false);
        }
    };

    const renderAddAddressForm = () => (
        <View style={styles.formContainer}>
            <View style={styles.formHeader}>
                <TouchableOpacity onPress={() => setShowAddForm(false)} style={styles.backButton}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path
                            d={isRTL ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"}
                            stroke={colors.primary}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </Svg>
                </TouchableOpacity>
                <Text style={[styles.formTitle, isRTL && styles.titleRTL]}>
                    {isRTL ? 'إضافة عنوان جديد' : 'Add New Address'}
                </Text>
                <View style={{ width: 30 }} />
            </View>

            <ScrollView
                style={styles.formScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 30 }}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={[styles.inputLabel, isRTL && styles.inputLabelRTL]}>
                    {isRTL ? 'اسم العنوان *' : 'Address Name *'}
                </Text>
                <TextInput
                    style={[styles.input, isRTL && styles.inputRTL]}
                    placeholder={isRTL ? 'مثال: المنزل، العمل' : 'e.g. Home, Work'}
                    placeholderTextColor="#999"
                    value={newAddress.name}
                    onChangeText={(text) => setNewAddress(prev => ({ ...prev, name: text }))}
                />

                <Text style={[styles.inputLabel, isRTL && styles.inputLabelRTL]}>
                    {isRTL ? 'الشارع *' : 'Street *'}
                </Text>
                <TextInput
                    style={[styles.input, isRTL && styles.inputRTL]}
                    placeholder={isRTL ? 'اسم الشارع' : 'Street name'}
                    placeholderTextColor="#999"
                    value={newAddress.street}
                    onChangeText={(text) => setNewAddress(prev => ({ ...prev, street: text }))}
                />

                <Text style={[styles.inputLabel, isRTL && styles.inputLabelRTL]}>
                    {isRTL ? 'رقم المنزل' : 'House Number'}
                </Text>
                <TextInput
                    style={[styles.input, isRTL && styles.inputRTL]}
                    placeholder={isRTL ? 'اختياري' : 'Optional'}
                    placeholderTextColor="#999"
                    value={newAddress.houseNumber}
                    onChangeText={(text) => setNewAddress(prev => ({ ...prev, houseNumber: text }))}
                />

                <Text style={[styles.inputLabel, isRTL && styles.inputLabelRTL]}>
                    {isRTL ? 'رقم الطابق' : 'Floor Number'}
                </Text>
                <TextInput
                    style={[styles.input, isRTL && styles.inputRTL]}
                    placeholder={isRTL ? 'اختياري' : 'Optional'}
                    placeholderTextColor="#999"
                    value={newAddress.floorNumber}
                    onChangeText={(text) => setNewAddress(prev => ({ ...prev, floorNumber: text }))}
                />

                <Text style={[styles.inputLabel, isRTL && styles.inputLabelRTL]}>
                    {isRTL ? 'المدينة *' : 'City *'}
                </Text>
                <TextInput
                    style={[styles.input, isRTL && styles.inputRTL]}
                    placeholder={isRTL ? 'المدينة' : 'City'}
                    placeholderTextColor="#999"
                    value={newAddress.city}
                    onChangeText={(text) => setNewAddress(prev => ({ ...prev, city: text }))}
                />

                {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
            </ScrollView>

            <View style={styles.formFooter}>
                <TouchableOpacity
                    style={[styles.saveButton, isAddingAddress && styles.saveButtonDisabled]}
                    onPress={handleAddNewAddress}
                    disabled={isAddingAddress}
                >
                    {isAddingAddress ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.saveButtonText}>
                            {isRTL ? 'حفظ العنوان' : 'Save Address'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.overlay}
            >
                <View style={styles.container}>
                    {showAddForm ? renderAddAddressForm() : (
                        <>
                            <View style={styles.header}>
                                <Text style={[styles.title, isRTL && styles.titleRTL]}>
                                    {isRTL ? 'اختر عنوان التسليم' : 'Select Delivery Address'}
                                </Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <Text style={styles.closeButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                </View>
                            ) : addresses.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={[styles.emptyText, isRTL && styles.emptyTextRTL]}>
                                        {isRTL ? 'لا توجد عناوين محفوظة.' : 'No saved addresses.'}
                                    </Text>
                                    <TouchableOpacity style={styles.addPrimaryButton} onPress={() => setShowAddForm(true)}>
                                        <Text style={styles.addPrimaryButtonText}>
                                            + {isRTL ? 'إضافة عنوان' : 'Add Address'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.listContainer}>
                                    <ScrollView style={styles.addressList} showsVerticalScrollIndicator={false}>
                                        {addresses.map(address => (
                                            <TouchableOpacity
                                                key={address._id}
                                                style={[styles.addressCard, selectedAddressId === address._id && styles.addressCardSelected]}
                                                onPress={() => setSelectedAddressId(address._id)}
                                            >
                                                <View style={styles.radioContainer}>
                                                    <View style={[styles.radioOuter, selectedAddressId === address._id && styles.radioOuterSelected]}>
                                                        {selectedAddressId === address._id && <View style={styles.radioInner} />}
                                                    </View>
                                                </View>
                                                <View style={styles.addressDetails}>
                                                    <View style={[styles.nameRow, isRTL && { flexDirection: 'row-reverse' }]}>
                                                        <Text style={[styles.addressName, isRTL && styles.addressNameRTL]}>{address.name}</Text>
                                                        {address.isDefault && (
                                                            <View style={styles.defaultBadge}>
                                                                <Text style={styles.defaultBadgeText}>{isRTL ? 'افتراضي' : 'Default'}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <Text style={[styles.addressText, isRTL && styles.addressTextRTL]}>
                                                        {address.street}
                                                        {address.houseNumber && `, ${isRTL ? 'منزل' : 'House'} ${address.houseNumber}`}
                                                        {address.floorNumber && `, ${isRTL ? 'طابق' : 'Floor'} ${address.floorNumber}`}
                                                    </Text>
                                                    <Text style={[styles.addressText, isRTL && styles.addressTextRTL]}>{address.city}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}

                                        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(true)}>
                                            <Text style={styles.addButtonText}>+ {isRTL ? 'إضافة عنوان جديد' : 'Add New Address'}</Text>
                                        </TouchableOpacity>
                                    </ScrollView>
                                </View>
                            )}

                            <View style={styles.footer}>
                                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                    <Text style={styles.cancelButtonText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.confirmButton, (!selectedAddressId || addresses.length === 0) && styles.confirmButtonDisabled]}
                                    onPress={handleConfirm}
                                    disabled={!selectedAddressId || addresses.length === 0}
                                >
                                    <Text style={styles.confirmButtonText}>{isRTL ? 'تأكيد الحجز' : 'Confirm Booking'}</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    container: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, minHeight: '40%', maxHeight: '80%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    title: { fontSize: 16, fontWeight: '700', color: colors.textDark },
    titleRTL: { textAlign: 'right' },
    closeButton: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
    closeButtonText: { fontSize: 24, color: colors.textSecondary },
    loadingContainer: { padding: 40, alignItems: 'center' },
    emptyContainer: { padding: 40, alignItems: 'center' },
    emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
    emptyTextRTL: { textAlign: 'right' },
    addPrimaryButton: { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10, marginTop: 20 },
    addPrimaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    listContainer: { flex: 1, minHeight: 0 },
    addressList: { paddingHorizontal: 20, paddingTop: 5 },
    addressCard: { flexDirection: 'row', backgroundColor: colors.backgroundLight, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 2, borderColor: 'transparent' },
    addressCardSelected: { borderColor: colors.primary, backgroundColor: '#E8F5F4' },
    radioContainer: { marginRight: 12, paddingTop: 2 },
    radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D0D0D0', justifyContent: 'center', alignItems: 'center' },
    radioOuterSelected: { borderColor: colors.primary },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
    addressDetails: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 },
    addressName: { fontSize: 14, fontWeight: '700', color: colors.textDark },
    addressNameRTL: { textAlign: 'right' },
    addressText: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
    addressTextRTL: { textAlign: 'right' },
    defaultBadge: { backgroundColor: colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    defaultBadgeText: { fontSize: 9, fontWeight: '600', color: '#fff' },
    addButton: { backgroundColor: colors.backgroundLight, paddingVertical: 12, paddingHorizontal: 16, marginTop: 8, marginBottom: 15, borderRadius: 10, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed' },
    addButtonText: { color: colors.primary, fontSize: 13, fontWeight: '600', textAlign: 'center' },
    footer: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    cancelButton: { flex: 1, backgroundColor: '#F0F0F0', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    cancelButtonText: { fontSize: 14, fontWeight: '600', color: colors.textDark },
    confirmButton: { flex: 2, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    confirmButtonDisabled: { backgroundColor: colors.textSecondary, opacity: 0.5 },
    confirmButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
    // Form styles
    formContainer: { flex: 1 },
    formHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    backButton: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
    formTitle: { fontSize: 16, fontWeight: '700', color: colors.textDark },
    formScroll: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textDark, marginBottom: 6, marginTop: 14 },
    inputLabelRTL: { textAlign: 'right' },
    input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.textDark, borderWidth: 1.5, borderColor: '#E0E0E0' },
    inputRTL: { textAlign: 'right' },
    errorText: { color: '#FF4444', fontSize: 13, marginTop: 16, textAlign: 'center' },
    formFooter: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    saveButton: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

export default AddressSelection;
