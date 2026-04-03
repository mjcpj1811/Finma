import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { BalanceSummaryCard } from '../../components/BalanceSummaryCard';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { ReportIncomeExpenseChart } from '../../components/ReportIncomeExpenseChart';
import { reportApi } from '../../api/reportApi';
import { type ReportDashboard, type ReportFilter } from '../../types/report';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Report'>;


const periodOptions: Array<{ key: ReportFilter; label: string }> = [
  { key: 'day', label: 'Ngày' },
  { key: 'week', label: 'Tuần' },
  { key: 'month', label: 'Tháng' },
  { key: 'year', label: 'Năm' },
];

const formatCurrency = (value: number) => value.toLocaleString('vi-VN');

const TargetProgress = ({ percent }: { percent: number }) => {
  const size = 88;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);

  return (
    <View style={styles.targetRingWrap}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.4)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.white}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <Text style={styles.targetPercent}>{percent}%</Text>
    </View>
  );
};

export const ReportScreen = ({ navigation }: Props) => {
  const [period, setPeriod] = useState<ReportFilter>('day');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<ReportDashboard | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      try {
        const response = await reportApi.getDashboard(period);
        setDashboard(response);
      } catch {
        setDashboard(null);
      } finally {
        setLoading(false);
      }
    };

    void loadReport();
  }, [period]);

  if (loading || !dashboard) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải dữ liệu phân tích...</Text>
        </View>
        <ScreenBottomNavigation activeTab="report" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topSection}>
        <AppScreenHeader
          title="Phân Tích"
          onPressNotification={() => navigation.navigate('Notifications')}
          showNotificationBadge={dashboard.unreadNotifications > 0}
        />

        <BalanceSummaryCard
          totalBalance={dashboard.overview.totalBalance}
          totalExpense={dashboard.overview.totalExpense}
          budgetUsedPercent={dashboard.overview.budgetUsedPercent}
          budgetLimit={dashboard.overview.budgetLimit}
        />

        <Text style={styles.goalSummary}>{dashboard.goalSummaryText}</Text>
      </View>

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentWrap}>
          <View style={styles.periodWrap}>
            {periodOptions.map((option) => {
              const selected = option.key === period;
              return (
                <Pressable
                  key={option.key}
                  style={[styles.periodButton, selected && styles.periodButtonActive]}
                  onPress={() => setPeriod(option.key)}
                >
                  <Text style={[styles.periodText, selected && styles.periodTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Thu nhập & Chi tiêu</Text>
              <View style={styles.chartActions}>
                <Pressable style={styles.chartActionButton} onPress={() => navigation.navigate('ReportSearch')}>
                  <MaterialIcons name="search" size={18} color={colors.white} />
                </Pressable>
                <Pressable style={styles.chartActionButton} onPress={() => navigation.navigate('ReportCalendar')}>
                  <MaterialIcons name="calendar-month" size={18} color={colors.white} />
                </Pressable>
              </View>
            </View>

            <ReportIncomeExpenseChart data={dashboard.chart} />
          </View>

          <View style={styles.totalsRow}>
            <View style={styles.totalItem}>
              <View style={styles.totalIconWrap}>
                <MaterialIcons name="south-west" size={22} color={colors.primary} />
              </View>
              <Text style={styles.totalLabel}>Thu Nhập</Text>
              <Text style={[styles.totalValue, styles.incomeText]}>{formatCurrency(dashboard.incomeTotal)}</Text>
            </View>

            <View style={styles.totalItem}>
              <View style={styles.totalIconWrap}>
                <MaterialIcons name="north-east" size={22} color={colors.blueDark} />
              </View>
              <Text style={styles.totalLabel}>Chi Tiêu</Text>
              <Text style={[styles.totalValue, styles.expenseText]}>{formatCurrency(dashboard.expenseTotal)}</Text>
            </View>
          </View>

          <View style={styles.targetSection}>
            <Text style={styles.targetHeading}>Mục tiêu của tôi</Text>
            <View style={styles.targetGrid}>
              {dashboard.targets.map((item) => (
                <View key={item.id} style={styles.targetCard}>
                  <TargetProgress percent={item.progressPercent} />
                  <Text style={styles.targetTitle}>{item.title}</Text>
                </View>
              ))}
            </View>
          </View>
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
  topSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 12,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 30,
    height: 30,
  },
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 24,
    lineHeight: 28,
    textAlign: 'center',
  },
  goalSummary: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  mainPanel: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    paddingHorizontal: 18,
    paddingTop: 20,
    marginTop: 8,
  },
  contentWrap: {
    paddingBottom: 98,
    gap: 16,
  },
  periodWrap: {
    flexDirection: 'row',
    backgroundColor: '#DFF7E2',
    borderRadius: 20,
    padding: 6,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 10,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  periodTextActive: {
    color: colors.white,
    fontFamily: typography.poppins.semibold,
  },
  chartCard: {
    backgroundColor: '#DFF7E2',
    borderRadius: 24,
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartTitle: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 15,
  },
  chartActions: {
    flexDirection: 'row',
    gap: 8,
  },
  chartActionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  totalItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  totalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DFF7E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalLabel: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 12,
  },
  totalValue: {
    color: colors.text,
    fontFamily: typography.poppins.bold,
    fontSize: 30,
    lineHeight: 34,
  },
  incomeText: {
    color: colors.primary,
  },
  expenseText: {
    color: colors.blueDark,
  },
  targetSection: {
    gap: 12,
  },
  targetHeading: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 16,
  },
  targetGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  targetCard: {
    flex: 1,
    minHeight: 152,
    borderRadius: 24,
    backgroundColor: '#5D9EF5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  targetRingWrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetPercent: {
    position: 'absolute',
    color: colors.white,
    fontFamily: typography.poppins.bold,
    fontSize: 22,
  },
  targetTitle: {
    color: colors.white,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
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