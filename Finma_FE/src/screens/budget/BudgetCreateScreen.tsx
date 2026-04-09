import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import * as budgetApi from '../../api/budgetApi';
import { homeApi } from '../../api/homeApi';
import type { CategoryItem } from '../../types/category';
import type { PeriodType, BudgetRequest } from '../../types/budget';

type Props = NativeStackScreenProps<RootStackParamList, 'BudgetCreate'>;

export const BudgetCreateScreen = ({ navigation, route }: Props) => {
  const budgetId = route.params?.budgetId;
  const presetCategoryId = route.params?.categoryId;
  const presetCategoryName = route.params?.categoryName;
  const isEdit = Boolean(budgetId);

  const [amount, setAmount] = useState('');
  const [expense, setExpense] = useState('');
  const [note, setNote] = useState('');
  const [periodType, setPeriodType] = useState<PeriodType>('MONTHLY');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [budgets, setBudgets] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [selectedCategoryName, setSelectedCategoryName] = useState('Chọn danh mục');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const selectedMonth = useMemo(() => new Date(), []);

  const navigateToBudgetList = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Budget' }],
    });
  };

  // Format month for display
  const selectedMonthLabel = selectedMonth.toLocaleDateString('vi-VN', { month: 'long' });

  // Calculate start and end dates based on period type
  const getDateRange = () => {
    const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    let endDate: Date;

    if (periodType === 'YEARLY') {
      endDate = new Date(selectedMonth.getFullYear(), 11, 31);
    } else {
      endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoryList, homeData] = await Promise.all([
          budgetApi.getCategories(),
          homeApi.getDashboard('month').catch(() => null),
        ]);
        setCategories(categoryList);
        if (!isEdit && presetCategoryId) {
          setSelectedCategoryId(presetCategoryId);
          const matchedName =
            presetCategoryName ||
            categoryList.find((category) => category.id === presetCategoryId)?.name ||
            'Chọn danh mục';
          setSelectedCategoryName(matchedName);
        }
        if (homeData) {
          setUnreadNotifications(homeData.user.unreadNotifications);
        }
      } catch (err) {
        console.error('Lỗi tải danh mục:', err);
        setCategories([]);
      }

      if (isEdit) {
        try {
          const detail = await budgetApi.getBudget(budgetId);
          setAmount(detail.amountLimit.toString());
          setPeriodType(detail.periodType);
          setIsRecurring(detail.isRecurring);
          setSelectedCategoryId(detail.categoryId);
          setSelectedCategoryName(detail.categoryName);
        } catch (err) {
          Alert.alert('Lỗi', 'Không thể tải chi tiết ngân sách.');
        }
      } else {
        try {
          const budgetList = await budgetApi.getBudgets();
          setBudgets(budgetList.map((budget) => budget.categoryId));
        } catch (err) {
          console.error('Lỗi tải ngân sách hiện có:', err);
          setBudgets([]);
        }
      }
    };

    void loadData();
  }, [budgetId, isEdit, presetCategoryId, presetCategoryName]);

  const onSave = async () => {
    // Validate inputs
    const cleaned = amount.replace(/[^0-9]/g, '').trim();
    if (!cleaned || Number(cleaned) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền ngân sách hợp lệ.');
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert('Lỗi', 'Vui lòng chọn danh mục.');
      return;
    }

    setIsSaving(true);
    try {
      const { startDate, endDate } = getDateRange();
      const payload: BudgetRequest = {
        categoryId: selectedCategoryId,
        amountLimit: Number(cleaned),
        periodType,
        startDate,
        endDate,
        isRecurring,
      };

      if (isEdit) {
        await budgetApi.updateBudget(budgetId, payload);
      } else {
        await budgetApi.createBudget(payload);
      }

      Alert.alert('Thành công', isEdit ? 'Ngân sách đã được cập nhật.' : 'Ngân sách mới đã được tạo.', [
        {
          text: 'OK',
          onPress: navigateToBudgetList,
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tạo ngân sách.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title={isEdit ? 'Sửa Ngân Sách' : 'Thêm Ngân Sách'}
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
        showNotificationBadge={unreadNotifications > 0}
      />

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Tháng</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputValue}>{selectedMonthLabel}</Text>
              <MaterialIcons name="calendar-today" size={20} color={colors.textSecondary} />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Danh Mục</Text>
            <Pressable
              style={[styles.inputRow, styles.dropdownTrigger]}
              onPress={() => setIsDropdownOpen((prev) => !prev)}
            >
              <Text style={styles.inputValue}>{selectedCategoryName}</Text>
              <MaterialIcons
                name={isDropdownOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={24}
                color={colors.textSecondary}
              />
            </Pressable>

            {isDropdownOpen && (
              <View style={styles.dropdownList}>
                {categories.filter((category) => !budgets.includes(category.id)).length === 0 ? (
                  <Text style={styles.dropdownEmpty}>Không có danh mục nào khả dụng</Text>
                ) : (
                  categories
                    .filter((category) => !budgets.includes(category.id))
                    .map((category) => (
                      <Pressable
                        key={category.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedCategoryId(category.id);
                          setSelectedCategoryName(category.name);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{category.name}</Text>
                      </Pressable>
                    ))
                )}
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Số tiền</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="600,000"
              placeholderTextColor="#8FB8A5"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Loại Kỳ</Text>
            <View style={styles.periodTypeContainer}>
              <Pressable
                style={[styles.periodTypeBtn, periodType === 'MONTHLY' && styles.periodTypeActive]}
                onPress={() => setPeriodType('MONTHLY')}
              >
                <Text style={[styles.periodTypeText, periodType === 'MONTHLY' && styles.periodTypeTextActive]}>
                  Tháng
                </Text>
              </Pressable>
              <Pressable
                style={[styles.periodTypeBtn, periodType === 'YEARLY' && styles.periodTypeActive]}
                onPress={() => setPeriodType('YEARLY')}
              >
                <Text style={[styles.periodTypeText, periodType === 'YEARLY' && styles.periodTypeTextActive]}>
                  Năm
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.recurringContainer}>
              <Text style={styles.fieldLabel}>Lặp lại</Text>
              <Pressable
                style={[styles.checkbox, isRecurring && styles.checkboxActive]}
                onPress={() => setIsRecurring(!isRecurring)}
              >
                {isRecurring && <MaterialIcons name="check" size={16} color={colors.white} />}
              </Pressable>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Chi Tiêu</Text>
            <TextInput
              value={expense}
              onChangeText={setExpense}
              placeholder="Đi lại"
              placeholderTextColor="#8FB8A5"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Ghi chú</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Nhập ghi chú"
              placeholderTextColor="#8FB8A5"
              multiline
              style={[styles.input, styles.noteInput]}
            />
          </View>

          <Pressable style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} onPress={onSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveText}>Lưu</Text>
            )}
          </Pressable>
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
  mainPanel: {
    flex: 1,
    marginTop: 16,
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 150,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontFamily: typography.poppins.medium,
    fontSize: 13,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5F1',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: '#D5E9DD',
  },
  dropdownList: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D5E9DD',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F3',
  },
  dropdownItemText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  dropdownEmpty: {
    padding: 14,
    color: colors.textSecondary,
    fontFamily: typography.poppins.regular,
    fontSize: 14,
  },
  inputValue: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 15,
  },
  input: {
    backgroundColor: '#E8F5F1',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontFamily: typography.poppins.regular,
    fontSize: 15,
  },
  noteInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  periodTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  periodTypeBtn: {
    flex: 1,
    backgroundColor: '#E8F5F1',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  periodTypeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodTypeText: {
    color: colors.textSecondary,
    fontFamily: typography.poppins.medium,
    fontSize: 15,
  },
  periodTypeTextActive: {
    color: colors.white,
  },
  recurringContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#E8F5F1',
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  saveBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveText: {
    color: colors.white,
    fontFamily: typography.poppins.semibold,
    fontSize: 16,
  },
});
