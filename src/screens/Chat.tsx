import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';
import { API_BASE_URL } from '../config/api.config';
import ChatConversation from './ChatConversation';

interface ChatProps {
  onBack?: () => void;
}

const Chat: React.FC<ChatProps> = ({ onBack }) => {
  const { isRTL } = useLanguage();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminId();
  }, []);

  const loadAdminId = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        console.log('[Chat] No token found');
        setAdminId('admin'); // Fallback to 'admin' string
        setLoading(false);
        return;
      }

      console.log('[Chat] Fetching admin user...');
      const response = await fetch(
        `${API_BASE_URL}/api/auth/users?role=admin`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        const admins = Array.isArray(result) ? result : result.data || [];
        console.log('[Chat] Admin users:', admins);
        if (admins?.length > 0) {
          setAdminId(admins[0]._id);
          console.log('[Chat] Admin ID set to:', admins[0]._id);
        } else {
          console.log('[Chat] No admins found, using fallback');
          setAdminId('admin');
        }
      } else {
        console.log('[Chat] Failed to fetch admin:', response.status);
        setAdminId('admin'); // Fallback to 'admin' string
      }
    } catch (error) {
      console.error('[Chat] Error loading admin:', error);
      setAdminId('admin'); // Fallback to 'admin' string
    } finally {
      setLoading(false);
    }
  };

  // Show loading while fetching admin ID
  if (loading || !adminId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  // Show chat conversation with admin
  return (
    <ChatConversation
      onBack={onBack}
      vendorId={adminId}
      vendorName={isRTL ? 'الدعم الفني' : 'Support'}
      vendorImage={undefined}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default Chat;
