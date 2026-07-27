import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 600;

export const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: isTablet ? 24 : 16,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerRowRTL: {
    flexDirection: 'row-reverse',
  },
  headerTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  textRTL: {
    textAlign: 'right',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryContainerRTL: {
    flexDirection: 'row-reverse',
  },
  scoreSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingEnd: 16,
    borderEndWidth: 1,
    borderEndColor: '#E2E8F0',
    minWidth: 90,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
    lineHeight: 36,
  },
  starsRow: {
    fontSize: 14,
    color: colors.primary,
    marginVertical: 3,
  },
  totalReviewsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  barsSection: {
    flex: 1,
    paddingStart: 16,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  distributionRowRTL: {
    flexDirection: 'row-reverse',
  },
  starLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    width: 24,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  countLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    width: 20,
    textAlign: 'right',
  },
  reviewsList: {
    paddingBottom: 30,
  },
  reviewCard: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTopRowRTL: {
    flexDirection: 'row-reverse',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userInfoRTL: {
    flexDirection: 'row-reverse',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 161, 156, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  userDetails: {
    marginHorizontal: 10,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  reviewDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  reviewStars: {
    fontSize: 13,
    color: colors.primary,
  },
  commentText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#334155',
  },
  vendorReplyBox: {
    marginTop: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderStartWidth: 2,
    borderStartColor: colors.primary,
  },
  vendorReplyBoxRTL: {
    borderStartWidth: 0,
    borderEndWidth: 2,
    borderEndColor: colors.primary,
  },
  vendorReplyTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 1,
  },
  vendorReplyText: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
});
