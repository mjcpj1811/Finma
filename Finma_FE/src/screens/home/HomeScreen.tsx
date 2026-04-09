import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { BalanceSummaryCard } from '../../components/BalanceSummaryCard';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { homeApi } from '../../api/homeApi';
import * as budgetApi from '../../api/budgetApi';
import CategoryIcon from '../../../assets/icons/Category.svg';
import HomeIcon from '../../../assets/icons/Home.svg';
import TransactionsIcon from '../../../assets/icons/Transactions.svg';
import AccountIcon from '../../../assets/icons/account.svg';
import { type HomeDashboard, type PeriodFilter } from '../../types/home';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const periodOptions: Array<{ key: PeriodFilter; label: string }> = [
  { key: 'day', label: 'Ngày' },
  { key: 'week', label: 'Tuần' },
  { key: 'month', label: 'Tháng' },
];

const formatCurrency = (value: number) => value.toLocaleString('vi-VN');

const periodHeaderLabel: Record<PeriodFilter, string> = {
  day: 'hôm qua',
  week: 'tuần trước',
  month: 'tháng trước',
};

const HomeSkeleton = () => {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.skeletonLineLarge} />
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonStack}>
          <View style={styles.skeletonLineMedium} />
          <View style={styles.skeletonLineSmall} />
        </View>
      </View>

      <View style={styles.skeletonCard}>
        <View style={styles.skeletonItem}>
          <View style={styles.skeletonAvatarSmall} />
          <View style={styles.skeletonStack}>
            <View style={styles.skeletonLineMedium} />
            <View style={styles.skeletonLineSmall} />
          </View>
        </View>
        <View style={styles.skeletonDivider} />
        <View style={styles.skeletonItem}>
          <View style={styles.skeletonAvatarSmall} />
          <View style={styles.skeletonStack}>
            <View style={styles.skeletonLineMedium} />
            <View style={styles.skeletonLineSmall} />
          </View>
        </View>
      </View>

      <View style={styles.skeletonList}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.skeletonTransactionRow}>
            <View style={styles.skeletonAvatarSmall} />
            <View style={[styles.skeletonStack, styles.skeletonGrow]}>
              <View style={styles.skeletonLineMedium} />
              <View style={styles.skeletonLineSmall} />
            </View>
            <View style={styles.skeletonAmount} />
          </View>
        ))}
      </View>
    </View>
  );
};

const EmptyTransactions = () => {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        <TransactionsIcon width={24} height={24} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Chưa có giao dịch</Text>
      <Text style={styles.emptyText}>Kỳ này chưa có dữ liệu để hiển thị. Hãy thêm giao dịch mới để bắt đầu.</Text>
    </View>
  );
};

