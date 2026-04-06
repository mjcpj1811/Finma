import { useEffect, useMemo, useState } from 'react';
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
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { debtApi } from '../../api/debtApi';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import {
  type DebtDirection,
  type DebtItem,
  type DebtTransactionItem,
  type DebtTransactionsResponse,
  type DebtsDashboard,
  type UpsertDebtPayload,
  type UpsertDebtTransactionPayload,
} from '../../types/debt';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Debts'>;

type ViewMode = 'overview' | 'detail';

type DebtFormState = {
  name: string;
  direction: DebtDirection;
  principalAmount: string;
  remainingAmount: string;
  iconKey: DebtItem['iconKey'];
};

type DebtTransactionFormState = {
  dateIso: string;
  title: string;
  counterparty: string;
  amount: string;
  kind: DebtTransactionItem['kind'];
};

const defaultDebtForm: DebtFormState = {
  name: '',
  direction: 'lend',
  principalAmount: '',
  remainingAmount: '',
  iconKey: 'payments',
};

const defaultDebtTransactionForm: DebtTransactionFormState = {
  dateIso: new Date().toISOString(),
  title: '',
  counterparty: '',
  amount: '',
  kind: 'borrow',
};

const formatCurrency = (value: number) => `${Math.round(value).toLocaleString('vi-VN')} đ`;

const formatDateText = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

const debtIconMeta: Record<DebtItem['iconKey'], { name: keyof typeof MaterialIcons.glyphMap; bg: string }> = {
  payments: { name: 'payments', bg: '#6AA8FF' },
  'account-balance-wallet': { name: 'account-balance-wallet', bg: '#6AA8FF' },
  groups: { name: 'groups', bg: '#6AA8FF' },
};

const transactionKindMeta: Record<DebtTransactionsResponse['items'][number]['kind'], { color: string; icon: keyof typeof MaterialIcons.glyphMap; label: string }> = {
  borrow: { color: '#0B8D72', icon: 'north-east', label: 'Vay' },
  repay: { color: '#EF4444', icon: 'south-west', label: 'Trả' },
};

