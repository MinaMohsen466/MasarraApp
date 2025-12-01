import AsyncStorage from '@react-native-async-storage/async-storage';

const WISHLIST_KEY_PREFIX = 'masarra_wishlist_v2_';

export type WishlistItem = {
  _id: string;
  name?: string;
  image?: string;
  price?: number;
};

// Get the current user ID from AsyncStorage
async function getCurrentUserId(): Promise<string | null> {
  try {
    const userDataStr = await AsyncStorage.getItem('userData');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      return userData._id || userData.id || null;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Get wishlist key for current user
async function getWishlistKey(): Promise<string> {
  const userId = await getCurrentUserId();
  if (userId) {
    return `${WISHLIST_KEY_PREFIX}${userId}`;
  }
  // Fallback to generic key if no user is logged in
  return `${WISHLIST_KEY_PREFIX}guest`;
}

export async function getWishlist(): Promise<WishlistItem[]> {
  try {
    const key = await getWishlistKey();
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as WishlistItem[];
  } catch (e) {
    return [];
  }
}

async function saveWishlist(items: WishlistItem[]) {
  try {
    const key = await getWishlistKey();
    await AsyncStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    // Error saving wishlist
  }
}

export async function addToWishlist(item: WishlistItem) {
  const items = await getWishlist();
  if (!items.find(i => i._id === item._id)) {
    items.unshift(item);
    await saveWishlist(items);
  }
  return items;
}

export async function removeFromWishlist(id: string) {
  let items = await getWishlist();
  items = items.filter(i => i._id !== id);
  await saveWishlist(items);
  return items;
}

export async function toggleWishlist(item: WishlistItem) {
  const items = await getWishlist();
  const exists = items.find(i => i._id === item._id);
  if (exists) {
    return await removeFromWishlist(item._id);
  }
  return await addToWishlist(item);
}

export async function isWishlisted(id: string) {
  const items = await getWishlist();
  return items.some(i => i._id === id);
}

// Clear wishlist for current user (useful on logout)
export async function clearWishlist() {
  try {
    const key = await getWishlistKey();
    await AsyncStorage.removeItem(key);
  } catch (e) {
    // Error clearing wishlist
  }
}
