/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../constants/colors';

interface CartLoginPromptProps {
  isRTL: boolean;
  t: (key: string) => string;
  insets: { top: number };
  handleBack: () => void;
  onNavigate?: (route: string) => void;
}

export const CartLoginPrompt: React.FC<CartLoginPromptProps> = ({
  isRTL,
  t,
  insets,
  handleBack,
  onNavigate,
}) => {
  return (
    <>
      <StatusBar
        backgroundColor={colors.backgroundCard}
        barStyle="dark-content"
        translucent={false}
      />
      <View style={{ flex: 1, backgroundColor: colors.backgroundCard }}>
        <View style={{ height: insets.top, backgroundColor: colors.backgroundCard }} />

        {/* Clean Header Bar */}
        <View
          style={{
            flexDirection: isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <TouchableOpacity
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: '#FFFFFF',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 5,
              elevation: 2,
              borderWidth: 1,
              borderColor: 'rgba(44, 95, 93, 0.15)',
            }}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Icon
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={20}
              color="#0F172A"
            />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#0F172A',
              textAlign: 'center',
              flex: 1,
            }}
          >
            {t('myCart')}
          </Text>

          <View style={{ width: 42 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Login Prompt Card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              marginHorizontal: 16,
              marginTop: 20,
              borderRadius: 24,
              padding: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(44, 95, 93, 0.12)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.04,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: 'rgba(0, 161, 156, 0.08)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  stroke={colors.primary}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>

            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#0F172A',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              {isRTL ? 'سلة التسوق' : 'My Cart'}
            </Text>

            <Text
              style={{
                fontSize: 13,
                color: '#64748B',
                textAlign: 'center',
                lineHeight: 20,
                marginBottom: 20,
                paddingHorizontal: 8,
              }}
            >
              {isRTL
                ? 'الرجاء تسجيل الدخول لعرض سلة التسوق الخاصة بك وإضافة الخدمات.'
                : 'Please log in to view your shopping cart and add services.'}
            </Text>

            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 13,
                paddingHorizontal: 36,
                borderRadius: 20,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={() => onNavigate && onNavigate('auth')}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: '700',
                  letterSpacing: 0.5,
                }}
              >
                {isRTL ? 'تسجيل الدخول' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
};
