import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  containerRTL: {
    // RTL adjustments handled by flexDirection in child components
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 12,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  topRowRTL: {
    flexDirection: 'row-reverse',
  },
  imageContainer: {
    width: 90,
    height: 90,
    marginRight: 12,
    marginLeft: 0,
  },
  imageContainerRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  vendorImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  letterAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterAvatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  infoContainerRTL: {
    alignItems: 'flex-end',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 6,
  },
  occasionsTags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  occasionsTagsRTL: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
  },
  occasionTag: {
    fontSize: 12,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  ratingContainerRTL: {
    flexDirection: 'row-reverse',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 6,
  },
  ratingTextRTL: {
    marginRight: 0,
    marginLeft: 6,
  },
  reviewsText: {
    fontSize: 12,
    color: '#999',
  },
  descriptionSection: {
    marginTop: 10,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  description: {
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
    fontWeight: '400',
  },
  filterSortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 0,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  filterSortContainerRTL: {
    flexDirection: 'row-reverse',
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: '45%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  sortButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: '45%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  textRTL: {
    textAlign: 'right',
  },
});