export const HomeScreen = ({ navigation }: Props) => {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [dashboard, setDashboard] = useState<HomeDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [realBudgetLimit, setRealBudgetLimit] = useState(0);
  const [realSpentAmount, setRealSpentAmount] = useState(0);

  useEffect(() => {
    const loadHome = async () => {
      setLoading(true);
      try {
        const [response, activeBudgets] = await Promise.all([
          homeApi.getDashboard(period),
          budgetApi.getActiveBudgets().catch(() => []),
        ]);

        setDashboard(response);
        setRealBudgetLimit(activeBudgets.reduce((sum, b) => sum + (b.amountLimit ?? 0), 0));
        setRealSpentAmount(activeBudgets.reduce((sum, b) => sum + (b.spentAmount ?? 0), 0));
      } catch {
        setDashboard(null);
      } finally {
        setLoading(false);
      }
    };

    void loadHome();
  }, [period]);

  const activeDashboard = useMemo(() => dashboard, [dashboard]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.topSection}>
          <AppScreenHeader
            title="Trang Chủ"
            onPressNotification={() => navigation.navigate('Notifications')}
            showNotificationBadge={false}
          />
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.white} />
            <Text style={styles.loaderText}>Đang tải dữ liệu trang chủ...</Text>
          </View>
          <HomeSkeleton />
        </View>
        <ScreenBottomNavigation activeTab="home" />
      </SafeAreaView>
    );
  }

  if (!activeDashboard) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.topSection}>
          <AppScreenHeader
            title="Trang Chủ"
            onPressNotification={() => navigation.navigate('Notifications')}
            showNotificationBadge={false}
          />
          <View style={styles.loaderWrap}>
            <Text style={styles.loaderText}>Không thể tải dữ liệu trang chủ.</Text>
          </View>
        </View>
        <ScreenBottomNavigation activeTab="home" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topSection}>
        <AppScreenHeader
          title="Trang Chủ"
          onPressNotification={() => navigation.navigate('Notifications')}
          showNotificationBadge={activeDashboard.user.unreadNotifications > 0}
        />
        <View>
          <Text style={styles.welcomeText}>Chào mừng {activeDashboard.user.name}</Text>
          <Text style={styles.subText}>{activeDashboard.user.greetingText}</Text>
        </View>

        <BalanceSummaryCard
          totalBalance={activeDashboard.overview.totalBalance}
          totalExpense={realSpentAmount > 0 ? realSpentAmount : activeDashboard.overview.totalExpense}
          budgetUsedPercent={activeDashboard.overview.budgetUsedPercent}
          budgetLimit={realBudgetLimit > 0 ? realBudgetLimit : activeDashboard.overview.budgetLimit}
          onPressBudget={() => navigation.navigate('Budget')}
        />
      </View>

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          <View style={styles.snapshotCard}>
            <Pressable style={styles.goalBlock} onPress={() => navigation.navigate('Savings')}>
              <View style={styles.goalIconWrap}>
                <CategoryIcon width={28} height={28} color={colors.white} />
              </View>
              <Text style={styles.goalText}>{activeDashboard.goalSummaryText}</Text>
            </Pressable>

            <View style={styles.snapshotContent}>
              <View style={styles.snapshotItem}>
                <HomeIcon width={20} height={20} color={colors.white} />
                <View>
                  <Text style={styles.snapshotLabel}>Tổng thu {periodHeaderLabel[period]}</Text>
                  <Text style={styles.snapshotValue}>{formatCurrency(activeDashboard.headerSummary.totalIncome)}</Text>
                </View>
              </View>

              <View style={styles.snapshotDivider} />

              <View style={styles.snapshotItem}>
                <TransactionsIcon width={20} height={20} color={colors.white} />
                <View>
                  <Text style={styles.snapshotLabel}>Tổng chi {periodHeaderLabel[period]}</Text>
                  <Text style={[styles.snapshotValue, styles.expenseText]}>-{formatCurrency(activeDashboard.headerSummary.totalExpense)}</Text>
                </View>
              </View>
            </View>
          </View>

          <Pressable style={styles.manageButton} onPress={() => navigation.navigate('ManageSources')}>
            <AccountIcon width={22} height={22} />
            <Text style={styles.manageText}>Quản lý nguồn tiền</Text>
          </Pressable>

          <View style={styles.periodRow}>
            {periodOptions.map((option) => {
              const selected = option.key === period;
              return (
                <Pressable
                  key={option.key}
                  style={[styles.periodItem, selected && styles.periodItemActive]}
                  onPress={() => setPeriod(option.key)}
                >
                  <Text style={[styles.periodText, selected && styles.periodTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.transactionList}>
            {activeDashboard.transactions.length === 0 ? (
              <EmptyTransactions />
            ) : (
              activeDashboard.transactions.map((item) => (
                <View key={item.id} style={styles.transactionItem}>
                  <View style={styles.transactionIconWrap}>
                    {item.kind === 'income' ? (
                      <HomeIcon width={24} height={24} color={colors.white} />
                    ) : (
                      <TransactionsIcon width={24} height={24} color={colors.white} />
                    )}
                  </View>

                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>{item.title}</Text>
                    <Text style={styles.transactionTime}>{item.timeLabel}</Text>
                  </View>

                  <Text style={styles.transactionCategory}>{item.categoryLabel || '-'}</Text>

                  <Text style={[styles.transactionAmount, item.kind === 'expense' && styles.expenseText]}>
                    {item.kind === 'expense' ? '-' : ''}
                    {formatCurrency(Math.abs(item.amount))}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      <ScreenBottomNavigation activeTab="home" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  topSection: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 14,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  skeletonWrap: {
    gap: 14,
  },
  skeletonLineLarge: {
    height: 92,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  skeletonCard: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 24,
    padding: 16,
    gap: 14,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  skeletonAvatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  skeletonStack: {
    flex: 1,
    gap: 8,
  },
  skeletonGrow: {
    flexGrow: 1,
  },
  skeletonLineMedium: {
    height: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.32)',
    width: '70%',
  },
  skeletonLineSmall: {
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    width: '48%',
  },
  skeletonDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  skeletonList: {
    gap: 12,
    paddingTop: 4,
  },
  skeletonTransactionRow: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonAmount: {
    width: 72,
    height: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 22,
    gap: 10,
    backgroundColor: colors.bgCard,
    borderRadius: 22,
  },
  emptyIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#DFF7E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 15,
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: typography.poppins.regular,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  loaderText: {
    color: colors.white,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  welcomeText: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 23,
    lineHeight: 28,
  },
  subText: {
    color: colors.text,
    fontFamily: typography.poppins.regular,
    fontSize: 12,
    opacity: 0.75,
  },
  mainPanel: {
    flex: 1,
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    paddingHorizontal: 18,
    paddingTop: 22,
    marginTop: 8,
  },
  panelContent: {
    paddingBottom: 92,
    gap: 16,
  },
  snapshotCard: {
    backgroundColor: colors.primary,
    borderRadius: 32,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    gap: 14,
  },
  goalBlock: {
    width: 94,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.65)',
    paddingRight: 12,
  },
  goalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.blueDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  goalIcon: {
    width: 28,
    height: 28,
    tintColor: colors.white,
  },
  goalText: {
    textAlign: 'center',
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 11,
    lineHeight: 14,
  },
  snapshotContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  snapshotItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  snapshotIcon: {
    width: 20,
    height: 20,
    tintColor: colors.white,
  },
  snapshotLabel: {
    color: colors.text,
    fontFamily: typography.poppins.regular,
    fontSize: 11,
  },
  snapshotValue: {
    color: colors.text,
    fontFamily: typography.poppins.bold,
    fontSize: 22,
    lineHeight: 26,
  },
  snapshotDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginVertical: 4,
  },
  manageButton: {
    alignSelf: 'center',
    backgroundColor: '#DFF7E2',
    borderRadius: 16,
    minWidth: 180,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  manageIcon: {
    width: 22,
    height: 22,
  },
  manageText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#DFF7E2',
    borderRadius: 22,
    padding: 8,
  },
  periodItem: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  periodItemActive: {
    backgroundColor: colors.primary,
  },
  periodText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 13,
  },
  periodTextActive: {
    fontFamily: typography.poppins.semibold,
  },
  transactionList: {
    gap: 12,
  },
  transactionItem: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  transactionIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#60A5FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionIcon: {
    width: 24,
    height: 24,
    tintColor: colors.white,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 14,
  },
  transactionTime: {
    color: colors.blueDark,
    fontFamily: typography.poppins.medium,
    fontSize: 11,
  },
  transactionCategory: {
    color: colors.textSecondary,
    fontFamily: typography.poppins.regular,
    fontSize: 11,
    minWidth: 70,
    textAlign: 'center',
  },
  transactionAmount: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 14,
  },
  expenseText: {
    color: colors.blueDark,
  },
});
