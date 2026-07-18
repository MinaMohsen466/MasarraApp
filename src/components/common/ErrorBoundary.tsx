import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors } from '../../constants/colors';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <View style={styles.content}>
            <Text style={styles.errorIcon}>⚠️</Text>

            <Text style={styles.titleAr}>حدث خطأ غير متوقع</Text>
            <Text style={styles.messageAr}>
              نعتذر عن هذا الخلل، يرجى المحاولة مرة أخرى أو إعادة تشغيل التطبيق.
            </Text>

            <Text style={styles.titleEn}>An unexpected error occurred</Text>
            <Text style={styles.messageEn}>
              We apologize for the inconvenience. Please try again or restart
              the app.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText} numberOfLines={8}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>إعادة المحاولة / Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  titleAr: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark || '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  messageAr: {
    fontSize: 15,
    color: colors.textSecondary || '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  titleEn: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark || '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  messageEn: {
    fontSize: 14,
    color: colors.textSecondary || '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  debugContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E21D48',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#334155',
  },
  button: {
    backgroundColor: colors.primary || '#00A19C',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: colors.primary || '#00A19C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
