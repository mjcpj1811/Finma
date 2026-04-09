import { useFocusEffect } from '@react-navigation/native';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { savingsApi } from '../../api/savingsApi';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { AppScreenHeader } from '../../components/AppScreenHeader';
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
  iconKey: string;
  endDate: Date;
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
  endDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
};

const defaultTransactionForm = (title = ''): TransactionFormState => ({
  dateIso: new Date().toISOString(),
  amount: '',
  title,
  note: '',
  kind: 'deposit',
});

const formatCurrency = (value: number) => `${Math.round(value).toLocaleString('vi-VN')}`;

const savingIconMeta: Record<string, { name: keyof typeof MaterialIcons.glyphMap; label: string }> = {
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

const transactionIcon: Record<
  SavingTransactionsResponse['items'][number]['kind'],
  { name: keyof typeof MaterialIcons.glyphMap; bg: string; color: string }
> = {
  deposit: { name: 'south-west', bg: '#DBF7EA', color: '#0A8D6F' },
  withdraw: { name: 'north-east', bg: '#FDECEC', color: '#DC2626' },
};

const getSavingIcon = (iconKey?: string) => {
  return savingIconMeta[iconKey ?? 'savings'] ?? savingIconMeta.savings;
};

const getTransactionIcon = (kind: SavingTransactionsResponse['items'][number]['kind']) => {
  return transactionIcon[kind] ?? transactionIcon.deposit;
};

const stripSavingPrefix = (name: string) => name.replace(/^Tiết\s*Kiệm\s*/i, '').trim() || name;

const formatDateText = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('vi-VN', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  });
};

const formatTransactionTime = (item: any) => {
  if (!item.dateIso) return item.timeLabel;
  const date = new Date(item.dateIso);
  if (isNaN(date.getTime())) return item.timeLabel;

  const timePart = item.timeLabel.split(' - ')[0] || '';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString();

  return `${timePart} - ${day} Tháng ${month}`;
};

