import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../contexts/LanguageContext';
import { createReview, deleteReview } from '../services/reviewsApi';
import { colors } from '../constants/colors';
import { CustomAlert } from '../components/CustomAlert/CustomAlert';

interface WriteReviewProps {
  bookingId: string;
  serviceId: string;
  serviceName: string;
  initialRating?: number;
  initialComment?: string;
  oldReviewId?: string;
  onBack?: () => void;
  onSuccess?: () => void;
}

const WriteReview: React.FC<WriteReviewProps> = ({
  bookingId,
  serviceId,
  serviceName,
  initialRating,
  initialComment,
  oldReviewId,
  onBack,
  onSuccess,
}) => {
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(initialRating || 0);
  const [comment, setComment] = useState(initialComment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
  }>({ visible: false, title: '', message: '', buttons: [] });

  const handleSubmit = async () => {
    // Validation
    if (rating === 0) {
      setAlertConfig({
        visible: true,
        title: isRTL ? 'خطأ' : 'Error',
        message: isRTL ? 'الرجاء اختيار التقييم' : 'Please select a rating',
        buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
      });
      return;
    }

    if (comment.trim().length < 1) {
      setAlertConfig({
        visible: true,
        title: isRTL ? 'خطأ' : 'Error',
        message: isRTL ? 'الرجاء كتابة تعليق' : 'Please write a comment',
        buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
      });
      return;
    }

    if (comment.length > 300) {
      setAlertConfig({
        visible: true,
        title: isRTL ? 'خطأ' : 'Error',
        message: isRTL
          ? 'التعليق طويل جداً (الحد الأقصى 300 حرف)'
          : 'Comment is too long (max 300 characters)',
        buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
      });
      return;
    }
    setIsSubmitting(true);

    try {
      if (oldReviewId) {
        console.log('[WriteReview] Deleting old review:', oldReviewId);
        await deleteReview(oldReviewId);
      }

      console.log('[WriteReview] Submitting review:', {
        serviceId,
        bookingId,
        rating,
        comment: comment.substring(0, 50),
      });
      await createReview(serviceId, rating, comment, bookingId);

      // Invalidate the reviews cache so ServiceDetails will refetch
      queryClient.invalidateQueries({
        queryKey: ['service-reviews', serviceId],
      });

      setAlertConfig({
        visible: true,
        title: isRTL ? 'نجح!' : 'Success!',
        message: isRTL
          ? oldReviewId
            ? 'تم تعديل التقييم بنجاح'
            : 'تم إرسال التقييم بنجاح'
          : oldReviewId
          ? 'Review updated successfully'
          : 'Review submitted successfully',
        buttons: [
          {
            text: isRTL ? 'حسناً' : 'OK',
            style: 'default',
            onPress: () => {
              if (onSuccess) {
                onSuccess();
              } else if (onBack) {
                onBack();
              }
            },
          },
        ],
      });
    } catch (error: any) {
      setAlertConfig({
        visible: true,
        title: isRTL ? 'خطأ' : 'Error',
        message:
          error.message ||
          (isRTL ? 'فشل في إرسال التقييم' : 'Failed to submit review'),
        buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
            disabled={isSubmitting}
          >
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={star <= rating ? colors.primary : '#E0E0E0'}
                stroke={star <= rating ? colors.primary : '#BDBDBD'}
                strokeWidth={1}
              />
            </Svg>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.overlay}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onBack}
      />
      <View
        style={[
          styles.sheetContainer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Svg
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              style={!isRTL && { transform: [{ rotate: '180deg' }] }}
            >
              <Path
                d={isRTL ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}
                stroke={colors.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
              {isRTL ? 'تقييم الخدمة' : 'Rate Service'}
            </Text>
            <Text
              style={[styles.headerSubtitle, isRTL && styles.headerSubtitleRTL]}
              numberOfLines={1}
            >
              {serviceName}
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Rating Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {isRTL ? 'التقييم' : 'Rating'}
            </Text>
            {renderStars()}
            {rating > 0 && (
              <Text style={[styles.ratingText, isRTL && styles.textRTL]}>
                {rating === 5 && (isRTL ? 'ممتاز!' : 'Excellent!')}
                {rating === 4 && (isRTL ? 'جيد جداً' : 'Very Good')}
                {rating === 3 && (isRTL ? 'جيد' : 'Good')}
                {rating === 2 && (isRTL ? 'مقبول' : 'Fair')}
                {rating === 1 && (isRTL ? 'ضعيف' : 'Poor')}
              </Text>
            )}
          </View>

          {/* Comment Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {isRTL ? 'التعليق' : 'Comment'}
            </Text>
            <TextInput
              style={[styles.commentInput, isRTL && styles.commentInputRTL]}
              value={comment}
              onChangeText={setComment}
              placeholder={
                isRTL
                  ? 'شارك تجربتك مع هذه الخدمة...'
                  : 'Share your experience with this service...'
              }
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              maxLength={300}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
            <Text style={[styles.characterCount, isRTL && styles.textRTL]}>
              {comment.length} / 300
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (isSubmitting || rating === 0) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isRTL ? 'إرسال التقييم' : 'Submit Review'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 480,
    width: '100%',
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerTitleRTL: {
    fontFamily: 'Arial',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  headerSubtitleRTL: {
    fontFamily: 'Arial',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  starButton: {
    padding: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 6,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 100,
    backgroundColor: '#FAFAFA',
  },
  commentInputRTL: {
    textAlign: 'right',
    fontFamily: 'Arial',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  textRTL: {
    textAlign: 'right',
    fontFamily: 'Arial',
  },
});

export default WriteReview;
