import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { useLanguage } from '../contexts/LanguageContext';
import { useSocket } from '../contexts/SocketContext';
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
}

const ChatConversation: React.FC<ChatConversationProps> = ({ onBack }) => {
  const { isRTL } = useLanguage();
  const { socket, isConnected, joinChat, leaveChat, sendTyping } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [chatId, setChatId] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);
  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth >= 600;

  // Define loadMessages first with useCallback
  const loadMessages = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('[ChatConversation] No token found');
        if (!silent) setLoading(false);
        return;
      }

      // Get current user ID first if not set
      let userId = currentUserId;
      if (!userId) {
        const userResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          userId = userData._id;
          setCurrentUserId(userId);
        }
      }

      // Only admin chat is supported - get all chats and find admin chat
      const chatResponse = await fetch(`${API_BASE_URL}/api/chats`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!chatResponse.ok) {
        if (!silent) setLoading(false);
        return;
      }

      const chatsData = await chatResponse.json();
      const chats = Array.isArray(chatsData) ? chatsData : chatsData.data || [];

      // Find admin chat - admin chat has vendor: null
      const adminChat = chats.find((chat: any) => chat.vendor === null);

      if (!adminChat) {
        if (!silent) setLoading(false);
        return;
      }
      setChatId(adminChat._id);
      markMessagesAsRead(token, adminChat._id);

      // Load messages from chat
      const messages = adminChat.messages || [];

      // Format messages with correct isMe flag
      const messagesWithFlag = messages.map((msg: any, index: number) => {
        const senderId = msg.sender?._id || msg.sender;
        const messageIsMe = userId ? senderId === userId : false;
        return {
          _id: msg._id || `${String(Math.random())}-${index}-${Date.now()}`,
          sender: msg.sender || { _id: '', name: 'Unknown' },
          message: msg.content || msg.message || '',
          createdAt: msg.timestamp || msg.createdAt || new Date().toISOString(),
          isMe: messageIsMe,
        };
      });

      setMessages(messagesWithFlag);
      
      // Scroll to bottom after messages load
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      // Silent error - avoid console spam
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [currentUserId]);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Socket.IO event listeners
  useEffect(() => {
    if (!socket || !isConnected || !chatId) return;

    // Listen for new messages
    const handleNewMessage = (data: any) => {
      const { chatId: messageChatId, message } = data;
      
      // Don't add our own messages (they're added optimistically)
      if (message?.sender === currentUserId) return;

      // If this is the active conversation, add the message directly
      if (messageChatId === chatId && message) {
        const newMessage: Message = {
          _id: message._id || `received-${Date.now()}`,
          sender: message.sender || { _id: '', name: 'Admin' },
          message: message.content || message.message || '',
          createdAt: message.timestamp || message.createdAt || new Date().toISOString(),
          isMe: false,
        };
        setMessages(prev => [...prev, newMessage]);
        
        // Scroll to bottom if already at bottom
        if (isAtBottom) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    };

    // Listen for typing indicators
    const handleUserTyping = ({ userId, isTyping: typing }: any) => {
      if (userId === currentUserId) return; // Ignore our own typing
      setIsTyping(typing);
      
      // Clear typing indicator after 3 seconds
      if (typing) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    };

    // Listen for messages read
    const handleMessagesRead = ({ chatId: readChatId }: any) => {
      if (readChatId === chatId) {
        loadMessages(true);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, isConnected, chatId, currentUserId, isAtBottom]);

  // Join/leave chat room
  useEffect(() => {
    if (!socket || !isConnected || !chatId) return;

    joinChat(chatId);

    return () => {
      leaveChat(chatId);
    };
  }, [socket, isConnected, chatId, joinChat, leaveChat]);

  const markMessagesAsRead = async (token: string, chatId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/chats/${chatId}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch {}
  };

  const handleTyping = (text: string) => {
    setMessageText(text);
    
    // Send typing indicator
    if (socket && isConnected && chatId) {
      sendTyping(chatId, true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing indicator after 2 seconds of no typing
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(chatId, false);
      }, 2000);
    }
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
        sender: { _id: currentUserId || 'me', name: 'You' },
        message: messageToSend,
        createdAt: new Date().toISOString(),
        isMe: true,
      };

      // Add to end of array (bottom of chat)
      setMessages(prev => [...prev, newMessage]);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );

      // Send message in background (non-blocking)
      const response = await fetch(
        `${API_BASE_URL}/api/chats/${chatId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: messageToSend }),
        },
      );

      if (response.ok) {
        // Reload messages silently in background to sync
        loadMessages(true);
      } else {
        // Revert on failure
        setMessages(prev => prev.filter(m => m._id !== newMessage._id));
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    } catch {
      Alert.alert(
        'Error',
        'Error sending message. Please check your connection.',
      );
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

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setIsAtBottom(isBottom);
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setIsAtBottom(true);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageRow, item.isMe && styles.messageRowMe]}>
      <View
        style={[
          styles.messageBubble,
          item.isMe ? styles.messageBubbleMe : styles.messageBubbleThem,
        ]}
      >
        <Text style={[styles.messageText, item.isMe && styles.messageTextMe]}>
          {item.message}
        </Text>
        <Text style={[styles.messageTime, item.isMe && styles.messageTimeMe]}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 18l-6-6 6-6"
            stroke="#00695C"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <View style={styles.headerAvatarPlaceholder}>
          <Text style={styles.headerAvatarText}>S</Text>
        </View>
        <Text style={styles.headerTitle}>
          {isRTL ? 'الدعم الفني' : 'Support'}
        </Text>
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

        <View
          style={[
            styles.messagesContainer,
            { paddingBottom: isTablet ? 160 : 130 },
          ]}
        >
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
              keyExtractor={item => item._id}
              contentContainerStyle={[
                styles.messagesContent,
                { paddingBottom: 16 },
              ]}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={400}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
              ListFooterComponent={
                isTyping ? (
                  <View style={styles.typingIndicator}>
                    <View style={styles.typingDot} />
                    <View style={[styles.typingDot, { marginHorizontal: 4 }]} />
                    <View style={styles.typingDot} />
                    <Text style={styles.typingText}>
                      {isRTL ? 'يكتب...' : 'Typing...'}
                    </Text>
                  </View>
                ) : null
              }
            />
          )}
        </View>
      </SafeAreaView>

      {/* Scroll to Bottom Button */}
      {!isAtBottom && messages.length > 0 && (
        <TouchableOpacity
          style={styles.scrollToBottomButton}
          onPress={scrollToBottom}
          activeOpacity={0.8}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M7 10l5 5 5-5"
              stroke="#fff"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      )}

      {/* Input Area - Fixed at bottom above navigation */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={styles.inputWrapper}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, isRTL && styles.inputRTL]}
            placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message...'}
            placeholderTextColor="#9E9E9E"
            value={messageText}
            onChangeText={handleTyping}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                  stroke="#fff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
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
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00695C',
  },
  typingText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#9E9E9E',
    fontStyle: 'italic',
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
  scrollToBottomButton: {
    position: 'absolute',
    right: 20,
    bottom: Dimensions.get('window').width >= 600 ? 180 : 150,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00695C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default ChatConversation;
