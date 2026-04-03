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
import { MaterialIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { transactionApi } from '../../api/transactionApi';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { BottomNavBar } from '../../components/BottomNavBar';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { type TransactionDashboard, type TransactionItem, type TransactionType } from '../../types/transaction';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryTransactions'>;

const iconByKey: Record<TransactionItem['iconKey'], { name: keyof typeof MaterialIcons.glyphMap; bg: string }> = {
  salary: { name: 'inventory-2', bg: '#4D9EFF' },
  food: { name: 'restaurant-menu', bg: '#4D9EFF' },
  rent: { name: 'home', bg: '#4D9EFF' },
  transport: { name: 'directions-bus', bg: '#4D9EFF' },
  other: { name: 'shopping-bag', bg: '#7A8BFF' },
};

const categoryIconMap: Record<string, TransactionItem['iconKey']> = {
  shopping: 'food',
  restaurant: 'food',
  directions_bus: 'transport',
  attach_money: 'salary',
  account_balance_wallet: 'salary',
  movie: 'other',
  healing: 'other',
  card_giftcard: 'other',
};

const categoryIdMap: Record<string, string> = {
  shopping: 'food',
  restaurant: 'food',
  directions_bus: 'transport',
  attach_money: 'salary',
  account_balance_wallet: 'bonus',
};

const formatCurrency = (value: number) => `${Math.round(value).toLocaleString('vi-VN')} đ`;

export const CategoryTransactionsScreen = ({ navigation, route }: Props) => {
  const { categoryName, categoryGroup, categoryIconKey } = route.params;

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<TransactionDashboard | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await transactionApi.getDashboard('all');
        setDashboard(response);
      } catch {
        setDashboard(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filteredItems = useMemo(() => {
    if (!dashboard) {
      return [] as TransactionItem[];
    }

    const mappedIcon = categoryIconMap[categoryIconKey] ?? 'other';
    const expectedKind: TransactionType = categoryGroup === 'income' ? 'income' : 'expense';
    const nameLower = categoryName.toLowerCase();

    return dashboard.items.filter((item) => {
      const matchKind = item.kind === expectedKind;
      const matchIcon = item.iconKey === mappedIcon;
      const matchName = item.title.toLowerCase().includes(nameLower);
      return matchKind && (matchIcon || matchName);
    });
  }, [categoryGroup, categoryIconKey, categoryName, dashboard]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, TransactionItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.monthLabel]) {
        groups[item.monthLabel] = [];
      }
      groups[item.monthLabel].push(item);
    });

    return Object.entries(groups);
  }, [filteredItems]);

  const totalAmount = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + Math.abs(item.amount), 0);
  }, [filteredItems]);

  if (loading || !dashboard) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải giao dịch danh mục...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title={categoryName}
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
        showNotificationBadge={dashboard.overview.unreadNotifications > 0}
      />

      <View style={styles.summaryRow}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Tổng dư</Text>
          <Text style={styles.summaryValue}>{formatCurrency(dashboard.overview.totalBalance)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={[styles.summaryCol, styles.summaryColRight]}>
          <Text style={styles.summaryLabel}>{categoryGroup === 'income' ? 'Tổng thu' : 'Tổng chi'}</Text>
          <Text style={[styles.summaryValue, styles.expenseValue]}>
            {categoryGroup === 'income' ? '+' : '-'}{formatCurrency(totalAmount)}
          </Text>
        </View>
      </View>

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          {groupedItems.map(([monthLabel, items]) => (
            <View key={monthLabel} style={styles.monthGroup}>
              <View style={styles.monthHeaderRow}>
                <Text style={styles.monthLabel}>{monthLabel}</Text>
                <Pressable style={styles.calendarChip} onPress={() => navigation.navigate('ReportCalendar')}>
                  <MaterialIcons name="calendar-month" size={16} color={colors.white} />
                </Pressable>
              </View>

              {items.map((item) => {
                const iconMeta = iconByKey[item.iconKey];
                return (
                  <Pressable
                    key={item.id}
                    style={styles.itemCard}
                    onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
                  >
                    <View style={[styles.itemIconWrap, { backgroundColor: iconMeta.bg }]}>
                      <MaterialIcons name={iconMeta.name} size={22} color={colors.white} />
                    </View>

                    <View style={styles.itemInfoWrap}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemTime}>{item.timeLabel}</Text>
                    </View>

                    <View style={styles.itemRightWrap}>
                      <Text style={[styles.itemAmount, item.kind === 'expense' ? styles.expenseAmountText : styles.incomeAmountText]}>
                        {item.kind === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(item.amount))}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}

          {filteredItems.length === 0 ? <Text style={styles.emptyText}>Chưa có giao dịch cho danh mục này.</Text> : null}

          <Pressable
            style={styles.addButton}
            onPress={() =>
              navigation.navigate('AddTransaction', {
                presetType: categoryGroup === 'income' ? 'income' : 'expense',
                presetCategoryId: categoryIdMap[categoryIconKey],
                presetTitle: categoryName,
              })
            }
          >
            <Text style={styles.addButtonText}>{categoryGroup === 'income' ? 'Thêm thu nhập' : 'Thêm chi tiêu'}</Text>
          </Pressable>
        </ScrollView>
      </View>

      <View style={styles.fixedBottomNav}>
        <BottomNavBar
          activeTab="layers"
          onPress={(tab) => {
            if (tab === 'home') navigation.navigate('Home');
            if (tab === 'report') navigation.navigate('Report');
            if (tab === 'exchange') navigation.navigate('Transactions');
            if (tab === 'layers') navigation.navigate('Categories');
            if (tab === 'profile') navigation.navigate('Profile');
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
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backSlot: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSlot: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: colors.text,
    textAlign: 'center',
    fontFamily: typography.poppins.semibold,
    fontSize: 24,
    lineHeight: 28,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  summaryCol: {
    flex: 1,
  },
  summaryColRight: {
    alignItems: 'flex-end',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#C6EFE4',
    marginHorizontal: 10,
  },
  summaryLabel: {
    color: '#DFF7E2',
    fontFamily: typography.poppins.medium,
    fontSize: 13,
    marginBottom: 4,
  },
  summaryValue: {
    color: colors.white,
    fontFamily: typography.poppins.bold,
    fontSize: 22,
    lineHeight: 28,
  },
  expenseValue: {
    color: '#0E62D0',
  },
  mainPanel: {
    flex: 1,
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  panelContent: {
    paddingBottom: 120,
  },
  monthGroup: {
    marginBottom: 16,
    gap: 8,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLabel: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 18,
    lineHeight: 24,
  },
  calendarChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#DFF7E2',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  itemIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfoWrap: {
    flex: 1,
  },
  itemTitle: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 16,
    lineHeight: 20,
  },
  itemTime: {
    color: '#0E62D0',
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  itemRightWrap: {
    alignItems: 'flex-end',
    minWidth: 110,
  },
  itemAmount: {
    fontFamily: typography.poppins.semibold,
    fontSize: 17,
  },
  expenseAmountText: {
    color: '#0E62D0',
  },
  incomeAmountText: {
    color: colors.primary,
  },
  addButton: {
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    alignSelf: 'center',
    paddingHorizontal: 28,
  },
  addButtonText: {
    color: '#0B6E5F',
    fontFamily: typography.poppins.semibold,
    fontSize: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: '#4F6B63',
    fontFamily: typography.poppins.medium,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 8,
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
});
