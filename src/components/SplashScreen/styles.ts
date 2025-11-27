import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.5,
    height: height * 0.3,
    maxWidth: 250,
    maxHeight: 300,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textWhite,
    letterSpacing: 4,
    marginTop: 10,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textWhite,
    letterSpacing: 2,
    opacity: 0.9,
  },
});
