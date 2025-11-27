import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles';
import { useLanguage } from '../../contexts/LanguageContext';

interface MasarraWelcomeProps {
  onBrowseServices: () => void;
  onGetStarted: () => void;
}

const MasarraWelcome: React.FC<MasarraWelcomeProps> = ({ onBrowseServices, onGetStarted }) => {
  const { isRTL } = useLanguage();

  return (
    <View style={styles.container}>

      {/* Welcome Text */}
      <Text style={[styles.title, isRTL && styles.titleRTL]}>
        {isRTL ? 'مرحباً بك في مسرة' : 'Welcome to Masarra'}
      </Text>
      
      <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
        {isRTL ? 'اكتشف خدمات مذهلة لمناسباتك الخاصة' : 'Discover amazing services for your special occasions'}
      </Text>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.browseButton}
          onPress={onBrowseServices}
          activeOpacity={0.8}>
          <Text style={styles.browseButtonText}>
            {isRTL ? 'تصفح الخدمات' : 'Browse Services'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.getStartedButton}
          onPress={onGetStarted}
          activeOpacity={0.8}>
          <Text style={styles.getStartedButtonText}>
            {isRTL ? 'ابدأ الآن' : 'Get Started'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MasarraWelcome;
