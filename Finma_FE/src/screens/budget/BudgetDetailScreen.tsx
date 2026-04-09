import React, { useEffect, useMemo, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { request } from '../../api/httpClient';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { type TransactionItem } from '../../types/transaction';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import * as budgetApi from '../../api/budgetApi';
import { homeApi } from '../../api/homeApi';
import { resolveTransactionIconBg, resolveTransactionIconName } from '../../utils/transactionIcon';

type Props = NativeStackScreenProps<RootStackParamList, 'BudgetDetail'>;

const formatCurrency = (value: number) => value.toLocaleString('vi-VN');

// ── local helpers ────────────────────────────────────────────────────────────
type BackendTxItem = {
  id: number;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  categoryId: number;
  category: string;
  note?: string | null;
  transactionDateTime?: string | null;
  date?: string | null;
};

type ApiListResponse = { code: number; message?: string; result: BackendTxItem[] };

const pad2 = (v: number) => String(v).padStart(2, '0');

const parseDate = (val?: string | null): Date => {
  if (!val) return new Date();
  const [datePart, timePart = '00:00:00'] = val.trim().split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  if ([year, month, day].some(Number.isNaN)) return new Date();
  return new Date(year, month - 1, day, hour ?? 0, minute ?? 0, second ?? 0);
};

const MONTHS_VI = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const mapTxItem = (item: BackendTxItem): TransactionItem => {
  const date = parseDate(item.transactionDateTime ?? item.date);
  const monthLabel = MONTHS_VI[date.getMonth()];
  const title = item.note?.split(' | ')[0]?.trim() || item.category || 'Giao dịch';
  return {
    id: String(item.id),
    categoryId: String(item.categoryId),
    monthLabel,
    title,
    timeLabel: `${pad2(date.getHours())}:${pad2(date.getMinutes())} - ${pad2(date.getDate())} ${monthLabel}`,
    note: item.note ?? '',
    amount: item.type === 'EXPENSE' ? -Math.abs(Number(item.amount)) : Math.abs(Number(item.amount)),
    kind: item.type === 'INCOME' ? 'income' : 'expense',
    iconKey: item.category || (item.type === 'INCOME' ? 'attach_money' : 'shopping'),
  };
};
// ─────────────────────────────────────────────────────────────────────────────

export const BudgetDetailScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const {
    budgetId,
    categoryId,
    categoryName,
    categoryGroup,
    amountLimit,
    spentAmount,
    categoryIcon,
    categoryColor,
  } = route.params;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, homeData] = await Promise.all([
        request<ApiListResponse>(`/transactions?categoryId=${categoryId}`),
        homeApi.getDashboard('month').catch(() => null),
      ]);
      setItems((res.result ?? []).map(mapTxItem));
      if (homeData) {
        setUnreadNotifications(homeData.user.unreadNotifications);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [categoryId]);

  const monthOptions = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.monthLabel)));
  }, [items]);

  useEffect(() => {
    if (!selectedMonth && monthOptions.length > 0) {
      setSelectedMonth(monthOptions[0]);
    }
  }, [monthOptions, selectedMonth]);

  const visibleItems = useMemo(() => {
    if (!selectedMonth) return items;
    return items.filter((item) => item.monthLabel === selectedMonth);
  }, [items, selectedMonth]);

  const usedPercentage = amountLimit > 0 ? Math.round((spentAmount / amountLimit) * 100) : 0;
  const remainingAmount = Math.max(amountLimit - spentAmount, 0);

  const handleEdit = () => {
    navigation.navigate('BudgetCreate', { budgetId });
  };

  const handleDelete = () => {
    Alert.alert('Xóa ngân sách', `Bạn có chắc muốn xóa ngân sách cho "${categoryName}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await budgetApi.deleteBudget(budgetId);
            navigation.navigate('Budget');
          } catch (err) {
            Alert.alert('Lỗi', 'Không thể xóa ngân sách.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderScreen}>
        <ActivityIndicator size="large" color={colors.white} />
        <Text style={styles.loaderText}>Đang tải giao dịch ngân sách...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title={categoryName}
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
        showNotificationBadge={unreadNotifications > 0}
      />

      <View style={styles.budgetActionsRow}>
        <Pressable style={styles.editBudgetChip} onPress={handleEdit}>
          <MaterialIcons name="edit" size={15} color="#2563EB" />
          <Text style={styles.editBudgetChipText}>Sửa ngân sách</Text>
        </Pressable>

        <Pressable style={styles.deleteBudgetChip} onPress={handleDelete}>
          <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
          <Text style={styles.deleteBudgetChipText}>Xóa ngân sách</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <View>
              <Text style={styles.smallLabel}>Ngân sách</Text>
              <Text style={styles.largeValue}>{formatCurrency(amountLimit)}</Text>
              <Text style={styles.subLabel}>{formatCurrency(spentAmount)} đã chi</Text>
            </View>

            <View style={[styles.iconCircle, { backgroundColor: categoryColor ?? colors.blueLight }]}> 
              <MaterialIcons name={categoryIcon as any} size={32} color={colors.white} />
              <Text style={styles.iconTitle}>{categoryName}</Text>
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressPercent}>{usedPercentage}%</Text>
              <Text style={styles.progressAmount}>{formatCurrency(remainingAmount)} còn lại</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(usedPercentage, 100)}%` }]} />
            </View>
            <Text style={styles.progressLabel}>Bạn đã dùng {usedPercentage}% ngân sách này.</Text>
          </View>

          <View style={styles.transactionList}>
            <View style={styles.filterWrapper}>
              <Text style={styles.monthTitle}>{selectedMonth || 'Tháng'}</Text>
              <Pressable style={styles.filterButton} onPress={() => setShowMonthPicker(true)} hitSlop={12}>
                <MaterialIcons name="calendar-today" size={20} color={colors.white} />
              </Pressable>
            </View>

            {visibleItems.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có giao dịch cho ngân sách này.</Text>
            ) : (
              visibleItems.map((item, index) => {
                const isLast = index === visibleItems.length - 1;
                return (
                  <View key={item.id} style={[styles.transactionCard, !isLast && styles.transactionCardBorder]}>
                    <View style={[styles.transactionIcon, { backgroundColor: resolveTransactionIconBg(item.kind) }]}>
                      <MaterialIcons
                        name={resolveTransactionIconName(item.iconKey, item.kind) as keyof typeof MaterialIcons.glyphMap}
                        size={22}
                        color={colors.white}
                      />
                    </View>
                    <View style={styles.transactionText}>
                      <Text style={styles.transactionTitle}>{item.title}</Text>
                      <Text style={styles.transactionTime}>{item.timeLabel}</Text>
                    </View>
                    <Text style={styles.transactionAmount}>
                      {formatCurrency(Math.abs(item.amount))}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          <Modal
            visible={showMonthPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowMonthPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Chọn tháng</Text>
                {monthOptions.map((month) => (
                  <Pressable
                    key={month}
                    style={styles.modalOption}
                    onPress={() => {
                      setSelectedMonth(month);
                      setShowMonthPicker(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, selectedMonth === month && styles.modalOptionTextActive]}>
                      {month}
                    </Text>
                  </Pressable>
                ))}
                <Pressable style={styles.modalClose} onPress={() => setShowMonthPicker(false)}>
                  <Text style={styles.modalCloseText}>Đóng</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  loaderScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  loaderText: {
    marginTop: 16,
    color: colors.white,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  body: {
    flex: 1,
    backgroundColor: colors.bgPage,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSpacing: {
    marginLeft: 10,
  },
  budgetActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  editBudgetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8EEFF',
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  editBudgetChipText: {
    color: '#2563EB',
    fontFamily: typography.poppins.medium,
    fontSize: 11,
  },
  deleteBudgetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FCE8E8',
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  deleteBudgetChipText: {
    color: '#EF4444',
    fontFamily: typography.poppins.medium,
    fontSize: 11,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 32,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  smallLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: typography.poppins.medium,
    marginBottom: 8,
  },
  largeValue: {
    color: colors.text,
    fontSize: 34,
    fontFamily: typography.poppins.bold,
    lineHeight: 42,
  },
  subLabel: {
    marginTop: 10,
    color: colors.primary,
    fontSize: 14,
    fontFamily: typography.poppins.semibold,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  iconTitle: {
    marginTop: 10,
    color: colors.white,
    fontSize: 12,
    fontFamily: typography.poppins.medium,
    textAlign: 'center',
  },
  progressCard: {
    marginTop: 20,
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressPercent: {
    color: colors.text,
    fontSize: 22,
    fontFamily: typography.poppins.semibold,
  },
  progressAmount: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: typography.poppins.semibold,
  },
  progressTrack: {
    marginTop: 16,
    height: 14,
    borderRadius: 12,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  progressLabel: {
    marginTop: 14,
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: typography.poppins.regular,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 18,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: typography.poppins.regular,
  },
  infoValue: {
    marginTop: 8,
    color: colors.text,
    fontSize: 16,
    fontFamily: typography.poppins.semibold,
  },
  divider: {
    width: 1,
    height: 48,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  transactionList: {
    marginTop: 20,
    backgroundColor: colors.white,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  filterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 4,
  },
  monthTitle: {
    color: colors.text,
    fontSize: 16,
    fontFamily: typography.poppins.semibold,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 16,
    fontFamily: typography.poppins.semibold,
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionText: {
    color: colors.text,
    fontSize: 15,
    fontFamily: typography.poppins.regular,
  },
  modalOptionTextActive: {
    color: colors.primary,
    fontFamily: typography.poppins.semibold,
  },
  modalClose: {
    marginTop: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  modalCloseText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: typography.poppins.semibold,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  transactionCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  monthGroup: {
    marginBottom: 16,
  },
  monthLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: typography.poppins.semibold,
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F3EE',
  },
  transactionIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionText: {
    flex: 1,
  },
  transactionTitle: {
    color: colors.text,
    fontSize: 15,
    fontFamily: typography.poppins.semibold,
  },
  transactionTime: {
    marginTop: 4,
    color: colors.blueDark,
    fontSize: 12,
    fontFamily: typography.poppins.regular,
  },
  transactionAmount: {
    color: colors.text,
    fontSize: 15,
    fontFamily: typography.poppins.semibold,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: typography.poppins.medium,
    textAlign: 'center',
    marginTop: 12,
  },
  addButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: typography.poppins.semibold,
  },
});
