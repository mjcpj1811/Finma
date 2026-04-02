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
import { savingsApi } from '../../api/savingsApi';
import { BottomNavBar } from '../../components/BottomNavBar';
import { NotificationBellButton } from '../../components/NotificationBellButton';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import {
  type SavingItem,
  type SavingTransactionsResponse,
  type SavingsDashboard,
  type UpsertSavingPayload,
} from '../../types/savings';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Savings'>;

type ViewMode = 'overview' | 'detail' | 'form';

type FormState = {
  name: string;
  targetAmount: string;
  currentAmount: string;
  iconKey: SavingItem['iconKey'];
};

type TransactionFormState = {
  dateIso: string;
  amount: string;
  title: string;
  note: string;
  kind: SavingTransactionsResponse['items'][number]['kind'];
};

const defaultForm: FormState = {
  name: '',
  targetAmount: '',
  currentAmount: '',
  iconKey: 'savings',
};

const defaultTransactionForm = (title = ''): TransactionFormState => ({
  dateIso: new Date().toISOString(),
  amount: '',
  title,
  note: '',
  kind: 'deposit',
});

const formatCurrency = (value: number) => `${Math.round(value).toLocaleString('vi-VN')}`;

const savingIconMeta: Record<SavingItem['iconKey'], { name: keyof typeof MaterialIcons.glyphMap; label: string }> = {
  savings: { name: 'savings', label: 'Tiết kiệm' },
  flight: { name: 'flight', label: 'Du lịch' },
  'directions-car': { name: 'directions-car', label: 'Mua xe' },
  'home-work': { name: 'home-work', label: 'Mua nhà' },
};

const transactionIcon: Record<
  SavingTransactionsResponse['items'][number]['kind'],
  { name: keyof typeof MaterialIcons.glyphMap; bg: string; color: string }
> = {
  deposit: { name: 'south-west', bg: '#DBF7EA', color: '#0A8D6F' },
  withdraw: { name: 'north-east', bg: '#FDECEC', color: '#DC2626' },
};

const stripSavingPrefix = (name: string) => name.replace(/^Tiết\s*Kiệm\s*/i, '').trim() || name;

const formatDateText = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  });
};

