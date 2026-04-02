import { useCallback, useMemo, useState } from 'react';
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
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomNavBar } from '../../components/BottomNavBar';
import { NotificationBellButton } from '../../components/NotificationBellButton';
import { transactionApi } from '../../api/transactionApi';
import { recurringApi } from '../../api/recurringApi';
import { type TransactionDashboard, type TransactionFilter, type TransactionItem } from '../../types/transaction';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Transactions'>;

const ICON_BACK = require('../../../assets/icons/back.png');

const filterOptions: Array<{ key: TransactionFilter; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'income', label: 'Thu nhập' },
  { key: 'expense', label: 'Chi tiêu' },
];

const iconByKey: Record<TransactionItem['iconKey'], { name: keyof typeof MaterialIcons.glyphMap; bg: string }> = {
  salary: { name: 'inventory-2', bg: '#4D9EFF' },
  food: { name: 'shopping-bag', bg: '#4D9EFF' },
  rent: { name: 'home', bg: '#4D9EFF' },
  transport: { name: 'directions-bus', bg: '#4D9EFF' },
  other: { name: 'restaurant-menu', bg: '#A8A8FF' },
};

const formatCurrency = (value: number) => value.toLocaleString('vi-VN');

export const TransactionScreen = ({ navigation }: Props) => {
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<TransactionDashboard | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await recurringApi.syncDueTransactions();
      const response = await transactionApi.getDashboard(filter);
      setDashboard(response);
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const groupedItems = useMemo(() => {
    const groups: Record<string, TransactionItem[]> = {};
    dashboard?.items.forEach((item) => {
      if (!groups[item.monthLabel]) {
        groups[item.monthLabel] = [];
      }
      groups[item.monthLabel].push(item);
    });

    return Object.entries(groups);
  }, [dashboard]);

  if (loading || !dashboard) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải giao dịch...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerRow}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Giao Dịch</Text>
        <View style={styles.headerRightSlot}>
          <NotificationBellButton
            size={30}
            onPress={() => navigation.navigate('Notifications')}
            showBadge={dashboard.overview.unreadNotifications > 0}
          />
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Tổng Số Dư</Text>
        <Text style={styles.summaryValue}>{formatCurrency(dashboard.overview.totalBalance)}</Text>
      </View>

      <View style={styles.summaryRow}>
        <Pressable
          style={[styles.summaryMiniCard, filter === 'income' && styles.summaryMiniCardActive]}
          onPress={() => setFilter('income')}
        >
          <View style={styles.summaryMiniIconWrap}>
            <MaterialIcons name="south-west" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.summaryMiniLabel, styles.incomeLabel]}>Thu Nhập</Text>
          <Text style={[styles.summaryMiniValue, styles.incomeValue]}>
            {formatCurrency(dashboard.overview.totalIncome)}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.summaryMiniCard, filter === 'expense' && styles.summaryMiniCardActive]}
          onPress={() => setFilter('expense')}
        >
          <View style={styles.summaryMiniIconWrap}>
            <MaterialIcons name="north-east" size={18} color={colors.blueDark} />
          </View>
          <Text style={[styles.summaryMiniLabel, styles.expenseLabel]}>Chi Tiêu</Text>
          <Text style={[styles.summaryMiniValue, styles.expenseValue]}>
            {formatCurrency(dashboard.overview.totalExpense)}
          </Text>
        </Pressable>
      </View>

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.monthHeader}>April</Text>
            <View style={styles.listActions}>
              <Pressable style={styles.roundAction} onPress={() => navigation.navigate('AddTransaction')}>
                <MaterialIcons name="add" size={22} color={colors.white} />
              </Pressable>
              <Pressable style={styles.roundAction} onPress={() => navigation.navigate('ReportCalendar')}>
                <MaterialIcons name="calendar-month" size={18} color={colors.white} />
              </Pressable>
            </View>
          </View>

          {filterOptions.some((option) => option.key === filter) ? null : null}

          {groupedItems.map(([monthLabel, items]) => (
            <View key={monthLabel} style={styles.monthGroup}>
              <Text style={styles.monthLabel}>{monthLabel}</Text>

              {items.map((item) => {
                const iconMeta = iconByKey[item.iconKey];
                return (
                  <Pressable
                    key={item.id}
                    style={styles.itemCard}
                    onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
                  >
                    <View style={[styles.itemIconWrap, { backgroundColor: iconMeta.bg }]}>
                      <MaterialIcons name={iconMeta.name} size={24} color={colors.white} />
                    </View>

                    <View style={styles.itemInfoWrap}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemTime}>{item.timeLabel}</Text>
                    </View>

                    <View style={styles.itemRightWrap}>
                      <Text style={styles.itemNote}>{item.note}</Text>
                      <Text style={[styles.itemAmount, item.kind === 'expense' ? styles.expenseAmountText : styles.incomeAmountText]}>
                        {item.kind === 'expense' ? '-' : ''}
                        {formatCurrency(Math.abs(item.amount))}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.fixedBottomNav}>
        <BottomNavBar
          activeTab="exchange"
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
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  headerRightSlot: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 22,
    height: 22,
  },
  headerTitle: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.poppins.semibold,
    fontSize: 24,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#DFF7E2',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 12,
    width: '90%',
    alignSelf: 'center',
  },
  summaryLabel: {
    color: colors.text,
    textAlign: 'center',
    fontFamily: typography.poppins.medium,
    fontSize: 13,
    
  },
  summaryValue: {
    color: colors.text,
    textAlign: 'center',
    fontFamily: typography.poppins.bold,
    fontSize: 34,
    lineHeight: 40,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    width: '90%',
    alignSelf: 'center',
    marginBottom: 12,
  },
  summaryMiniCard: {
    flex: 1,
    backgroundColor: '#F1FFF3',
    borderRadius: 14,
    padding: 12,
  },
  summaryMiniCardActive: {
    backgroundColor: '#F1FFF3',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  summaryMiniIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryMiniLabel: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 12,
  },
  summaryMiniLabelActive: {
    color: colors.white,
  },
  summaryMiniValue: {
    color: colors.text,
    fontFamily: typography.poppins.bold,
    fontSize: 24,
    lineHeight: 30,
  },
  summaryMiniValueActive: {
    color: colors.white,
  },
  expenseLabel: {
    color: colors.blueDark,
  },
  incomeLabel: {
    color: colors.primary,
  },
  incomeValue: {
    color: colors.primary,
  },
  expenseValue: {
    color: colors.blueDark,
  },
  mainPanel: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    paddingHorizontal: 18,
    paddingTop: 20,
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 100,
    gap: 14,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthHeader: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 18,
  },
  listActions: {
    flexDirection: 'row',
    gap: 10,
  },
  roundAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthGroup: {
    gap: 10,
  },
  monthLabel: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 16,
  },
  itemCard: {
    backgroundColor: '#DFF7E2',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfoWrap: {
    flex: 1,
  },
  itemTitle: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 16,
  },
  itemTime: {
    color: colors.blueDark,
    fontFamily: typography.poppins.medium,
    fontSize: 12,
  },
  itemRightWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  itemNote: {
    color: '#666666',
    fontFamily: typography.poppins.medium,
    fontSize: 13,
  },
  itemAmount: {
    fontFamily: typography.poppins.semibold,
    fontSize: 16,
  },
  incomeAmountText: {
    color: colors.text,
  },
  expenseAmountText: {
    color: colors.blueDark,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    color: colors.white,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  fixedBottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#DFF7E2',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 10,
  },
});