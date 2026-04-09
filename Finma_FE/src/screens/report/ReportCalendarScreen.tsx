import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { calendarApi } from '../../api/calendarApi';
import {
  type CalendarCategorySlice,
  type CalendarTransactionItem,
} from '../../types/calendar';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { resolveTransactionIconBg, resolveTransactionIconName } from '../../utils/transactionIcon';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportCalendar'>;
type TabMode = 'transactions' | 'categories';

const weekdayHeaders = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const monthOptions = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

const toRoundedMoney = (value: number) => Math.round(Number(value) || 0);
const formatAmount = (value: number) => toRoundedMoney(value).toLocaleString('vi-VN');

const toPolar = (cx: number, cy: number, radius: number, angleDeg: number) => {
  const angle = (Math.PI / 180) * angleDeg;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
};

const makeSemiSectorPath = (
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) => {
  const start = toPolar(cx, cy, radius, startAngle);
  const end = toPolar(cx, cy, radius, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
};

const SemiPieChart = ({ slices }: { slices: CalendarCategorySlice[] }) => {
  const width = 280;
  const height = 170;
  const cx = 140;
  const cy = 150;
  const radius = 110;

  let start = 180;

  return (
    <Svg width={width} height={height}>
      {slices.map((slice) => {
        const sweep = (slice.percent / 100) * 180;
        const end = start + sweep;
        const mid = (start + end) / 2;
        const textPos = toPolar(cx, cy, radius * 0.62, mid);
        const path = makeSemiSectorPath(cx, cy, radius, start, end);
        start = end;

        return (
          <>
            <Path key={`path-${slice.id}`} d={path} fill={slice.color} />
            <SvgText
              key={`text-${slice.id}`}
              x={textPos.x}
              y={textPos.y}
              fontSize="20"
              fontWeight="700"
              textAnchor="middle"
              fill="white"
            >
              {`${slice.percent}%`}
            </SvgText>
          </>
        );
      })}
    </Svg>
  );
};

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

export const ReportCalendarScreen = ({ navigation }: Props) => {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(currentDate.getDate());
  const [showMonthList, setShowMonthList] = useState(false);
  const [showYearList, setShowYearList] = useState(false);
  const [activeTab, setActiveTab] = useState<TabMode>('transactions');
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [transactions, setTransactions] = useState<CalendarTransactionItem[]>([]);
  const [categorySlices, setCategorySlices] = useState<CalendarCategorySlice[]>([]);

  const yearOptions = useMemo(() => {
    const thisYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, index) => thisYear - 5 + index);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'transactions') {
          const response = await calendarApi.getTransactions({ month: month + 1, year, day: selectedDay });
          setTransactions(response.items);
          setUnreadNotifications(response.unreadNotifications);
        } else {
          const response = await calendarApi.getCategories({ month: month + 1, year, day: selectedDay });
          setCategorySlices(response.slices);
          setUnreadNotifications(response.unreadNotifications);
        }
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [activeTab, month, selectedDay, year]);

  const monthText = useMemo(() => {
    return new Date(year, month, 1).toLocaleString('vi-VN', { month: 'long' });
  }, [year, month]);

  const dayCells = useMemo(() => buildCalendarDays(year, month), [year, month]);

  const daysInCurrentMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);

  useEffect(() => {
    if (selectedDay > daysInCurrentMonth) {
      setSelectedDay(daysInCurrentMonth);
    }
  }, [daysInCurrentMonth, selectedDay]);

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title="Lịch"
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
        showNotificationBadge={unreadNotifications > 0}
      />

      <View style={styles.panel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          <View style={styles.monthYearRow}>
            <Pressable
              style={styles.monthYearItem}
              onPress={() => {
                setShowMonthList((prev) => !prev);
                setShowYearList(false);
              }}
            >
              <Text style={styles.monthYearText}>{monthText}</Text>
              <MaterialIcons name={showMonthList ? 'expand-less' : 'expand-more'} size={16} color={colors.primary} />
            </Pressable>

            <Pressable
              style={styles.monthYearItem}
              onPress={() => {
                setShowYearList((prev) => !prev);
                setShowMonthList(false);
              }}
            >
              <Text style={styles.monthYearText}>{year}</Text>
              <MaterialIcons name={showYearList ? 'expand-less' : 'expand-more'} size={16} color={colors.primary} />
            </Pressable>
          </View>

          {showMonthList ? (
            <View style={styles.dropdownList}>
              {monthOptions.map((option, index) => (
                <Pressable
                  key={option}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setMonth(index);
                    setShowMonthList(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{option}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {showYearList ? (
            <View style={styles.dropdownList}>
              {yearOptions.map((option) => (
                <Pressable
                  key={option}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setYear(option);
                    setShowYearList(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{option}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.calendarGrid}>
            {weekdayHeaders.map((day) => (
              <Text key={day} style={styles.weekdayText}>{day}</Text>
            ))}

            {dayCells.map((day, idx) => {
              if (day == null) {
                return <View key={`d-${idx}`} style={styles.dayCell} />;
              }

              const isSelected = day === selectedDay;

              return (
                <Pressable
                  key={`d-${idx}`}
                  style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tabButton, activeTab === 'transactions' && styles.tabButtonActive]}
              onPress={() => setActiveTab('transactions')}
            >
              <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>Giao Dịch</Text>
            </Pressable>

            <Pressable
              style={[styles.tabButton, activeTab === 'categories' && styles.tabButtonActive]}
              onPress={() => setActiveTab('categories')}
            >
              <Text style={[styles.tabText, activeTab === 'categories' && styles.tabTextActive]}>Danh Mục</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null}

          {!loading && activeTab === 'transactions' ? (
            <View style={styles.listWrap}>
              {transactions.map((item) => {
                const absoluteAmount = Math.abs(item.amount);
                const roundedAbsoluteAmount = toRoundedMoney(absoluteAmount);
                const amountSign = roundedAbsoluteAmount > 0 && item.kind === 'expense' ? '-' : '';

                return (
                  <View key={item.id} style={styles.transactionCard}>
                    <View style={[styles.txIconWrap, { backgroundColor: resolveTransactionIconBg(item.kind) }]}>
                      <MaterialIcons
                        name={resolveTransactionIconName(item.iconKey, item.kind) as keyof typeof MaterialIcons.glyphMap}
                        size={22}
                        color={colors.white}
                      />
                    </View>

                    <View style={styles.txInfo}>
                      <Text style={styles.txTitle}>{item.title}</Text>
                      <Text style={styles.txTime}>{item.timeLabel}</Text>
                    </View>

                    <View style={styles.txRight}>
                      <Text style={styles.txSub}>{item.subLabel}</Text>
                      <Text style={[styles.txAmount, item.kind === 'expense' ? styles.txExpense : styles.txIncome]}>
                        {amountSign}
                        {formatAmount(roundedAbsoluteAmount)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {!loading && activeTab === 'categories' ? (
            <View style={styles.categoryWrap}>
              <SemiPieChart slices={categorySlices} />

              <View style={styles.legendRow}>
                {categorySlices.map((slice) => (
                  <View key={slice.id} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                    <Text style={styles.legendText}>{slice.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      </View>

      <ScreenBottomNavigation activeTab="report" />
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
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.black,
    fontFamily: typography.poppins.semibold,
    fontSize: 24,
    lineHeight: 28,
  },
  panel: {
    flex: 1,
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  panelContent: {
    paddingBottom: 104,
    gap: 16,
  },
  monthYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthYearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthYearText: {
    color: colors.primary,
    fontFamily: typography.poppins.semibold,
    fontSize: 16,
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
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    color: '#2D3748',
    fontFamily: typography.poppins.regular,
    fontSize: 14,
  },
  dayTextSelected: {
    color: colors.white,
    fontFamily: typography.poppins.semibold,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 10,
  },
  tabButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DFF7E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: '#2D3748',
    fontFamily: typography.poppins.semibold,
    fontSize: 14,
  },
  tabTextActive: {
    color: colors.white,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listWrap: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: '#DFF7E2',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIconBlue: {
    backgroundColor: '#4F7CFF',
  },
  txIconLightBlue: {
    backgroundColor: '#6BBAFF',
  },
  txInfo: {
  },
  txTime: {
    color: '#3B82F6',
    fontFamily: typography.poppins.regular,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txSub: {
    color: '#718096',
    fontFamily: typography.poppins.regular,
    fontSize: 12,
  },
  txAmount: {
    fontFamily: typography.poppins.semibold,
    fontSize: 16,
  },
  txExpense: {
    color: colors.blueDark,
  },
  txIncome: {
    color: '#2D3748',
  },
  categoryWrap: {
    alignItems: 'center',
    paddingTop: 8,
    gap: 16,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: '#2D3748',
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },

});