export const DebtsScreen = ({ navigation, route }: Props) => {
  const [viewMode, setViewMode] = useState<ViewMode>(route.params?.debtId ? 'detail' : 'overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboard, setDashboard] = useState<DebtsDashboard | null>(null);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(route.params?.debtId ?? null);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<DebtTransactionsResponse | null>(null);

  const [debtModalVisible, setDebtModalVisible] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);
  const [debtForm, setDebtForm] = useState<DebtFormState>(defaultDebtForm);

  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<DebtTransactionItem | null>(null);
  const [transactionForm, setTransactionForm] = useState<DebtTransactionFormState>(defaultDebtTransactionForm);

  const selectedDebt = useMemo(
    () => dashboard?.items.find((item) => item.id === selectedDebtId) ?? null,
    [dashboard?.items, selectedDebtId],
  );

  const groupedItems = useMemo(() => {
    const groups: Record<string, DebtTransactionsResponse['items']> = {};
    detail?.items.forEach((item) => {
      if (!groups[item.monthLabel]) {
        groups[item.monthLabel] = [];
      }
      groups[item.monthLabel].push(item);
    });

    return Object.entries(groups);
  }, [detail?.items]);

  const loadDetail = async (debtId: string) => {
    setDetailLoading(true);
    try {
      const response = await debtApi.getDebtTransactions(debtId);
      setDetail(response);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const loadDashboard = async (preferredId?: string | null) => {
    setLoading(true);
    try {
      const response = await debtApi.getDashboard();
      setDashboard(response);

      const nextId =
        (preferredId && response.items.some((item) => item.id === preferredId) && preferredId) ||
        (selectedDebtId && response.items.some((item) => item.id === selectedDebtId) && selectedDebtId) ||
        response.items[0]?.id ||
        null;

      setSelectedDebtId(nextId);
    } catch {
      setDashboard(null);
      setSelectedDebtId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard(route.params?.debtId ?? null);
  }, [route.params?.debtId]);

  useEffect(() => {
    if (viewMode !== 'detail' || !selectedDebtId) {
      return;
    }

    void loadDetail(selectedDebtId);
  }, [selectedDebtId, viewMode]);

  const onBack = () => {
    if (viewMode === 'detail') {
      setViewMode('overview');
      return;
    }

    navigation.goBack();
  };

  const openDetail = async (debtId: string) => {
    setSelectedDebtId(debtId);
    setViewMode('detail');
  };

  const openCreateDebtModal = () => {
    setEditingDebt(null);
    setDebtForm(defaultDebtForm);
    setDebtModalVisible(true);
  };

  const openEditDebtModal = (item: DebtItem) => {
    setEditingDebt(item);
    setDebtForm({
      name: item.name,
      direction: item.direction,
      principalAmount: String(item.principalAmount),
      remainingAmount: String(item.remainingAmount),
      iconKey: item.iconKey,
    });
    setDebtModalVisible(true);
  };

  const onSaveDebt = async () => {
    const principalAmount = Number(debtForm.principalAmount.replace(/[^\d]/g, ''));
    const remainingAmount = Number(debtForm.remainingAmount.replace(/[^\d]/g, ''));

    if (!debtForm.name.trim() || !principalAmount || remainingAmount < 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên và số tiền hợp lệ.');
      return;
    }

    const payload: UpsertDebtPayload = {
      name: debtForm.name.trim(),
      direction: debtForm.direction,
      principalAmount,
      remainingAmount,
      iconKey: debtForm.iconKey,
    };

    setSaving(true);
    try {
      if (editingDebt) {
        await debtApi.updateDebt(editingDebt.id, payload);
        await loadDashboard(editingDebt.id);
      } else {
        const response = await debtApi.createDebt(payload);
        await loadDashboard(response.debtId ?? null);
      }

      setDebtModalVisible(false);
      setEditingDebt(null);
      setDebtForm(defaultDebtForm);
    } finally {
      setSaving(false);
    }
  };

  const onDeleteDebt = (item: DebtItem) => {
    Alert.alert('Xóa vay nợ', `Bạn có chắc muốn xóa "${item.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          await debtApi.deleteDebt(item.id);
          await loadDashboard();
          if (selectedDebtId === item.id) {
            setViewMode('overview');
          }
        },
      },
    ]);
  };

  const openCreateTransactionModal = () => {
    if (!selectedDebt) {
      return;
    }

    setEditingTransaction(null);
    setTransactionForm({
      ...defaultDebtTransactionForm,
      title: selectedDebt.name,
      counterparty: selectedDebt.direction === 'lend' ? 'Cho vay' : 'Đi vay',
    });
    setTransactionModalVisible(true);
  };

  const openEditTransactionModal = (item: DebtTransactionItem) => {
    setEditingTransaction(item);
    setTransactionForm({
      dateIso: item.dateIso,
      title: item.title,
      counterparty: item.counterparty,
      amount: String(Math.abs(item.amount)),
      kind: item.kind,
    });
    setTransactionModalVisible(true);
  };

  const onSaveTransaction = async () => {
    if (!selectedDebtId) {
      return;
    }

    const amount = Number(transactionForm.amount.replace(/[^\d]/g, ''));
    if (!transactionForm.title.trim() || !amount) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề và số tiền hợp lệ.');
      return;
    }

    const payload: UpsertDebtTransactionPayload = {
      dateIso: transactionForm.dateIso,
      title: transactionForm.title.trim(),
      counterparty: transactionForm.counterparty.trim() || (transactionForm.kind === 'borrow' ? 'Vay' : 'Trả'),
      amount,
      kind: transactionForm.kind,
    };

    setSaving(true);
    try {
      if (editingTransaction) {
        await debtApi.updateDebtTransaction(selectedDebtId, editingTransaction.id, payload);
      } else {
        await debtApi.createDebtTransaction(selectedDebtId, payload);
      }

      await loadDashboard(selectedDebtId);
      await loadDetail(selectedDebtId);
      setTransactionModalVisible(false);
      setEditingTransaction(null);
      setTransactionForm(defaultDebtTransactionForm);
    } finally {
      setSaving(false);
    }
  };

  const onDeleteTransaction = (item: DebtTransactionItem) => {
    if (!selectedDebtId) {
      return;
    }

    Alert.alert('Xóa giao dịch', 'Bạn có chắc muốn xóa giao dịch này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          await debtApi.deleteDebtTransaction(selectedDebtId, item.id);
          await loadDashboard(selectedDebtId);
          await loadDetail(selectedDebtId);
        },
      },
    ]);
  };

  if (loading || !dashboard) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải vay nợ...</Text>
        </View>
        <ScreenBottomNavigation activeTab="layers" />
      </SafeAreaView>
    );
  }

  const title = viewMode === 'overview' ? 'Vay Nợ' : 'Chi Tiết Vay Nợ';

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title={title}
        onPressBack={onBack}
        onPressNotification={() => navigation.navigate('Notifications')}
        showNotificationBadge={dashboard.overview.unreadNotifications > 0}
      />

      <View style={styles.summaryRow}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Cho vay / Đi vay</Text>
          <Text style={styles.summaryValue}>{formatCurrency(dashboard.overview.totalPrincipal)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={[styles.summaryCol, styles.summaryColRight]}>
          <Text style={styles.summaryLabel}>Đang vay</Text>
          <Text style={[styles.summaryValue, styles.remainingValue]}>{formatCurrency(dashboard.overview.totalRemaining)}</Text>
        </View>
      </View>

      <View style={styles.mainPanel}>
        {viewMode === 'overview' ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
            {dashboard.items.map((item) => {
              const icon = debtIconMeta[item.iconKey];
              return (
                <Pressable key={item.id} style={styles.debtCard} onPress={() => openDetail(item.id)}>
                  <View style={[styles.debtIcon, { backgroundColor: icon.bg }]}>
                    <MaterialIcons name={icon.name} size={22} color={colors.white} />
                  </View>

                  <View style={styles.debtInfo}>
                    <Text style={styles.debtName}>{item.name}</Text>
                    <Text style={styles.debtType}>{item.direction === 'lend' ? 'Cho vay' : 'Đi vay'}</Text>
                  </View>

                  <View style={styles.debtAmounts}>
                    <Text style={styles.debtPrincipal}>{formatCurrency(item.principalAmount)}</Text>
                    <Text style={styles.debtRemaining}>{formatCurrency(item.remainingAmount)}</Text>

                    <View style={styles.cardActionRow}>
                      <Pressable
                        style={styles.cardActionBtn}
                        onPress={(event) => {
                          event.stopPropagation();
                          openEditDebtModal(item);
                        }}
                      >
                        <MaterialIcons name="edit" size={13} color={colors.text} />
                      </Pressable>

                      <Pressable
                        style={styles.cardActionBtn}
                        onPress={(event) => {
                          event.stopPropagation();
                          onDeleteDebt(item);
                        }}
                      >
                        <MaterialIcons name="delete-outline" size={14} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })}

            <Pressable style={styles.addButton} onPress={openCreateDebtModal}>
              <Text style={styles.addButtonText}>Thêm vay nợ</Text>
            </Pressable>
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
            {detailLoading || !detail || !selectedDebt ? (
              <View style={styles.loaderInline}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loaderInlineText}>Đang tải chi tiết...</Text>
              </View>
            ) : (
              <>
                <View style={styles.selectedCard}>
                  <View style={styles.selectedLeft}>
                    <Text style={styles.selectedLabel}>Cho vay / Đi vay</Text>
                    <Text style={styles.selectedPrimary}>{formatCurrency(detail.overview.totalBorrowed)}</Text>
                    <Text style={styles.selectedLabel}>Đang vay</Text>
                    <Text style={styles.selectedSecondary}>{formatCurrency(detail.overview.remainingAmount)}</Text>
                  </View>

                  <View style={styles.selectedRight}>
                    <View style={styles.selectedIconWrap}>
                      <MaterialIcons name={debtIconMeta[selectedDebt.iconKey].name} size={34} color={colors.white} />
                    </View>
                    <Text style={styles.selectedName}>{selectedDebt.name}</Text>
                  </View>
                </View>

                {groupedItems.map(([monthLabel, items]) => (
                  <View key={monthLabel} style={styles.monthGroup}>
                    <Text style={styles.monthLabel}>{monthLabel}</Text>

                    {items.map((item) => {
                      const kindMeta = transactionKindMeta[item.kind];
                      return (
                        <View key={item.id} style={styles.transactionItem}>
                          <View style={styles.txLeft}>
                            <View style={styles.transactionIconWrap}>
                              <MaterialIcons name={debtIconMeta[selectedDebt.iconKey].name} size={16} color={colors.white} />
                            </View>

                            <View>
                              <Text style={styles.transactionTitle}>{item.title}</Text>
                              <Text style={styles.transactionTime}>{item.timeLabel}</Text>
                            </View>
                          </View>

                          <View style={styles.txRight}>
                            <View style={styles.kindRow}>
                              <MaterialIcons name={kindMeta.icon} size={12} color={kindMeta.color} />
                              <Text style={[styles.kindText, { color: kindMeta.color }]}>{kindMeta.label}</Text>
                            </View>
                            <Text style={styles.txAmount}>{formatCurrency(Math.abs(item.amount))}</Text>

                            <View style={styles.txActionRow}>
                              <Pressable style={styles.txActionBtn} onPress={() => openEditTransactionModal(item)}>
                                <MaterialIcons name="edit" size={12} color={colors.text} />
                              </Pressable>

                              <Pressable style={styles.txActionBtn} onPress={() => onDeleteTransaction(item)}>
                                <MaterialIcons name="delete-outline" size={13} color="#EF4444" />
                              </Pressable>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}

                <Pressable style={styles.addButton} onPress={openCreateTransactionModal}>
                  <Text style={styles.addButtonText}>Thêm trả/vay</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        )}
      </View>

      <Modal visible={debtModalVisible} transparent animationType="fade" onRequestClose={() => setDebtModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingDebt ? 'Sửa vay nợ' : 'Thêm vay nợ'}</Text>

            <Text style={styles.modalLabel}>Tên</Text>
            <TextInput
              value={debtForm.name}
              onChangeText={(value) => setDebtForm((prev) => ({ ...prev, name: value }))}
              placeholder="Ví dụ: Nguyễn Văn D"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.modalLabel}>Loại</Text>
            <View style={styles.typeRow}>
              <Pressable
                style={[styles.typeChip, debtForm.direction === 'lend' && styles.typeChipActive]}
                onPress={() => setDebtForm((prev) => ({ ...prev, direction: 'lend' }))}
              >
                <Text style={[styles.typeChipText, debtForm.direction === 'lend' && styles.typeChipTextActive]}>Cho vay</Text>
              </Pressable>

              <Pressable
                style={[styles.typeChip, debtForm.direction === 'borrow' && styles.typeChipActive]}
                onPress={() => setDebtForm((prev) => ({ ...prev, direction: 'borrow' }))}
              >
                <Text style={[styles.typeChipText, debtForm.direction === 'borrow' && styles.typeChipTextActive]}>Đi vay</Text>
              </Pressable>
            </View>

            <Text style={styles.modalLabel}>Số tiền gốc</Text>
            <TextInput
              value={debtForm.principalAmount}
              onChangeText={(value) => setDebtForm((prev) => ({ ...prev, principalAmount: value }))}
              placeholder="500000"
              keyboardType="numeric"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.modalLabel}>Còn lại</Text>
            <TextInput
              value={debtForm.remainingAmount}
              onChangeText={(value) => setDebtForm((prev) => ({ ...prev, remainingAmount: value }))}
              placeholder="300000"
              keyboardType="numeric"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.modalLabel}>Biểu tượng</Text>
            <View style={styles.iconRow}>
              {(Object.keys(debtIconMeta) as DebtItem['iconKey'][]).map((iconKey) => {
                const selected = debtForm.iconKey === iconKey;
                return (
                  <Pressable
                    key={iconKey}
                    style={[styles.iconChip, selected && styles.iconChipActive]}
                    onPress={() => setDebtForm((prev) => ({ ...prev, iconKey }))}
                  >
                    <MaterialIcons name={debtIconMeta[iconKey].name} size={18} color={selected ? colors.white : colors.text} />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalActionRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setDebtModalVisible(false)}>
                <Text style={styles.cancelText}>Hủy</Text>
              </Pressable>

              <Pressable style={styles.saveBtn} onPress={onSaveDebt} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'Đang lưu...' : 'Lưu'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={transactionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTransactionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingTransaction ? 'Sửa giao dịch' : 'Thêm giao dịch trả/vay'}</Text>

            <Text style={styles.modalLabel}>Ngày</Text>
            <View style={styles.readonlyInput}>
              <Text style={styles.readonlyText}>{formatDateText(transactionForm.dateIso)}</Text>
              <MaterialIcons name="event" size={18} color={colors.primary} />
            </View>

            <Text style={styles.modalLabel}>Tiêu đề</Text>
            <TextInput
              value={transactionForm.title}
              onChangeText={(value) => setTransactionForm((prev) => ({ ...prev, title: value }))}
              placeholder="Ví dụ: Nguyễn Văn A"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.modalLabel}>Loại</Text>
            <View style={styles.typeRow}>
              <Pressable
                style={[styles.typeChip, transactionForm.kind === 'borrow' && styles.typeChipActive]}
                onPress={() => setTransactionForm((prev) => ({ ...prev, kind: 'borrow' }))}
              >
                <Text style={[styles.typeChipText, transactionForm.kind === 'borrow' && styles.typeChipTextActive]}>Vay</Text>
              </Pressable>

              <Pressable
                style={[styles.typeChip, transactionForm.kind === 'repay' && styles.typeChipActive]}
                onPress={() => setTransactionForm((prev) => ({ ...prev, kind: 'repay' }))}
              >
                <Text style={[styles.typeChipText, transactionForm.kind === 'repay' && styles.typeChipTextActive]}>Trả</Text>
              </Pressable>
            </View>

            <Text style={styles.modalLabel}>Số tiền</Text>
            <TextInput
              value={transactionForm.amount}
              onChangeText={(value) => setTransactionForm((prev) => ({ ...prev, amount: value }))}
              placeholder="300000"
              keyboardType="numeric"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.modalLabel}>Mô tả</Text>
            <TextInput
              value={transactionForm.counterparty}
              onChangeText={(value) => setTransactionForm((prev) => ({ ...prev, counterparty: value }))}
              placeholder="Cho vay / Đi vay / Trả nợ"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <View style={styles.modalActionRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setTransactionModalVisible(false)}>
                <Text style={styles.cancelText}>Hủy</Text>
              </Pressable>

              <Pressable style={styles.saveBtn} onPress={onSaveTransaction} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'Đang lưu...' : 'Lưu'}</Text>
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
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSlot: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 2,
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
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  summaryCol: {
    flex: 1,
  },
  summaryColRight: {
    alignItems: 'flex-end',
  },
  summaryLabel: {
    color: '#DFF7E2',
    fontFamily: typography.poppins.medium,
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: colors.white,
    fontFamily: typography.poppins.bold,
    fontSize: 26,
    lineHeight: 30,
  },
  remainingValue: {
    color: '#0E62D0',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#C6EFE4',
    marginHorizontal: 10,
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
    paddingBottom: 110,
    gap: 8,
  },
  debtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#DFF7E2',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 10,
  },
  debtIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtInfo: {
    flex: 1,
  },
  debtName: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 14,
  },
  debtType: {
    color: '#0E62D0',
    fontFamily: typography.poppins.medium,
    fontSize: 12,
  },
  debtAmounts: {
    alignItems: 'flex-end',
  },
  debtPrincipal: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 13,
  },
  debtRemaining: {
    color: '#0B8D72',
    fontFamily: typography.poppins.medium,
    fontSize: 12,
  },
  cardActionRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  cardActionBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DFF7E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCard: {
    backgroundColor: '#DFF7E2',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  selectedLeft: {
    flex: 1,
  },
  selectedLabel: {
    color: '#3A6357',
    fontFamily: typography.poppins.medium,
    fontSize: 12,
    marginBottom: 2,
  },
  selectedPrimary: {
    color: colors.text,
    fontFamily: typography.poppins.bold,
    fontSize: 26,
    lineHeight: 30,
    marginBottom: 8,
  },
  selectedSecondary: {
    color: '#0B8D72',
    fontFamily: typography.poppins.bold,
    fontSize: 26,
    lineHeight: 30,
  },
  selectedRight: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconWrap: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: '#6AA8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedName: {
    marginTop: 4,
    color: '#6B7280',
    fontFamily: typography.poppins.medium,
    fontSize: 11,
    textAlign: 'center',
  },
  monthGroup: {
    marginTop: 10,
    gap: 8,
  },
  monthLabel: {
    color: '#3A6357',
    fontFamily: typography.poppins.semibold,
    fontSize: 14,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DFF7E2',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  txRight: {
    alignItems: 'flex-end',
    minWidth: 90,
  },
  transactionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DFF7E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionTitle: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 13,
  },
  transactionTime: {
    color: '#0E62D0',
    fontFamily: typography.poppins.medium,
    fontSize: 11,
  },
  kindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 2,
  },
  kindText: {
    fontFamily: typography.poppins.medium,
    fontSize: 11,
  },
  txAmount: {
    color: '#1F2937',
    fontFamily: typography.poppins.semibold,
    fontSize: 12,
  },
  txActionRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  txActionBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DFF7E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    alignSelf: 'center',
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    marginTop: 8,
  },
  addButtonText: {
    color: '#0C6657',
    fontFamily: typography.poppins.semibold,
    fontSize: 14,
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
  loaderInline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loaderInlineText: {
    color: '#4F6B63',
    fontFamily: typography.poppins.medium,
    fontSize: 13,
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
  readonlyInput: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#E6F5EC',
    borderWidth: 1,
    borderColor: '#D4EFE8',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readonlyText: {
    color: colors.text,
    fontFamily: typography.poppins.regular,
    fontSize: 13,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  typeChip: {
    flex: 1,
    minHeight: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5F1',
  },
  typeChipActive: {
    backgroundColor: colors.primary,
  },
  typeChipText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 12,
  },
  typeChipTextActive: {
    color: colors.white,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  iconChip: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#E8F5F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipActive: {
    backgroundColor: colors.primary,
  },
  modalActionRow: {
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
