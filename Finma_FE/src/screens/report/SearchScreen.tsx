import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { searchApi } from '../../api/searchApi';
import { type SearchCategoryOption, type SearchReportType, type SearchResultItem } from '../../types/search';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportSearch'>;

const formatDateValue = (date: Date) => date.toLocaleDateString('vi-VN');
const toApiDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
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

const formatCurrency = (value: number) => value.toLocaleString('vi-VN');

export const SearchScreen = ({ navigation }: Props) => {
  const [keyword, setKeyword] = useState('');
  const [categories, setCategories] = useState<SearchCategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState<string>('all');
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showWebCalendar, setShowWebCalendar] = useState(false);
  const [webCalendarYear, setWebCalendarYear] = useState(new Date().getFullYear());
  const [webCalendarMonth, setWebCalendarMonth] = useState(new Date().getMonth());
  const [reportType, setReportType] = useState<SearchReportType>('expense');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);

  const openDatePicker = () => {
    setShowCategoryList(false);

    if (Platform.OS === 'web') {
      setWebCalendarYear(date.getFullYear());
      setWebCalendarMonth(date.getMonth());
      setShowWebCalendar(true);
      return;
    }

    setShowDatePicker(true);
  };

  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const response = await searchApi.getOptions();
        setCategories([
          { id: 'all', label: 'Tất cả danh mục' },
          ...response.categories,
        ]);
        setCategoryId('all');
      } finally {
        setLoadingOptions(false);
      }
    };

    void loadOptions();
  }, []);

  const selectedCategoryLabel = useMemo(() => {
    return categories.find((item) => item.id === categoryId)?.label ?? 'Chọn danh mục';
  }, [categories, categoryId]);

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

  const onSearch = async () => {
    setLoadingSearch(true);
    try {
      const response = await searchApi.searchReport({
        keyword,
        categoryId,
        date: toApiDate(date),
        reportType,
      });
      setResults(response.items);
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title="Tìm Kiếm"
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
      />

      <View style={styles.searchInputWrap}>
        <TextInput
          placeholder="Tìm kiếm..."
          placeholderTextColor={colors.textMuted}
          value={keyword}
          onChangeText={setKeyword}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.mainPanel}>
        {loadingOptions ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Danh Mục</Text>
              <Pressable style={styles.selectInput} onPress={() => setShowCategoryList((prev) => !prev)}>
                <Text style={styles.selectText}>{selectedCategoryLabel}</Text>
                <MaterialIcons name={showCategoryList ? 'expand-less' : 'expand-more'} size={20} color={colors.textSecondary} />
              </Pressable>

              {showCategoryList ? (
                <View style={styles.dropdownList}>
                  {categories.map((item) => (
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

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Ngày</Text>
              <View style={styles.selectInput}>
                <Pressable style={styles.dateValueHitArea} onPress={openDatePicker}>
                  <Text style={styles.dateText}>{formatDateValue(date)}</Text>
                </Pressable>
                <Pressable style={styles.calendarButton} onPress={openDatePicker} hitSlop={8}>
                  <MaterialIcons name="calendar-month" size={16} color={colors.white} />
                </Pressable>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Báo cáo</Text>
              <View style={styles.reportTypeRow}>
                <Pressable style={styles.radioItem} onPress={() => setReportType('income')}>
                  <View style={styles.radioOuter}>
                    {reportType === 'income' ? <View style={styles.radioInner} /> : null}
                  </View>
                  <Text style={styles.radioLabel}>Thu Nhập</Text>
                </Pressable>

                <Pressable style={styles.radioItem} onPress={() => setReportType('expense')}>
                  <View style={styles.radioOuter}>
                    {reportType === 'expense' ? <View style={styles.radioInner} /> : null}
                  </View>
                  <Text style={styles.radioLabel}>Chi Tiêu</Text>
                </Pressable>
              </View>
            </View>

            <Pressable style={styles.searchButton} onPress={onSearch}>
              <Text style={styles.searchButtonText}>{loadingSearch ? 'Đang tìm...' : 'Tìm'}</Text>
            </Pressable>

            {results.map((item) => (
              <View key={item.id} style={styles.resultCard}>
                <View style={styles.resultIconWrap}>
                  <MaterialIcons
                    name={item.type === 'income' ? 'south-west' : 'restaurant'}
                    size={20}
                    color={item.type === 'income' ? colors.primary : colors.blueDark}
                  />
                </View>

                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle}>{item.title}</Text>
                  <Text style={styles.resultTime}>{item.timeLabel}</Text>
                </View>

                <Text style={[styles.resultAmount, item.type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {showDatePicker ? (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          locale="vi-VN"
          onChange={(_, nextDate) => {
            setShowDatePicker(false);
            if (nextDate) {
              setDate(nextDate);
            }
          }}
        />
      ) : null}

      {showWebCalendar ? (
        <Modal transparent animationType="fade" visible={showWebCalendar} onRequestClose={() => setShowWebCalendar(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Pressable style={styles.monthNavButton} onPress={onPrevMonth}>
                  <MaterialIcons name="chevron-left" size={20} color={colors.primary} />
                </Pressable>
                <Text style={styles.modalTitle}>{webCalendarTitle}</Text>
                <Pressable style={styles.monthNavButton} onPress={onNextMonth}>
                  <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
                </Pressable>
              </View>

              <View style={styles.calendarGrid}>
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

              <Pressable style={styles.modalCloseButton} onPress={() => setShowWebCalendar(false)}>
                <Text style={styles.modalCloseText}>Đóng</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}

      <ScreenBottomNavigation activeTab="report" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
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
  title: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 24,
    lineHeight: 28,
  },
  searchInputWrap: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  searchInput: {
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DFF7E2',
    paddingHorizontal: 16,
    color: colors.text,
    fontFamily: typography.poppins.regular,
    fontSize: 13,
  },
  mainPanel: {
    flex: 1,
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  panelContent: {
    paddingBottom: 110,
    gap: 18,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 15,
  },
  selectInput: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#DFF7E2',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    color: colors.textSecondary,
    fontFamily: typography.poppins.regular,
    fontSize: 13,
  },
  dropdownList: {
    borderRadius: 12,
    backgroundColor: '#DFF7E2',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5EFEA',
  },
  dropdownText: {
    color: colors.text,
    fontFamily: typography.poppins.regular,
    fontSize: 13,
  },
  dateText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 13,
  },
  dateValueHitArea: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  calendarButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  searchButton: {
    width: 168,
    height: 46,
    alignSelf: 'center',
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: colors.white,
    fontFamily: typography.poppins.semibold,
    fontSize: 16,
  },
  resultCard: {
    backgroundColor: '#DFF7E2',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#8BBEFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 13,
  },
  resultTime: {
    color: colors.blueDark,
    fontFamily: typography.poppins.medium,
    fontSize: 11,
  },
  resultAmount: {
    fontFamily: typography.poppins.semibold,
    fontSize: 13,
  },
  incomeAmount: {
    color: colors.primary,
  },
  expenseAmount: {
    color: colors.blueDark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: '#F1FFF3',
    padding: 14,
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthNavButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DFF7E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 15,
    textTransform: 'capitalize',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
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
  modalCloseButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: colors.white,
    fontFamily: typography.poppins.semibold,
    fontSize: 14,
  },

});