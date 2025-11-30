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
  const [chatId, setChatId] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const refreshIntervalRef = useRef<any>(null);
  const lastMessagesCountRef = useRef<number>(0);

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
      
      // First, get or create chat with this vendor
      console.log('📤 Sending vendor chat request with vendorId:', vendorId);
      const chatResponse = await fetch(`${API_BASE_URL}/api/chats/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendorId: vendorId
        })
      });

      if (!chatResponse.ok) {
        const errorText = await chatResponse.text();
        console.error('❌ Failed to get/create chat:', chatResponse.status, errorText);
        if (!silent) {
          setLoading(false);
        }
        return;
      }

      const chatData = await chatResponse.json();
      console.log('✅ Chat loaded:', chatData);
      
      // Save chat ID for mark as read
      if (chatData.data && chatData.data._id) {
        setChatId(chatData.data._id);
        
        // Mark messages as read
        markMessagesAsRead(token, chatData.data._id);
      }
      
      // Get current user ID to mark messages as "mine"
      const userResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        
        // Extract messages from chat data
        const messages = chatData.data?.messages || [];
        const messagesWithFlag = messages.map((msg: any, index: number) => ({
          _id: msg._id || `${String(Math.random())}-${index}-${Date.now()}`,
          sender: msg.sender || { _id: userData._id, name: userData.name },
          message: msg.content || msg.message || '',
          createdAt: msg.timestamp || msg.createdAt || new Date().toISOString(),
          isMe: (msg.sender?._id || msg.sender) === userData._id
        }));
        
        console.log('✅ Messages with flags:', messagesWithFlag);
        
        // Only update if message count changed (avoid unnecessary re-renders)
        if (messagesWithFlag.length !== lastMessagesCountRef.current) {
          setMessages(messagesWithFlag);
          lastMessagesCountRef.current = messagesWithFlag.length;
        }
      } else {
        const messages = chatData.data?.messages || [];
        const messagesWithFlag = messages.map((msg: any, index: number) => ({
          _id: msg._id || `${String(Math.random())}-${index}-${Date.now()}`,
          sender: msg.sender || { _id: '', name: 'Unknown' },
          message: msg.content || msg.message || '',
          createdAt: msg.timestamp || msg.createdAt || new Date().toISOString(),
          isMe: false
        }));
        
        // Only update if message count changed
        if (messagesWithFlag.length !== lastMessagesCountRef.current) {
          setMessages(messagesWithFlag);
          lastMessagesCountRef.current = messagesWithFlag.length;
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (token: string, chatId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/chats/${chatId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Messages marked as read');
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || sending) return;

    try {
      setSending(true);
      const messageToSend = messageText.trim(); // Save the message before clearing
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        console.log('No token found');
        return;
      }

      if (!chatId) {
        console.log('No chat ID found');
        Alert.alert('Error', 'Chat not initialized. Please try again.');
        setSending(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: messageToSend
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Message sent:', result);
        
        // Clear input immediately
        setMessageText('');
        
        // Immediately reload messages after sending
        await loadMessages(false);
        
        // Get user data for the new message
        const userResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          
          // Create new message object with the message we sent (not the current state)
          const newMessage: Message = {
            _id: result._id || result.messageId || String(Date.now()),
            sender: {
              _id: userData._id,
              name: userData.name || 'You'
            },
            message: messageToSend, // Use the saved message, not messageText
            createdAt: new Date().toISOString(),
            isMe: true
          };
          
          // Scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to send message:', response.status, errorText);
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
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

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.isMe;
    
    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe && vendorImage && (
          <Image
            source={{ uri: getImageUrl(vendorImage) }}
            style={styles.messageAvatar}
          />
        )}
        <View style={[
          styles.messageBubble,
          isMe ? styles.messageBubbleMe : styles.messageBubbleThem
        ]}>
          <Text style={[
            styles.messageText,
            isMe && styles.messageTextMe
          ]}>
            {item.message}
          </Text>
          <Text style={[
            styles.messageTime,
            isMe && styles.messageTimeMe
          ]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M15 18l-6-6 6-6" stroke="#00695C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            {vendorImage ? (
              <Image
                source={{ uri: getImageUrl(vendorImage) }}
                style={styles.headerAvatar}
              />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.headerAvatarText}>
                  {vendorName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.headerTitle}>{vendorName}</Text>
          </View>
          
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
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M15 18l-6-6 6-6" stroke="#00695C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            {vendorImage ? (
              <Image
                source={{ uri: getImageUrl(vendorImage) }}
                style={styles.headerAvatar}
              />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.headerAvatarText}>
                  {vendorName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.headerTitle}>{vendorName}</Text>
          </View>
          
          <View style={styles.placeholder} />
        </View>

        {/* Messages List */}
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>
              {isRTL ? 'لا توجد رسائل بعد' : 'No messages yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {isRTL 
                ? 'ابدأ المحادثة مع مقدم الخدمة' 
                : 'Start the conversation with the vendor'}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Input Area */}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#212121',
    marginRight: 8,
  },
  inputRTL: {
    textAlign: 'right',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00695C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatConversation;
