/* eslint-disable no-console */
import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSocket } from '../contexts/SocketContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification, renderNotificationText } from '../contexts/NotificationContext';
import { CustomAlert } from './CustomAlert/CustomAlert';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface SocketNotificationPayload {
  title?: string;
  titleEn?: string;
  message?: string;
  messageEn?: string;
  messageAr?: string;
  type?: string;
  bookingId?: string;
  id?: string;
  _id?: string;
  requiresPayment?: boolean;
  booking?: string;
  link?: string;
  chat?: string;
}

interface SocketNotificationListenerProps {
  setCurrentRoute: (route: string) => void;
}

export const SocketNotificationListener: React.FC<SocketNotificationListenerProps> = ({
  setCurrentRoute,
}) => {
  const { socket } = useSocket();
  const { isRTL } = useLanguage();
  const { addNotification } = useNotification();
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationButtons, setNotificationButtons] = useState<AlertButton[]>([]);

  const showAlert = useCallback((title: string, message: string, buttons: AlertButton[]) => {
    setNotificationTitle(title);
    setNotificationMessage(message);
    setNotificationButtons(buttons);
    setNotificationVisible(true);
  }, []);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    // Legacy booking_notification handler
    const handleBookingNotification = (data: SocketNotificationPayload) => {
      console.log('Received booking notification via socket:', data);
      
      const title = isRTL ? data.title : data.titleEn;
      const message = isRTL ? data.message : data.messageEn;
      
      // Save notification to history and show top banner
      addNotification({
        id: data._id || data.id,
        title: data.title || (isRTL ? 'إشعار الحجز' : 'Booking Notification'),
        titleEn: data.titleEn || 'Booking Notification',
        message: data.message || '',
        messageEn: data.messageEn || '',
        type: data.type || 'booking_notification',
        bookingId: data.bookingId || data.id
      }).catch(err => console.error('Failed to add socket booking notification:', err));

      const buttons: AlertButton[] = [
        {
          text: isRTL ? 'إغلاق' : 'Close',
          style: 'cancel',
          onPress: () => {},
        }
      ];

      if (data.type === 'booking_confirmed') {
        buttons.unshift({
          text: isRTL ? 'عرض الطلب والدفع' : 'View Order & Pay',
          style: 'default',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('openOrderHistory', '1');
              setCurrentRoute('profile');
            } catch (err) {
              console.error('Error redirecting to order history:', err);
            }
          }
        });
      } else if (data.type === 'booking_created') {
        buttons.unshift({
          text: isRTL ? 'عرض حجوزاتي' : 'View My Bookings',
          style: 'default',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('openOrderHistory', '1');
              setCurrentRoute('profile');
            } catch (err) {
              console.error('Error redirecting to order history:', err);
            }
          }
        });
      }

      showAlert(title || 'Notification', message || '', buttons);
    };

    // Payment confirmed notification
    const handlePaymentConfirmed = (data: SocketNotificationPayload) => {
      console.log('Payment confirmed notification:', data);
      const title = isRTL ? '✅ تم تأكيد الدفع' : '✅ Payment Confirmed';
      const message = isRTL
        ? (data.messageAr || 'تم تأكيد دفعك بنجاح! حجزك مؤكد الآن.')
        : (data.messageEn || 'Your payment was confirmed! Your booking is now confirmed.');
      
      // Save notification to history and show top banner
      addNotification({
        id: data._id || data.id,
        title: isRTL ? 'تم تأكيد الدفع' : 'Payment Confirmed',
        titleEn: 'Payment Confirmed',
        message: data.messageAr || 'تم تأكيد دفعك بنجاح! حجزك مؤكد الآن.',
        messageEn: data.messageEn || 'Your payment was confirmed! Your booking is now confirmed.',
        type: 'booking_payment_confirmed',
        bookingId: data.bookingId || data.id
      }).catch(err => console.error('Failed to add payment socket notification:', err));

      showAlert(title, message, [
        {
          text: isRTL ? 'عرض حجوزاتي' : 'View My Bookings',
          style: 'default',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('openOrderHistory', '1');
              setCurrentRoute('profile');
            } catch (err) {
              console.error('Error redirecting to order history:', err);
            }
          }
        },
        {
          text: isRTL ? 'إغلاق' : 'Close',
          style: 'cancel',
        }
      ]);
    };

    // Vendor confirmed notification
    const handleVendorConfirmed = (data: SocketNotificationPayload) => {
      console.log('Vendor confirmed notification:', data);
      const title = isRTL ? '🎉 تم قبول الحجز' : '🎉 Booking Confirmed';
      const message = isRTL
        ? (data.messageAr || 'قبل البائع حجزك!')
        : (data.messageEn || 'Vendor confirmed your booking!');
      
      // Save notification to history and show top banner
      addNotification({
        id: data._id || data.id,
        title: isRTL ? 'تم قبول الحجز' : 'Booking Confirmed',
        titleEn: 'Booking Confirmed',
        message: data.messageAr || 'قبل البائع حجزك!',
        messageEn: data.messageEn || 'Vendor confirmed your booking!',
        type: 'booking_confirmed_by_vendor',
        bookingId: data.bookingId || data.id
      }).catch(err => console.error('Failed to add vendor confirmation socket notification:', err));

      const buttons: AlertButton[] = [
        {
          text: isRTL ? 'إغلاق' : 'Close',
          style: 'cancel',
        }
      ];

      if (data.requiresPayment) {
        buttons.unshift({
          text: isRTL ? 'الدفع الآن' : 'Pay Now',
          style: 'default',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('openOrderHistory', '1');
              setCurrentRoute('profile');
            } catch (err) {
              console.error('Error redirecting to order history:', err);
            }
          }
        });
      } else {
        buttons.unshift({
          text: isRTL ? 'عرض حجوزاتي' : 'View My Bookings',
          style: 'default',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('openOrderHistory', '1');
              setCurrentRoute('profile');
            } catch (err) {
              console.error('Error redirecting to order history:', err);
            }
          }
        });
      }

      showAlert(title, message, buttons);
    };

    // Unified notification handler for new server-generated notifications
    const handleNewServerNotification = (data: SocketNotificationPayload) => {
      console.log('Received unified notification via socket:', data);
      if (!data) return;

      const { title, message } = renderNotificationText(data, isRTL);
      const { title: titleEn, message: messageEn } = renderNotificationText(data, false);

      addNotification({
        id: data._id || data.id,
        title,
        titleEn,
        message,
        messageEn,
        type: data.type || 'notification',
        bookingId: data.booking,
        link: data.link,
        chat: data.chat,
      }).catch(err => console.error('Failed to add socket notification:', err));

      // Do not show popup alert for chat/message notifications, just keep them in notifications list
      if (data.type === 'new_message' || data.type === 'new_chat' || data.chat) {
        return;
      }

      const buttons: AlertButton[] = [
        {
          text: isRTL ? 'إغلاق' : 'Close',
          style: 'cancel',
          onPress: () => {},
        }
      ];

      // If it's related to bookings, allow direct navigation to bookings screen
      if (
        data.type === 'booking_confirmed' ||
        data.type === 'new_booking' ||
        data.type === 'booking_payment_confirmed'
      ) {
        buttons.unshift({
          text: isRTL ? 'عرض حجوزاتي' : 'View My Bookings',
          style: 'default',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('openOrderHistory', '1');
              setCurrentRoute('profile');
            } catch (err) {
              console.error('Error redirecting to order history:', err);
            }
          }
        });
      } else if (data.type === 'event_reminder') {
        buttons.unshift({
          text: isRTL ? 'عرض الضيوف' : 'View Guest List',
          style: 'default',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('openMyEvents', '1');
              setCurrentRoute('profile');
            } catch (err) {
              console.error('Error redirecting to guest list:', err);
            }
          }
        });
      }

      showAlert(title, message, buttons);
    };

    socket.on('booking_notification', handleBookingNotification);
    socket.on('booking_payment_confirmed', handlePaymentConfirmed);
    socket.on('booking_confirmed_by_vendor', handleVendorConfirmed);
    socket.on('notification:new', handleNewServerNotification);

    return () => {
      socket.off('booking_notification', handleBookingNotification);
      socket.off('booking_payment_confirmed', handlePaymentConfirmed);
      socket.off('booking_confirmed_by_vendor', handleVendorConfirmed);
      socket.off('notification:new', handleNewServerNotification);
    };
  }, [socket, isRTL, setCurrentRoute, showAlert, addNotification]);

  return (
    <CustomAlert
      visible={notificationVisible}
      title={notificationTitle}
      message={notificationMessage}
      buttons={notificationButtons}
      onClose={() => setNotificationVisible(false)}
    />
  );
};
