import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';
import { API_BASE_URL } from '../config/api.config';
import { getImageUrl } from '../services/api';
import ChatConversation from './ChatConversation';

interface ChatMessage {
  _id: string;
  sender: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  message: string;
  createdAt: string;
}

interface ChatConversation {
  _id: string;
  vendor: {
    _id: string;
    name: string;
    profilePicture?: string;
    vendorProfile?: {
      businessName?: string;
      businessName_ar?: string;
    };
  };
  customer: {
    _id: string;
    name: string;
  };
  lastMessage?: ChatMessage;
  unreadCount: number;
  updatedAt: string;
}

interface ChatProps {
  onBack?: () => void;
  vendorId?: string; // If provided, open chat with this vendor directly
}

const Chat: React.FC<ChatProps> = ({ onBack, vendorId }) => {
  const { isRTL } = useLanguage();
  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<{ vendorId: string; vendorName: string; vendorImage?: string } | null>(null);

  useEffect(() => {
    loadChats();
    
    // Auto-refresh chats list every 5 seconds when not in a conversation
    const interval = setInterval(() => {
      if (!selectedChat) {
        loadChats(true); // Silent refresh
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [selectedChat]);

  const loadChats = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        console.log('No token found');
        if (!silent) {
          setLoading(false);
        }
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Chats response:', result);
        
        // Handle both formats: direct array or { success, data }
        const chatsData = result.data || result;
        
        // Transform chats to match our interface
        const transformedChats = chatsData.map((chat: any) => ({
          _id: chat._id,
          vendor: {
            _id: chat.vendor?._id || chat.vendor,
            name: chat.vendor?.name || 'Vendor',
            profilePicture: chat.vendor?.profilePicture,
            vendorProfile: chat.vendor?.vendorProfile
          },
          customer: {
            _id: chat.user?._id || chat.user,
            name: chat.user?.name || 'Customer'
          },
          lastMessage: chat.messages && chat.messages.length > 0 
            ? {
                _id: chat.messages[chat.messages.length - 1]._id,
                sender: chat.messages[chat.messages.length - 1].sender,
                message: chat.messages[chat.messages.length - 1].content || chat.lastMessage || '',
                createdAt: chat.messages[chat.messages.length - 1].timestamp || chat.lastMessageAt
              }
            : chat.lastMessage 
              ? {
                  _id: 'last',
                  sender: { _id: '', name: '' },
                  message: chat.lastMessage,
                  createdAt: chat.lastMessageAt
                }
              : undefined,
          unreadCount: chat.unreadCount?.user || 0,
          updatedAt: chat.lastMessageAt || chat.createdAt
        }));
        
        console.log('✅ Transformed chats:', transformedChats);
        setChats(transformedChats);
      } else {
        console.error('❌ Failed to load chats:', response.status);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return isRTL ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return isRTL ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return isRTL ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
    } else {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      return `${day}/${month}`;
    }
  };

  const getVendorName = (vendor: ChatConversation['vendor']) => {
    if (isRTL) {
      return vendor.vendorProfile?.businessName_ar || vendor.vendorProfile?.businessName || vendor.name;
    }
    return vendor.vendorProfile?.businessName || vendor.vendorProfile?.businessName_ar || vendor.name;
  };

  const handleChatPress = (chat: ChatConversation) => {
    console.log('Open chat:', chat._id);
    setSelectedChat({
      vendorId: chat.vendor._id,
      vendorName: getVendorName(chat.vendor),
      vendorImage: chat.vendor.profilePicture
    });
  };

  const renderChatItem = ({ item }: { item: ChatConversation }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item)}
      activeOpacity={0.7}>
      <View style={styles.avatarContainer}>
        {item.vendor.profilePicture ? (
          <Image
            source={{ uri: getImageUrl(item.vendor.profilePicture) }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {getVendorName(item.vendor).charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.vendorName, isRTL && styles.vendorNameRTL]}>
            {getVendorName(item.vendor)}
          </Text>
          {item.lastMessage && (
            <Text style={styles.timeText}>
              {formatTime(item.lastMessage.createdAt)}
            </Text>
          )}
        </View>

        {item.lastMessage && (
          <Text 
            style={[styles.lastMessage, isRTL && styles.lastMessageRTL]}
            numberOfLines={1}>
            {item.lastMessage.message}
          </Text>
        )}
      </View>

      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>
              {isRTL ? '›' : '‹'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isRTL ? 'المحادثات' : 'Chats'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00695C" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>
            {isRTL ? '›' : '‹'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isRTL ? 'المحادثات' : 'Chats'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>
            {isRTL ? 'لا توجد محادثات بعد' : 'No chats yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {isRTL 
              ? 'ابدأ محادثة مع أحد مقدمي الخدمات' 
              : 'Start a chat with a vendor'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      {/* Chat Conversation Modal */}
      <Modal
        visible={selectedChat !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setSelectedChat(null)}>
        {selectedChat && (
          <ChatConversation
            onBack={() => {
              setSelectedChat(null);
              loadChats(); // Reload chats when coming back
            }}
            vendorId={selectedChat.vendorId}
            vendorName={selectedChat.vendorName}
            vendorImage={selectedChat.vendorImage}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00695C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  chatContent: {
    flex: 1,
    marginRight: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  vendorNameRTL: {
    textAlign: 'right',
  },
  timeText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: '#757575',
  },
  lastMessageRTL: {
    textAlign: 'right',
  },
  unreadBadge: {
    backgroundColor: '#00695C',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default Chat;
