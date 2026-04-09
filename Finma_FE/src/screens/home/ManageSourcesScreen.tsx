import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { sourceApi } from '../../api/sourceApi';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import {
  type MoneySourceDashboard,
  type MoneySourceItem,
  type MoneySourceType,
  type UpsertMoneySourcePayload,
} from '../../types/source';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageSources'>;

type FormState = {
  name: string;
  balance: string;
  type: MoneySourceType;
};

type SourceTypeOption = {
  type: MoneySourceType;
  label: string;
};

const formatCurrency = (value: number) => value.toLocaleString('vi-VN');

const defaultFormState: FormState = {
  name: '',
  balance: '',
  type: 'CASH',
};

const iconMetaByType: Record<MoneySourceType, { name: keyof typeof MaterialIcons.glyphMap; bg: string; color: string }> = {
  CASH: { name: 'account-balance-wallet', bg: '#E8F5F1', color: '#00D09E' },
  BANK: { name: 'account-balance', bg: '#EEF2FF', color: '#6366F1' },
  E_WALLET: { name: 'phone-iphone', bg: '#FFF5E7', color: '#F59E0B' },
  CREDIT: { name: 'credit-card', bg: '#FDECEC', color: '#EF4444' },
  SAVING: { name: 'savings', bg: '#DFF7E2', color: '#4CAF50' },
  INVESTMENT: { name: 'trending-up', bg: '#F3E8FF', color: '#8B5CF6' },
};

const sourceTypeOptions: SourceTypeOption[] = [
  { type: 'CASH', label: 'Tiền mặt' },
  { type: 'BANK', label: 'Ngân hàng' },
  { type: 'E_WALLET', label: 'Ví điện tử' },
  { type: 'CREDIT', label: 'Thẻ tín dụng' },
];

