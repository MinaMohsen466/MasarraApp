import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../constants/colors';
import { myEventsStyles as styles } from '../../screens/myEventsStyles';

interface EventGuest {
  _id: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
  user?: {
    _id: string;
    id?: string;
    name?: string;
    email?: string;
  };
}

interface GuestListModalProps {
  visible: boolean;
  isRTL: boolean;
  selectedBookingForGuests: {
    _id: string;
    customer?: {
      _id?: string;
      id?: string;
    } | string;
  } | null;
  loadingGuests: { [key: string]: boolean };
  guestsData: { [key: string]: EventGuest[] };
  user: {
    _id?: string;
    id?: string;
    role?: string;
  } | null;
  onClose: () => void;
  onRemoveGuest: (guestId: string, bookingId: string) => void;
  onLeaveGuest: (bookingId: string) => void;
}

export const GuestListModal: React.FC<GuestListModalProps> = ({
  visible,
  isRTL,
  selectedBookingForGuests,
  loadingGuests,
  guestsData,
  user,
  onClose,
  onRemoveGuest,
  onLeaveGuest,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.guestPageContainer}>
        <TouchableOpacity
          style={localStyles.touchableBackground}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.guestPageContent}>
          <View style={styles.guestPageHeader}>
            <TouchableOpacity
              style={styles.guestPageBackButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Icon
                name={isRTL ? 'chevron-forward' : 'chevron-back'}
                size={24}
                color={colors.primaryDark}
              />
            </TouchableOpacity>
            <Text style={styles.guestPageTitle}>
              {isRTL ? 'قائمة الضيوف' : 'Guest List'}
            </Text>
            <View style={localStyles.headerSpacer} />
          </View>

          <ScrollView style={styles.guestPageScroll} showsVerticalScrollIndicator={false}>
            {selectedBookingForGuests && (
              <>
                {loadingGuests[selectedBookingForGuests._id] ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>
                      {isRTL ? 'جاري التحميل...' : 'Loading...'}
                    </Text>
                  </View>
                ) : !guestsData[selectedBookingForGuests._id] || guestsData[selectedBookingForGuests._id].length === 0 ? (
                  <View style={styles.emptyGuestList}>
                    <Text style={styles.emptyGuestText}>
                      {isRTL ? 'لا يوجد ضيوف' : 'No guests'}
                    </Text>
                  </View>
                ) : (
                  <View style={localStyles.guestsContainer}>
                    {guestsData[selectedBookingForGuests._id].map((guest) => {
                      const guestUserId = guest.user?._id || guest.user;
                      const isCurrentUser = guestUserId
                        ? guestUserId === user?.id || guestUserId === user?._id
                        : false;

                      const bookingCustomerObj = selectedBookingForGuests.customer;
                      const bookingCustomerId = typeof bookingCustomerObj === 'object'
                        ? bookingCustomerObj?._id || bookingCustomerObj?.id
                        : bookingCustomerObj;

                      const canRemove =
                        user?.role === 'admin' ||
                        (bookingCustomerId && (bookingCustomerId === user?.id || bookingCustomerId === user?._id));

                      return (
                        <View key={guest._id} style={[styles.guestListItem, isRTL && localStyles.rowRTL]}>
                          <View style={[localStyles.flexStart, isRTL && localStyles.alignEnd]}>
                            <Text style={[styles.guestListName, isRTL && localStyles.textRight]}>
                              {guest.name || guest.user?.name || (isRTL ? 'ضيف' : 'Guest')}
                              <Text style={styles.guestListSubText}>
                                {guest.phone ? ` (${guest.phone})` : guest.email || guest.user?.email ? ` (${guest.email || guest.user?.email})` : ''}
                              </Text>
                            </Text>
                            <Text style={[styles.guestListMetaText, isRTL && localStyles.textRight]}>
                              {`#${String(guest._id).slice(-6)} • `}
                              {guest.joinedAt ? new Date(guest.joinedAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                            </Text>
                          </View>
                          <View style={[localStyles.actionsContainer, isRTL && localStyles.rowRTL]}>
                            {canRemove && (
                              <TouchableOpacity
                                style={styles.guestActionIconButton}
                                onPress={() => onRemoveGuest(guest._id, selectedBookingForGuests._id)}
                                activeOpacity={0.7}
                              >
                                <Icon name="trash-outline" size={18} color="#ef4444" />
                              </TouchableOpacity>
                            )}
                            {isCurrentUser && (
                              <TouchableOpacity
                                style={styles.guestActionIconButton}
                                onPress={() => onLeaveGuest(selectedBookingForGuests._id)}
                                activeOpacity={0.7}
                              >
                                <Icon name="log-out-outline" size={18} color="#f97316" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  touchableBackground: {
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  guestsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  flexStart: {
    flex: 1,
    alignItems: 'flex-start',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  textRight: {
    textAlign: 'right',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
});
