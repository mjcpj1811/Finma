import { useCallback, useState } from 'react';
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
import { BottomNavBar } from '../../components/BottomNavBar';
import { NotificationBellButton } from '../../components/NotificationBellButton';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { type RecurringDashboard, type RecurringRuleItem, type UpsertRecurringRulePayload } from '../../types/recurring';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Recurring'>;

type FormState = {
  title: string;
  amount: string;
  dayOfMonth: string;
  note: string;
};

const defaultForm: FormState = {
  title: '',
  amount: '',
  dayOfMonth: '',
  note: '',
};

const formatCurrency = (value: number) => `${Math.round(value).toLocaleString('vi-VN')} đ`;

const ToggleSwitch = ({ value, onPress }: { value: boolean; onPress: () => void }) => {
  return (
    <Pressable style={[styles.toggleTrack, value && styles.toggleTrackActive]} onPress={onPress}>
      <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
    </Pressable>
  );
};

export const RecurringTransactionsScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboard, setDashboard] = useState<RecurringDashboard | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await recurringApi.getDashboard();
      setDashboard(response);
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
          await recurringApi.deleteRecurringRule(item.id);
          await loadData();
        },
      },
    ]);
  };

  const onToggleRule = async (item: RecurringRuleItem) => {
    await recurringApi.toggleRecurringRule(item.id, !item.isActive);
    await loadData();
  };

  const onAdd = async () => {
    const amount = Number(form.amount.replace(/[^\d]/g, ''));
    const dayOfMonth = Number(form.dayOfMonth.replace(/[^\d]/g, ''));

    if (!form.title.trim() || !amount || !dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên, số tiền và ngày hợp lệ (1-31).');
      return;
    }

    const payload: UpsertRecurringRulePayload = {
      title: form.title.trim(),
      amount,
      cycle: 'monthly',
      dayOfMonth,
      categoryId: 'other',
      sourceId: 'cash',
      note: form.note.trim() || 'Hàng tháng',
      isActive: true,
    };

    setSaving(true);
    try {
      await recurringApi.createRecurringRule(payload);
      setShowModal(false);
      setForm(defaultForm);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  if (loading || !dashboard) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải giao dịch định kỳ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerRow}>
        <Pressable style={styles.leftSlot} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color={colors.white} />
        </Pressable>

        <Text style={styles.headerTitle}>Định Kỳ</Text>

        <View style={styles.rightSlot}>
          <NotificationBellButton
            size={30}
            onPress={() => navigation.navigate('Notifications')}
            showBadge={dashboard.overview.unreadNotifications > 0}
          />
        </View>
      </View>

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
                <View style={styles.ruleMetaRow}>
                  <Text style={styles.ruleMetaText}>Hàng Tháng</Text>
                  <Text style={styles.ruleMetaText}>Ngày {item.dayOfMonth}</Text>
                  <Text style={styles.ruleMetaAmount}>{formatCurrency(item.amount)}</Text>
                </View>
              </View>

              <View style={styles.ruleActions}>
                <Pressable style={styles.deleteBtn} onPress={() => onDeleteRule(item)}>
                  <MaterialIcons name="delete-outline" size={14} color="#EF4444" />
                </Pressable>
                <ToggleSwitch value={item.isActive} onPress={() => onToggleRule(item)} />
              </View>
            </View>
          ))}

          <Pressable style={styles.addButton} onPress={() => setShowModal(true)}>
            <Text style={styles.addButtonText}>Thêm Mới</Text>
          </Pressable>
        </ScrollView>
      </View>

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
            <Text style={styles.modalTitle}>Thêm Mới</Text>

            <Text style={styles.modalLabel}>Chu kỳ</Text>
            <View style={styles.readonlyInput}>
              <Text style={styles.readonlyText}>Hàng tháng</Text>
              <MaterialIcons name="keyboard-arrow-down" size={18} color={colors.primary} />
            </View>

            <Text style={styles.modalLabel}>Ngày thực hiện</Text>
            <TextInput
              value={form.dayOfMonth}
              onChangeText={(value) => setForm((prev) => ({ ...prev, dayOfMonth: value }))}
              placeholder="15"
              keyboardType="numeric"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
            />

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
              <Pressable style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>Hủy</Text>
              </Pressable>

              <Pressable style={styles.saveBtn} onPress={onAdd} disabled={saving}>
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
  ruleMetaAmount: {
    color: '#1F2937',
    fontFamily: typography.poppins.semibold,
    fontSize: 11,
  },
  ruleActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  deleteBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FCE8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTrack: {
    width: 24,
    height: 14,
    borderRadius: 8,
    backgroundColor: '#2D2D2D',
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: '#47E0C7',
  },
  toggleThumb: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: 10,
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
});
