import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { BalanceSummaryCard } from '../../components/BalanceSummaryCard';
import { BottomNavBar } from '../../components/BottomNavBar';
import { NotificationBellButton } from '../../components/NotificationBellButton';
import { homeApi } from '../../api/homeApi';
import { type HomeDashboard, type PeriodFilter } from '../../types/home';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const ICON_GOAL = require('../../../assets/icons/category.png');
const ICON_INCOME = require('../../../assets/icons/home.png');
const ICON_FOOD = require('../../../assets/icons/transaction.png');
const ICON_MANAGE = require('../../../assets/icons/account.png');

const periodOptions: Array<{ key: PeriodFilter; label: string }> = [
  { key: 'day', label: 'Ngày' },
  { key: 'week', label: 'Tuần' },
  { key: 'month', label: 'Tháng' },
];

const formatCurrency = (value: number) => value.toLocaleString('vi-VN');

export const HomeScreen = ({ navigation }: Props) => {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [dashboard, setDashboard] = useState<HomeDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHome = async () => {
      setLoading(true);
      try {
        const response = await homeApi.getDashboard(period);
        setDashboard(response);
      } catch {
        setDashboard(null);
      } finally {
        setLoading(false);
      }
    };

    void loadHome();
  }, [period]);

  const activeDashboard = useMemo(() => dashboard, [dashboard]);

  if (loading || !activeDashboard) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải dữ liệu trang chủ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topSection}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeText}>Chào mừng {activeDashboard.user.name}</Text>
            <Text style={styles.subText}>{activeDashboard.user.greetingText}</Text>
          </View>

          <NotificationBellButton
            onPress={() => navigation.navigate('Notifications')}
            showBadge={activeDashboard.user.unreadNotifications > 0}
          />
        </View>

        <BalanceSummaryCard
          totalBalance={activeDashboard.overview.totalBalance}
          totalExpense={activeDashboard.overview.totalExpense}
          budgetUsedPercent={activeDashboard.overview.budgetUsedPercent}
          budgetLimit={activeDashboard.overview.budgetLimit}
        />
      </View>

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          <View style={styles.snapshotCard}>
            <View style={styles.goalBlock}>
              <View style={styles.goalIconWrap}>
                <Image source={ICON_GOAL} style={styles.goalIcon} resizeMode="contain" />
              </View>
              <Text style={styles.goalText}>{activeDashboard.weeklySnapshot.savingGoalLabel}</Text>
            </View>

            <View style={styles.snapshotContent}>
              <View style={styles.snapshotItem}>
                <Image source={ICON_INCOME} style={styles.snapshotIcon} resizeMode="contain" />
                <View>
                  <Text style={styles.snapshotLabel}>Tổng thu tuần trước</Text>
                  <Text style={styles.snapshotValue}>{formatCurrency(activeDashboard.weeklySnapshot.lastWeekIncome)}</Text>
                </View>
              </View>

              <View style={styles.snapshotDivider} />

              <View style={styles.snapshotItem}>
                <Image source={ICON_FOOD} style={styles.snapshotIcon} resizeMode="contain" />
                <View>
                  <Text style={styles.snapshotLabel}>Ăn uống tuần trước</Text>
                  <Text style={[styles.snapshotValue, styles.expenseText]}>-{formatCurrency(activeDashboard.weeklySnapshot.lastWeekFoodExpense)}</Text>
                </View>
              </View>
            </View>
          </View>

          <Pressable style={styles.manageButton} onPress={() => navigation.navigate('ManageSources')}>
            <Image source={ICON_MANAGE} style={styles.manageIcon} resizeMode="contain" />
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
            {activeDashboard.transactions.map((item) => (
              <View key={item.id} style={styles.transactionItem}>
                <View style={styles.transactionIconWrap}>
                  <Image source={ICON_INCOME} style={styles.transactionIcon} resizeMode="contain" />
                </View>

                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>{item.title}</Text>
                  <Text style={styles.transactionTime}>{item.timeLabel}</Text>
                </View>

                <Text style={styles.transactionCategory}>{item.categoryLabel || '-'}</Text>

                <Text style={[styles.transactionAmount, item.kind === 'expense' && styles.expenseText]}>
                  {item.kind === 'expense' ? '-' : ''}
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.fixedBottomNav}>
        <BottomNavBar
          activeTab="home"
          onPress={(tab) => {
            if (tab === 'home') {
              navigation.navigate('Home');
            }
            if (tab === 'report') {
              navigation.navigate('Report');
            }
            if (tab === 'exchange') {
              navigation.navigate('Transactions');
            }
            if (tab === 'layers') {
              navigation.navigate('Categories');
            }
            if (tab === 'profile') {
              navigation.navigate('Profile');
            }
          }}
        />
      </View>
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
  loaderText: {
    color: colors.white,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  fixedBottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#DFF7E2',
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 10,
  },
});
