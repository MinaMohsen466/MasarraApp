import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../constants/colors';
import { Booking } from '../../services/bookingApi'; // We can import from bookingApi/apiFacade since they are re-exported.

interface CancellationRequestModalProps {
  visible: boolean;
  isRTL: boolean;
  selectedCancellationBooking: Booking | null;
  cancellationReason: string;
  setCancellationReason: (val: string) => void;
  submittingCancellation: boolean;
  cancellationResult: any;
  closeCancellationModal: () => void;
  handleSubmitCancellationRequest: () => void;
}

export const CancellationRequestModal: React.FC<CancellationRequestModalProps> = ({
  visible,
  isRTL,
  selectedCancellationBooking,
  cancellationReason,
  setCancellationReason,
  submittingCancellation,
  cancellationResult,
  closeCancellationModal,
  handleSubmitCancellationRequest,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={closeCancellationModal}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            width: '100%',
            maxWidth: 450,
            maxHeight: '90%',
            overflow: 'hidden',
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
          }}
        >
          {/* Modal Header */}
          <View
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#E2E8F0',
              flexDirection: isRTL ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.primary,
              }}
            >
              {isRTL ? 'تقديم طلب إلغاء' : 'Request Cancellation'}
            </Text>
            <TouchableOpacity
              onPress={closeCancellationModal}
              style={{ padding: 4 }}
            >
              <Icon name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Modal Body */}
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {!cancellationResult ? (
              <>
                {/* Policy Banner */}
                <View
                  style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    backgroundColor: '#FFFBEB',
                    borderWidth: 1,
                    borderColor: '#FEF3C7',
                    borderLeftWidth: isRTL ? 1 : 4,
                    borderRightWidth: isRTL ? 4 : 1,
                    borderLeftColor: isRTL ? '#FEF3C7' : '#F59E0B',
                    borderRightColor: isRTL ? '#F59E0B' : '#FEF3C7',
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 16,
                    gap: 8,
                  }}
                >
                  <Icon
                    name="information-circle-outline"
                    size={16}
                    color="#F59E0B"
                    style={{ marginTop: 1, marginRight: isRTL ? 0 : 2, marginLeft: isRTL ? 2 : 0 }}
                  />
                  <Text
                    style={{
                      color: '#92400E',
                      fontSize: 13,
                      lineHeight: 18,
                      flex: 1,
                      fontWeight: '500',
                      textAlign: isRTL ? 'right' : 'left',
                    }}
                  >
                    {isRTL
                      ? 'تخضع استرداد المبالغ لموافقة الإدارة وسياسة الإلغاء الخاصة بكل مقدم خدمة. سيتم خصم عمولة منصة مسرة من المبالغ المستردة المؤهلة.'
                      : "Refunds depend on each vendor's cancellation window and are subject to admin approval. Masarra's commission is deducted from eligible refunds."}
                  </Text>
                </View>

                {/* Vendor Cancellation Policies & Time Left */}
                {selectedCancellationBooking?.services && (
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: '#1E293B',
                        marginBottom: 8,
                        textAlign: isRTL ? 'right' : 'left',
                      }}
                    >
                      {isRTL ? 'تفاصيل سياسة إلغاء الخدمات:' : 'Service cancellation details:'}
                    </Text>
                    {selectedCancellationBooking.services.map((svc: any, idx: number) => {
                      const serviceName = isRTL
                        ? svc.service?.nameAr || svc.service?.name || svc.service
                        : svc.service?.name || svc.service;
                      const vendorName = isRTL
                        ? svc.vendor?.vendorProfile?.businessName_ar || svc.vendor?.vendorProfile?.businessName || svc.vendor?.name
                        : svc.vendor?.vendorProfile?.businessName || svc.vendor?.name;
                      
                      const refundPeriodHours = svc.vendor?.vendorProfile?.refundPeriodHours !== undefined
                        ? Number(svc.vendor.vendorProfile.refundPeriodHours)
                        : 48;

                      const formatRefundWindow = (h: number) => {
                        if (h === 0) return isRTL ? 'أي وقت' : 'any time';
                        if (h < 24) return isRTL ? `${h} ساعة` : `${h} hours`;
                        const d = Math.round(h / 24);
                        return isRTL ? `${d} يوم` : `${d} days`;
                      };

                      // Calculate cutoff date & time left
                      const eventTimeStr = svc.timeSlot?.start || svc.eventDate || selectedCancellationBooking.eventTime?.start || selectedCancellationBooking.eventDate;
                      let cutoffDate: Date | null = null;
                      let isWithinWindow = false;
                      let timeLeftString = '';

                      if (eventTimeStr) {
                        const d = new Date(eventTimeStr);
                        if (
                          d.getUTCHours() === 0 &&
                          d.getUTCMinutes() === 0 &&
                          d.getUTCSeconds() === 0 &&
                          d.getUTCMilliseconds() === 0
                        ) {
                          d.setUTCHours(20, 59, 59, 999); // 23:59:59 Kuwait time
                        }
                        cutoffDate = new Date(d.getTime() - refundPeriodHours * 60 * 60 * 1000);
                        const now = new Date();
                        isWithinWindow = now.getTime() <= cutoffDate.getTime();
                        
                        if (isWithinWindow) {
                          const diffMs = cutoffDate.getTime() - now.getTime();
                          const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
                          if (totalHours < 24) {
                            timeLeftString = isRTL 
                              ? `متبقي ${totalHours} ساعة للإلغاء المجاني`
                              : `${totalHours} hours left for free cancellation`;
                          } else {
                            const days = Math.floor(totalHours / 24);
                            const remainingHours = totalHours % 24;
                            timeLeftString = isRTL
                              ? `متبقي ${days} يوم و ${remainingHours} ساعة للإلغاء المجاني`
                              : `${days}d ${remainingHours}h left for free cancellation`;
                          }
                        } else {
                          timeLeftString = isRTL ? 'انتهت فترة الإلغاء المجاني' : 'Free cancellation period expired';
                        }
                      }

                      return (
                        <View
                          key={svc._id || idx}
                          style={{
                            backgroundColor: '#F8FAFC',
                            borderWidth: 1,
                            borderColor: '#E2E8F0',
                            borderRadius: 10,
                            padding: 12,
                            marginBottom: 10,
                            alignItems: 'stretch',
                          }}
                        >
                          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                              {serviceName}
                            </Text>
                            {vendorName && (
                              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500', marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }}>
                                ({vendorName})
                              </Text>
                            )}
                          </View>
                          
                          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Icon name="time-outline" size={14} color="#64748B" />
                            <Text style={{ fontSize: 11, color: '#475569', textAlign: isRTL ? 'right' : 'left', flex: 1 }}>
                              {isRTL
                                ? `سياسة الإلغاء: استرداد كامل حتى ${formatRefundWindow(refundPeriodHours)} قبل الفعالية`
                                : `Cancellation Policy: Full refund up to ${formatRefundWindow(refundPeriodHours)} before event`}
                            </Text>
                          </View>

                          {timeLeftString ? (
                            <View
                              style={{
                                flexDirection: isRTL ? 'row-reverse' : 'row',
                                alignItems: 'center',
                                backgroundColor: isWithinWindow ? '#ECFDF5' : '#FEF2F2',
                                paddingVertical: 6,
                                paddingHorizontal: 8,
                                borderRadius: 6,
                                gap: 6,
                              }}
                            >
                              <Icon
                                name={isWithinWindow ? 'checkmark-circle' : 'alert-circle'}
                                size={14}
                                color={isWithinWindow ? '#059669' : '#DC2626'}
                              />
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontWeight: '600',
                                  color: isWithinWindow ? '#047857' : '#B91C1C',
                                  flex: 1,
                                  textAlign: isRTL ? 'right' : 'left',
                                }}
                              >
                                {timeLeftString}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Input Label */}
                <View
                  style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#374151',
                    }}
                  >
                    {isRTL ? 'سبب الإلغاء' : 'Reason for cancellation'}
                  </Text>
                  <Text style={{ color: '#dc3545', marginLeft: 4 }}> *</Text>
                </View>

                {/* Text Input */}
                <TextInput
                  multiline={true}
                  numberOfLines={4}
                  value={cancellationReason}
                  onChangeText={setCancellationReason}
                  placeholder={
                    isRTL
                      ? 'أخبرنا عن سبب إلغاء الحجز...'
                      : "Tell us why you're cancelling…"
                  }
                  placeholderTextColor="#94A3B8"
                  style={{
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 14,
                    color: '#0F172A',
                    height: 100,
                    textAlignVertical: 'top',
                    textAlign: isRTL ? 'right' : 'left',
                    marginBottom: 20,
                  }}
                />

                {/* Modal Footer Buttons */}
                <View
                  style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    justifyContent: 'flex-end',
                    gap: 12,
                  }}
                >
                  <TouchableOpacity
                    onPress={closeCancellationModal}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#CBD5E1',
                      backgroundColor: '#fff',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#475569',
                      }}
                    >
                      {isRTL ? 'إغلاق' : 'Close'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSubmitCancellationRequest}
                    disabled={!cancellationReason.trim() || submittingCancellation}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 10,
                      backgroundColor: '#EF4444',
                      opacity: !cancellationReason.trim() || submittingCancellation ? 0.6 : 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      minWidth: 120,
                    }}
                  >
                    {submittingCancellation ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: '#fff',
                        }}
                      >
                        {isRTL ? 'إرسال الطلب' : 'Submit request'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : cancellationResult.error ? (
              <View style={{ alignItems: 'center', width: '100%' }}>
                {/* Error Alert */}
                <View
                  style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    backgroundColor: '#FEF2F2',
                    borderWidth: 1,
                    borderColor: '#FEE2E2',
                    borderLeftWidth: isRTL ? 1 : 4,
                    borderRightWidth: isRTL ? 4 : 1,
                    borderLeftColor: isRTL ? '#FEE2E2' : '#EF4444',
                    borderRightColor: isRTL ? '#EF4444' : '#FEE2E2',
                    borderRadius: 10,
                    padding: 16,
                    width: '100%',
                    marginBottom: 20,
                    gap: 8,
                  }}
                >
                  <Icon name="alert-circle-outline" size={18} color="#EF4444" />
                  <Text
                    style={{
                      color: '#991B1B',
                      fontSize: 14,
                      fontWeight: '600',
                      flex: 1,
                      textAlign: isRTL ? 'right' : 'left',
                    }}
                  >
                    {cancellationResult.error}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={closeCancellationModal}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 24,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#fff',
                    }}
                  >
                    {isRTL ? 'إغلاق' : 'Close'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ alignItems: 'center', width: '100%' }}>
                {/* Success Alert */}
                <View
                  style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    backgroundColor: '#F0FDF4',
                    borderWidth: 1,
                    borderColor: '#DCFCE7',
                    borderLeftWidth: isRTL ? 1 : 4,
                    borderRightWidth: isRTL ? 4 : 1,
                    borderLeftColor: isRTL ? '#DCFCE7' : '#22C55E',
                    borderRightColor: isRTL ? '#22C55E' : '#DCFCE7',
                    borderRadius: 10,
                    padding: 16,
                    width: '100%',
                    marginBottom: 16,
                    gap: 8,
                  }}
                >
                  <Icon name="checkmark-circle-outline" size={18} color="#22C55E" />
                  <Text
                    style={{
                      color: '#166534',
                      fontSize: 14,
                      fontWeight: '600',
                      flex: 1,
                      textAlign: isRTL ? 'right' : 'left',
                      lineHeight: 20,
                    }}
                  >
                    {isRTL
                      ? 'تم تقديم طلب الإلغاء بنجاح وجاري مراجعته من قبل الإدارة.'
                      : 'Your cancellation request has been submitted for review.'}
                  </Text>
                </View>

                {/* Refund Eligibility Notice */}
                {cancellationResult.eligibility && !cancellationResult.eligibility.anyEligible ? (
                  <View
                    style={{
                      backgroundColor: '#FEF2F2',
                      borderWidth: 1,
                      borderColor: '#FEE2E2',
                      borderLeftWidth: isRTL ? 1 : 4,
                      borderRightWidth: isRTL ? 4 : 1,
                      borderLeftColor: isRTL ? '#FEE2E2' : '#EF4444',
                      borderRightColor: isRTL ? '#EF4444' : '#FEE2E2',
                      borderRadius: 10,
                      padding: 12,
                      width: '100%',
                      marginBottom: 20,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}
                  >
                    <Icon
                      name="warning-outline"
                      size={16}
                      color="#EF4444"
                      style={{ marginTop: 2, marginRight: isRTL ? 0 : 2, marginLeft: isRTL ? 2 : 0 }}
                    />
                    <Text
                      style={{
                        color: '#991B1B',
                        fontSize: 12,
                        lineHeight: 18,
                        flex: 1,
                        fontWeight: '500',
                        textAlign: isRTL ? 'right' : 'left',
                      }}
                    >
                      {isRTL
                        ? 'هذا الطلب خارج نافذة الإلغاء المسموح بها لمزود الخدمة، لذا قد لا يكون مؤهلاً للاسترداد. ومع ذلك، يمكن للمسؤول الموافقة على الإلغاء وفقًا لتقديره.'
                        : "This request is past the vendor's refund window, so it is not eligible for a refund. The admin may still approve the cancellation at their discretion."}
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={{
                      color: '#64748B',
                      fontSize: 12,
                      textAlign: 'center',
                      marginBottom: 20,
                      lineHeight: 16,
                    }}
                  >
                    {isRTL
                      ? 'في حال الاستحقاق، سيتم تأكيد مبلغ الاسترداد عند موافقة الإدارة على طلبك.'
                      : 'If eligible, your refund amount will be confirmed when an admin approves your request.'}
                  </Text>
                )}

                <TouchableOpacity
                  onPress={closeCancellationModal}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 24,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#fff',
                    }}
                  >
                    {isRTL ? 'تم' : 'Done'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
