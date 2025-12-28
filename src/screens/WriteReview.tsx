import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useLanguage } from '../contexts/LanguageContext';
import { createReview } from '../services/reviewsApi';
import { colors } from '../constants/colors';
import { CustomAlert } from '../components/CustomAlert/CustomAlert';

interface WriteReviewProps {
  bookingId: string;
  serviceId: string;
  serviceName: string;
  onBack?: () => void;
  onSuccess?: () => void;
}

const WriteReview: React.FC<WriteReviewProps> = ({
  bookingId,
  serviceId,
  serviceName,
  onBack,
  onSuccess,
}) => {
  const { isRTL } = useLanguage();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
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

    if (comment.trim().length < 10) {
      setAlertConfig({
        visible: true,
        title: isRTL ? 'خطأ' : 'Error',
        message: isRTL
          ? 'الرجاء كتابة تعليق لا يقل عن 10 أحرف'
          : 'Please write a comment with at least 10 characters',
        buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
      });
      return;
    }

    if (comment.length > 1000) {
      setAlertConfig({
        visible: true,
        title: isRTL ? 'خطأ' : 'Error',
        message: isRTL
          ? 'التعليق طويل جداً (الحد الأقصى 1000 حرف)'
          : 'Comment is too long (max 1000 characters)',
        buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
      });
      return;
    }
    setIsSubmitting(true);

    try {
      await createReview(serviceId, rating, comment, bookingId);

      setAlertConfig({
        visible: true,
        title: isRTL ? 'نجح!' : 'Success!',
        message: isRTL
          ? 'تم إرسال التقييم بنجاح'
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
            <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
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
    <SafeAreaView style={styles.container} edges={['top']}>
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
        <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
          {isRTL ? 'كتابة تقييم' : 'Write Review'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Name */}
        <View style={styles.serviceNameContainer}>
          <Text style={[styles.serviceNameLabel, isRTL && styles.textRTL]}>
            {isRTL ? 'الخدمة:' : 'Service:'}
          </Text>
          <Text style={[styles.serviceName, isRTL && styles.textRTL]}>
            {serviceName}
          </Text>
        </View>

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
            numberOfLines={6}
            maxLength={1000}
            textAlignVertical="top"
            editable={!isSubmitting}
          />
          <Text style={[styles.characterCount, isRTL && styles.textRTL]}>
            {comment.length} / 1000
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

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerTitleRTL: {
    fontFamily: 'Arial',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: Dimensions.get('window').width >= 600 ? 120 : 20,
  },
  serviceNameContainer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  serviceNameLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 150,
    backgroundColor: '#FAFAFA',
  },
  commentInputRTL: {
    textAlign: 'right',
    fontFamily: 'Arial',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  textRTL: {
    textAlign: 'right',
    fontFamily: 'Arial',
  },
});

export default WriteReview;
