import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { useLanguage } from '../contexts/LanguageContext';
import { getImageUrl } from '../services/api';
import { API_BASE_URL } from '../config/api.config';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
  };
  message: string;
  createdAt: string;
  isMe?: boolean;
}

interface ChatConversationProps {
  onBack?: () => void;
  vendorId: string;
  vendorName?: string;
  vendorImage?: string;
}

const ChatConversation: React.FC<ChatConversationProps> = ({ 
  onBack, 
  vendorId, 
  vendorName = 'Vendor',
  vendorImage 
}) => {
  const { isRTL } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [chatId, setChatId] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const refreshIntervalRef = useRef<any>(null);
  const lastMessagesCountRef = useRef<number>(0);
  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth >= 600;

  useEffect(() => {
    loadMessages();
    
    // Auto-refresh messages every 10 seconds (reduced from 3 for better performance)
    refreshIntervalRef.current = setInterval(() => {
      loadMessages(true); // Silent refresh (no loading state)
    }, 10000);
    
    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [vendorId]);

  const loadMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('[ChatConversation] No token found');
        if (!silent) setLoading(false);
        return;
      }
      
      console.log('[ChatConversation] Loading chat with admin...');
      
      // Only admin chat is supported - get all chats and find admin chat
      const chatResponse = await fetch(`${API_BASE_URL}/api/chats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!chatResponse.ok) {
        console.log('[ChatConversation] Failed to fetch chats:', chatResponse.status);
        if (!silent) setLoading(false);
        return;
      }
      
      const chatsData = await chatResponse.json();
      console.log('[ChatConversation] All chats response:', chatsData);
      
      const chats = Array.isArray(chatsData) ? chatsData : (chatsData.data || []);
      console.log('[ChatConversation] Processing', chats.length, 'chats');
      
      // Find admin chat - admin chat has vendor: null
      const adminChat = chats.find((chat: any) => {
        console.log('[ChatConversation] Checking chat:', {
          id: chat._id,
          vendor: chat.vendor,
          vendorIsNull: chat.vendor === null
        });
        return chat.vendor === null;
      });
      
      if (!adminChat) {
        console.log('[ChatConversation] No admin chat found in user chats');
        if (!silent) setLoading(false);
        return;
      }
      
      console.log('[ChatConversation] Found admin chat:', adminChat._id);
      setChatId(adminChat._id);
      markMessagesAsRead(token, adminChat._id);
      
      // Load messages from chat
      const messages = adminChat.messages || [];
      console.log('[ChatConversation] Found', messages.length, 'messages');
      
      // Get current user ID
      const userResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let currentUserId: string | null = null;
      if (userResponse.ok) {
        const userData = await userResponse.json();
        currentUserId = userData._id;
        console.log('[ChatConversation] Current user ID:', currentUserId);
      }
      
      // Format messages
      const messagesWithFlag = messages.map((msg: any, index: number) => ({
        _id: msg._id || `${String(Math.random())}-${index}-${Date.now()}`,
        sender: msg.sender || { _id: '', name: 'Unknown' },
        message: msg.content || msg.message || '',
        createdAt: msg.timestamp || msg.createdAt || new Date().toISOString(),
        isMe: currentUserId ? (msg.sender?._id || msg.sender) === currentUserId : false
      }));
      
      if (messagesWithFlag.length !== lastMessagesCountRef.current) {
        setMessages(messagesWithFlag);
        lastMessagesCountRef.current = messagesWithFlag.length;
      }
      
      console.log('[ChatConversation] Messages loaded successfully');
    } catch (error) {
      console.error('[ChatConversation] Error loading messages:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const markMessagesAsRead = async (token: string, chatId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/chats/${chatId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch {}
  };

  const sendMessage = async () => {
    if (!messageText.trim() || sending) return;

    try {
      setSending(true);
      const messageToSend = messageText.trim();
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token || !chatId) {
        Alert.alert('Error', 'Chat not initialized. Please try again.');
        setSending(false);
        return;
      }

      // Clear input immediately for UX
      setMessageText('');
      
      // Add message optimistically to UI
      const newMessage: Message = {
        _id: `temp-${Date.now()}`,
        sender: { _id: 'me', name: 'You' },
        message: messageToSend,
        createdAt: new Date().toISOString(),
        isMe: true
      };
      
      // Add to end of array (bottom of chat)
      setMessages(prev => [...prev, newMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      // Send message in background (non-blocking)
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: messageToSend })
      });

      if (response.ok) {
        // Reload messages silently in background to sync
        loadMessages(true);
      } else {
        // Revert on failure
        setMessages(prev => prev.filter(m => m._id !== newMessage._id));
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Error sending message. Please check your connection.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageRow, item.isMe && styles.messageRowMe]}>
      {!item.isMe && vendorImage && !imageError && (
        <Image 
          source={{ uri: getImageUrl(vendorImage) }} 
          style={styles.messageAvatar}
          onError={() => setImageError(true)}
        />
      )}
      <View style={[styles.messageBubble, item.isMe ? styles.messageBubbleMe : styles.messageBubbleThem]}>
        <Text style={[styles.messageText, item.isMe && styles.messageTextMe]}>{item.message}</Text>
        <Text style={[styles.messageTime, item.isMe && styles.messageTimeMe]}>{formatTime(item.createdAt)}</Text>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M15 18l-6-6 6-6" stroke="#00695C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </TouchableOpacity>
      <View style={styles.headerContent}>
        {vendorImage && !imageError ? (
          <Image 
            source={{ uri: getImageUrl(vendorImage) }} 
            style={styles.headerAvatar}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.headerAvatarPlaceholder}>
            <Text style={styles.headerAvatarText}>{vendorName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.headerTitle}>{vendorName}</Text>
      </View>
      <View style={styles.placeholder} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00695C" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {renderHeader()}

        <View style={[styles.messagesContainer, { paddingBottom: isTablet ? 160 : 130 }]}>
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isRTL ? 'لا توجد رسائل بعد' : 'No messages yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {isRTL 
                  ? 'ابدأ المحادثة مع الدعم' 
                  : 'Start the conversation with the admin'}
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item._id}
              contentContainerStyle={[styles.messagesContent, { paddingBottom: isTablet ? 100 : 50 }]}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />
          )}
        </View>
      </SafeAreaView>

      {/* Input Area - Fixed at bottom above navigation */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, isRTL && styles.inputRTL]}
            placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message...'}
            placeholderTextColor="#9E9E9E"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim() || sending}>
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  safeArea: {
    flex: 1,
  },
  inputWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00695C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    paddingVertical: 40,
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
  messagesContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: Dimensions.get('window').width >= 600 ? 80 : 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  messageBubbleThem: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageBubbleMe: {
    backgroundColor: '#00695C',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#212121',
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 4,
  },
  messageTimeMe: {
    color: '#E0F2F1',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: 62,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#212121',
    marginRight: 12,
  },
  inputRTL: {
    textAlign: 'right',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00695C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatConversation;
