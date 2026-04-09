import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { transactionApi } from '../../api/transactionApi';
import { savingsApi } from '../../api/savingsApi';
import { type TransactionDetail } from '../../types/transaction';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'SavingTransactionDetail'>;

const formatCurrency = (value: number) => value.toLocaleString('vi-VN');
const formatDate = (value: string) => new Date(value).toLocaleDateString('vi-VN');

export const SavingTransactionDetailScreen = ({ navigation, route }: Props) => {
  const { transactionId, savingId } = route.params;

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  
  // Edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [editSourceId, setEditSourceId] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [sources, setSources] = useState<Array<{ id: string; label: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; label: string }>>([]);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const [detail, options] = await Promise.all([
        transactionApi.getTransactionDetail(transactionId),
        transactionApi.getFormOptions()
      ]);
      setTransaction(detail);
      setSources(options.sources);
      setCategories(options.categories.filter(c => c.type === 'finance'));
    } catch {
      setTransaction(null);
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useFocusEffect(
    useCallback(() => {
      void loadDetail();
    }, [loadDetail]),
  );

  const onDelete = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Bạn có chắc muốn xóa giao dịch tiết kiệm này?');
      if (!confirmed) return;

      void (async () => {
        setDeleting(true);
        try {
          await savingsApi.deleteSavingTransaction(savingId, transactionId);
          navigation.goBack();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Không thể xóa giao dịch.';
          window.alert(message);
        } finally {
          setDeleting(false);
        }
      })();
      return;
    }

    Alert.alert('Xóa giao dịch', 'Bạn có chắc muốn xóa giao dịch tiết kiệm này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await savingsApi.deleteSavingTransaction(savingId, transactionId);
            navigation.goBack();
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể xóa giao dịch.';
            Alert.alert('Thông báo', message);
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loading || !transaction) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải chi tiết giao dịch...</Text>
        </View>
        <ScreenBottomNavigation activeTab="layers" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title="Chi Tiết Tiết Kiệm"
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
      />

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentWrap}>
          <View style={styles.heroCard}>
            <View style={[styles.heroIconWrap, { backgroundColor: '#4D9EFF' }]}>
              <MaterialIcons name="account-balance-wallet" size={26} color={colors.white} />
            </View>
            <Text style={styles.heroTitle}>Tiền tiết kiệm</Text>
            <Text style={styles.heroAmount}>
              {formatCurrency(transaction.amount)}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngày</Text>
              <Text style={styles.infoValue}>{formatDate(transaction.date)}</Text>
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Quỹ mục tiêu</Text>
                <Text style={styles.infoValue}>{transaction.categoryLabel}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tiêu đề</Text>
              <Text style={styles.infoValue}>{transaction.title}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nguồn tiền</Text>
              <Text style={styles.infoValue}>{transaction.sourceLabel || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ghi chú</Text>
              <Text style={styles.infoValue}>{transaction.note || '-'}</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              style={styles.editButton}
              onPress={() => {
                if (transaction) {
                  setEditAmount(String(transaction.amount));
                  setEditTitle(transaction.title);
                  setEditDate(new Date(transaction.date));
                  setEditSourceId(transaction.sourceId);
                  setEditCategoryId(transaction.categoryId);
                  setShowEditModal(true);
                }
              }}
            >
              <Text style={styles.editText}>Sửa</Text>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={onDelete} disabled={deleting}>
              <Text style={styles.deleteText}>{deleting ? 'Đang xóa...' : 'Xóa'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>

      <ScreenBottomNavigation activeTab="layers" />

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sửa khoản nạp</Text>
              <Pressable onPress={() => setShowEditModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Số tiền</Text>
                <TextInput
                  style={styles.input}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  keyboardType="numeric"
                  placeholder="Nhập số tiền"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Tiêu đề</Text>
                <TextInput
                  style={styles.input}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Ví dụ: Tiền tiết kiệm tháng 10"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Ngày</Text>
                <Pressable
                  style={styles.pickerTrigger}
                  onPress={() => {
                    if (Platform.OS === 'android') {
                      DateTimePickerAndroid.open({
                        value: editDate,
                        onChange: (event, date) => date && setEditDate(date),
                        mode: 'date',
                      });
                    } else {
                      setShowDatePicker(true);
                    }
                  }}
                >
                  <Text style={styles.pickerText}>{editDate.toLocaleDateString('vi-VN')}</Text>
                  <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
                </Pressable>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Danh mục</Text>
                <Pressable
                  style={styles.pickerTrigger}
                  onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                >
                  <Text style={styles.pickerText}>
                    {categories.find(c => c.id === editCategoryId)?.label || 'Chọn danh mục'}
                  </Text>
                  <MaterialIcons name="expand-more" size={20} color={colors.primary} />
                </Pressable>
                {showCategoryPicker && (
                  <View style={styles.dropdown}>
                    {categories.map(c => (
                      <Pressable
                        key={c.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setEditCategoryId(c.id);
                          setShowCategoryPicker(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{c.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Nguồn tiền</Text>
                <Pressable
                  style={styles.pickerTrigger}
                  onPress={() => setShowSourcePicker(!showSourcePicker)}
                >
                  <Text style={styles.pickerText}>
                    {sources.find(s => s.id === editSourceId)?.label || 'Chọn nguồn tiền'}
                  </Text>
                  <MaterialIcons name="expand-more" size={20} color={colors.primary} />
                </Pressable>
                {showSourcePicker && (
                  <View style={styles.dropdown}>
                    {sources.map(s => (
                      <Pressable
                        key={s.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setEditSourceId(s.id);
                          setShowSourcePicker(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{s.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={async () => {
                   if (!transaction) return;
                   setSaving(true);
                   try {
                     await transactionApi.updateTransaction(transactionId, {
                       amount: Number(editAmount),
                       title: editTitle,
                       date: editDate.toISOString(),
                       sourceId: editSourceId,
                       type: 'saving',
                       categoryId: editCategoryId
                     });
                     setShowEditModal(false);
                     void loadDetail();
                   } catch (error) {
                     const message = error instanceof Error ? error.message : 'Lỗi cập nhật';
                     Alert.alert('Lỗi', message);
                   } finally {
                     setSaving(false);
                   }
                }}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>{saving ? 'Đang lưu...' : 'Cập nhật'}</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {Platform.OS === 'ios' && showDatePicker && (
        <Modal transparent visible={showDatePicker}>
           <View style={styles.iosDateOverlay}>
              <View style={styles.iosDateContainer}>
                 <DateTimePicker
                   value={editDate}
                   mode="date"
                   display="spinner"
                   onChange={(event, date) => date && setEditDate(date)}
                 />
                 <Pressable style={styles.iosDateDone} onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.iosDateDoneText}>Xong</Text>
                 </Pressable>
              </View>
           </View>
        </Modal>
      )}
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
  mainPanel: {
    flex: 1,
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    paddingHorizontal: 18,
    paddingTop: 20,
    marginTop: 8,
  },
  contentWrap: {
    paddingBottom: 110,
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#DFF7E2',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 18,
  },
  heroAmount: {
    color: colors.blueDark,
    fontFamily: typography.poppins.bold,
    fontSize: 24,
  },
  infoCard: {
    backgroundColor: '#DFF7E2',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  infoLabel: {
    color: '#55716A',
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  editButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editText: {
    color: colors.white,
    fontFamily: typography.poppins.semibold,
    fontSize: 15,
  },
  deleteButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F06D6D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: colors.white,
    fontFamily: typography.poppins.semibold,
    fontSize: 15,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: typography.poppins.semibold,
    color: colors.text,
  },
  modalContent: {
    padding: 20,
    gap: 20,
  },
  formField: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: typography.poppins.medium,
    color: '#55716A',
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: typography.poppins.medium,
    borderWidth: 1,
    borderColor: '#D0E8D5',
  },
  pickerTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D0E8D5',
  },
  pickerText: {
    fontSize: 16,
    fontFamily: typography.poppins.medium,
    color: colors.text,
  },
  dropdown: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#D0E8D5',
    maxHeight: 150,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 14,
    fontFamily: typography.poppins.medium,
    color: colors.text,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: typography.poppins.semibold,
  },
  disabledButton: {
    opacity: 0.6,
  },
  iosDateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  iosDateContainer: {
    backgroundColor: colors.white,
    paddingBottom: 20,
  },
  iosDateDone: {
    alignItems: 'center',
    padding: 15,
  },
  iosDateDoneText: {
    color: colors.primary,
    fontSize: 18,
    fontFamily: typography.poppins.semibold,
  },
});
