import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';
import { API_BASE_URL } from '../config/api.config';
import ChatConversation from './ChatConversation';

interface ChatProps {
  onBack?: () => void;
}

const Chat: React.FC<ChatProps> = ({ onBack }) => {
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAdminId();
  }, []);

  const loadAdminId = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        console.log('❌ No token found');
        setError('No token');
        setLoading(false);
        return;
      }

      // Fetch admin user
      const response = await fetch(`${API_BASE_URL}/api/auth/users?role=admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const admins = Array.isArray(result) ? result : (result.data || []);
        
        if (admins && admins.length > 0) {
          const admin = admins[0];
          console.log('✅ Admin found:', admin.name);
          setAdminId(admin._id);
        } else {
          console.error('❌ No admin found');
          setError('No admin found');
        }
      } else {
        console.error('❌ Failed to load admin:', response.status);
        setError('Failed to load admin');
      }
    } catch (error) {
      console.error('❌ Error loading admin:', error);
      setError('Error loading admin');
    } finally {
      setLoading(false);
    }
  };

  // If loading or error, show loading screen
  if (loading || error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>
              {isRTL ? '›' : '‹'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isRTL ? 'المحادثة' : 'Chat'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <ActivityIndicator size="large" color="#00695C" />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // If admin found, show chat conversation directly
  if (adminId) {
    return (
      <ChatConversation
        onBack={onBack}
        vendorId={adminId}
        vendorName="Admin"
        vendorImage={undefined}
      />
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00695C',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },
});

export default Chat;