import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  type GestureResponderEvent,
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
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
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
  subtitle: string;
  balance: string;
  type: MoneySourceType;
};

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

const defaultFormState: FormState = {
  name: '',
  subtitle: '',
  balance: '',
  type: 'cash',
};

const iconMetaByType: Record<MoneySourceType, { name: keyof typeof MaterialIcons.glyphMap; bg: string; color: string }> = {
  cash: { name: 'account-balance-wallet', bg: '#E8F5F1', color: '#00D09E' },
  bank: { name: 'account-balance', bg: '#EEF2FF', color: '#6366F1' },
  card: { name: 'credit-card', bg: '#FEF3C7', color: '#F59E0B' },
};

export const ManageSourcesScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboard, setDashboard] = useState<MoneySourceDashboard | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingSource, setEditingSource] = useState<MoneySourceItem | null>(null);
  const [form, setForm] = useState<FormState>(defaultFormState);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await sourceApi.getDashboard();
      setDashboard(response);
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

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
      subtitle: item.subtitle,
      balance: String(item.balance),
      type: item.type,
    });
    setModalVisible(true);
  };

  const onSave = async () => {
    const parsedBalance = Number(form.balance.replace(/[^\d]/g, ''));
    if (!form.name.trim() || !form.subtitle.trim() || !parsedBalance) {
      return;
    }

    const payload: UpsertMoneySourcePayload = {
      name: form.name.trim(),
      subtitle: form.subtitle.trim(),
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
    Alert.alert('Xóa tài khoản', `Bạn có chắc muốn xóa ${item.name}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          await sourceApi.deleteSource(item.id);
          await loadDashboard();
        },
      },
    ]);
  };

  const stopCardPress = (event: GestureResponderEvent) => {
    event.stopPropagation();
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
        <Text style={styles.balanceValue}>{formatCurrency(dashboard.summary.totalBalance)}</Text>
        <Text style={styles.balanceSub}>{dashboard.summary.totalAccounts} tài khoản</Text>
      </View>

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          <Text style={styles.panelTitle}>Danh sách tài khoản</Text>

          {dashboard.items.map((item) => {
            const iconMeta = iconMetaByType[item.type];
            return (
              <Pressable
                key={item.id}
                style={styles.itemCard}
                onPress={() => navigation.navigate('SourceTransactions', { sourceId: item.id })}
              >
                <View style={styles.itemTopRow}>
                  <View style={styles.itemLeftGroup}>
                    <View style={[styles.itemIconWrap, { backgroundColor: iconMeta.bg }]}>
                      <MaterialIcons name={iconMeta.name} size={24} color={iconMeta.color} />
                    </View>

                    <View>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemSub}>{item.subtitle}</Text>
                    </View>
                  </View>

                  <Text style={styles.itemAmount}>{formatCurrency(item.balance)}</Text>
                </View>

                <View style={styles.itemActionRow}>
                  <Pressable
                    style={styles.editButton}
                    onPress={(event) => {
                      stopCardPress(event);
                      openEditModal(item);
                    }}
                  >
                    <MaterialIcons name="edit" size={15} color={colors.text} />
                    <Text style={styles.editText}>Sửa</Text>
                  </Pressable>

                  <Pressable
                    style={styles.deleteButton}
                    onPress={(event) => {
                      stopCardPress(event);
                      onDelete(item);
                    }}
                  >
                    <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
                    <Text style={styles.deleteText}>Xóa</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })}

          <Pressable style={styles.addButton} onPress={openCreateModal}>
            <MaterialIcons name="add" size={20} color={colors.white} />
            <Text style={styles.addText}>Thêm tài khoản mới</Text>
          </Pressable>
        </ScrollView>
      </View>

      <ScreenBottomNavigation activeTab="home" />

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
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
              <Text style={styles.fieldLabel}>Mô tả ngắn</Text>
              <TextInput
                value={form.subtitle}
                onChangeText={(value) => setForm((prev) => ({ ...prev, subtitle: value }))}
                placeholder="Ví dụ: Ngân hàng"
                style={styles.input}
                placeholderTextColor={colors.textMuted}
              />
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

            <View style={styles.typeRow}>
              {(['cash', 'bank', 'card'] as MoneySourceType[]).map((itemType) => {
                const selected = form.type === itemType;
                const label = itemType === 'cash' ? 'Tiền mặt' : itemType === 'bank' ? 'Ngân hàng' : 'Thẻ';
                return (
                  <Pressable
                    key={itemType}
                    style={[styles.typeItem, selected && styles.typeItemSelected]}
                    onPress={() => setForm((prev) => ({ ...prev, type: itemType }))}
                  >
                    <Text style={[styles.typeText, selected && styles.typeTextSelected]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalActionRow}>
              <Pressable style={styles.modalCancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Hủy</Text>
              </Pressable>

              <Pressable style={styles.modalSaveButton} onPress={onSave} disabled={saving}>
                <Text style={styles.modalSaveText}>{saving ? 'Đang lưu...' : 'Lưu'}</Text>
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
  panelTitle: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 19,
    marginBottom: 14,
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
  addButton: {
    marginTop: 10,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  addText: {
    color: colors.white,
    fontFamily: typography.poppins.semibold,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 18,
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
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeItem: {
    flex: 1,
    minHeight: 36,
    borderRadius: 9,
    backgroundColor: '#E8F5F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeItemSelected: {
    backgroundColor: colors.primary,
  },
  typeText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 13,
  },
  typeTextSelected: {
    color: colors.white,
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
