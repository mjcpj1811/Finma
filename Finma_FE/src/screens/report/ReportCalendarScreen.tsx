import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { BottomNavBar } from '../../components/BottomNavBar';
import { calendarApi } from '../../api/calendarApi';
import {
  type CalendarCategorySlice,
  type CalendarTransactionItem,
} from '../../types/calendar';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportCalendar'>;
type TabMode = 'transactions' | 'categories';

const weekdayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const formatAmount = (value: number) => value.toLocaleString('vi-VN');

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
  const [year] = useState(2023);
  const [month] = useState(3);
  const [selectedDay, setSelectedDay] = useState(1);
  const [activeTab, setActiveTab] = useState<TabMode>('transactions');
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [transactions, setTransactions] = useState<CalendarTransactionItem[]>([]);
  const [categorySlices, setCategorySlices] = useState<CalendarCategorySlice[]>([]);

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
    return new Date(year, month, 1).toLocaleString('en-US', { month: 'long' });
  }, [year, month]);

  const dayCells = useMemo(() => buildCalendarDays(year, month), [year, month]);

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
            <View style={styles.monthYearItem}>
              <Text style={styles.monthYearText}>{monthText}</Text>
              <MaterialIcons name="expand-more" size={16} color={colors.primary} />
            </View>

            <View style={styles.monthYearItem}>
              <Text style={styles.monthYearText}>{year}</Text>
              <MaterialIcons name="expand-more" size={16} color={colors.primary} />
            </View>
          </View>

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
              {transactions.map((item, index) => (
                <View key={item.id} style={styles.transactionCard}>
                  <View style={[styles.txIconWrap, index === 0 ? styles.txIconBlue : styles.txIconLightBlue]}>
                    <MaterialIcons name={index === 0 ? 'shopping-bag' : 'inventory-2'} size={22} color={colors.white} />
                  </View>

                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle}>{item.title}</Text>
                    <Text style={styles.txTime}>{item.timeLabel}</Text>
                  </View>

                  <View style={styles.txRight}>
                    <Text style={styles.txSub}>{item.subLabel}</Text>
                    <Text style={[styles.txAmount, item.kind === 'expense' ? styles.txExpense : styles.txIncome]}>
                      {item.kind === 'expense' ? '-' : ''}
                      {formatAmount(Math.abs(item.amount))}
                    </Text>
                  </View>
                </View>
              ))}
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

      <View style={styles.fixedBottomNav}>
        <BottomNavBar
          activeTab="report"
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
    flex: 1,
  },
  txTitle: {
    color: '#2D3748',
    fontFamily: typography.poppins.semibold,
    fontSize: 16,
  },
  txTime: {
    color: '#3B82F6',
    fontFamily: typography.poppins.regular,
    fontSize: 12,
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
  fixedBottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#D4E8E0',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 10,
  },
});