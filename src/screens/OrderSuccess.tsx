import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../constants/colors';
import { useLanguage } from '../contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OrderSuccessProps {
  onDone?: () => void;
}

const OrderSuccess: React.FC<OrderSuccessProps> = ({ onDone }) => {
  const { isRTL } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Svg width={120} height={120} viewBox="0 0 120 120">
            <Circle
              cx="60"
              cy="60"
              r="55"
              stroke={colors.primary}
              strokeWidth="4"
              fill="none"
            />
            <Path
              d="M 35 60 L 50 75 L 85 40"
              stroke={colors.primary}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>
          {isRTL ? 'تم استلام طلبك' : 'YOUR ORDER HAS'}
        </Text>
        <Text style={styles.title}>{isRTL ? '' : 'BEEN RECEIVED'}</Text>

        <Text style={styles.subtitle}>
          {isRTL ? 'شكراً لك على الشراء!' : 'Thank you for your Purchase!'}
        </Text>

        <Text style={styles.description}>
          {isRTL
            ? 'سوف تتلقى بريد إلكتروني لتأكيد الطلب مع تفاصيل طلبك'
            : 'You will recieve an order confirmation email with your details of your order'}
        </Text>

        <Text style={styles.thankYou}>
          {isRTL
            ? 'شكراً لك على اختيار MASARRA!'
            : 'Thank you for Choosing MASARRA!'}
        </Text>

        {/* Done Button */}
        {onDone && (
          <TouchableOpacity style={styles.doneButton} onPress={onDone}>
            <Text style={styles.doneButtonText}>{isRTL ? 'تم' : 'DONE'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    maxWidth: SCREEN_WIDTH - 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  thankYou: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 40,
  },
  doneButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 60,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  doneButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default OrderSuccess;
