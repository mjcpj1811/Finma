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
import { recurringApi } from '../../api/recurringApi';
import { transactionApi } from '../../api/transactionApi';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { type TransactionFormOptions } from '../../types/transaction';
import { type RecurringCycle, type RecurringDashboard, type RecurringRuleItem, type UpsertRecurringRulePayload } from '../../types/recurring';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Recurring'>;

type FormState = {
  cycle: RecurringCycle;
  title: string;
  amount: string;
  dayOfMonth: string;
  dayOfWeek: string;
  categoryId: string;
  sourceId: string;
  startDate: string;
  note: string;
};

const defaultForm: FormState = {
  cycle: 'monthly',
  title: '',
  amount: '',
  dayOfMonth: '',
  dayOfWeek: '',
  categoryId: '',
  sourceId: '',
  startDate: '',
  note: '',
};

const formatCurrency = (value: number) => `${Math.round(value).toLocaleString('vi-VN')}`;

const cycleOptions: Array<{ value: RecurringCycle; label: string }> = [
  { value: 'daily', label: 'Hàng ngày' },
  { value: 'weekly', label: 'Hàng tuần' },
  { value: 'monthly', label: 'Hàng tháng' },
  { value: 'yearly', label: 'Hàng năm' },
];

const weekdayOptions = [
  { value: '0', label: 'Chủ Nhật' },
  { value: '1', label: 'Thứ Hai' },
  { value: '2', label: 'Thứ Ba' },
  { value: '3', label: 'Thứ Tư' },
  { value: '4', label: 'Thứ Năm' },
  { value: '5', label: 'Thứ Sáu' },
  { value: '6', label: 'Thứ Bảy' },
];

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: `Tháng ${index + 1}`,
}));

const toDateOnly = (year: number, month: number, day: number) => {
  const monthText = String(month).padStart(2, '0');
  const dayText = String(day).padStart(2, '0');
  return `${year}-${monthText}-${dayText}`;
};

const getDateParts = (value?: string) => {
  const matched = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matched) {
    return {
      year: Number(matched[1]),
      month: Number(matched[2]),
      day: Number(matched[3]),
    };
  }

  const parsed = value ? new Date(value) : new Date();
  if (!Number.isNaN(parsed.getTime())) {
    return {
      year: parsed.getFullYear(),
      month: parsed.getMonth() + 1,
      day: parsed.getDate(),
    };
  }

  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
};

const getMaxDayOfMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

const ToggleSwitch = ({
  value,
  onPress,
  disabled,
  loading,
}: {
  value: boolean;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) => {
  return (
    <Pressable
      style={[styles.toggleTrack, value && styles.toggleTrackActive, disabled && styles.toggleTrackDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.white} />
      ) : (
        <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
      )}
    </Pressable>
  );
};

