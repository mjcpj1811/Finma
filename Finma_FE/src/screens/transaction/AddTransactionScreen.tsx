import { useMemo, useState, useEffect } from 'react';
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
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { transactionApi } from '../../api/transactionApi';
import {
  type TransactionFormOptions,
  type TransactionType,
} from '../../types/transaction';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'AddTransaction'>;

const formatDate = (value: Date) => value.toLocaleDateString('vi-VN');
const weekdayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const buildCalendarDays = (year: number, monthIndex: number) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayNative = new Date(year, monthIndex, 1).getDay();
  const firstDayMondayIndex = (firstDayNative + 6) % 7;

  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDayMondayIndex; i += 1) {
    cells.push(null);
  }

  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(d);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
};

export const AddTransactionScreen = ({ navigation, route }: Props) => {
  const editingTransactionId = route.params?.transactionId;
  const isEditMode = Boolean(editingTransactionId);
  const presetType = route.params?.presetType;
  const presetCategoryId = route.params?.presetCategoryId;
  const presetTitle = route.params?.presetTitle;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showWebCalendar, setShowWebCalendar] = useState(false);
  const [webCalendarYear, setWebCalendarYear] = useState(new Date().getFullYear());
  const [webCalendarMonth, setWebCalendarMonth] = useState(new Date().getMonth());
  const [showTypeList, setShowTypeList] = useState(false);
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [showSourceList, setShowSourceList] = useState(false);

  const [options, setOptions] = useState<TransactionFormOptions>({ categories: [], sources: [] });
  const [date, setDate] = useState(new Date());
  const [draftDate, setDraftDate] = useState(new Date());
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');

  const openDatePicker = () => {
    setShowTypeList(false);
    setShowCategoryList(false);
    setShowSourceList(false);

    if (Platform.OS === 'web') {
      setWebCalendarYear(date.getFullYear());
      setWebCalendarMonth(date.getMonth());
      setShowWebCalendar(true);
      return;
    }

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        mode: 'date',
        is24Hour: true,
        onChange: (event, nextDate) => {
          if (event.type === 'set' && nextDate) {
            setDate(nextDate);
          }
        },
      });
      return;
    }

    setDraftDate(date);
    setShowDatePicker(true);
  };

  const webCalendarCells = useMemo(
    () => buildCalendarDays(webCalendarYear, webCalendarMonth),
    [webCalendarYear, webCalendarMonth],
  );

  const webCalendarTitle = useMemo(
    () => `${new Date(webCalendarYear, webCalendarMonth, 1).toLocaleString('vi-VN', { month: 'long' })} ${webCalendarYear}`,
    [webCalendarYear, webCalendarMonth],
  );

  const onPrevMonth = () => {
    if (webCalendarMonth === 0) {
      setWebCalendarMonth(11);
      setWebCalendarYear((prev) => prev - 1);
      return;
    }
    setWebCalendarMonth((prev) => prev - 1);
  };

  const onNextMonth = () => {
    if (webCalendarMonth === 11) {
      setWebCalendarMonth(0);
      setWebCalendarYear((prev) => prev + 1);
      return;
    }
    setWebCalendarMonth((prev) => prev + 1);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [formOptions, transactionDetail] = await Promise.all([
          transactionApi.getFormOptions(),
          editingTransactionId ? transactionApi.getTransactionDetail(editingTransactionId) : Promise.resolve(null),
        ]);

        setOptions(formOptions);

        if (transactionDetail) {
          const detailDate = new Date(transactionDetail.date);
          setDate(detailDate);
          setDraftDate(detailDate);
          setType(transactionDetail.type);
          setCategoryId(transactionDetail.categoryId);
          setSourceId(transactionDetail.sourceId);
          setAmount(String(Math.abs(transactionDetail.amount)));
          setTitle(transactionDetail.title);
          setDetail(transactionDetail.detail ?? '');
          return;
        }

        const initialType = presetType ?? type;
        setType(initialType);

        const presetCategoryValid =
          Boolean(presetCategoryId) &&
          formOptions.categories.some((item) => item.id === presetCategoryId && item.type === initialType);

        if (presetCategoryValid && presetCategoryId) {
          setCategoryId(presetCategoryId);
        } else {
          const firstByType = formOptions.categories.find((item) => item.type === initialType);
          setCategoryId(firstByType?.id ?? '');
        }

        if (presetTitle?.trim()) {
          setTitle(presetTitle.trim());
        }

        setSourceId(formOptions.sources[0]?.id ?? '');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [editingTransactionId, presetCategoryId, presetTitle, presetType]);

  useEffect(() => {
    if (!options.categories.length) {
      return;
    }

    const categoryStillValid = options.categories.some((item) => {
      if (item.id === categoryId) {
        if (type === 'saving' || type === 'debt_payment') {
          return item.type === 'finance';
        }
        return item.type === type;
      }
      return false;
    });

    if (!categoryStillValid) {
      const firstByType = options.categories.find((item) => {
        if (type === 'saving' || type === 'debt_payment') {
          return item.type === 'finance';
        }
        return item.type === type;
      });
      setCategoryId(firstByType?.id ?? '');
    }
  }, [type, categoryId, options.categories]);

  const categoriesByType = useMemo(() => {
    return options.categories.filter((item) => {
      if (type === 'saving' || type === 'debt_payment') {
        return item.type === 'finance';
      }
      return item.type === type;
    });
  }, [options.categories, type]);

  const selectedCategoryLabel = useMemo(() => {
    if (type === 'saving') return 'Khoản tiết kiệm';
    return categoriesByType.find((item) => item.id === categoryId)?.label ?? 'Chọn danh mục';
  }, [categoriesByType, categoryId, type]);

  const selectedSourceLabel = useMemo(() => {
    return options.sources.find((item) => item.id === sourceId)?.label ?? 'Chọn nguồn tiền';
  }, [options.sources, sourceId]);

  const onChangeType = (next: TransactionType) => {
    setType(next);
    const firstByType = options.categories.find((item) => item.type === next);
    setCategoryId(firstByType?.id ?? '');
    setShowTypeList(false);
    setShowCategoryList(false);
  };

  const onSave = async () => {
    const normalizedAmount = amount.replace(/,/g, '').trim();
    const parsedAmount = Number(normalizedAmount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      const message = 'Số tiền không hợp lệ. Vui lòng nhập số lớn hơn 0.';
      setAmountError(message);
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Thông báo', message);
      }
      return;
    }
    setAmountError('');

    if (!title.trim() || !categoryId || !sourceId) {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date: date.toISOString(),
        type,
        categoryId,
        amount: parsedAmount,
        title: title.trim(),
        sourceId,
        detail: detail.trim(),
      };

      if (editingTransactionId) {
        await transactionApi.updateTransaction(editingTransactionId, payload);
      } else {
        await transactionApi.createTransaction(payload);
      }

      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu giao dịch.';
      Alert.alert('Thông báo', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title={isEditMode ? 'Sửa Giao Dịch' : presetType === 'expense' ? 'Thêm Chi Tiêu' : presetType === 'income' ? 'Thêm Thu Nhập' : 'Thêm Giao Dịch'}
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
      />

      <View style={styles.mainPanel}>
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentWrap}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Ngày</Text>
              <View style={styles.selectField}>
                <Pressable style={styles.dateValueHitArea} onPress={openDatePicker}>
                  <Text style={styles.fieldText}>{formatDate(date)}</Text>
                </Pressable>
                <Pressable style={styles.calendarButton} onPress={openDatePicker} hitSlop={8}>
                  <MaterialIcons name="calendar-month" size={16} color={colors.white} />
                </Pressable>
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Loại Giao Dịch</Text>
              <Pressable style={styles.selectField} onPress={() => setShowTypeList((prev) => !prev)}>
                <Text style={styles.fieldText}>
                  {type === 'expense' ? 'Chi Tiêu' : type === 'income' ? 'Thu Nhập' : 'Tiết Kiệm'}
                </Text>
                <MaterialIcons name={showTypeList ? 'expand-less' : 'expand-more'} size={18} color={colors.primary} />
              </Pressable>

              {showTypeList ? (
                <View style={styles.dropdownList}>
                  <Pressable style={styles.dropdownItem} onPress={() => onChangeType('expense')}>
                    <Text style={styles.dropdownText}>Chi Tiêu</Text>
                  </Pressable>
                  <Pressable style={styles.dropdownItem} onPress={() => onChangeType('income')}>
                    <Text style={styles.dropdownText}>Thu Nhập</Text>
                  </Pressable>
                  {type === 'saving' && (
                    <Pressable style={styles.dropdownItem} onPress={() => onChangeType('saving')}>
                      <Text style={styles.dropdownText}>Tiết Kiệm</Text>
                    </Pressable>
                  )}
                </View>
              ) : null}
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Danh Mục</Text>
              <Pressable style={styles.selectField} onPress={() => setShowCategoryList((prev) => !prev)}>
                <Text style={styles.fieldText}>{selectedCategoryLabel}</Text>
                <MaterialIcons name={showCategoryList ? 'expand-less' : 'expand-more'} size={18} color={colors.primary} />
              </Pressable>

              {showCategoryList ? (
                <View style={styles.dropdownList}>
                  {categoriesByType.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setCategoryId(item.id);
                        setShowCategoryList(false);
                      }}
                    >
                      <Text style={styles.dropdownText}>{item.label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Số Tiền</Text>
              <TextInput
                value={amount}
                onChangeText={(nextValue) => {
                  setAmount(nextValue);
                  if (amountError) {
                    setAmountError('');
                  }
                }}
                placeholder="30,000"
                keyboardType="numeric"
                placeholderTextColor="#8FB8A5"
                style={styles.textInput}
              />
              {amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Tiêu Đề</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Grab"
                placeholderTextColor="#8FB8A5"
                style={styles.textInput}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Nguồn Tiền</Text>
              <Pressable style={styles.selectField} onPress={() => setShowSourceList((prev) => !prev)}>
                <Text style={styles.fieldText}>{selectedSourceLabel}</Text>
                <MaterialIcons name={showSourceList ? 'expand-less' : 'expand-more'} size={18} color={colors.primary} />
              </Pressable>

              {showSourceList ? (
                <View style={styles.dropdownList}>
                  {options.sources.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSourceId(item.id);
                        setShowSourceList(false);
                      }}
                    >
                      <Text style={styles.dropdownText}>{item.label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Nhập Chi Tiết</Text>
              <TextInput
                value={detail}
                onChangeText={setDetail}
                placeholder=""
                multiline
                style={styles.detailInput}
              />
            </View>

            <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
              <Text style={styles.saveText}>
                {saving ? 'Đang lưu...' : isEditMode ? 'Cập Nhật' : 'Lưu'}
              </Text>
            </Pressable>
          </ScrollView>
        )}
      </View>

      {Platform.OS === 'ios' && showDatePicker ? (
        <View style={styles.dateModalOverlay}>
          <View style={styles.dateModalCard}>
            <DateTimePicker
              value={draftDate}
              mode="date"
              display="spinner"
              locale="vi-VN"
              onChange={(event, nextDate) => {
                if (nextDate) {
                  setDraftDate(nextDate);
                }
              }}
            />

            <View style={styles.dateModalActions}>
              <Pressable style={styles.dateCancelButton} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.dateCancelText}>Hủy</Text>
              </Pressable>

              <Pressable
                style={styles.dateDoneButton}
                onPress={() => {
                  setDate(draftDate);
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.dateDoneText}>Chọn</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {showWebCalendar ? (
        <Modal transparent animationType="fade" visible={showWebCalendar} onRequestClose={() => setShowWebCalendar(false)}>
          <View style={styles.dateModalOverlay}>
            <View style={styles.dateModalCard}>
              <View style={styles.webCalendarHeader}>
                <Pressable style={styles.monthNavButton} onPress={onPrevMonth}>
                  <MaterialIcons name="chevron-left" size={20} color={colors.primary} />
                </Pressable>
                <Text style={styles.webCalendarTitle}>{webCalendarTitle}</Text>
                <Pressable style={styles.monthNavButton} onPress={onNextMonth}>
                  <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
                </Pressable>
              </View>

              <View style={styles.webCalendarGrid}>
                {weekdayHeaders.map((day) => (
                  <Text key={day} style={styles.weekdayText}>{day}</Text>
                ))}

                {webCalendarCells.map((day, index) => {
                  if (day == null) {
                    return <View key={`empty-${index}`} style={styles.dayCell} />;
                  }

                  const isSelected =
                    date.getFullYear() === webCalendarYear &&
                    date.getMonth() === webCalendarMonth &&
                    date.getDate() === day;

                  return (
                    <Pressable
                      key={`day-${index}`}
                      style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                      onPress={() => {
                        setDate(new Date(webCalendarYear, webCalendarMonth, day));
                        setShowWebCalendar(false);
                      }}
                    >
                      <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable style={styles.webCalendarCloseButton} onPress={() => setShowWebCalendar(false)}>
                <Text style={styles.webCalendarCloseText}>Đóng</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}

      <ScreenBottomNavigation activeTab="layers" />
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
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightSlot: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.poppins.semibold,
    fontSize: 24,
    lineHeight: 28,
    textAlign: 'center',
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
  loaderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  contentWrap: {
    paddingBottom: 110,
    gap: 16,
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  selectField: {
    minHeight: 46,
    backgroundColor: '#DFF7E2',
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldText: {
    color: colors.text,
    fontFamily: typography.poppins.regular,
    fontSize: 15,
  },
  dateValueHitArea: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  calendarButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownList: {
    backgroundColor: '#DFF7E2',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#CFE8DE',
  },
  dropdownText: {
    color: colors.text,
    fontFamily: typography.poppins.regular,
    fontSize: 15,
  },
  textInput: {
    minHeight: 46,
    backgroundColor: '#DFF7E2',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: colors.text,
    fontFamily: typography.poppins.regular,
    fontSize: 15,
  },
  detailLabel: {
    color: colors.primary,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  detailInput: {
    height: 88,
    backgroundColor: '#DFF7E2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 10,
    color: colors.text,
    textAlignVertical: 'top',
    fontFamily: typography.poppins.regular,
    fontSize: 14,
  },
  saveButton: {
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveText: {
    color: colors.white,
    fontFamily: typography.poppins.semibold,
    fontSize: 16,
  },
  errorText: {
    marginTop: 6,
    color: '#D14343',
    fontFamily: typography.poppins.medium,
    fontSize: 12,
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dateModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#F1FFF3',
    borderRadius: 16,
    padding: 14,
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
  webCalendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthNavButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DFF7E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webCalendarTitle: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 15,
    textTransform: 'capitalize',
  },
  webCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  weekdayText: {
    width: '14.285%',
    textAlign: 'center',
    color: colors.primary,
    fontFamily: typography.poppins.medium,
    fontSize: 11,
    marginBottom: 6,
  },
  dayCell: {
    width: '14.285%',
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    color: '#2D3748',
    fontFamily: typography.poppins.regular,
    fontSize: 13,
  },
  dayTextSelected: {
    color: colors.white,
    fontFamily: typography.poppins.semibold,
  },
  webCalendarCloseButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webCalendarCloseText: {
    color: colors.white,
    fontFamily: typography.poppins.semibold,
    fontSize: 14,
  },

});