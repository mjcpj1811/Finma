import { useCallback, useMemo, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { transactionApi } from '../../api/transactionApi';
import { recurringApi } from '../../api/recurringApi';
import { type TransactionDashboard, type TransactionFilter, type TransactionItem } from '../../types/transaction';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Transactions'>;

type SelectedTransactionType = Extract<TransactionFilter, 'income' | 'expense'>;

const iconByKey: Record<TransactionItem['iconKey'], { name: keyof typeof MaterialIcons.glyphMap; bg: string }> = {
  salary: { name: 'inventory-2', bg: '#4D9EFF' },
  food: { name: 'shopping-bag', bg: '#4D9EFF' },
  rent: { name: 'home', bg: '#4D9EFF' },
  transport: { name: 'directions-bus', bg: '#4D9EFF' },
  other: { name: 'restaurant-menu', bg: '#A8A8FF' },
};

const formatCurrency = (value: number) => value.toLocaleString('vi-VN');

const filterConfig: Record<
  SelectedTransactionType,
  {
    label: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    activeBackground: string;
    inactiveBackground: string;
    activeText: string;
    inactiveText: string;
    activeIcon: string;
    inactiveIcon: string;
  }
> = {
  income: {
    label: 'Thu Nhập',
    icon: 'south-west',
    activeBackground: colors.blueDark,
    inactiveBackground: colors.white,
    activeText: colors.white,
    inactiveText: colors.text,
    activeIcon: colors.white,
    inactiveIcon: colors.primary,
  },
  expense: {
    label: 'Chi Tiêu',
    icon: 'north-east',
    activeBackground: colors.blueDark,
    inactiveBackground: colors.white,
    activeText: colors.white,
    inactiveText: colors.text,
    activeIcon: colors.white,
    inactiveIcon: colors.blueDark,
  },
};

export const TransactionScreen = ({ navigation }: Props) => {
  const [selectedType, setSelectedType] = useState<SelectedTransactionType>('income');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<TransactionDashboard | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await recurringApi.syncDueTransactions();
      const response = await transactionApi.getDashboard(selectedType);
      setDashboard(response);
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

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
        <ScreenBottomNavigation activeTab="exchange" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title="Giao Dịch"
        onPressNotification={() => navigation.navigate('Notifications')}
        showNotificationBadge={dashboard.overview.unreadNotifications > 0}
      />

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Tổng Số Dư</Text>
        <Text style={styles.summaryValue}>{formatCurrency(dashboard.overview.totalBalance)}</Text>
      </View>

      <View style={styles.summaryRow}>
        {(['income', 'expense'] as SelectedTransactionType[]).map((type) => {
          const config = filterConfig[type];
          const isActive = selectedType === type;
          const value = type === 'income' ? dashboard.overview.totalIncome : dashboard.overview.totalExpense;

          return (
            <Pressable
              key={type}
              style={[
                styles.summaryMiniCard,
                { backgroundColor: isActive ? config.activeBackground : config.inactiveBackground },
                isActive ? styles.summaryMiniCardActive : styles.summaryMiniCardInactive,
              ]}
              onPress={() => setSelectedType(type)}
            >
              <View style={[styles.summaryMiniIconWrap, isActive ? styles.summaryMiniIconWrapActive : styles.summaryMiniIconWrapInactive]}>
                <MaterialIcons
                  name={config.icon}
                  size={18}
                  color={isActive ? config.activeIcon : config.inactiveIcon}
                />
              </View>
              <Text style={[styles.summaryMiniLabel, { color: isActive ? config.activeText : config.inactiveText }]}>
                {config.label}
              </Text>
              <Text style={[styles.summaryMiniValue, { color: isActive ? config.activeText : config.inactiveText }]}>
                {formatCurrency(value)}
              </Text>
            </Pressable>
          );
        })}
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

          {groupedItems.map(([monthLabel, items]) => (
            <View key={monthLabel} style={styles.monthGroup}>
              <Text style={styles.monthLabel}>{monthLabel}</Text>

              {items.map((item) => {
                const iconMeta = iconByKey[item.iconKey];
                const secondaryText = item.note.trim();
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
                      {secondaryText ? <Text style={styles.itemNote}>{secondaryText}</Text> : null}
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

      <ScreenBottomNavigation activeTab="exchange" />
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
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  summaryMiniCardActive: {
    borderColor: colors.blueDark,
  },
  summaryMiniCardInactive: {
    borderColor: '#E5EDEB',
    borderRadius: 14,
    padding: 12,
  },
  summaryMiniIconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  summaryMiniIconWrapInactive: {
    backgroundColor: '#F1FFF3',
  },
  summaryMiniIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryMiniLabel: {
    fontFamily: typography.poppins.medium,
    fontSize: 12,
  },
  summaryMiniValue: {
    fontFamily: typography.poppins.bold,
    fontSize: 24,
    lineHeight: 30,
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

});