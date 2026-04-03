import { useMemo, useState, useEffect } from 'react';
import {
  ActivityIndicator,
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
import { BottomNavBar } from '../../components/BottomNavBar';
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

export const AddTransactionScreen = ({ navigation, route }: Props) => {
  const editingTransactionId = route.params?.transactionId;
  const isEditMode = Boolean(editingTransactionId);
  const presetType = route.params?.presetType;
  const presetCategoryId = route.params?.presetCategoryId;
  const presetTitle = route.params?.presetTitle;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
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

    const categoryStillValid = options.categories.some(
      (item) => item.id === categoryId && item.type === type,
    );

    if (!categoryStillValid) {
      const firstByType = options.categories.find((item) => item.type === type);
      setCategoryId(firstByType?.id ?? '');
    }
  }, [type, categoryId, options.categories]);

  const categoriesByType = useMemo(() => {
    return options.categories.filter((item) => item.type === type);
  }, [options.categories, type]);

  const selectedCategoryLabel = useMemo(() => {
    return categoriesByType.find((item) => item.id === categoryId)?.label ?? 'Chọn danh mục';
  }, [categoriesByType, categoryId]);

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
    const parsedAmount = Number(amount.replace(/[^\d]/g, ''));
    if (!parsedAmount || !title.trim() || !categoryId || !sourceId) {
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
              <Pressable style={styles.selectField} onPress={openDatePicker}>
                <Text style={styles.fieldText}>{formatDate(date)}</Text>
                <MaterialIcons name="calendar-month" size={18} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Loại Giao Dịch</Text>
              <Pressable style={styles.selectField} onPress={() => setShowTypeList((prev) => !prev)}>
                <Text style={styles.fieldText}>{type === 'expense' ? 'Chi Tiêu' : 'Thu Nhập'}</Text>
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
                onChangeText={setAmount}
                placeholder="30,000"
                keyboardType="numeric"
                placeholderTextColor="#8FB8A5"
                style={styles.textInput}
              />
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

      <View style={styles.fixedBottomNav}>
        <BottomNavBar
          activeTab="layers"
          onPress={(tab) => {
            if (tab === 'home') {
              navigation.navigate('Home');
            }
            if (tab === 'report') {
              navigation.navigate('Report');
            }
            if (tab === 'exchange') {
              navigation.navigate('Transactions');
            }
            if (tab === 'layers') {
              navigation.navigate('Categories');
            }
            if (tab === 'profile') {
              navigation.navigate('Profile');
            }
          }}
        />
      </View>
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
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
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
  fixedBottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#DFF7E2',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 10,
  },
});