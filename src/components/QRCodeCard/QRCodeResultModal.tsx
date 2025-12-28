import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  ImageBackground,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  useWindowDimensions,
  Clipboard,
} from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors } from '../../constants/colors';
import { getBackgroundImageUrl } from '../../services/qrCodeApi';
import type { QRCodeData, QRCodeCustomDetails } from '../../services/qrCodeApi';

interface QRCodeResultModalProps {
  visible: boolean;
  qrCode: QRCodeData | null;
  backgroundImage: any;
  onClose: () => void;
  onEdit: () => void;
}

export const QRCodeResultModal: React.FC<QRCodeResultModalProps> = ({
  visible,
  qrCode,
  backgroundImage,
  onClose,
  onEdit,
}) => {
  const { isRTL } = useLanguage();
  const [downloadingCard, setDownloadingCard] = useState(false);
  const [copyingLink, setCopyingLink] = useState(false);

  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const [cardAspectRatio, setCardAspectRatio] = useState<number | null>(null);
  const maxCardWidth = Math.min(420, Math.floor(winWidth * 0.88));
  const maxCardHeight = Math.floor(winHeight * 0.78);

  const handleDownloadCard = async () => {
    setDownloadingCard(true);
    try {
      Alert.alert(
        isRTL ? 'نجح' : 'Success',
        isRTL ? 'تم تنزيل البطاقة بنجاح' : 'Card downloaded successfully',
      );
    } catch (error) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل التنزيل' : 'Download failed',
      );
    } finally {
      setDownloadingCard(false);
    }
  };

  const handleCopyLink = async () => {
    setCopyingLink(true);
    try {
      if (qrCode?.qrUrl) {
        Clipboard.setString(qrCode.qrUrl);
        Alert.alert(
          isRTL ? 'نجح' : 'Success',
          isRTL ? 'تم نسخ الرابط بنجاح' : 'Link copied successfully',
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'الرابط غير متوفر' : 'Link not available',
        );
      }
    } catch (error) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'فشل النسخ' : 'Copy failed');
    } finally {
      setCopyingLink(false);
    }
  };

  const customDetails = (qrCode?.customDetails || {}) as QRCodeCustomDetails;

  // Get the background image URL - handle both path and url fields
  const getBackgroundImageUri = () => {
    if (!backgroundImage) return '';
    // Backend returns direct S3 URL in path field, or sometimes in url field
    return backgroundImage.url || backgroundImage.path || '';
  };

  // Get QR code image URI
  const getQRCodeImageUri = () => {
    if (!qrCode) return '';
    // Try both qrCode and qrCodeImage fields
    return qrCode.qrCode || qrCode.qrCodeImage || '';
  };

  useEffect(() => {
    // Try to compute natural aspect ratio of the background image to avoid side gaps
    const bgUri = getBackgroundImageUri();
    if (!bgUri) return;

    let isActive = true;
    if (Image.getSize) {
      Image.getSize(
        bgUri,
        (w, h) => {
          if (isActive && w && h) {
            setCardAspectRatio(w / h);
          }
        },
        error => {
        },
      );
    }
    return () => {
      isActive = false;
    };
  }, [qrCode, backgroundImage]);

  return (
    <Modal
      visible={visible && Boolean(qrCode && backgroundImage)}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Title */}
            <Text style={styles.title}>
              {isRTL ? 'تم إنشاء QR Code!' : 'QR Code Generated!'}
            </Text>

            {/* QR Card Preview with Background Image */}
            <View style={styles.cardContainer}>
              {getBackgroundImageUri() && backgroundImage ? (
                <ImageBackground
                  source={{ uri: getBackgroundImageUri() }}
                  style={[
                    styles.cardBackground,
                    {
                      width: maxCardWidth,
                      maxHeight: maxCardHeight,
                      aspectRatio: cardAspectRatio || 0.7,
                    },
                  ]}
                  imageStyle={{ resizeMode: 'stretch' }}
                  onError={error => {
                  }}
                  onLoad={() => {
                  }}
                >
                  {/* Semi-transparent overlay for better text visibility */}
                  <View style={styles.cardOverlay} />

                  {/* Card Content - Centered Layout */}
                  <View style={styles.cardContentWrapper}>
                    {/* Top Spacing */}
                    <View style={{ height: 20 }} />

                    {/* Names - Main Title */}
                    {(customDetails.name1 || customDetails.name2) && (
                      <Text
                        style={[
                          styles.nameText,
                          {
                            fontFamily:
                              backgroundImage?.font?.family || 'Georgia',
                            color: backgroundImage?.font?.color || '#000000',
                            fontSize: backgroundImage?.font?.size
                              ? backgroundImage.font.size + 10
                              : 28,
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {customDetails.name1}
                      </Text>
                    )}

                    {/* "and" text */}
                    <Text
                      style={[
                        styles.andText,
                        {
                          fontFamily:
                            backgroundImage?.font?.family || 'Georgia',
                          color: backgroundImage?.font?.color || '#999999',
                          fontSize: backgroundImage?.font?.size
                            ? backgroundImage.font.size + 2
                            : 14,
                        },
                      ]}
                    >
                      {isRTL ? 'و' : 'and'}
                    </Text>

                    {/* Second Name */}
                    {customDetails.name2 && (
                      <Text
                        style={[
                          styles.nameText,
                          {
                            fontFamily:
                              backgroundImage?.font?.family || 'Georgia',
                            color: backgroundImage?.font?.color || '#000000',
                            fontSize: backgroundImage?.font?.size
                              ? backgroundImage.font.size + 10
                              : 28,
                          },
                        ]}
                      >
                        {customDetails.name2}
                      </Text>
                    )}

                    {/* Divider */}
                    <View
                      style={[
                        styles.divider,
                        {
                          backgroundColor:
                            backgroundImage?.font?.color || '#cccccc',
                          marginVertical: 12,
                        },
                      ]}
                    />

                    {/* Event Date - Large */}
                    {customDetails.eventDate && (
                      <Text
                        style={[
                          styles.dateText,
                          {
                            fontFamily:
                              backgroundImage?.font?.family || 'Georgia',
                            color: backgroundImage?.font?.color || '#333333',
                            fontSize: backgroundImage?.font?.size
                              ? backgroundImage.font.size + 4
                              : 18,
                          },
                        ]}
                      >
                        {customDetails.eventDate}
                      </Text>
                    )}

                    {/* Event Time */}
                    {customDetails.eventTime && (
                      <Text
                        style={[
                          styles.infoText,
                          {
                            fontFamily:
                              backgroundImage?.font?.family || 'Georgia',
                            color: backgroundImage?.font?.color || '#666666',
                            fontSize: backgroundImage?.font?.size
                              ? backgroundImage.font.size - 2
                              : 12,
                          },
                        ]}
                      >
                        {customDetails.eventTime}
                      </Text>
                    )}

                    {/* Location */}
                    {customDetails.location && (
                      <Text
                        style={[
                          styles.infoText,
                          {
                            fontFamily:
                              backgroundImage?.font?.family || 'Georgia',
                            color: backgroundImage?.font?.color || '#666666',
                            fontSize: backgroundImage?.font?.size
                              ? backgroundImage.font.size - 2
                              : 12,
                          },
                        ]}
                        numberOfLines={3}
                      >
                        {customDetails.location}
                      </Text>
                    )}

                    {/* Contact */}
                    {customDetails.contact && (
                      <Text
                        style={[
                          styles.infoText,
                          {
                            fontFamily:
                              backgroundImage?.font?.family || 'Georgia',
                            color: backgroundImage?.font?.color || '#666666',
                            fontSize: backgroundImage?.font?.size
                              ? backgroundImage.font.size - 2
                              : 12,
                          },
                        ]}
                      >
                        {customDetails.contact}
                      </Text>
                    )}

                    {/* Bottom Spacing */}
                    <View style={{ height: 16 }} />

                    {/* Divider before QR */}
                    <View
                      style={[
                        styles.divider,
                        {
                          backgroundColor:
                            backgroundImage?.font?.color || '#cccccc',
                        },
                      ]}
                    />

                    {/* Bottom Spacing */}
                    <View style={{ height: 16 }} />
                  </View>

                  {/* QR Code Box - Below content */}
                  <View style={styles.qrCodeBoxContainer}>
                    {/* Show QR code if available and not preview mode */}
                    {getQRCodeImageUri() && qrCode?._id !== 'preview' ? (
                      <>
                        <View style={styles.qrCodeBox}>
                          <Image
                            source={{ uri: getQRCodeImageUri() }}
                            style={{ width: 120, height: 120 }}
                            resizeMode="contain"
                            onError={error => {
                            }}
                            onLoad={() => {
                            }}
                          />
                        </View>
                        <Text
                          style={[
                            styles.scanText,
                            {
                              fontFamily:
                                backgroundImage?.font?.family || 'Georgia',
                              color: backgroundImage?.font?.color || '#666666',
                            },
                          ]}
                        >
                          {isRTL
                            ? 'امسح لعرض التفاصيل'
                            : 'Scan to view details'}
                        </Text>
                      </>
                    ) : qrCode?._id === 'preview' ? (
                      <View style={styles.qrCodeBox}>
                        <View
                          style={{
                            width: 120,
                            height: 120,
                            backgroundColor: '#e0e0e0',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#666', fontSize: 16 }}>
                            {isRTL ? 'معاينة' : 'Preview'}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                </ImageBackground>
              ) : (
                <View
                  style={[
                    styles.cardBackground,
                    { backgroundColor: '#f0f0f0' },
                  ]}
                >
                  <Text>
                    {isRTL ? 'لا توجد صورة خلفية' : 'No background image'}
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.downloadButton]}
                onPress={handleDownloadCard}
                disabled={downloadingCard}
              >
                {downloadingCard ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.downloadButtonText}>
                    {isRTL ? 'تنزيل البطاقة' : 'Download Card'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={onEdit}
              >
                <Text style={styles.editButtonText}>
                  {isRTL ? 'تعديل البيانات' : 'Edit Details'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.copyButton]}
                onPress={handleCopyLink}
                disabled={copyingLink}
              >
                {copyingLink ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.copyButtonText}>
                    {isRTL ? 'نسخ الرابط' : 'Copy Link'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Info Text */}
            <Text style={styles.infoFooter}>
              {isRTL
                ? 'يمكن للضيوف مسح هذا رمز QR لعرض تفاصيل الحدث'
                : 'Guests can scan this QR code to view event details'}
            </Text>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>
                {isRTL ? 'إغلاق' : 'Close'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '95%',
    maxHeight: '95%',
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cardContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardBackground: {
    width: '100%',
    minHeight: 520,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    flexDirection: 'column',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.10)',
  },
  cardContentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    width: '100%',
  },
  nameText: {
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  andText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 4,
    opacity: 0.7,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  dateText: {
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 8,
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  divider: {
    width: '50%',
    height: 1,
    alignSelf: 'center',
    opacity: 0.5,
  },
  infoText: {
    textAlign: 'center',
    marginVertical: 3,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  qrCodeBoxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    zIndex: 2,
  },
  qrCodeBox: {
    width: 140,
    height: 140,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 2,
  },
  qrCodePlaceholder: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 48,
  },
  scanText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    zIndex: 1,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  button: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: colors.primary,
  },
  downloadButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  copyButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: '#fff',
  },
  copyButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  infoFooter: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
