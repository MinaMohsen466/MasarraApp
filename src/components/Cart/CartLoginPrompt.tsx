import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../constants/colors';
import { styles } from '../../screens/cartStyles';

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
        backgroundColor="#00a19c"
        barStyle="light-content"
        translucent={false}
      />
      <View style={{ flex: 1, backgroundColor: colors.primary }}>
        <View
          style={{ height: insets.top, backgroundColor: colors.primary }}
        />
        <View style={styles.loginFullPageContainer}>
          <ScrollView
            style={styles.loginScrollContainer}
            contentContainerStyle={styles.loginContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Curved Header Background Block with topographic waves & integrated navigation */}
            <View style={styles.loginHeaderBlock}>
              <Svg
                width="100%"
                height="100%"
                viewBox="0 0 375 130"
                preserveAspectRatio="none"
                style={styles.loginTopographicSvg}
              >
                <Path
                  d="M-20 25 C80 70 180 15 300 60 T400 40"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1.5}
                  fill="none"
                />
                <Path
                  d="M-20 45 C80 90 180 25 300 80 T400 60"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={1.5}
                  fill="none"
                />
                <Path
                  d="M-20 65 C80 110 180 35 300 100 T400 80"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={2}
                  fill="none"
                />
              </Svg>

              {/* Overlay Navigation Bar */}
              <View
                style={[
                  styles.loginOverlayBar,
                  isRTL && styles.loginOverlayBarRTL,
                ]}
              >
                <TouchableOpacity
                  style={styles.loginBackButtonCircle}
                  onPress={handleBack}
                  activeOpacity={0.8}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d={isRTL ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
                      stroke={colors.textWhite}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>

                <Text
                  style={[
                    styles.headerTitle,
                    { color: colors.textWhite },
                    isRTL && styles.headerTitleRTL,
                  ]}
                >
                  {t('myCart')}
                </Text>

                <View style={styles.loginHeaderSpacer} />
              </View>
            </View>

            {/* Curved Wave Divider (Transitions header to card background) */}
            <View style={styles.loginCurveDivider}>
              <Svg
                height="40"
                width="100%"
                viewBox="0 0 375 40"
                preserveAspectRatio="none"
              >
                <Path
                  d="M0,25 C100,55 250,0 375,25 L375,40 L0,40 Z"
                  fill={colors.backgroundCard}
                />
              </Svg>
            </View>

            {/* Login Prompt Section */}
            <View style={styles.loginPromptContainer}>
              {/* Circular Container with Shopping Basket Icon */}
              <View style={styles.loginPlaceholderCircle}>
                <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
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
                style={[
                  styles.loginPromptTitle,
                  isRTL && styles.loginPromptTitleRTL,
                ]}
              >
                {isRTL ? 'سلة التسوق' : 'My Cart'}
              </Text>

              <Text
                style={[
                  styles.loginPromptText,
                  isRTL && styles.loginPromptTextRTL,
                ]}
              >
                {isRTL
                  ? 'الرجاء تسجيل الدخول لعرض سلة التسوق الخاصة بك'
                  : 'Please log in to view your shopping cart'}
              </Text>

              <TouchableOpacity
                style={styles.loginSubmitButton}
                onPress={() => onNavigate && onNavigate('auth')}
                activeOpacity={0.8}
              >
                <Text style={styles.loginSubmitButtonText}>
                  {isRTL ? 'تسجيل الدخول' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </>
  );
};