export const ManageSourcesScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboard, setDashboard] = useState<MoneySourceDashboard | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingSource, setEditingSource] = useState<MoneySourceItem | null>(null);
  const [form, setForm] = useState<FormState>(defaultFormState);

  const visibleItems = useMemo(
    () => dashboard?.items.filter((item) => item.type !== 'SAVING' && item.type !== 'INVESTMENT') ?? [],
    [dashboard?.items],
  );

  const visibleTotalBalance = useMemo(
    () => visibleItems.reduce((sum, item) => sum + item.balance, 0),
    [visibleItems],
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await sourceApi.getDashboard();
      setDashboard(response);
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  const title = useMemo(() => (editingSource ? 'Sửa tài khoản' : 'Thêm tài khoản'), [editingSource]);

  const openCreateModal = () => {
    setEditingSource(null);
    setForm(defaultFormState);
    setModalVisible(true);
  };

  const openEditModal = (item: MoneySourceItem) => {
    setEditingSource(item);
    setForm({
      name: item.name,
      balance: String(item.balance),
      type: item.type,
    });
    setModalVisible(true);
  };

  const onSave = async () => {
    const parsedBalance = Number(form.balance.replace(/[^\d]/g, ''));
    if (!form.name.trim() || !parsedBalance) {
      return;
    }

    const sourceMeta = iconMetaByType[form.type];

    const payload: UpsertMoneySourcePayload = {
      name: form.name.trim(),
      icon: sourceMeta.name,
      color: sourceMeta.color,
      balance: parsedBalance,
      type: form.type,
    };

    setSaving(true);
    try {
      if (editingSource) {
        await sourceApi.updateSource(editingSource.id, payload);
      } else {
        await sourceApi.createSource(payload);
      }
      setModalVisible(false);
      setForm(defaultFormState);
      setEditingSource(null);
      await loadDashboard();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (item: MoneySourceItem) => {
    console.log('Nút xóa đã được bấm cho:', item.name); // Thêm dòng này để debug
    Alert.alert('Xóa tài khoản', `Bạn có chắc muốn xóa ${item.name}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await sourceApi.deleteSource(item.id);
            await loadDashboard();
          } catch {
            Alert.alert('Xóa thất bại', 'Không thể xóa tài khoản. Vui lòng thử lại.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loading || !dashboard) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải nguồn tiền...</Text>
        </View>
        <ScreenBottomNavigation activeTab="home" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title="Quản Lý Nguồn Tiền"
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
        showNotificationBadge={dashboard.summary.unreadNotifications > 0}
      />

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Tổng số dư tất cả tài khoản</Text>
        <Text style={styles.balanceValue}>{formatCurrency(visibleTotalBalance)}</Text>
        <Text style={styles.balanceSub}>{visibleItems.length} tài khoản</Text>
      </View>

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.panelTitle}>Danh sách tài khoản</Text>
            <View style={styles.listActions}>
              <Pressable style={styles.roundAction} onPress={openCreateModal}>
                <MaterialIcons name="add" size={22} color={colors.white} />
              </Pressable>
            </View>
          </View>

          {visibleItems.map((item) => {
            const iconMeta = iconMetaByType[item.type];
            return (
              <View
                key={item.id}
                style={styles.itemCard}
              >
                <Pressable onPress={() => navigation.navigate('SourceTransactions', { sourceId: item.id })}>
                  <View style={styles.itemTopRow}>
                    <View style={styles.itemLeftGroup}>
                      <View style={[styles.itemIconWrap, { backgroundColor: (item.color || iconMeta.color) + '20' }]}>
                        <MaterialIcons name={(item.icon as any) || iconMeta.name} size={24} color={item.color || iconMeta.color} />
                      </View>

                      <View>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemSub}>{item.type}</Text>
                      </View>
                    </View>

                    <Text style={styles.itemAmount}>{formatCurrency(item.balance)}</Text>
                  </View>
                </Pressable>

                <View style={styles.itemActionRow}>
                  <Pressable
                    style={styles.editButton}
                    onPress={() => openEditModal(item)}
                  >
                    <MaterialIcons name="edit" size={15} color={colors.text} />
                    <Text style={styles.editText}>Sửa</Text>
                  </Pressable>

                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => onDelete(item)}
                  >
                    <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
                    <Text style={styles.deleteText}>Xóa</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

        </ScrollView>
      </View>

      <ScreenBottomNavigation activeTab="home" />

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalKeyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.modalContent}
              >
                <Text style={styles.modalTitle}>{title}</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Tên tài khoản</Text>
                  <TextInput
                    value={form.name}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
                    placeholder="Ví dụ: Tiền mặt"
                    style={styles.input}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Loại tài khoản</Text>
                  <View style={styles.typeGrid}>
                    {sourceTypeOptions.map((option) => {
                      const selected = form.type === option.type;
                      const typeMeta = iconMetaByType[option.type];
                      return (
                        <Pressable
                          key={option.type}
                          style={[styles.typeCard, selected && styles.typeCardSelected]}
                          onPress={() => setForm((prev) => ({ ...prev, type: option.type }))}
                        >
                          <View style={[styles.typeIconWrap, { backgroundColor: typeMeta.bg }]}> 
                            <MaterialIcons name={typeMeta.name} size={18} color={typeMeta.color} />
                          </View>
                          <Text style={[styles.typeText, selected && styles.typeTextSelected]}>{option.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Số dư</Text>
                  <TextInput
                    value={form.balance}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, balance: value }))}
                    placeholder="5000000"
                    keyboardType="numeric"
                    style={styles.input}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.modalActionRow}>
                  <Pressable style={styles.modalCancelButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.modalCancelText}>Hủy</Text>
                  </Pressable>

                  <Pressable style={styles.modalSaveButton} onPress={onSave} disabled={saving}>
                    <Text style={styles.modalSaveText}>{saving ? 'Đang lưu...' : 'Lưu'}</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    color: colors.text,
    textAlign: 'center',
    fontFamily: typography.poppins.semibold,
    fontSize: 24,
    lineHeight: 28,
  },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 10,
  },
  balanceLabel: {
    color: colors.white,
    opacity: 0.85,
    fontFamily: typography.poppins.regular,
    fontSize: 13,
    marginBottom: 4,
  },
  balanceValue: {
    color: colors.white,
    fontFamily: typography.poppins.bold,
    fontSize: 34,
    lineHeight: 40,
    marginBottom: 2,
  },
  balanceSub: {
    color: colors.white,
    fontFamily: typography.poppins.regular,
    fontSize: 13,
    opacity: 0.9,
  },
  mainPanel: {
    flex: 1,
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    paddingHorizontal: 14,
    paddingTop: 20,
    marginTop: 10,
  },
  panelContent: {
    paddingBottom: 110,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
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
  panelTitle: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 19,
  },
  itemCard: {
    backgroundColor: '#DFF7E2',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    marginBottom: 12,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  itemLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    color: colors.black,
    fontFamily: typography.poppins.semibold,
    fontSize: 15,
  },
  itemSub: {
    color: '#9CA3AF',
    fontFamily: typography.poppins.regular,
    fontSize: 13,
  },
  itemAmount: {
    color: colors.black,
    fontFamily: typography.poppins.semibold,
    fontSize: 15,
  },
  itemActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 9,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  editText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 13,
  },
  deleteButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 9,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  deleteText: {
    color: '#EF4444',
    fontFamily: typography.poppins.medium,
    fontSize: 13,
  },

  modalKeyboardAvoid: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  modalCard: {
    backgroundColor: '#F1FFF3',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    maxHeight: '85%',
  },
  modalContent: {
    paddingBottom: 8,
  },
  modalTitle: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 18,
    marginBottom: 10,
  },
  fieldGroup: {
    marginBottom: 10,
  },
  fieldLabel: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 13,
    marginBottom: 4,
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    width: '48%',
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: '#E8F5F1',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#DFF7E2',
  },
  typeIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  typeText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 13,
  },
  typeTextSelected: {
    color: colors.primary,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalCancelButton: {
    minHeight: 36,
    borderRadius: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5F1',
  },
  modalCancelText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 13,
  },
  modalSaveButton: {
    minHeight: 36,
    borderRadius: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  modalSaveText: {
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