export const RecurringTransactionsScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [dashboard, setDashboard] = useState<RecurringDashboard | null>(null);
  const [options, setOptions] = useState<TransactionFormOptions>({ categories: [], sources: [] });
  const [showModal, setShowModal] = useState(false);
  const [showCycleList, setShowCycleList] = useState(false);
  const [showWeekdayList, setShowWeekdayList] = useState(false);
  const [showYearMonthList, setShowYearMonthList] = useState(false);
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [showSourceList, setShowSourceList] = useState(false);
  const [togglingRuleId, setTogglingRuleId] = useState<string | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [response, formOptions] = await Promise.all([
        recurringApi.getDashboard(),
        transactionApi.getFormOptions(),
      ]);
      const expenseCategories = formOptions.categories.filter((item) => item.type === 'expense');

      setOptions({
        categories: expenseCategories,
        sources: formOptions.sources,
      });
      setDashboard(response);
      setForm((prev) => ({
        ...prev,
        categoryId: prev.categoryId || expenseCategories[0]?.id || '',
        sourceId: prev.sourceId || formOptions.sources[0]?.id || '',
      }));
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const onDeleteRule = (item: RecurringRuleItem) => {
    Alert.alert('Xác nhận xóa định kỳ', 'Bạn có chắc muốn xóa giao dịch định kỳ này không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await recurringApi.deleteRecurringRule(item.id);
            await loadData();
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể xóa giao dịch định kỳ.';
            Alert.alert('Xóa thất bại', message);
          }
        },
      },
    ]);
  };

  const onToggleRule = async (item: RecurringRuleItem) => {
    if (togglingRuleId) {
      return;
    }

    setTogglingRuleId(item.id);
    setDashboard((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        items: prev.items.map((rule) =>
          rule.id === item.id ? { ...rule, isActive: !rule.isActive } : rule,
        ),
      };
    });

    try {
      await recurringApi.toggleRecurringRule(item.id, !item.isActive);
      await loadData();
    } catch (error) {
      setDashboard((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          items: prev.items.map((rule) =>
            rule.id === item.id ? { ...rule, isActive: item.isActive } : rule,
          ),
        };
      });
      const message = error instanceof Error ? error.message : 'Không thể cập nhật trạng thái giao dịch định kỳ.';
      Alert.alert('Cập nhật thất bại', message);
    } finally {
      setTogglingRuleId(null);
    }
  };

  const onOpenAddModal = () => {
    setEditingRuleId(null);
    setShowCycleList(false);
    setShowWeekdayList(false);
    setShowYearMonthList(false);
    setShowCategoryList(false);
    setShowSourceList(false);
    setForm({
      ...defaultForm,
      cycle: 'monthly',
      categoryId: options.categories[0]?.id ?? '',
      sourceId: options.sources[0]?.id ?? '',
      startDate: new Date().toISOString(),
      note: 'Hàng tháng',
    });
    setShowModal(true);
  };

  const onOpenEditModal = async (item: RecurringRuleItem) => {
    setModalLoading(true);
    try {
      const detail = await recurringApi.getRecurringRuleById(item.id);
      setEditingRuleId(item.id);
      setForm({
        cycle: detail.cycle,
        title: detail.title,
        amount: String(Math.round(Math.abs(detail.amount))),
        dayOfMonth: detail.dayOfMonth ? String(detail.dayOfMonth) : '',
        dayOfWeek: detail.dayOfWeek != null ? String(detail.dayOfWeek) : '',
        categoryId: detail.categoryId ?? options.categories[0]?.id ?? '',
        sourceId: detail.sourceId ?? options.sources[0]?.id ?? '',
        startDate: detail.startDate,
        note: detail.note ?? '',
      });
      setShowCycleList(false);
      setShowWeekdayList(false);
      setShowYearMonthList(false);
      setShowCategoryList(false);
      setShowSourceList(false);
      setShowModal(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải dữ liệu giao dịch định kỳ.';
      Alert.alert('Không thể sửa', message);
    } finally {
      setModalLoading(false);
    }
  };

  const onSubmit = async () => {
    const amount = Number(form.amount.replace(/[^\d]/g, ''));
    const dayOfMonth = Number(form.dayOfMonth.replace(/[^\d]/g, ''));
    const dayOfWeek = Number(form.dayOfWeek.replace(/[^\d]/g, ''));
    const dateParts = getDateParts(form.startDate);

    if (!form.title.trim() || !amount || !form.categoryId || !form.sourceId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ tên, số tiền, danh mục và nguồn tiền.');
      return;
    }

    if (form.cycle === 'monthly' && (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31)) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập ngày hợp lệ (1-31).');
      return;
    }

    if (form.cycle === 'yearly') {
      const maxDay = getMaxDayOfMonth(dateParts.year, dateParts.month);
      if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > maxDay) {
        Alert.alert('Thiếu thông tin', `Vui lòng nhập ngày hợp lệ (1-${maxDay}) cho tháng đã chọn.`);
        return;
      }
    }

    if (form.cycle === 'weekly' && (Number.isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6)) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn thứ trong tuần hợp lệ.');
      return;
    }

    let normalizedStartDate = form.startDate || new Date().toISOString();
    if (form.cycle === 'yearly') {
      normalizedStartDate = toDateOnly(dateParts.year, dateParts.month, dayOfMonth);
    }

    const payload: UpsertRecurringRulePayload = {
      title: form.title.trim(),
      amount,
      cycle: form.cycle,
      dayOfMonth: form.cycle === 'monthly' || form.cycle === 'yearly' ? dayOfMonth : undefined,
      dayOfWeek: form.cycle === 'weekly' ? dayOfWeek : undefined,
      startDate: normalizedStartDate,
      categoryId: form.categoryId,
      sourceId: form.sourceId,
      note: form.note.trim() || 'Hàng tháng',
    };

    setSaving(true);
    try {
      if (editingRuleId) {
        await recurringApi.updateRecurringRule(editingRuleId, payload);
      } else {
        await recurringApi.createRecurringRule(payload);
      }
      setShowModal(false);
      setEditingRuleId(null);
      setForm(defaultForm);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu giao dịch định kỳ.';
      Alert.alert('Lưu thất bại', message);
    } finally {
      setSaving(false);
    }
  };

  const selectedCategoryLabel = useMemo(
    () => options.categories.find((item) => item.id === form.categoryId)?.label ?? 'Chọn danh mục',
    [form.categoryId, options.categories],
  );

  const selectedSourceLabel = useMemo(
    () => options.sources.find((item) => item.id === form.sourceId)?.label ?? 'Chọn nguồn tiền',
    [form.sourceId, options.sources],
  );

  const selectedCycleLabel = useMemo(
    () => cycleOptions.find((item) => item.value === form.cycle)?.label ?? 'Hàng tháng',
    [form.cycle],
  );

  const selectedWeekdayLabel = useMemo(
    () => weekdayOptions.find((item) => item.value === form.dayOfWeek)?.label ?? 'Chọn thứ trong tuần',
    [form.dayOfWeek],
  );

  const selectedYearMonthValue = useMemo(
    () => String(getDateParts(form.startDate).month),
    [form.startDate],
  );

  const selectedYearMonthLabel = useMemo(
    () => monthOptions.find((item) => item.value === selectedYearMonthValue)?.label ?? 'Chọn tháng thực hiện',
    [selectedYearMonthValue],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải giao dịch định kỳ...</Text>
        </View>
        <ScreenBottomNavigation activeTab="layers" />
      </SafeAreaView>
    );
  }

  if (!dashboard) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <Text style={styles.loaderText}>Không tải được dữ liệu giao dịch định kỳ.</Text>
          <Pressable style={styles.retryButton} onPress={() => void loadData()}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </Pressable>
        </View>
        <ScreenBottomNavigation activeTab="layers" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title="Định Kỳ"
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
        showNotificationBadge={dashboard.overview.unreadNotifications > 0}
      />

      <View style={styles.summaryRow}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Số Giao Dịch Định Kỳ</Text>
          <Text style={styles.summaryValue}>{dashboard.overview.activeCount}</Text>
        </View>

        <View style={styles.divider} />

        <View style={[styles.summaryCol, styles.summaryColRight]}>
          <Text style={styles.summaryLabel}>Chi Tiêu Hàng Tháng</Text>
          <Text style={[styles.summaryValue, styles.expenseValue]}>{formatCurrency(dashboard.overview.monthlyExpense)}</Text>
        </View>
      </View>

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          {dashboard.items.map((item) => (
            <View key={item.id} style={styles.ruleCard}>
              <View style={styles.ruleIconWrap}>
                <MaterialIcons name="sell" size={18} color={colors.white} />
              </View>

              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>{item.title}</Text>
                <Text style={styles.ruleMetaText}>
                  {item.executionLabel?.trim() || item.frequencyLabel?.trim() || 'Chưa có lịch thực hiện'}
                </Text>
              </View>

              <View style={styles.ruleRight}>
                <Text style={styles.ruleAmountTop}>{formatCurrency(item.amount)}</Text>
                <View style={styles.ruleActionRow}>
                  <Pressable style={styles.editBtn} onPress={() => void onOpenEditModal(item)} disabled={modalLoading}>
                    <MaterialIcons name="edit" size={13} color={colors.text} />
                  </Pressable>
                  <Pressable style={styles.deleteBtn} onPress={() => onDeleteRule(item)}>
                    <MaterialIcons name="delete-outline" size={14} color="#EF4444" />
                  </Pressable>
                  <ToggleSwitch
                    value={item.isActive}
                    onPress={() => void onToggleRule(item)}
                    disabled={togglingRuleId === item.id}
                    loading={togglingRuleId === item.id}
                  />
                </View>
              </View>
            </View>
          ))}

          <Pressable style={styles.addButton} onPress={onOpenAddModal}>
            <Text style={styles.addButtonText}>Thêm Mới</Text>
          </Pressable>
        </ScrollView>
      </View>

      <ScreenBottomNavigation activeTab="layers" />

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingRuleId ? 'Cập nhật giao dịch định kỳ' : 'Thêm giao dịch định kỳ'}</Text>

            <Text style={styles.modalLabel}>Chu kỳ</Text>
            <Pressable
              style={styles.selectField}
              onPress={() => {
                setShowCycleList((prev) => !prev);
                setShowWeekdayList(false);
                setShowYearMonthList(false);
                setShowCategoryList(false);
                setShowSourceList(false);
              }}
            >
              <Text style={styles.fieldText}>{selectedCycleLabel}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={18} color={colors.primary} />
            </Pressable>
            {showCycleList ? (
              <View style={styles.dropdownList}>
                {cycleOptions.map((item) => (
                  <Pressable
                    key={item.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setForm((prev) => ({
                        ...prev,
                        cycle: item.value,
                        dayOfMonth: item.value === 'weekly' || item.value === 'daily' ? '' : prev.dayOfMonth,
                        dayOfWeek: item.value === 'weekly' ? prev.dayOfWeek : '',
                        startDate:
                          item.value === 'yearly' && !prev.startDate
                            ? new Date().toISOString()
                            : prev.startDate,
                      }));
                      setShowCycleList(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {form.cycle === 'weekly' ? (
              <>
                <Text style={styles.modalLabel}>Thứ thực hiện</Text>
                <Pressable
                  style={styles.selectField}
                  onPress={() => {
                    setShowWeekdayList((prev) => !prev);
                    setShowCycleList(false);
                    setShowYearMonthList(false);
                    setShowCategoryList(false);
                    setShowSourceList(false);
                  }}
                >
                  <Text style={styles.fieldText}>{selectedWeekdayLabel}</Text>
                  <MaterialIcons name="keyboard-arrow-down" size={18} color={colors.primary} />
                </Pressable>
                {showWeekdayList ? (
                  <View style={styles.dropdownList}>
                    {weekdayOptions.map((item) => (
                      <Pressable
                        key={item.value}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setForm((prev) => ({ ...prev, dayOfWeek: item.value }));
                          setShowWeekdayList(false);
                        }}
                      >
                        <Text style={styles.dropdownText}>{item.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </>
            ) : form.cycle === 'yearly' ? (
              <>
                <Text style={styles.modalLabel}>Tháng thực hiện</Text>
                <Pressable
                  style={styles.selectField}
                  onPress={() => {
                    setShowYearMonthList((prev) => !prev);
                    setShowCycleList(false);
                    setShowWeekdayList(false);
                    setShowCategoryList(false);
                    setShowSourceList(false);
                  }}
                >
                  <Text style={styles.fieldText}>{selectedYearMonthLabel}</Text>
                  <MaterialIcons name="keyboard-arrow-down" size={18} color={colors.primary} />
                </Pressable>
                {showYearMonthList ? (
                  <View style={styles.dropdownList}>
                    {monthOptions.map((item) => (
                      <Pressable
                        key={item.value}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setForm((prev) => {
                            const parts = getDateParts(prev.startDate);
                            const nextMonth = Number(item.value);
                            const typedDay = Number(prev.dayOfMonth.replace(/[^\d]/g, ''));
                            const maxDay = getMaxDayOfMonth(parts.year, nextMonth);
                            const safeDay = typedDay > 0 ? Math.min(typedDay, maxDay) : Math.min(parts.day, maxDay);

                            return {
                              ...prev,
                              startDate: toDateOnly(parts.year, nextMonth, safeDay),
                              dayOfMonth: typedDay > 0 ? String(safeDay) : prev.dayOfMonth,
                            };
                          });
                          setShowYearMonthList(false);
                        }}
                      >
                        <Text style={styles.dropdownText}>{item.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                <Text style={styles.modalLabel}>Ngày thực hiện</Text>
                <TextInput
                  value={form.dayOfMonth}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, dayOfMonth: value }))}
                  placeholder="15"
                  keyboardType="numeric"
                  style={styles.input}
                  placeholderTextColor={colors.textMuted}
                />
              </>
            ) : form.cycle === 'monthly' ? (
              <>
                <Text style={styles.modalLabel}>Ngày thực hiện</Text>
                <TextInput
                  value={form.dayOfMonth}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, dayOfMonth: value }))}
                  placeholder="15"
                  keyboardType="numeric"
                  style={styles.input}
                  placeholderTextColor={colors.textMuted}
                />
              </>
            ) : (
              <>
                <Text style={styles.modalLabel}>Ngày thực hiện</Text>
                <View style={styles.readonlyInput}>
                  <Text style={styles.readonlyText}>Tự động mỗi ngày</Text>
                  <MaterialIcons name="event-repeat" size={18} color={colors.primary} />
                </View>
              </>
            )}

            <Text style={styles.modalLabel}>Danh mục chi tiêu</Text>
            <Pressable
              style={styles.selectField}
              onPress={() => {
                setShowCategoryList((prev) => !prev);
                setShowCycleList(false);
                setShowWeekdayList(false);
                setShowYearMonthList(false);
                setShowSourceList(false);
              }}
            >
              <Text style={styles.fieldText}>{selectedCategoryLabel}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={18} color={colors.primary} />
            </Pressable>
            {showCategoryList ? (
              <View style={styles.dropdownList}>
                {options.categories.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setForm((prev) => ({ ...prev, categoryId: item.id }));
                      setShowCategoryList(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Text style={styles.modalLabel}>Nguồn tiền</Text>
            <Pressable
              style={styles.selectField}
              onPress={() => {
                setShowSourceList((prev) => !prev);
                setShowCycleList(false);
                setShowWeekdayList(false);
                setShowYearMonthList(false);
                setShowCategoryList(false);
              }}
            >
              <Text style={styles.fieldText}>{selectedSourceLabel}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={18} color={colors.primary} />
            </Pressable>
            {showSourceList ? (
              <View style={styles.dropdownList}>
                {options.sources.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setForm((prev) => ({ ...prev, sourceId: item.id }));
                      setShowSourceList(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Text style={styles.modalLabel}>Tiêu đề</Text>
            <TextInput
              value={form.title}
              onChangeText={(value) => setForm((prev) => ({ ...prev, title: value }))}
              placeholder="Gia Hạn Gói Mạng"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.modalLabel}>Số tiền (vnd)</Text>
            <TextInput
              value={form.amount}
              onChangeText={(value) => setForm((prev) => ({ ...prev, amount: value }))}
              placeholder="300000"
              keyboardType="numeric"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.modalLabel}>Mô tả</Text>
            <TextInput
              value={form.note}
              onChangeText={(value) => setForm((prev) => ({ ...prev, note: value }))}
              placeholder="Mô tả"
              style={[styles.input, styles.noteInput]}
              multiline
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalActionRow}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => {
                  setShowModal(false);
                  setEditingRuleId(null);
                  setShowCycleList(false);
                  setShowWeekdayList(false);
                  setShowYearMonthList(false);
                  setShowCategoryList(false);
                  setShowSourceList(false);
                }}
              >
                <Text style={styles.cancelText}>Hủy</Text>
              </Pressable>

              <Pressable style={styles.saveBtn} onPress={onSubmit} disabled={saving || modalLoading}>
                <Text style={styles.saveText}>{saving ? 'Đang lưu...' : editingRuleId ? 'Cập nhật' : 'Lưu'}</Text>
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
    fontSize: 11,
    marginBottom: 4,
  },
  summaryValue: {
    color: colors.white,
    fontFamily: typography.poppins.bold,
    fontSize: 30,
    lineHeight: 34,
  },
  expenseValue: {
    color: '#0E62D0',
    fontSize: 28,
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
  ruleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#DFF7E2',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  ruleIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6AA8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 13,
  },
  ruleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  ruleMetaText: {
    color: '#0E62D0',
    fontFamily: typography.poppins.medium,
    fontSize: 11,
  },
  ruleRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 120,
  },
  ruleAmountTop: {
    color: '#1F2937',
    fontFamily: typography.poppins.semibold,
    fontSize: 12,
  },
  ruleActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  deleteBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FCE8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DFF7E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTrack: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2D2D2D',
    paddingHorizontal: 3,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: '#47E0C7',
  },
  toggleTrackDisabled: {
    opacity: 0.6,
  },
  toggleThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ffffff',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  addButton: {
    alignSelf: 'center',
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    marginTop: 8,
  },
  addButtonText: {
    color: '#0C6657',
    fontFamily: typography.poppins.semibold,
    fontSize: 13,
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
    backgroundColor: '#DFF7E2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4EFE8',
    paddingHorizontal: 12,
    color: colors.text,
    fontFamily: typography.poppins.regular,
    fontSize: 14,
  },
  selectField: {
    minHeight: 42,
    backgroundColor: '#DFF7E2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4EFE8',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldText: {
    color: colors.text,
    fontFamily: typography.poppins.regular,
    fontSize: 14,
  },
  dropdownList: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4EFE8',
    backgroundColor: '#DFF7E2',
  },
  dropdownItem: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  dropdownText: {
    color: colors.text,
    fontFamily: typography.poppins.regular,
    fontSize: 13,
  },
  noteInput: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  readonlyInput: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#DFF7E2',
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
  retryButton: {
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  retryButtonText: {
    color: colors.primary,
    fontFamily: typography.poppins.semibold,
    fontSize: 13,
  },
});
