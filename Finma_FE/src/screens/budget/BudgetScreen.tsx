import React, { useEffect, useState, useCallback } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import * as budgetApi from '../../api/budgetApi';
import { homeApi } from '../../api/homeApi';
import type { CategoryItem } from '../../types/category';
import type { BudgetResponse } from '../../types/budget';
import { mapIconName } from '../../utils/iconMapper';

type Props = NativeStackScreenProps<RootStackParamList, 'Budget'>;

const BudgetRow = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <View style={styles.rowBetween}>
    <Text style={[styles.label, bold && styles.bold]}>{label}</Text>
    <Text style={[styles.value, bold && styles.bold]}>{value}</Text>
  </View>
);

export const BudgetScreen = ({ navigation }: Props) => {
  const [budgets, setBudgets] = useState<BudgetResponse[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchBudgets = async (isRefresh = false) => {
    if (isFetching) return;

    setIsFetching(true);
    try {
      if (!isRefresh) setIsLoading(true);
      setIsRefreshing(isRefresh);
      setError(null);
      const [data, homeData] = await Promise.all([
        budgetApi.getBudgets(),
        homeApi.getDashboard('month').catch(() => null),
      ]);
      setBudgets(data);
      if (homeData) {
        setUnreadNotifications(homeData.user.unreadNotifications);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải ngân sách');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const list = await budgetApi.getCategories();
        setCategories(list);
      } catch {
        setCategories([]);
      }
    };

    void loadCategories();
    fetchBudgets();
  }, []);

  // Refresh data when screen comes into focus (e.g., after creating a budget)
  useFocusEffect(
    useCallback(() => {
      fetchBudgets(true);
    }, [])
  );

  // Calculate summary data
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amountLimit, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spentAmount, 0);
  const remainingBudget = totalBudget - totalSpent;
  const usedPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Transform budgets to display format
  const budgetItems = budgets.map((budget) => {
    const category = categories.find((item) => item.id === budget.categoryId);
    return {
      id: budget.id,
      categoryId: budget.categoryId,
      categoryGroup: category?.group,
      title: budget.categoryName,
      remainingAmount: budget.remainingAmount,
      budgetAmount: budget.amountLimit,
      spentAmount: budget.spentAmount,
      remaining: budget.remainingAmount.toLocaleString(),
      budget: budget.amountLimit.toLocaleString(),
      spent: budget.spentAmount.toLocaleString(),
      icon: mapIconName(budget.categoryIcon),
      color: budget.categoryColor || '#5DB8FF',
    };
  });

  const handleRefresh = () => {
    fetchBudgets(true);
  };
  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title="Ngân Sách"
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
        showNotificationBadge={unreadNotifications > 0}
      />

      <View style={styles.summaryBox}>
        <View style={styles.percentBadge}>
          <View style={[
            styles.percentFill,
            { 
              height: `${Math.min(usedPercentage, 100)}%`,
              backgroundColor: usedPercentage > 100 ? '#FF6B6B' : usedPercentage > 80 ? '#FFB547' : '#00D09E' 
            }
          ]} />
          
          <View style={styles.percentContent}>
            <Text style={styles.percentBadgeText}>{Math.min(usedPercentage, 999)}</Text>
            <Text style={styles.percentBadgeSub}>%</Text>
          </View>
        </View>

        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>Ngân sách tháng</Text>
          <Text style={styles.summaryAmount}>{totalBudget.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.noteRow}>
        <MaterialIcons name="check-box" size={18} color="#00D9A5" />
        <Text style={styles.noteText}>
          Còn {100 - usedPercentage}% Tổng Ngân Sách cho tháng này
        </Text>
      </View>

      <View style={styles.mainPanel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {isLoading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Đang tải ngân sách...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContent}>
              <MaterialIcons name="error-outline" size={48} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryBtn} onPress={handleRefresh}>
                <Text style={styles.retryText}>Thử lại</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {budgetItems.length === 0 ? (
                <View style={styles.centerContent}>
                  <MaterialIcons name="account-balance-wallet" size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyText}>Chưa có ngân sách nào</Text>
                  <Text style={styles.emptySubtext}>Tạo ngân sách đầu tiên của bạn</Text>
                </View>
              ) : (
                budgetItems.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.itemRow}
                    onPress={() =>
                      navigation.navigate('BudgetDetail', {
                        budgetId: item.id,
                        categoryId: item.categoryId,
                        categoryName: item.title,
                        categoryGroup: item.categoryGroup,
                        amountLimit: item.budgetAmount,
                        spentAmount: item.spentAmount,
                        categoryIcon: item.icon,
                        categoryColor: item.color,
                      })
                    }
                  >
                    <View style={styles.iconColumn}>
                      <View style={[styles.iconBox, { backgroundColor: item.color + '22' }]}>
                        <MaterialIcons name={item.icon as any} size={24} color={item.color} />
                      </View>
                      <Text style={styles.categoryText}>{item.title}</Text>
                    </View>

                    <View style={styles.card}>
                      <BudgetRow label="Còn Lại:" value={item.remaining} />
                      <BudgetRow label="Ngân Sách:" value={item.budget} bold />
                      <BudgetRow label="Chi Tiêu:" value={item.spent} />
                    </View>
                  </Pressable>
                ))
              )}

              <Pressable style={styles.addBtn} onPress={() => navigation.navigate('BudgetCreate')}>
                <Text style={styles.addText}>Thêm Ngân Sách</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>

      <ScreenBottomNavigation activeTab="layers" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  summaryBox: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#DFF7E2',
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  percentBadge: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#E8F5F1', // Nền nhạt khi chưa lấp đầy
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#D4EFE8',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden', // Quan trọng để lớp màu không tràn ra ngoài hình tròn
  },
  percentFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
  percentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1, // Luôn nằm trên lớp màu
  },
  percentBadgeText: {
    color: colors.text,
    fontSize: 26,
    fontFamily: typography.poppins.bold,
  },
  percentBadgeSub: {
    color: colors.text,
    fontSize: 12,
    fontFamily: typography.poppins.semibold,
    marginTop: 6,
    marginLeft: 1,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: typography.poppins.regular,
    marginBottom: 4,
  },
  summaryAmount: {
    color: colors.text,
    fontSize: 28,
    fontFamily: typography.poppins.bold,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
  },
  noteText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  mainPanel: {
    flex: 1,
    marginTop: 16,
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 150,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  iconColumn: {
    width: 98,
    alignItems: 'center',
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryText: {
    textAlign: 'center',
    color: colors.text,
    fontSize: 14,
    fontFamily: typography.poppins.medium,
  },
  card: {
    flex: 1,
    backgroundColor: '#DFF7E2',
    borderRadius: 24,
    padding: 16,
    justifyContent: 'center',
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#667085',
    fontSize: 13,
    fontFamily: typography.poppins.regular,
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontFamily: typography.poppins.semibold,
  },
  bold: {
    fontFamily: typography.poppins.bold,
  },
  addBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: typography.poppins.semibold,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: typography.poppins.medium,
  },
  errorText: {
    marginTop: 16,
    color: '#EF4444',
    fontSize: 16,
    fontFamily: typography.poppins.medium,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: typography.poppins.semibold,
  },
  emptyText: {
    marginTop: 16,
    color: colors.text,
    fontSize: 18,
    fontFamily: typography.poppins.semibold,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: typography.poppins.regular,
    textAlign: 'center',
  },
});
