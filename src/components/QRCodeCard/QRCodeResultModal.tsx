/* eslint-disable @typescript-eslint/no-explicit-any, react-native/no-inline-styles, react-native/no-unused-styles */
import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  ImageBackground,
  ActivityIndicator,
  Modal,
  Image,
  useWindowDimensions,
  Clipboard,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors } from '../../constants/colors';
import { CustomAlert } from '../CustomAlert/CustomAlert';
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
  // The node handed to captureRef — the card itself, not its wrapper, so the
  // saved image has no surrounding modal chrome.
  const cardRef = useRef<View>(null);

  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const [cardAspectRatio, setCardAspectRatio] = useState<number | null>(null);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }>;
  }>({ visible: false, title: '', message: '', buttons: [] });
  // Calculate card dimensions dynamically to prevent overflow inside the modal and aspect ratio conflicts
  const maxCardWidth = Math.min(380, Math.floor(winWidth * 0.8));
  const maxCardHeight = Math.floor(winHeight * 0.65);

  const cardWidth = maxCardWidth;
  const cardHeight = Math.min(
    maxCardHeight,
    Math.floor(cardWidth / (cardAspectRatio || 0.7)),
  );

  // Android 9 and below still write through the legacy external storage API;
  // from Android 10 the MediaStore insert needs no permission at all.
  const ensureGalleryPermission = async () => {
    if (Platform.OS !== 'android' || Number(Platform.Version) >= 29) return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: isRTL ? 'حفظ البطاقة' : 'Save card',
        message: isRTL
          ? 'يحتاج التطبيق إذن الوصول للصور لحفظ البطاقة'
          : 'Storage access is needed to save the card',
        buttonPositive: isRTL ? 'موافق' : 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const handleDownloadCard = async () => {
    setDownloadingCard(true);
    try {
      if (!cardRef.current) throw new Error('card not rendered');

      if (!(await ensureGalleryPermission())) {
        setAlertConfig({
          visible: true,
          title: isRTL ? 'الإذن مرفوض' : 'Permission denied',
          message: isRTL
            ? 'لا يمكن حفظ البطاقة بدون إذن الوصول للصور'
            : 'The card cannot be saved without storage access',
          buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
        });
        return;
      }

      // Capture the card exactly as it is on screen, then hand the file to the
      // gallery. Rendering a second copy off-screen would drift from what the
      // user is looking at.
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      await CameraRoll.saveAsset(uri, { type: 'photo', album: 'Masarra' });

      setAlertConfig({
        visible: true,
        title: isRTL ? 'نجح' : 'Success',
        message: isRTL
          ? 'تم حفظ البطاقة في معرض الصور'
          : 'Card saved to your gallery',
        buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
      });
    } catch {
      setAlertConfig({
        visible: true,
        title: isRTL ? 'خطأ' : 'Error',
        message: isRTL ? 'فشل حفظ البطاقة' : 'Could not save the card',
        buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
      });
    } finally {
      setDownloadingCard(false);
    }
  };

  const handleCopyLink = async () => {
    setCopyingLink(true);
    try {
      if (qrCode?.qrUrl) {
        Clipboard.setString(qrCode.qrUrl);
        setAlertConfig({
          visible: true,
          title: isRTL ? 'نجح' : 'Success',
          message: isRTL ? 'تم نسخ الرابط بنجاح' : 'Link copied successfully',
          buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
        });
      } else {
        setAlertConfig({
          visible: true,
          title: isRTL ? 'خطأ' : 'Error',
          message: isRTL ? 'الرابط غير متوفر' : 'Link not available',
          buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
        });
      }
    } catch {
      setAlertConfig({
        visible: true,
        title: isRTL ? 'خطأ' : 'Error',
        message: isRTL ? 'فشل النسخ' : 'Copy failed',
        buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
      });
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
    let isActive = true;

    if (bgUri && Image.getSize) {
      Image.getSize(
        bgUri,
        (w, h) => {
          if (isActive && w && h) {
            setCardAspectRatio(w / h);
          }
        },
        _error => {},
      );
    }
    return () => {
      isActive = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <View style={styles.cardContainer} ref={cardRef} collapsable={false}>
              {getBackgroundImageUri() && backgroundImage ? (
                <ImageBackground
                  source={{ uri: getBackgroundImageUri() }}
                  style={[
                    styles.cardBackground,
                    {
                      width: cardWidth,
                      height: cardHeight,
                    },
                  ]}
                  resizeMode="cover"
                >
                  {/* Legibility scrim. A single flat wash either greys out a
                      light photo or leaves text unreadable on a busy one, so it
                      is layered: a light overall tint plus a darker band under
                      the QR panel where the small print sits. */}
                  <View style={styles.cardOverlay} />
                  <View style={styles.cardScrimBottom} />

                  {/* Inset hairline frame — the one invitation motif that reads
                      the same over any background the admin uploads. */}
                  <View
                    style={[
                      styles.cardFrame,
                      {
                        borderColor:
                          backgroundImage?.font?.color ||
                          'rgba(255, 255, 255, 0.45)',
                      },
                    ]}
                    pointerEvents="none"
                  />

                  {/* Card Content - Centered Layout */}
                  <View style={styles.cardContentWrapper}>
                    {/* Top Spacing */}
                    <View style={{ height: 12 }} />

                    {/* Names - Main Title */}
                    {(customDetails.name1 || customDetails.name2) && (
                      <Text
                        style={[
                          styles.nameText,
                          {
                            fontFamily:
                              backgroundImage?.font?.family || 'Georgia',
                            color: backgroundImage?.font?.color || '#ffffff',
                            fontSize: backgroundImage?.font?.size
                              ? backgroundImage.font.size + 4
                              : 24,
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
                          color:
                            backgroundImage?.font?.color ||
                            'rgba(255, 255, 255, 0.85)',
                          fontSize: backgroundImage?.font?.size
                            ? backgroundImage.font.size - 2
                            : 12,
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
                            color: backgroundImage?.font?.color || '#ffffff',
                            fontSize: backgroundImage?.font?.size
                              ? backgroundImage.font.size + 4
                              : 24,
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
                            backgroundImage?.font?.color ||
                            'rgba(255, 255, 255, 0.5)',
                          marginVertical: 8,
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
                            color: backgroundImage?.font?.color || '#ffffff',
                            fontSize: backgroundImage?.font?.size
                              ? backgroundImage.font.size
                              : 16,
                          },
                        ]}
                      >
                        {customDetails.eventDate}
                      </Text>
                    )}

                    {/* Time, place and phone read as one block rather than
                        three loose lines, on a faint panel so the small print
                        survives a busy photo. */}
                    <View style={styles.detailsPanel}>
                    {/* Event Time */}
                    {customDetails.eventTime && (
                      <Text
                        style={[
                          styles.infoText,
                          {
                            fontFamily:
                              backgroundImage?.font?.family || 'Georgia',
                            color:
                              backgroundImage?.font?.color ||
                              'rgba(255, 255, 255, 0.9)',
                            fontSize: backgroundImage?.font?.size
                              ? backgroundImage.font.size - 4
                              : 11,
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
                            color:
                              backgroundImage?.font?.color ||
                              'rgba(255, 255, 255, 0.9)',
                            fontSize: backgroundImage?.font?.size
                              ? backgroundImage.font.size - 4
                              : 11,
                          },
                        ]}
                        numberOfLines={2}
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
                            color:
                              backgroundImage?.font?.color ||
                              'rgba(255, 255, 255, 0.9)',
                            fontSize: backgroundImage?.font?.size
                              ? backgroundImage.font.size - 4
                              : 11,
                          },
                        ]}
                      >
                        {customDetails.contact}
                      </Text>
                    )}
                    </View>
                  </View>

                  {/* QR Code Box - Below content */}
                  <View style={styles.qrCodeBoxContainer}>
                    {/* Show QR code if available and not preview mode */}
                    {getQRCodeImageUri() && qrCode?._id !== 'preview' ? (
                      <>
                        <View style={styles.qrCodeBox}>
                          <Image
                            key={
                              qrCode
                                ? `qr_${qrCode.qrToken || ''}_${
                                    qrCode.updateTimestamp || 0
                                  }`
                                : 'empty'
                            }
                            source={{ uri: getQRCodeImageUri() }}
                            style={{ width: 110, height: 110 }}
                            resizeMode="contain"
                            onError={_error => {}}
                            onLoad={() => {}}
                          />
                        </View>
                        <Text
                          style={[
                            styles.scanText,
                            {
                              fontFamily:
                                backgroundImage?.font?.family || 'Georgia',
                              color:
                                backgroundImage?.font?.color ||
                                'rgba(255, 255, 255, 0.85)',
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
                            width: 110,
                            height: 110,
                            backgroundColor: '#e0e0e0',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#666', fontSize: 14 }}>
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
                    {
                      width: cardWidth,
                      height: cardHeight,
                      backgroundColor: '#f0f0f0',
                      justifyContent: 'center',
                    },
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

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
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
    minHeight: 350,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    flexDirection: 'column',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  // Bottom half only — where the small print and the QR panel sit.
  cardScrimBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
  },
  cardFrame: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 6,
    opacity: 0.55,
  },
  detailsPanel: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: '92%',
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
    marginVertical: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1.5 },
    textShadowRadius: 3.5,
  },
  andText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 2,
    opacity: 0.85,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 1 },
    textShadowRadius: 2,
  },
  dateText: {
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 6,
    letterSpacing: 3.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 1 },
    textShadowRadius: 2,
  },
  divider: {
    width: '50%',
    height: 1,
    alignSelf: 'center',
    opacity: 0.6,
  },
  infoText: {
    textAlign: 'center',
    marginVertical: 2.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 1 },
    textShadowRadius: 2,
  },
  qrCodeBoxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    zIndex: 2,
  },
  qrCodeBox: {
    width: 132,
    height: 132,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 9,
    zIndex: 2,
  },
  qrCodePlaceholder: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 40,
  },
  scanText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 1 },
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
    paddingVertical: 13,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: colors.primary,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
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
