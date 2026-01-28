import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useLanguage } from '../../contexts/LanguageContext';

const Banner: React.FC = () => {
    const { data: siteSettings } = useSiteSettings();
    const { isRTL } = useLanguage();
    const [isDismissed, setIsDismissed] = useState(false);

    // Only render if banner is enabled and has text
    if (!siteSettings?.bannerEnabled || isDismissed) {
        return null;
    }

    const bannerText = isRTL ? siteSettings.bannerTextAr : siteSettings.bannerText;

    if (!bannerText) {
        return null;
    }

    return (
        <View style={styles.bannerContainer}>
            <Text style={styles.bannerText}>{bannerText}</Text>
            <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsDismissed(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    bannerContainer: {
        backgroundColor: '#00a19c',
        paddingVertical: 8,
        paddingHorizontal: 40,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    bannerText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
        flex: 1,
    },
    closeButton: {
        position: 'absolute',
        right: 12,
        padding: 4,
    },
    closeButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default Banner;