export const SavingsScreen = ({ navigation, route }: Props) => {
  const [viewMode, setViewMode] = useState<ViewMode>(route.params?.savingId ? 'detail' : 'overview');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<SavingsDashboard | null>(null);
  const [selectedSavingId, setSelectedSavingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [detailLoading, setDetailLoading] = useState(true);
  const [detail, setDetail] = useState<SavingTransactionsResponse | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [editingItem, setEditingItem] = useState<SavingItem | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [draftEndDate, setDraftEndDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [transactionForm, setTransactionForm] = useState<TransactionFormState>(defaultTransactionForm());
  const [showTransactionDatePicker, setShowTransactionDatePicker] = useState(false);
  const [draftTransactionDate, setDraftTransactionDate] = useState(new Date());

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return dashboard.items.filter((item) => {
      // tính mục tiêu đến hạn
      if (item.daysRemaining !== undefined && item.daysRemaining !== null) {
        return item.daysRemaining === 1;
      }

      // Nếu không có, tự tính toán dựa trên endDate
      if (item.endDate) {
        const end = new Date(item.endDate);
        end.setHours(0, 0, 0, 0);
        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        return diffDays === 1;
      }

      return false;
    }).length;
  }, [dashboard]);

  const monthOptions = useMemo(() => {
    if (!detail) return [];
    return Array.from(new Set(detail.items.map((item) => item.monthLabel)));
  }, [detail]);

  useEffect(() => {
    if (!selectedMonth && monthOptions.length > 0) {
      setSelectedMonth(monthOptions[0]);
    }
  }, [monthOptions, selectedMonth]);

  const visibleItems = useMemo(() => {
    if (!detail) return [];
    
    const filtered = selectedMonth
      ? detail.items.filter((item) => item.monthLabel === selectedMonth)
      : detail.items;

    // Sắp xếp giảm dần theo ngày (mới nhất lên đầu)
    return [...filtered].sort((a, b) => {
      const dateA = a.dateIso || '';
      const dateB = b.dateIso || '';
      return dateB.localeCompare(dateA);
    });
  }, [detail, selectedMonth]);

  const loadDashboard = async (preferredId?: string | null) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await savingsApi.getDashboard();
      setDashboard(response);

      const nextSelected =
        (preferredId && response.items.some((item) => item.id === preferredId) && preferredId) ||
        (selectedSavingId && response.items.some((item) => item.id === selectedSavingId) && selectedSavingId) ||
        response.items[0]?.id ||
        null;

      setSelectedSavingId(nextSelected);
    } catch (error) {
      setDashboard(null);
      setSelectedSavingId(null);
      const message = error instanceof Error ? error.message : 'Không thể tải mục tiêu tiết kiệm.';
      setErrorMessage(message);
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
      setErrorMessage(null);
      try {
        const response = await savingsApi.getSavingTransactions(selectedSavingId);
        setDetail(response);
      } catch (error) {
        setDetail(null);
        const message = error instanceof Error ? error.message : 'Không thể tải giao dịch tiết kiệm.';
        setErrorMessage(message);
      } finally {
        setDetailLoading(false);
      }
    };

    void loadDetail();
  }, [selectedSavingId]);

  // Refresh data when screen focus (e.g. back from detail)
  useFocusEffect(
    useCallback(() => {
      loadDashboard(selectedSavingId);
      if (selectedSavingId) {
        // detail's useEffect will handle the detail load since it depends on selectedSavingId
        // but we might want to force a reload of detail too if selectedSavingId hasn't changed
        const loadDetail = async () => {
          setDetailLoading(true);
          try {
            const response = await savingsApi.getSavingTransactions(selectedSavingId);
            setDetail(response);
          } catch (error) {
            console.error('Failed to reload detail on focus:', error);
          } finally {
            setDetailLoading(false);
          }
        };
        loadDetail();
      }
    }, [selectedSavingId])
  );

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
      endDate: item.endDate ? new Date(item.endDate) : defaultForm.endDate,
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

    const today = new Date();
    const defaultStartDate = (editingItem?.startDate || today.toISOString().split('T')[0]);
    const nextEndDate = form.endDate.toISOString().split('T')[0];

    const payload: UpsertSavingPayload = {
      name: form.name.trim(),
      targetAmount,
      currentAmount,
      iconKey: form.iconKey,
      startDate: defaultStartDate,
      endDate: nextEndDate,
    };

    setSavingAction(true);
    try {
      if (editingItem) {
        await savingsApi.updateSaving(editingItem.id, payload);
        await loadDashboard(editingItem.id);
        if (selectedSavingId === editingItem.id) {
          const detailRes = await savingsApi.getSavingTransactions(editingItem.id);
          setDetail(detailRes);
        }
      } else {
        const response = await savingsApi.createSaving(payload);
        await loadDashboard(response.savingId ?? null);
      }

      setShowModal(false);
      setEditingItem(null);
      setForm(defaultForm);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu mục tiêu tiết kiệm.');
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

  const openEndDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: form.endDate,
        mode: 'date',
        is24Hour: true,
        onChange: (event, nextDate) => {
          if (event.type === 'set' && nextDate) {
            setForm((prev) => ({ ...prev, endDate: nextDate }));
          }
        },
      });
      return;
    }

    setDraftEndDate(form.endDate);
    setShowEndDatePicker(true);
  };

  const openTransactionDatePicker = () => {
    const currentDate = new Date(transactionForm.dateIso);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: currentDate,
        mode: 'date',
        is24Hour: true,
        onChange: (event, nextDate) => {
          if (event.type === 'set' && nextDate) {
            setTransactionForm((prev) => ({
              ...prev,
              dateIso: nextDate.toISOString().split('T')[0],
            }));
          }
        },
      });
      return;
    }

    setDraftTransactionDate(currentDate);
    setShowTransactionDatePicker(true);
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
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể lưu khoản tiết kiệm.');
    } finally {
      setSavingAction(false);
    }
  };

  const screenTitle =
    viewMode === 'overview' ? 'Tiết Kiệm' : viewMode === 'form' ? 'Thêm Mới' : stripSavingPrefix(selectedSaving?.name ?? 'Tiết Kiệm');

  const unreadNotifications = detail?.overview.unreadNotifications ?? dashboard?.overview.unreadNotifications ?? 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải tiết kiệm...</Text>
        </View>
        <ScreenBottomNavigation activeTab="layers" />
      </SafeAreaView>
    );
  }

  if (!dashboard) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <Text style={styles.loaderText}>{errorMessage ?? 'Không có dữ liệu tiết kiệm.'}</Text>
          <Pressable style={styles.addTransactionButton} onPress={() => void loadDashboard()}>
            <Text style={styles.addTransactionButtonText}>Thử lại</Text>
          </Pressable>
        </View>
        <ScreenBottomNavigation activeTab="layers" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title={screenTitle}
        onPressBack={onBack}
        onPressNotification={() => navigation.navigate('Notifications')}
        showNotificationBadge={unreadNotifications > 0}
      />

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
                  const icon = getSavingIcon(item.iconKey);
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

              <Pressable style={styles.addTransactionButton} onPress={openCreateModal}>
                <Text style={styles.addTransactionButtonText}>Thêm mục tiêu</Text>
              </Pressable>
            </ScrollView>
          </View>
        </>
      ) : null}

      {viewMode === 'detail' ? (
        <>
          {detail && !detailLoading ? (
            <View style={styles.savingActionsRow}>
              <Pressable style={styles.editSavingChip} onPress={() => openEditModal(detail.saving)}>
                <MaterialIcons name="edit" size={15} color="#2563EB" />
                <Text style={styles.editSavingChipText}>Sửa quỹ</Text>
              </Pressable>

              <Pressable style={styles.deleteSavingChip} onPress={() => onDelete(detail.saving)}>
                <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
                <Text style={styles.deleteSavingChipText}>Xóa quỹ</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.mainPanel}>
            {detailLoading ? (
              <View style={styles.emptyWrap}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.emptyText}>Đang tải giao dịch tiết kiệm...</Text>
              </View>
            ) : !detail ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>{errorMessage ?? 'Không tìm thấy giao dịch tiết kiệm.'}</Text>
                <Pressable style={styles.addTransactionButton} onPress={() => void loadDashboard(selectedSavingId)}>
                  <Text style={styles.addTransactionButtonText}>Tải lại</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
                <View style={styles.detailCard}>
                  <View style={styles.detailLeft}>
                    <View style={styles.statLabelRow}>
                      <View style={styles.statIconBox}>
                        <MaterialIcons name="north-west" size={14} color={colors.text} />
                      </View>
                      <Text style={styles.statLabel}>Mục Tiêu</Text>
                    </View>
                    <Text style={styles.statValue}>{formatCurrency(detail.overview.target)}</Text>

                    <View style={[styles.statLabelRow, { marginTop: 12 }]}>
                      <View style={[styles.statIconBox, { borderColor: '#00D09E' }]}>
                        <MaterialIcons name="north-east" size={14} color="#00D09E" />
                      </View>
                      <Text style={styles.statLabel}>Đã Được</Text>
                    </View>
                    <Text style={[styles.statValue, { color: '#00D09E' }]}>{formatCurrency(detail.overview.saved)}</Text>
                  </View>

                  <View style={styles.detailRight}>
                    <View style={styles.selectedIconWrap}>
                      <MaterialIcons name={getSavingIcon(detail.saving.iconKey).name} size={34} color={colors.white} />
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

                <View style={styles.transactionList}>
                  <View style={styles.filterWrapper}>
                    <Text style={styles.monthTitle}>{selectedMonth || 'Tháng'}</Text>
                    <Pressable style={styles.filterButton} onPress={() => setShowMonthPicker(true)}>
                      <MaterialIcons name="calendar-today" size={20} color={colors.white} />
                    </Pressable>
                  </View>

                  {visibleItems.length === 0 ? (
                    <Text style={styles.emptyText}>Chưa có giao dịch cho tiết kiệm này.</Text>
                  ) : (
                    visibleItems.map((item, index) => {
                      const icon = getTransactionIcon(item.kind);
                      const isLast = index === visibleItems.length - 1;
                      return (
                        <Pressable 
                          key={item.id} 
                          style={[styles.transactionCard, !isLast && styles.transactionCardBorder]}
                          onPress={() => navigation.navigate('SavingTransactionDetail', { 
                            transactionId: item.id,
                            savingId: detail.saving.id
                          })}
                        >
                          <View style={[styles.transactionIcon, { backgroundColor: '#4D9EFF' }]}>
                            <MaterialIcons name={getSavingIcon(detail.saving.iconKey).name} size={22} color={colors.white} />
                          </View>
                          <View style={styles.transactionText}>
                            <Text style={styles.transactionTitle}>{item.title}</Text>
                            <Text style={styles.transactionTime}>{formatTransactionTime(item)}</Text>
                          </View>
                          <Text style={styles.transactionAmount}>
                            {formatCurrency(Math.abs(item.amount))}
                          </Text>
                        </Pressable>
                      );
                    })
                  )}
                </View>

                <Pressable style={styles.addTransactionButton} onPress={openTransactionForm}>
                  <Text style={styles.addTransactionButtonText}>Thêm khoản tiết kiệm</Text>
                </Pressable>

                <Modal
                  visible={showMonthPicker}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowMonthPicker(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.monthPickerCard}>
                      <Text style={styles.monthPickerTitle}>Chọn tháng</Text>
                      {monthOptions.map((month) => (
                        <Pressable
                          key={month}
                          style={styles.monthOption}
                          onPress={() => {
                            setSelectedMonth(month);
                            setShowMonthPicker(false);
                          }}
                        >
                          <Text style={[styles.monthOptionText, selectedMonth === month && styles.monthOptionTextActive]}>
                            {month}
                          </Text>
                        </Pressable>
                      ))}
                      <Pressable style={styles.monthPickerClose} onPress={() => setShowMonthPicker(false)}>
                        <Text style={styles.monthPickerCloseText}>Đóng</Text>
                      </Pressable>
                    </View>
                  </View>
                </Modal>
              </ScrollView>
            )}
          </View>
        </>
      ) : null}

      {viewMode === 'form' ? (
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.mainPanel}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.formContent}
            >
              <View style={styles.formFieldBlock}>
                <Text style={styles.formLabel}>Ngày giao dịch</Text>
                <Pressable style={styles.readonlyInput} onPress={openTransactionDatePicker}>
                  <Text style={styles.readonlyText}>{formatDateText(transactionForm.dateIso)}</Text>
                  <MaterialIcons name="event" size={18} color={colors.primary} />
                </Pressable>
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

              <Pressable style={styles.addTransactionButton} onPress={onSaveTransaction} disabled={savingAction}>
                <Text style={styles.addTransactionButtonText}>{savingAction ? 'Đang lưu...' : 'Lưu'}</Text>
              </Pressable>

              {Platform.OS === 'ios' && showTransactionDatePicker ? (
                <View style={[StyleSheet.absoluteFill, styles.dateModalOverlay]}>
                  <View style={styles.dateModalCard}>
                    <DateTimePicker
                      value={draftTransactionDate}
                      mode="date"
                      display="spinner"
                      locale="vi-VN"
                      onChange={(event, nextDate) => {
                        if (nextDate) {
                          setDraftTransactionDate(nextDate);
                        }
                      }}
                    />

                    <View style={styles.dateModalActions}>
                      <Pressable style={styles.dateCancelButton} onPress={() => setShowTransactionDatePicker(false)}>
                        <Text style={styles.dateCancelText}>Hủy</Text>
                      </Pressable>

                      <Pressable
                        style={styles.dateDoneButton}
                        onPress={() => {
                          setTransactionForm((prev) => ({
                            ...prev,
                            dateIso: draftTransactionDate.toISOString().split('T')[0],
                          }));
                          setShowTransactionDatePicker(false);
                        }}
                      >
                        <Text style={styles.dateDoneText}>Chọn</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      ) : null}

      <ScreenBottomNavigation activeTab="layers" />

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

            <Text style={styles.modalLabel}>Ngày kết thúc</Text>
            <Pressable style={styles.readonlyInput} onPress={openEndDatePicker}>
              <Text style={styles.readonlyText}>{formatDateText(form.endDate.toISOString())}</Text>
              <MaterialIcons name="event" size={18} color={colors.primary} />
            </Pressable>

            <Text style={styles.modalLabel}>Biểu tượng</Text>
            <View style={styles.iconGridWrapper}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.iconGrid}
              >
                {Object.keys(savingIconMeta).map((iconKey) => {
                  const selected = form.iconKey === iconKey;
                  return (
                    <Pressable
                      key={iconKey}
                      style={[styles.iconOption, selected && styles.iconOptionActive]}
                      onPress={() => setForm((prev) => ({ ...prev, iconKey }))}
                    >
                      <MaterialIcons
                        name={savingIconMeta[iconKey].name}
                        size={22}
                        color={selected ? colors.white : colors.text}
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
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

          {Platform.OS === 'ios' && showEndDatePicker ? (
            <View style={[StyleSheet.absoluteFill, styles.dateModalOverlay]}>
              <View style={styles.dateModalCard}>
                <DateTimePicker
                  value={draftEndDate}
                  mode="date"
                  display="spinner"
                  locale="vi-VN"
                  onChange={(event, nextDate) => {
                    if (nextDate) {
                      setDraftEndDate(nextDate);
                    }
                  }}
                />

                <View style={styles.dateModalActions}>
                  <Pressable style={styles.dateCancelButton} onPress={() => setShowEndDatePicker(false)}>
                    <Text style={styles.dateCancelText}>Hủy</Text>
                  </Pressable>

                  <Pressable
                    style={styles.dateDoneButton}
                    onPress={() => {
                      setForm((prev) => ({ ...prev, endDate: draftEndDate }));
                      setShowEndDatePicker(false);
                    }}
                  >
                    <Text style={styles.dateDoneText}>Chọn</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}
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
  savingActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 6,
  },
  editSavingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8EEFF',
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editSavingChipText: {
    color: '#2563EB',
    fontFamily: typography.poppins.medium,
    fontSize: 11,
  },
  deleteSavingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FCE8E8',
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deleteSavingChipText: {
    color: '#EF4444',
    fontFamily: typography.poppins.medium,
    fontSize: 11,
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
    paddingBottom: 180,
    gap: 8,
  },
  keyboardAvoiding: {
    flex: 1,
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
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  detailLeft: {
    flex: 1,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  statValue: {
    color: colors.text,
    fontFamily: typography.poppins.bold,
    fontSize: 26,
    lineHeight: 32,
    marginLeft: 30,
  },
  detailRight: {
    alignItems: 'center',
    gap: 10,
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
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  transactionCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transactionText: {
    flex: 1,
  },
  addTransactionButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addTransactionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: typography.poppins.semibold,
  },
  monthPickerCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
  },
  monthPickerTitle: {
    color: colors.text,
    fontSize: 16,
    fontFamily: typography.poppins.semibold,
    marginBottom: 16,
  },
  monthOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  monthOptionText: {
    color: colors.text,
    fontSize: 15,
    fontFamily: typography.poppins.regular,
  },
  monthOptionTextActive: {
    color: colors.primary,
    fontFamily: typography.poppins.semibold,
  },
  monthPickerClose: {
    marginTop: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  monthPickerCloseText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: typography.poppins.semibold,
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
    width: 50,
    height: 50,
    borderRadius: 18,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
  iconGridWrapper: {
    maxHeight: 210,
    minHeight: 160,
    marginTop: 8,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 0,
  },
  iconOption: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: '#E8F5F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
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
  dateModalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  dateModalCard: {
    width: '100%',
    backgroundColor: '#F1FFF3',
    borderRadius: 16,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  dateModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  dateCancelButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#DFF7E2',
  },
  dateCancelText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 13,
  },
  dateDoneButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dateDoneText: {
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