export const SavingsScreen = ({ navigation, route }: Props) => {
  const [viewMode, setViewMode] = useState<ViewMode>(route.params?.savingId ? 'detail' : 'overview');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<SavingsDashboard | null>(null);
  const [selectedSavingId, setSelectedSavingId] = useState<string | null>(null);

  const [detailLoading, setDetailLoading] = useState(true);
  const [detail, setDetail] = useState<SavingTransactionsResponse | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [editingItem, setEditingItem] = useState<SavingItem | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [transactionForm, setTransactionForm] = useState<TransactionFormState>(defaultTransactionForm());

  const selectedSaving = useMemo(
    () => dashboard?.items.find((item) => item.id === selectedSavingId) ?? null,
    [dashboard?.items, selectedSavingId],
  );

  const totalProgressPercent = useMemo(() => {
    if (!dashboard?.overview.totalTarget) {
      return 0;
    }
    return Math.max(
      0,
      Math.min(100, Math.round((dashboard.overview.totalSaved / dashboard.overview.totalTarget) * 100)),
    );
  }, [dashboard?.overview.totalSaved, dashboard?.overview.totalTarget]);

  const upcomingTargets = useMemo(() => {
    if (!dashboard) {
      return 0;
    }

    return dashboard.items.filter((item) => item.targetAmount - item.currentAmount <= 150000).length;
  }, [dashboard]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, SavingTransactionsResponse['items']> = {};
    detail?.items.forEach((item) => {
      if (!groups[item.monthLabel]) {
        groups[item.monthLabel] = [];
      }
      groups[item.monthLabel].push(item);
    });

    return Object.entries(groups);
  }, [detail?.items]);

  const loadDashboard = async (preferredId?: string | null) => {
    setLoading(true);
    try {
      const response = await savingsApi.getDashboard();
      setDashboard(response);

      const nextSelected =
        (preferredId && response.items.some((item) => item.id === preferredId) && preferredId) ||
        (selectedSavingId && response.items.some((item) => item.id === selectedSavingId) && selectedSavingId) ||
        response.items[0]?.id ||
        null;

      setSelectedSavingId(nextSelected);
    } catch {
      setDashboard(null);
      setSelectedSavingId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard(route.params?.savingId ?? null);
  }, [route.params?.savingId]);

  useEffect(() => {
    if (route.params?.savingId) {
      setViewMode('detail');
    }
  }, [route.params?.savingId]);

  useEffect(() => {
    const loadDetail = async () => {
      if (!selectedSavingId) {
        setDetail(null);
        setDetailLoading(false);
        return;
      }

      setDetailLoading(true);
      try {
        const response = await savingsApi.getSavingTransactions(selectedSavingId);
        setDetail(response);
      } catch {
        setDetail(null);
      } finally {
        setDetailLoading(false);
      }
    };

    void loadDetail();
  }, [selectedSavingId]);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEditModal = (item: SavingItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      targetAmount: String(item.targetAmount),
      currentAmount: String(item.currentAmount),
      iconKey: item.iconKey,
    });
    setShowModal(true);
  };

  const onSave = async () => {
    const targetAmount = Number(form.targetAmount.replace(/[^\d]/g, ''));
    const currentAmount = Number(form.currentAmount.replace(/[^\d]/g, ''));

    if (!form.name.trim() || !targetAmount || currentAmount < 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên và số tiền hợp lệ.');
      return;
    }

    const payload: UpsertSavingPayload = {
      name: form.name.trim(),
      targetAmount,
      currentAmount,
      iconKey: form.iconKey,
    };

    setSavingAction(true);
    try {
      if (editingItem) {
        await savingsApi.updateSaving(editingItem.id, payload);
        await loadDashboard(editingItem.id);
      } else {
        const response = await savingsApi.createSaving(payload);
        await loadDashboard(response.savingId ?? null);
      }

      setShowModal(false);
      setEditingItem(null);
      setForm(defaultForm);
    } finally {
      setSavingAction(false);
    }
  };

  const onDelete = (item: SavingItem) => {
    Alert.alert('Xóa tiết kiệm', `Bạn có chắc muốn xóa "${item.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          await savingsApi.deleteSaving(item.id);
          await loadDashboard();
          if (selectedSavingId === item.id) {
            setViewMode('overview');
          }
        },
      },
    ]);
  };

  const onBack = () => {
    if (viewMode === 'form') {
      setViewMode('detail');
      return;
    }

    if (viewMode === 'detail') {
      setViewMode('overview');
      return;
    }

    navigation.goBack();
  };

  const openDetail = (savingId: string) => {
    setSelectedSavingId(savingId);
    setViewMode('detail');
  };

  const openTransactionForm = () => {
    if (!selectedSaving) {
      return;
    }

    setTransactionForm(defaultTransactionForm(selectedSaving.name));
    setViewMode('form');
  };

  const onSaveTransaction = async () => {
    if (!selectedSavingId || !selectedSaving) {
      return;
    }

    const amount = Number(transactionForm.amount.replace(/[^\d]/g, ''));
    if (!amount || !transactionForm.title.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tổng tiền và tiêu đề hợp lệ.');
      return;
    }

    setSavingAction(true);
    try {
      await savingsApi.createSavingTransaction(selectedSavingId, {
        dateIso: transactionForm.dateIso,
        amount,
        title: transactionForm.title.trim(),
        note: transactionForm.note.trim(),
        kind: transactionForm.kind,
      });

      await loadDashboard(selectedSavingId);
      const response = await savingsApi.getSavingTransactions(selectedSavingId);
      setDetail(response);
      setViewMode('detail');
    } finally {
      setSavingAction(false);
    }
  };

  const screenTitle =
    viewMode === 'overview' ? 'Tiết Kiệm' : viewMode === 'form' ? 'Thêm Mới' : stripSavingPrefix(selectedSaving?.name ?? 'Tiết Kiệm');

  const unreadNotifications = detail?.overview.unreadNotifications ?? dashboard?.overview.unreadNotifications ?? 0;

  if (loading || !dashboard) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải tiết kiệm...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backSlot} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={22} color={colors.white} />
        </Pressable>

        <Text style={styles.headerTitle}>{screenTitle}</Text>

        <View style={styles.headerActions}>
          {viewMode === 'detail' && selectedSaving ? (
            <Pressable style={styles.headerIconButton} onPress={() => openEditModal(selectedSaving)}>
              <MaterialIcons name="edit" size={18} color={colors.white} />
            </Pressable>
          ) : null}

          {viewMode === 'detail' && selectedSaving ? (
            <Pressable style={styles.headerIconButton} onPress={() => onDelete(selectedSaving)}>
              <MaterialIcons name="delete-outline" size={19} color="#EF4444" />
            </Pressable>
          ) : null}

          <NotificationBellButton
            size={30}
            onPress={() => navigation.navigate('Notifications')}
            showBadge={unreadNotifications > 0}
          />
        </View>
      </View>

      {viewMode === 'overview' ? (
        <>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Mục Tiêu</Text>
              <Text style={styles.summaryValue}>{formatCurrency(dashboard.overview.totalTarget)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={[styles.summaryCol, styles.summaryColRight]}>
              <Text style={styles.summaryLabel}>Đã tiết kiệm</Text>
              <Text style={[styles.summaryValue, styles.savedValue]}>{formatCurrency(dashboard.overview.totalSaved)}</Text>
            </View>
          </View>

          <View style={styles.summaryProgressTrack}>
            <View style={[styles.summaryProgressFill, { width: `${totalProgressPercent}%` }]} />
            <Text style={styles.summaryProgressPercent}>{totalProgressPercent}%</Text>
          </View>

          <Text style={styles.summaryHint}>
            {totalProgressPercent}% Mục Tiêu, {upcomingTargets} Mục Tiêu Sắp Đến Hạn
          </Text>

          <View style={styles.mainPanel}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
              <View style={styles.savingsGrid}>
                {dashboard.items.map((item) => {
                  const icon = savingIconMeta[item.iconKey];
                  return (
                    <Pressable
                      key={item.id}
                      style={styles.savingGridItem}
                      onPress={() => openDetail(item.id)}
                      onLongPress={() => openEditModal(item)}
                    >
                      <View style={styles.savingGridIcon}>
                        <MaterialIcons name={icon.name} size={30} color={colors.white} />
                      </View>
                      <Text style={styles.savingGridText} numberOfLines={1}>
                        {stripSavingPrefix(item.name)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable style={styles.addButton} onPress={openCreateModal}>
                <Text style={styles.addButtonText}>Thêm mục tiêu</Text>
              </Pressable>
            </ScrollView>
          </View>
        </>
      ) : null}

      {viewMode === 'detail' ? (
        <View style={styles.mainPanel}>
          {detailLoading || !detail ? (
            <View style={styles.emptyWrap}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.emptyText}>Đang tải giao dịch tiết kiệm...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
              <View style={styles.detailCard}>
                <View style={styles.detailLeft}>
                  <Text style={styles.detailLabel}>Mục Tiêu</Text>
                  <Text style={styles.detailMainValue}>{formatCurrency(detail.overview.target)}</Text>

                  <Text style={styles.detailLabel}>Đã tiết kiệm</Text>
                  <Text style={[styles.detailMainValue, styles.detailSaved]}>{formatCurrency(detail.overview.saved)}</Text>
                </View>

                <View style={styles.detailRight}>
                  <View style={styles.selectedIconWrap}>
                    <MaterialIcons name={savingIconMeta[detail.saving.iconKey].name} size={34} color={colors.white} />
                  </View>
                  <Text style={styles.selectedName}>{stripSavingPrefix(detail.saving.name)}</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${detail.overview.progressPercent}%` }]} />
                <Text style={styles.progressPercent}>{detail.overview.progressPercent}%</Text>
                <Text style={styles.progressTargetText}>{formatCurrency(detail.overview.target)}</Text>
              </View>

              <Text style={styles.progressText}>Đã đạt {detail.overview.progressPercent}% mục tiêu</Text>

              <View style={styles.monthHeaderRow}>
                <Text style={styles.monthLabel}>April</Text>
                <Pressable style={styles.calendarChip}>
                  <MaterialIcons name="calendar-month" size={16} color={colors.primary} />
                </Pressable>
              </View>

              {groupedTransactions.map(([monthLabel, items]) => (
                <View key={monthLabel} style={styles.monthGroup}>
                  {monthLabel !== 'April' ? <Text style={styles.monthLabel}>{monthLabel}</Text> : null}
                  {items.map((item) => {
                    const icon = transactionIcon[item.kind];
                    return (
                      <View key={item.id} style={styles.transactionItem}>
                        <View style={[styles.transactionIcon, { backgroundColor: '#6AA8FF' }]}>
                          <MaterialIcons name={savingIconMeta[detail.saving.iconKey].name} size={18} color={colors.white} />
                        </View>

                        <View style={styles.transactionCenter}>
                          <Text style={styles.transactionTitle}>{item.title}</Text>
                          <Text style={styles.transactionTime}>{item.timeLabel}</Text>
                        </View>

                        <View style={styles.transactionRight}>
                          <Text style={styles.transactionAmount}>{formatCurrency(Math.abs(item.amount))}</Text>
                          <View style={styles.transactionKindRow}>
                            <MaterialIcons name={icon.name} size={12} color={icon.color} />
                            <Text style={[styles.transactionKindText, item.kind === 'deposit' ? styles.amountIn : styles.amountOut]}>
                              {item.kind === 'deposit' ? 'Nạp quỹ' : 'Rút quỹ'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}

              <Pressable style={styles.addButton} onPress={openTransactionForm}>
                <Text style={styles.addButtonText}>Thêm khoản tiết kiệm</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      ) : null}

      {viewMode === 'form' ? (
        <View style={styles.mainPanel}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
            <View style={styles.formFieldBlock}>
              <Text style={styles.formLabel}>Ngày</Text>
              <View style={styles.readonlyInput}>
                <Text style={styles.readonlyText}>{formatDateText(transactionForm.dateIso)}</Text>
                <MaterialIcons name="event" size={18} color={colors.primary} />
              </View>
            </View>

            <View style={styles.formFieldBlock}>
              <Text style={styles.formLabel}>Danh Mục</Text>
              <View style={styles.readonlyInput}>
                <Text style={styles.readonlyText}>{stripSavingPrefix(selectedSaving?.name ?? 'Tiết kiệm')}</Text>
                <MaterialIcons name="keyboard-arrow-down" size={18} color={colors.primary} />
              </View>
            </View>

            <View style={styles.formFieldBlock}>
              <Text style={styles.formLabel}>Tổng</Text>
              <TextInput
                value={transactionForm.amount}
                onChangeText={(value) => setTransactionForm((prev) => ({ ...prev, amount: value }))}
                placeholder="201770"
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.formFieldBlock}>
              <Text style={styles.formLabel}>Tiêu Đề</Text>
              <TextInput
                value={transactionForm.title}
                onChangeText={(value) => setTransactionForm((prev) => ({ ...prev, title: value }))}
                placeholder="Tiết Kiệm Du Lịch"
                style={styles.input}
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.formFieldBlock}>
              <Text style={styles.formLabel}>Ghi Chú</Text>
              <TextInput
                value={transactionForm.note}
                onChangeText={(value) => setTransactionForm((prev) => ({ ...prev, note: value }))}
                placeholder="Chi tiết"
                style={[styles.input, styles.noteInput]}
                placeholderTextColor={colors.textMuted}
                multiline
              />
            </View>

            <View style={styles.formKindRow}>
              <Pressable
                style={[styles.kindChip, transactionForm.kind === 'deposit' && styles.kindChipActive]}
                onPress={() => setTransactionForm((prev) => ({ ...prev, kind: 'deposit' }))}
              >
                <Text style={[styles.kindChipText, transactionForm.kind === 'deposit' && styles.kindChipTextActive]}>Nạp quỹ</Text>
              </Pressable>

              <Pressable
                style={[styles.kindChip, transactionForm.kind === 'withdraw' && styles.kindChipActive]}
                onPress={() => setTransactionForm((prev) => ({ ...prev, kind: 'withdraw' }))}
              >
                <Text style={[styles.kindChipText, transactionForm.kind === 'withdraw' && styles.kindChipTextActive]}>Rút quỹ</Text>
              </Pressable>
            </View>

            <Pressable style={styles.addButton} onPress={onSaveTransaction} disabled={savingAction}>
              <Text style={styles.addButtonText}>{savingAction ? 'Đang lưu...' : 'Lưu'}</Text>
            </Pressable>
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.fixedBottomNav}>
        <BottomNavBar
          activeTab="layers"
          onPress={(tab) => {
            if (tab === 'home') navigation.navigate('Home');
            if (tab === 'report') navigation.navigate('Report');
            if (tab === 'exchange') navigation.navigate('Transactions');
            if (tab === 'layers') navigation.navigate('Categories');
            if (tab === 'profile') navigation.navigate('Profile');
          }}
        />
      </View>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingItem ? 'Sửa tiết kiệm' : 'Thêm mới'}</Text>

            <Text style={styles.modalLabel}>Tên mục tiêu</Text>
            <TextInput
              value={form.name}
              onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
              placeholder="Ví dụ: Tiết Kiệm Du Lịch"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.modalLabel}>Tổng mục tiêu</Text>
            <TextInput
              value={form.targetAmount}
              onChangeText={(value) => setForm((prev) => ({ ...prev, targetAmount: value }))}
              placeholder="10000000"
              keyboardType="numeric"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.modalLabel}>Đã tiết kiệm</Text>
            <TextInput
              value={form.currentAmount}
              onChangeText={(value) => setForm((prev) => ({ ...prev, currentAmount: value }))}
              placeholder="500000"
              keyboardType="numeric"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.modalLabel}>Biểu tượng</Text>
            <View style={styles.iconOptionsRow}>
              {(Object.keys(savingIconMeta) as SavingItem['iconKey'][]).map((iconKey) => {
                const selected = form.iconKey === iconKey;
                return (
                  <Pressable
                    key={iconKey}
                    style={[styles.iconOption, selected && styles.iconOptionActive]}
                    onPress={() => setForm((prev) => ({ ...prev, iconKey }))}
                  >
                    <MaterialIcons
                      name={savingIconMeta[iconKey].name}
                      size={20}
                      color={selected ? colors.white : colors.text}
                    />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>Hủy</Text>
              </Pressable>

              <Pressable style={styles.saveBtn} onPress={onSave} disabled={savingAction}>
                <Text style={styles.saveText}>{savingAction ? 'Đang lưu...' : 'Lưu'}</Text>
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
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backSlot: {
    width: 90,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  headerActions: {
    width: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  headerIconButton: {
    width: 28,
    height: 28,
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
    fontSize: 13,
    marginBottom: 4,
  },
  summaryValue: {
    color: colors.white,
    fontFamily: typography.poppins.bold,
    fontSize: 26,
    lineHeight: 30,
  },
  savedValue: {
    color: '#0E62D0',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#C6EFE4',
    marginHorizontal: 10,
  },
  summaryProgressTrack: {
    marginHorizontal: 16,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D9F3E8',
    overflow: 'hidden',
    justifyContent: 'center',
    marginBottom: 6,
  },
  summaryProgressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#0B1C26',
  },
  summaryProgressPercent: {
    color: colors.white,
    fontFamily: typography.poppins.semibold,
    fontSize: 11,
    paddingLeft: 10,
  },
  summaryHint: {
    color: '#0A4D3F',
    fontFamily: typography.poppins.medium,
    fontSize: 11,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  mainPanel: {
    flex: 1,
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  panelContent: {
    paddingBottom: 120,
  },
  formContent: {
    paddingBottom: 120,
    gap: 8,
  },
  savingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: 16,
    marginTop: 8,
  },
  savingGridItem: {
    width: '33.3333%',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 6,
  },
  savingGridIcon: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: '#6AA8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingGridText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
  },
  savingTabsContent: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  savingTab: {
    width: 90,
    alignItems: 'center',
    marginRight: 8,
  },
  savingTabIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#86B8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  savingTabIconActive: {
    backgroundColor: '#4D9EFF',
    borderWidth: 2,
    borderColor: '#2A74E6',
  },
  savingTabText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
  },
  detailCard: {
    backgroundColor: '#DFF7E2',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  detailLeft: {
    flex: 1,
  },
  detailRight: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel:  {
    color: '#DFF7E2',
    fontFamily: typography.poppins.medium,
    fontSize: 12,
    marginBottom: 2,
  },
  detailMainValue: {
    color: colors.text,
    fontFamily: typography.poppins.bold,
    fontSize: 28,
    lineHeight: 32,
    marginBottom: 8,
  },
  detailSaved: {
    color: '#0B8D72',
    marginBottom: 0,
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
  progressTrack: {
    marginTop: 10,
    height: 12,
    borderRadius: 7,
    backgroundColor: '#DCF4E9',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00D09E',
    borderRadius: 7,
  },
  progressPercent: {
    position: 'absolute',
    left: 8,
    top: -1,
    color: '#ffffff',
    fontFamily: typography.poppins.semibold,
    fontSize: 10,
  },
  progressTargetText: {
    position: 'absolute',
    right: 8,
    top: -1,
    color: '#0A8D6F',
    fontFamily: typography.poppins.semibold,
    fontSize: 10,
  },
  progressText: {
    marginTop: 6,
    color: '#4F6B63',
    fontFamily: typography.poppins.medium,
    fontSize: 12,
  },
  monthHeaderRow: {
    marginTop: 8,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D9F3E8',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    minHeight: 30,
    borderRadius: 10,
    backgroundColor: '#E8F5F1',
  },
  editBtnText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 12,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    minHeight: 30,
    borderRadius: 10,
    backgroundColor: '#FCE8E8',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontFamily: typography.poppins.medium,
    fontSize: 12,
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
    backgroundColor: '#E6F5EC',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 10,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionCenter: {
    flex: 1,
  },
  transactionTitle: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  transactionTime: {
    color: '#0E62D0',
    fontFamily: typography.poppins.medium,
    fontSize: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  transactionNote: {
    color: '#4F6B63',
    fontFamily: typography.poppins.medium,
    fontSize: 12,
  },
  transactionAmount: {
    fontFamily: typography.poppins.semibold,
    fontSize: 14,
    color: '#2A3A35',
  },
  transactionKindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  transactionKindText: {
    fontFamily: typography.poppins.medium,
    fontSize: 11,
  },
  amountIn: {
    color: '#0B8D72',
  },
  amountOut: {
    color: '#DC2626',
  },
  addButton: {
    alignSelf: 'center',
    marginTop: 14,
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  addButtonText: {
    color: '#0C6657',
    fontFamily: typography.poppins.semibold,
    fontSize: 15,
  },
  fixedBottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#DFF7E2',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 10,
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
  noteInput: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  formFieldBlock: {
    gap: 4,
  },
  formLabel: {
    color: '#3A6357',
    fontFamily: typography.poppins.medium,
    fontSize: 12,
    marginTop: 2,
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
  formKindRow: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 8,
  },
  kindChip: {
    flex: 1,
    minHeight: 34,
    borderRadius: 10,
    backgroundColor: '#E8F5F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindChipActive: {
    backgroundColor: colors.primary,
  },
  kindChipText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 12,
  },
  kindChipTextActive: {
    color: colors.white,
  },
  iconOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
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
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: {
    color: '#4F6B63',
    fontFamily: typography.poppins.medium,
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
