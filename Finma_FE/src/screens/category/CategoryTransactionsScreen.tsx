import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { categoryApi } from '../../api/categoryApi';
import { transactionApi } from '../../api/transactionApi';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { type CategoryGroup, type CategoryItem } from '../../types/category';
import { type TransactionDashboard, type TransactionItem, type TransactionType } from '../../types/transaction';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { resolveTransactionIconBg, resolveTransactionIconName } from '../../utils/transactionIcon';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryTransactions'>;

const formatCurrency = (value: number) => Math.round(value).toLocaleString('vi-VN');

type CategoryFormState = {
  name: string;
  group: CategoryGroup;
  iconKey: CategoryItem['iconKey'];
};

const categoryIconMeta: Record<CategoryItem['iconKey'], { name: keyof typeof MaterialIcons.glyphMap; label: string }> = {
  savings: { name: 'savings', label: 'Tiết kiệm' },
  schedule: { name: 'schedule', label: 'Định kỳ' },
  payments: { name: 'payments', label: 'Vay nợ' },
  shopping: { name: 'shopping-bag', label: 'Thực phẩm' },
  restaurant: { name: 'restaurant', label: 'Ăn uống' },
  card_giftcard: { name: 'card-giftcard', label: 'Quà tặng' },
  healing: { name: 'healing', label: 'Y tế' },
  movie: { name: 'movie', label: 'Giải trí' },
  directions_bus: { name: 'directions-bus', label: 'Di chuyển' },
  attach_money: { name: 'attach-money', label: 'Lương' },
  account_balance_wallet: { name: 'account-balance-wallet', label: 'Trợ cấp' },
  local_grocery_store: { name: 'local-grocery-store', label: 'Siêu thị' },
  directions_car: { name: 'directions-car', label: 'Xe cộ' },
  home: { name: 'home', label: 'Nhà ở' },
  school: { name: 'school', label: 'Học tập' },
  fitness_center: { name: 'fitness-center', label: 'Thể thao' },
  pets: { name: 'pets', label: 'Thú cưng' },
  phone_iphone: { name: 'phone-iphone', label: 'Điện thoại' },
  book: { name: 'book', label: 'Sách' },
  music_note: { name: 'music-note', label: 'Âm nhạc' },
  local_cafe: { name: 'local-cafe', label: 'Cà phê' },
  work: { name: 'work', label: 'Công việc' },
  child_care: { name: 'child-care', label: 'Con cái' },
  checkroom: { name: 'checkroom', label: 'Thời trang' },
};

const categorySectionMeta: Array<{ key: CategoryGroup; title: string }> = [
  { key: 'financial', title: 'Tài Chính' },
  { key: 'expense', title: 'Chi Tiêu' },
  { key: 'income', title: 'Thu Nhập' },
];

const normalizeCategoryIconKey = (iconKey: string): CategoryItem['iconKey'] => {
  if (Object.prototype.hasOwnProperty.call(categoryIconMeta, iconKey)) {
    return iconKey as CategoryItem['iconKey'];
  }
  return 'shopping';
};

