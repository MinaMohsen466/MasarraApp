/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import { createStyles } from './styles';
import {
  getWishlist,
  removeFromWishlist,
  WishlistItem,
} from '../../services/wishlist';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors } from '../../constants/colors';

interface Props {
  onBack?: () => void;
  onSelectService?: (serviceId: string) => void;
}

const Wishlist: React.FC<Props> = ({ onBack, onSelectService }) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { isRTL } = useLanguage();
  const isTablet = screenWidth >= 600;
  const numColumns = isTablet ? 3 : 2;
  const styles = createStyles(screenWidth);
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    (async () => {
      const w = await getWishlist();
      setItems(w);
    })();
  }, []);

  const handleRemove = async (id: string) => {
    const updated = await removeFromWishlist(id);
    setItems(updated);
  };

  const renderItem = ({ item }: { item: WishlistItem }) => (
    <TouchableOpacity
      style={styles.cardVertical}
      activeOpacity={0.9}
      onPress={() => {
        if (onSelectService) onSelectService(item._id);
      }}
    >
      <Image
        source={
          item.image ? { uri: item.image } : require('../../imgs/user.png')
        }
        style={styles.cardImageVertical}
        resizeMode="cover"
      />
      <View style={styles.cardBodyVertical}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.cardVendor} numberOfLines={1}>
          {item.vendorName || 'Vendor'}
        </Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description || ''}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.cardPrice}>
            {item.price?.toFixed(3) || '0.000'} {isRTL ? 'د.ك' : 'KD'}
          </Text>
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={() => handleRemove(item._id)}
            accessibilityLabel="Remove from wishlist"
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="#0b6b63"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      <StatusBar
        backgroundColor="#00a19c"
        barStyle="light-content"
        translucent={false}
      />
      <View style={{ height: insets.top, backgroundColor: colors.primary }} />
      <View style={[styles.container, { position: 'relative' }]}>
        {/* Curved Header Background Block with topographic waves & integrated navigation */}
        <View style={styles.profileHeaderBlock}>
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 375 110"
            preserveAspectRatio="none"
            style={styles.topographicSvg}
          >
            <Path
              d="M-20 20 C80 55 180 12 300 45 T400 35"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1.5}
              fill="none"
            />
            <Path
              d="M-20 35 C80 70 180 20 300 60 T400 50"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={1.5}
              fill="none"
            />
            <Path
              d="M-20 50 C80 85 180 28 300 75 T400 65"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={2}
              fill="none"
            />
          </Svg>

          {/* Overlay Navigation Bar */}
          <View
            style={[
              styles.headerOverlayBar,
              isRTL && styles.headerOverlayBarRTL,
            ]}
          >
            {onBack && (
              <TouchableOpacity
                style={styles.headerBackButtonCircle}
                onPress={onBack}
                activeOpacity={0.8}
              >
                <Icon
                  name={isRTL ? 'chevron-forward' : 'chevron-back'}
                  size={20}
                  color={colors.textWhite}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Curved Wave Divider (Transitions header to card background) */}
        <View style={styles.profileCurveDivider}>
          <Svg
            height="30"
            width="100%"
            viewBox="0 0 375 30"
            preserveAspectRatio="none"
          >
            <Path
              d="M0,20 C100,40 250,0 375,20 L375,30 L0,30 Z"
              fill={colors.background}
            />
          </Svg>
        </View>

        <Text style={[styles.pageBodyTitle, isRTL && styles.pageBodyTitleRTL]}>
          {isRTL ? `المفضلة (${items.length})` : `Wishlist (${items.length})`}
        </Text>

        {/* Content body */}
        {!items || items.length === 0 ? (
          <View style={styles.emptyBodyCentered}>
            <Text style={styles.emptyTitle}>
              {isRTL ? 'قائمة المفضلة فارغة' : 'Your wishlist is empty'}
            </Text>
            <Text style={styles.emptyNote}>
              {isRTL
                ? 'أضف خدمات إلى المفضلة للعثور عليها لاحقاً'
                : 'Add services to your wishlist to find them later.'}
            </Text>
          </View>
        ) : (
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={items}
            renderItem={renderItem}
            keyExtractor={i => i._id}
            numColumns={numColumns}
            key={numColumns}
            columnWrapperStyle={[styles.row, isRTL && styles.rowRTL]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

export default Wishlist;
