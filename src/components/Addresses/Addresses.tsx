import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Image, Alert, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { styles } from './styles';
import { fetchAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '../../services/api';

const Addresses: React.FC<{ onBack?: () => void; token?: string | null }> = ({ onBack, token }) => {
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', street: '', houseNumber: '', floorNumber: '', city: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const doLoad = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await fetchAddresses(token);
        setAddresses(data);
      } catch (err) {
        console.error(err);
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
        setAddresses(prev => prev.map(a => a._id === updated._id ? updated : a));
      } else {
        const created = await createAddress(token, { ...form, isDefault: addresses.length === 0 });
        setAddresses(prev => [created, ...prev]);
      }

      setShowForm(false);
      setForm({ name: '', street: '', houseNumber: '', floorNumber: '', city: '' });
      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (addr: any) => {
    setEditingId(addr._id);
    setForm({ name: addr.name || '', street: addr.street || '', houseNumber: addr.houseNumber || '', floorNumber: addr.floorNumber || '', city: addr.city || '' });
    setShowForm(true);
  };

  const confirmDelete = (addr: any) => {
    Alert.alert('Delete address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => handleDelete(addr._id) }
    ]);
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    setLoading(true);
    try {
      await deleteAddress(token, id);
      setAddresses(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Render empty-state similar to screenshot when no addresses
  if (loading) {
    return (
      <View style={styles.addressesContainer}>
        <ActivityIndicator size="large" color="#1677FF" />
      </View>
    );
  }

  if (!addresses || addresses.length === 0) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
            <View style={styles.addressesContainer}>
              {/* header: back icon (left) + add button (right) */}
              <View style={styles.headerRow}>
                <View style={styles.headerLeftRow}>
                  {onBack && (
                    <TouchableOpacity onPress={onBack} style={styles.backButtonInline}>
                      <Text style={styles.backButtonTextInline}>{'‹'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
                  <Text style={styles.addButtonText}>+ Add Address</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.emptyBox}>
                <View style={styles.emptyIconWrap}>
                  <Image source={require('../../imgs/user.png')} style={styles.emptyIcon} />
                </View>
                <Text style={styles.emptyTitle}>No addresses added yet</Text>
                <Text style={styles.emptySubtitle}>Add your addresses to make booking services faster and easier.</Text>

                <TouchableOpacity style={styles.primaryButton} onPress={() => setShowForm(true)}>
                  <Text style={styles.primaryButtonText}>+ Add Your First Address</Text>
                </TouchableOpacity>
              </View>

              {showForm && (
                <View style={styles.formContainer}>
                  <TextInput placeholder="Name" value={form.name} onChangeText={(t) => setForm(s => ({ ...s, name: t }))} style={styles.input} />
                  <TextInput placeholder="Street" value={form.street} onChangeText={(t) => setForm(s => ({ ...s, street: t }))} style={styles.input} />
                  <TextInput placeholder="House Number" value={form.houseNumber} onChangeText={(t) => setForm(s => ({ ...s, houseNumber: t }))} style={styles.input} />
                  <TextInput placeholder="Floor Number" value={form.floorNumber} onChangeText={(t) => setForm(s => ({ ...s, floorNumber: t }))} style={styles.input} />
                  <TextInput placeholder="City" value={form.city} onChangeText={(t) => setForm(s => ({ ...s, city: t }))} style={styles.input} />

                  <View style={styles.formButtonsRow}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowForm(false)}>
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButtonSmall} onPress={handleSubmit}>
                      <Text style={styles.primaryButtonTextSmall}>Add Address</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
          <View style={styles.addressesContainer}>
            {/* header: back icon (left) + add button (right) */}
            <View style={styles.headerRow}>
              <View style={styles.headerLeftRow}>
                {onBack && (
                  <TouchableOpacity onPress={onBack} style={styles.backButtonInline}>
                    <Text style={styles.backButtonTextInline}>{'‹'}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
                <Text style={styles.addButtonText}>+ Add Address</Text>
              </TouchableOpacity>
            </View>

            {addresses.map(addr => (
              <View key={addr._id} style={styles.addressCard}>
                <Text style={styles.addressName}>{addr.name}</Text>
                <Text style={styles.addressLine}>{addr.street} {addr.houseNumber}</Text>
                <Text style={styles.addressLine}>{addr.city}</Text>
                <View style={styles.actionsRow}>
                  {addr.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => handleSetDefault(addr._id)} style={styles.setDefaultLink}>
                      <Text style={styles.setDefaultLinkText}>Set as Default</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity onPress={() => startEdit(addr)} style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => confirmDelete(addr)} style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {showForm && (
              <View style={styles.formContainer}>
                <TextInput placeholder="Name" value={form.name} onChangeText={(t) => setForm(s => ({ ...s, name: t }))} style={styles.input} />
                <TextInput placeholder="Street" value={form.street} onChangeText={(t) => setForm(s => ({ ...s, street: t }))} style={styles.input} />
                <TextInput placeholder="House Number" value={form.houseNumber} onChangeText={(t) => setForm(s => ({ ...s, houseNumber: t }))} style={styles.input} />
                <TextInput placeholder="Floor Number" value={form.floorNumber} onChangeText={(t) => setForm(s => ({ ...s, floorNumber: t }))} style={styles.input} />
                <TextInput placeholder="City" value={form.city} onChangeText={(t) => setForm(s => ({ ...s, city: t }))} style={styles.input} />

                <View style={styles.formButtonsRow}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowForm(false)}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButtonSmall} onPress={handleSubmit}>
                    <Text style={styles.primaryButtonTextSmall}>Add Address</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Addresses;