export const CategoryTransactionsScreen = ({ navigation, route }: Props) => {
  const { categoryId, categoryName, categoryGroup, categoryIconKey, categoryIsDefault } = route.params;

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<TransactionDashboard | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [currentCategoryName, setCurrentCategoryName] = useState(categoryName);
  const [currentCategoryGroup, setCurrentCategoryGroup] = useState(categoryGroup);
  const [currentCategoryIconKey, setCurrentCategoryIconKey] = useState<CategoryItem['iconKey']>(
    normalizeCategoryIconKey(categoryIconKey),
  );
  const [isCurrentCategoryDefault, setIsCurrentCategoryDefault] = useState(Boolean(categoryIsDefault));
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>({
    name: categoryName,
    group: categoryGroup,
    iconKey: normalizeCategoryIconKey(categoryIconKey),
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [response, detail] = await Promise.all([
        transactionApi.getDashboard('all'),
        categoryApi.getCategoryById(categoryId),
      ]);
      setDashboard(response);
      setCurrentCategoryName(detail.name);
      setCurrentCategoryGroup(detail.group);
      setCurrentCategoryIconKey(detail.iconKey);
      setIsCurrentCategoryDefault(detail.isDefault);
      setCategoryForm({
        name: detail.name,
        group: detail.group,
        iconKey: detail.iconKey,
      });
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const openEditCategoryModal = () => {
    if (isCurrentCategoryDefault) {
      Alert.alert('Không thể sửa', 'Danh mục mặc định không thể chỉnh sửa.');
      return;
    }

    setCategoryForm({
      name: currentCategoryName,
      group: currentCategoryGroup,
      iconKey: currentCategoryIconKey,
    });
    setShowCategoryModal(true);
  };

  const closeEditCategoryModal = () => {
    setShowCategoryModal(false);
  };

  const onSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên danh mục.');
      return;
    }

    setSavingCategory(true);
    try {
      const response = await categoryApi.updateCategory(categoryId, {
        name: categoryForm.name.trim(),
        group: categoryForm.group,
        iconKey: categoryForm.iconKey,
      });

      if (!response.success) {
        Alert.alert('Thông báo', response.message || 'Không thể cập nhật danh mục.');
        return;
      }

      setCurrentCategoryName(categoryForm.name.trim());
      setCurrentCategoryGroup(categoryForm.group);
      setCurrentCategoryIconKey(categoryForm.iconKey);
      navigation.setParams({
        categoryName: categoryForm.name.trim(),
        categoryGroup: categoryForm.group,
        categoryIconKey: categoryForm.iconKey,
      });
      closeEditCategoryModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật danh mục.';
      Alert.alert('Thông báo', message);
    } finally {
      setSavingCategory(false);
    }
  };

  const onDeleteCategory = () => {
    if (isCurrentCategoryDefault) {
      Alert.alert('Không thể xóa', 'Danh mục mặc định không thể xóa.');
      return;
    }

    const executeDeleteCategory = async () => {
      try {
        const response = await categoryApi.deleteCategory(categoryId);
        if (!response.success) {
          Alert.alert('Thông báo', response.message || 'Xóa danh mục thất bại.');
          return;
        }
        navigation.goBack();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Xóa danh mục thất bại.';
        Alert.alert('Thông báo', message);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = typeof globalThis.confirm === 'function'
        ? globalThis.confirm(`Bạn có chắc muốn xóa "${currentCategoryName}"?`)
        : true;

      if (confirmed) {
        void executeDeleteCategory();
      }
      return;
    }

    Alert.alert('Xóa danh mục', `Bạn có chắc muốn xóa "${currentCategoryName}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          void executeDeleteCategory();
        },
      },
    ]);
  };

  const filteredItems = useMemo(() => {
    if (!dashboard) {
      return [] as TransactionItem[];
    }

    return dashboard.items.filter((item) => item.categoryId === categoryId);
  }, [categoryId, dashboard]);

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
        <ScreenBottomNavigation activeTab="layers" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title={currentCategoryName}
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
        showNotificationBadge={dashboard.overview.unreadNotifications > 0}
      />

      {!isCurrentCategoryDefault ? (
        <View style={styles.categoryActionsRow}>
          <Pressable style={styles.editCategoryChip} onPress={openEditCategoryModal}>
            <MaterialIcons name="edit" size={15} color="#2563EB" />
            <Text style={styles.editCategoryChipText}>Sửa danh mục</Text>
          </Pressable>

          <Pressable style={styles.deleteCategoryChip} onPress={onDeleteCategory}>
            <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
            <Text style={styles.deleteCategoryChipText}>Xóa danh mục</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.summaryRow}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Tổng dư</Text>
          <Text style={styles.summaryValue}>{formatCurrency(dashboard.overview.totalBalance)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={[styles.summaryCol, styles.summaryColRight]}>
          <Text style={styles.summaryLabel}>{currentCategoryGroup === 'income' ? 'Tổng thu' : 'Tổng chi'}</Text>
          <Text style={[styles.summaryValue, styles.expenseValue]}>
            {currentCategoryGroup === 'income' ? '+' : '-'}{formatCurrency(totalAmount)}
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
                return (
                  <Pressable
                    key={item.id}
                    style={styles.itemCard}
                    onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
                  >
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
                presetType: currentCategoryGroup === 'income' ? 'income' : 'expense',
                presetCategoryId: categoryId,
                presetTitle: currentCategoryName,
              })
            }
          >
            <Text style={styles.addButtonText}>{currentCategoryGroup === 'income' ? 'Thêm thu nhập' : 'Thêm chi tiêu'}</Text>
          </Pressable>
        </ScrollView>
      </View>

      <Modal visible={showCategoryModal} transparent animationType="fade" onRequestClose={closeEditCategoryModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sửa Danh Mục</Text>

            <Text style={styles.modalLabel}>Tên danh mục</Text>
            <TextInput
              value={categoryForm.name}
              onChangeText={(value) => setCategoryForm((prev) => ({ ...prev, name: value }))}
              placeholder="Ví dụ: Mua sắm"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.modalLabel}>Nhóm danh mục</Text>
            <View style={styles.groupRow}>
              {categorySectionMeta.map((section) => {
                const selected = categoryForm.group === section.key;
                return (
                  <Pressable
                    key={section.key}
                    style={[styles.groupChip, selected && styles.groupChipActive]}
                    onPress={() => setCategoryForm((prev) => ({ ...prev, group: section.key }))}
                  >
                    <Text style={[styles.groupChipText, selected && styles.groupChipTextActive]}>{section.title}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.modalLabel}>Biểu tượng</Text>
            <View style={styles.iconGrid}>
              {(Object.keys(categoryIconMeta) as CategoryItem['iconKey'][]).map((key) => {
                const selected = categoryForm.iconKey === key;
                return (
                  <Pressable
                    key={key}
                    style={[styles.iconOption, selected && styles.iconOptionActive]}
                    onPress={() => setCategoryForm((prev) => ({ ...prev, iconKey: key }))}
                  >
                    <MaterialIcons name={categoryIconMeta[key].name} size={20} color={selected ? colors.white : colors.text} />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={closeEditCategoryModal}>
                <Text style={styles.cancelText}>Hủy</Text>
              </Pressable>

              <Pressable style={styles.saveBtn} onPress={onSaveCategory} disabled={savingCategory}>
                <Text style={styles.saveText}>{savingCategory ? 'Đang lưu...' : 'Cập nhật'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ScreenBottomNavigation activeTab="layers" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
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
    paddingHorizontal: 16,
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
  categoryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  editCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8EEFF',
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editCategoryChipText: {
    color: '#2563EB',
    fontFamily: typography.poppins.medium,
    fontSize: 11,
  },
  deleteCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FCE8E8',
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deleteCategoryChipText: {
    color: '#EF4444',
    fontFamily: typography.poppins.medium,
    fontSize: 11,
  },
  mainPanel: {
    flex: 1,
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingTop: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  modalTitle: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 18,
    marginBottom: 10,
  },
  modalLabel: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 13,
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4EFE8',
    paddingHorizontal: 12,
    color: colors.text,
    fontFamily: typography.poppins.regular,
    fontSize: 14,
  },
  groupRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  groupChip: {
    flex: 1,
    minHeight: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5F1',
  },
  groupChipActive: {
    backgroundColor: colors.primary,
  },
  groupChipText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 12,
  },
  groupChipTextActive: {
    color: colors.white,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#E8F5F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionActive: {
    backgroundColor: colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  cancelBtn: {
    minHeight: 36,
    borderRadius: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5F1',
  },
  cancelText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 13,
  },
  saveBtn: {
    minHeight: 36,
    borderRadius: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  saveText: {
    color: colors.white,
    fontFamily: typography.poppins.semibold,
    fontSize: 13,
  },
});
