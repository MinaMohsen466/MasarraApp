import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { styles } from './styles';
import {
  getWishlist,
  removeFromWishlist,
  WishlistItem,
} from '../../services/wishlist';

interface Props {
  onBack?: () => void;
  onSelectService?: (serviceId: string) => void;
}

const Wishlist: React.FC<Props> = ({ onBack, onSelectService }) => {
  const insets = useSafeAreaInsets();
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
          Gourmet Catering LLC
        </Text>
        <Text style={styles.cardDesc} numberOfLines={3}>
          Capture every occasion in style with our elegant white modern
          flowers...
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.cardPrice}>
            KWD {item.price?.toFixed(3) || '0.000'}
          </Text>
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={() => handleRemove(item._id)}
            accessibilityLabel="Remove from wishlist"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
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

  if (!items || items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity style={styles.backInline} onPress={onBack}>
              <Text style={styles.backIcon}>{'‹'}</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.header}>{`Wishlist (0)`}</Text>
        </View>
        <View style={styles.emptyBodyCentered}>
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptyNote}>
            Add services to your wishlist to find them later.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.headerRow}>
        {onBack && (
          <TouchableOpacity style={styles.backInline} onPress={onBack}>
            <Text style={styles.backIcon}>{'‹'}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.header}>{`Wishlist (${items.length})`}</Text>
      </View>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={items}
        renderItem={renderItem}
        keyExtractor={i => i._id}
      />

      {/* footer note removed as per design request */}
    </View>
  );
};

export default Wishlist;
