import React, { useEffect } from 'react';
import { View, Image } from 'react-native';
import { styles } from './styles';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    // Show splash for 2 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Show static logo */}
        <Image
          source={require('../../imgs/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

export default SplashScreen;
