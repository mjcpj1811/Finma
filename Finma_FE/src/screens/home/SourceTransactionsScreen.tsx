import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { sourceApi } from '../../api/sourceApi';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { type MoneySourceTransactionsResponse } from '../../types/source';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { resolveTransactionIconBg, resolveTransactionIconName } from '../../utils/transactionIcon';

type Props = NativeStackScreenProps<RootStackParamList, 'SourceTransactions'>;

const toRoundedMoney = (value: number) => Math.round(Number(value) || 0);
const formatCurrency = (value: number) => toRoundedMoney(value).toLocaleString('vi-VN');

export const SourceTransactionsScreen = ({ navigation, route }: Props) => {
  const { sourceId } = route.params;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MoneySourceTransactionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await sourceApi.getSourceTransactions(sourceId);
          setData(response);
        } catch {
          setData(null);
          setError('Không thể tải dữ liệu giao dịch. Vui lòng thử lại.');
        } finally {
          setLoading(false);
        }
      };

      void load();
    }, [sourceId]),
  );

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

  if (loading) {
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

  if (!data) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <Text style={styles.loaderText}>{error ?? 'Không có dữ liệu giao dịch.'}</Text>
          <Pressable style={styles.addButton} onPress={() => navigation.goBack()}>
            <Text style={styles.addButtonText}>Quay lại</Text>
          </Pressable>
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
          <Text style={[styles.summaryValue, styles.expenseValue]}>
            {toRoundedMoney(Math.abs(data.overview.totalExpense)) > 0 ? '-' : ''}{formatCurrency(Math.abs(data.overview.totalExpense))}
          </Text>
        </View>
      </View>

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.monthHeader}></Text>
            <View style={styles.listActions}>
              <Pressable style={styles.roundAction} onPress={() => navigation.navigate('AddTransaction')}>
                <MaterialIcons name="add" size={22} color={colors.white} />
              </Pressable>
            </View>
          </View>

          {groupedItems.map(([monthLabel, items]) => (
            <View key={monthLabel} style={styles.monthGroup}>
              <Text style={styles.monthLabel}>{monthLabel}</Text>

              {items.map((item) => {
                const absoluteAmount = Math.abs(item.amount);
                const roundedAbsoluteAmount = toRoundedMoney(absoluteAmount);
                const amountSign = roundedAbsoluteAmount > 0 ? (item.kind === 'expense' ? '-' : '+') : '';
                return (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={[styles.itemIconWrap, { backgroundColor: resolveTransactionIconBg(item.kind) }]}>
                      <MaterialIcons
                        name={resolveTransactionIconName(item.iconKey, item.kind) as keyof typeof MaterialIcons.glyphMap}
                        size={22}
                        color={colors.white}
                      />
                    </View>

                    <View style={styles.itemInfoWrap}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemTime}>{item.timeLabel}</Text>
                    </View>

                    <View style={styles.itemRightWrap}>
                      <Text style={styles.itemNote}>{item.note}</Text>
                      <Text style={[styles.itemAmount, item.kind === 'expense' ? styles.expenseAmountText : styles.incomeAmountText]}>
                        {amountSign}
                        {formatCurrency(roundedAbsoluteAmount)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
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
    // paddingHorizontal: 16,
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
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthHeader: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 18,
    lineHeight: 24,
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
