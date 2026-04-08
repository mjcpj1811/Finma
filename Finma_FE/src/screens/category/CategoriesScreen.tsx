import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { BalanceSummaryCard } from '../../components/BalanceSummaryCard';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { type CategoryDashboard, type CategoryGroup, type CategoryItem } from '../../types/category';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Categories'>;

type FormState = {
  name: string;
  group: CategoryGroup;
  iconKey: CategoryItem['iconKey'];
};

const defaultForm: FormState = {
  name: '',
  group: 'expense',
  iconKey: 'shopping',
};

const iconMeta: Record<CategoryItem['iconKey'], { name: keyof typeof MaterialIcons.glyphMap; label: string }> = {
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

const sectionMeta: Array<{ key: CategoryGroup; title: string }> = [
  { key: 'financial', title: 'Tài Chính' },
  { key: 'expense', title: 'Chi Tiêu' },
  { key: 'income', title: 'Thu Nhập' },
];

const emptyDashboard: CategoryDashboard = {
  overview: {
    totalBalance: 0,
    totalExpense: 0,
    budgetUsedPercent: 0,
    budgetLimit: 0,
    unreadNotifications: 0,
  },
  groups: {
    financial: [],
    expense: [],
    income: [],
  },
};

export const CategoriesScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<CategoryDashboard | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await categoryApi.getDashboard();
      setData(response);
    } catch (error) {
      setData(emptyDashboard);
      const message = error instanceof Error ? error.message : 'Không tải được danh mục.';
      Alert.alert('Thông báo', message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  const allIcons = useMemo(() => Object.keys(iconMeta) as Array<CategoryItem['iconKey']>, []);

  const closeModal = () => {
    setShowModal(false);
    setForm(defaultForm);
  };

  const openCreateModal = () => {
    setForm(defaultForm);
    setShowModal(true);
  };

  const onSaveCategory = async () => {
    if (!form.name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên danh mục.');
      return;
    }

    setSaving(true);
    try {
      const response = await categoryApi.createCategory({
        name: form.name.trim(),
        group: form.group,
        iconKey: form.iconKey,
      });

      if (!response.success) {
        Alert.alert('Thông báo', response.message || 'Không thể lưu danh mục.');
        return;
      }

      closeModal();
      await loadDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu danh mục.';
      Alert.alert('Thông báo', message);
    } finally {
      setSaving(false);
    }
  };

  const onPressCategory = (item: CategoryItem) => {
    if (item.isDefault && item.iconKey === 'savings') {
      navigation.navigate('Savings');
      return;
    }

    if (item.isDefault && item.iconKey === 'payments') {
      navigation.navigate('Debts');
      return;
    }

    if (item.isDefault && item.iconKey === 'schedule') {
      navigation.navigate('Recurring');
      return;
    }

    navigation.navigate('CategoryTransactions', {
      categoryId: item.id,
      categoryName: item.name,
      categoryGroup: item.group,
      categoryIconKey: item.iconKey,
      categoryIsDefault: item.isDefault,
    });
  };

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải danh mục...</Text>
        </View>
        <ScreenBottomNavigation activeTab="layers" />
      </SafeAreaView>
    );
  }

  const visibleSections = sectionMeta.filter((section) => data.groups[section.key].length > 0);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topSection}>
        <AppScreenHeader
          title="Danh Mục"
          onPressNotification={() => navigation.navigate('Notifications')}
          showNotificationBadge={data.overview.unreadNotifications > 0}
        />

        <BalanceSummaryCard
          totalBalance={data.overview.totalBalance}
          totalExpense={data.overview.totalExpense}
          budgetUsedPercent={data.overview.budgetUsedPercent}
          budgetLimit={data.overview.budgetLimit}
        />
      </View>

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          {visibleSections.map((section, index) => {
            const items = data.groups[section.key];

            return (
              <View key={section.key} style={[styles.sectionWrap, index > 0 && styles.sectionWrapWithBorder]}>
                <Text style={styles.sectionTitle}>{section.title}</Text>

                <View style={styles.grid}>
                  {items.map((item) => {
                    const icon = iconMeta[item.iconKey] ?? iconMeta.shopping;
                    return (
                      <View key={item.id} style={styles.cardWrap}>
                        <Pressable
                          style={styles.categoryCard}
                          onPress={() => onPressCategory(item)}
                        >
                          <MaterialIcons name={icon.name} size={34} color={colors.white} />
                        </Pressable>

                        <Text style={styles.categoryName} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}

          <Pressable style={styles.addButton} onPress={openCreateModal}>
            <Text style={styles.addButtonText}>Thêm danh mục</Text>
          </Pressable>
        </ScrollView>
      </View>

      <ScreenBottomNavigation activeTab="layers" />

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Thêm Danh Mục</Text>

            <Text style={styles.modalLabel}>Tên danh mục</Text>
            <TextInput
              value={form.name}
              onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
              placeholder="Ví dụ: Mua sắm"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.modalLabel}>Nhóm danh mục</Text>
            <View style={styles.groupRow}>
              {sectionMeta.map((section) => {
                const selected = form.group === section.key;
                return (
                  <Pressable
                    key={section.key}
                    style={[styles.groupChip, selected && styles.groupChipActive]}
                    onPress={() => setForm((prev) => ({ ...prev, group: section.key }))}
                  >
                    <Text style={[styles.groupChipText, selected && styles.groupChipTextActive]}>{section.title}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.modalLabel}>Biểu tượng</Text>
            <View style={styles.iconGrid}>
              {allIcons.map((key) => {
                const selected = form.iconKey === key;
                return (
                  <Pressable
                    key={key}
                    style={[styles.iconOption, selected && styles.iconOptionActive]}
                    onPress={() => setForm((prev) => ({ ...prev, iconKey: key }))}
                  >
                    <MaterialIcons name={iconMeta[key].name} size={20} color={selected ? colors.white : colors.text} />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelText}>Hủy</Text>
              </Pressable>

              <Pressable style={styles.saveBtn} onPress={onSaveCategory} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'Đang lưu...' : 'Lưu'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  topSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
  },
  headerRow: {
    paddingHorizontal: 2,
    paddingTop: 10,
    paddingBottom: 16,
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
    textAlign: 'center',
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 24,
    lineHeight: 28,
  },
  mainPanel: {
    flex: 1,
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    marginTop: 6,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  panelContent: {
    paddingBottom: 106,
    gap: 18,
  },
  sectionWrap: {
    paddingTop: 2,
  },
  sectionWrapWithBorder: {
    borderTopWidth: 1,
    borderTopColor: '#CDE4D8',
    paddingTop: 12,
  },
  sectionTitle: {
    textAlign: 'center',
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 18,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: 16,
  },
  cardWrap: {
    width: '33.3333%',
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 8,
  },
  categoryCard: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: '#5B9EFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 13,
    textAlign: 'center',
    width: '100%',
  },
  deleteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#FCE8E8',
  },
  deleteChipText: {
    color: '#EF4444',
    fontFamily: typography.poppins.medium,
    fontSize: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#E8EEFF',
  },
  editChipText: {
    color: '#2563EB',
    fontFamily: typography.poppins.medium,
    fontSize: 10,
  },
  addButton: {
    alignSelf: 'center',
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    marginTop: -2,
  },
  addButtonText: {
    color: '#0C6657',
    fontFamily: typography.poppins.semibold,
    fontSize: 15,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#F1FFF3',
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
