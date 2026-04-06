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
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { sourceApi } from '../../api/sourceApi';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { type MoneySourceTransactionsResponse } from '../../types/source';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'SourceTransactions'>;

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

const iconByKey: Record<
  MoneySourceTransactionsResponse['items'][number]['iconKey'],
  { name: keyof typeof MaterialIcons.glyphMap; bg: string }
> = {
  salary: { name: 'inventory-2', bg: '#4D9EFF' },
  food: { name: 'restaurant-menu', bg: '#4D9EFF' },
  rent: { name: 'home', bg: '#4D9EFF' },
  transport: { name: 'directions-bus', bg: '#4D9EFF' },
  other: { name: 'shopping-bag', bg: '#7A8BFF' },
};

export const SourceTransactionsScreen = ({ navigation, route }: Props) => {
  const { sourceId } = route.params;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MoneySourceTransactionsResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await sourceApi.getSourceTransactions(sourceId);
        setData(response);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [sourceId]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, MoneySourceTransactionsResponse['items']> = {};
    data?.items.forEach((item) => {
      if (!groups[item.monthLabel]) {
        groups[item.monthLabel] = [];
      }
      groups[item.monthLabel].push(item);
    });

    return Object.entries(groups);
  }, [data?.items]);

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải giao dịch...</Text>
        </View>
        <ScreenBottomNavigation activeTab="home" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title={data.source.name}
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
        showNotificationBadge={data.overview.unreadNotifications > 0}
      />

      <View style={styles.summaryRow}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Số dư</Text>
          <Text style={styles.summaryValue}>{formatCurrency(data.overview.balance)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={[styles.summaryCol, styles.summaryColRight]}>
          <Text style={styles.summaryLabel}>Chi tiêu</Text>
          <Text style={[styles.summaryValue, styles.expenseValue]}>-{formatCurrency(data.overview.totalExpense)}</Text>
        </View>
      </View>

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          {groupedItems.map(([monthLabel, items]) => (
            <View key={monthLabel} style={styles.monthGroup}>
              <Text style={styles.monthLabel}>{monthLabel}</Text>

              {items.map((item) => {
                const iconMeta = iconByKey[item.iconKey];
                return (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={[styles.itemIconWrap, { backgroundColor: iconMeta.bg }]}>
                      <MaterialIcons name={iconMeta.name} size={22} color={colors.white} />
                    </View>

                    <View style={styles.itemInfoWrap}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemTime}>{item.timeLabel}</Text>
                    </View>

                    <View style={styles.itemRightWrap}>
                      <Text style={styles.itemNote}>{item.note}</Text>
                      <Text style={[styles.itemAmount, item.kind === 'expense' ? styles.expenseAmountText : styles.incomeAmountText]}>
                        {item.kind === 'expense' ? '-' : '+'}
                        {formatCurrency(Math.abs(item.amount))}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}

          <Pressable style={styles.addButton} onPress={() => navigation.navigate('AddTransaction')}>
            <Text style={styles.addButtonText}>Thêm giao dịch</Text>
          </Pressable>
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
  monthLabel: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 4,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#E6F5EC',
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
  itemNote: {
    color: '#4F6B63',
    fontFamily: typography.poppins.medium,
    fontSize: 14,
    marginBottom: 2,
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
