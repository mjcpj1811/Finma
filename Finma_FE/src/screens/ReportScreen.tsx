import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { fetchReportChart, fetchReportSummary } from '../api/finmaApi';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import type { MainTabParamList, ReportStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { formatVnd, toYmd } from '../utils/format';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ReportStackParamList, 'Report'>,
  BottomTabNavigationProp<MainTabParamList>
>;

const chartW = Dimensions.get('window').width - 32;

export function ReportScreen({ navigation }: { navigation: Nav }) {
  const { token } = useAuth();
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [balance, setBalance] = useState('0');
  const [expense, setExpense] = useState('0');
  const [labels, setLabels] = useState<string[]>([]);
  const [inc, setInc] = useState<number[]>([]);
  const [exp, setExp] = useState<number[]>([]);
  const [sumInc, setSumInc] = useState('0');
  const [sumExp, setSumExp] = useState('0');

  const range = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    if (view === 'year') {
      return { from: `${y - 4}-01-01`, to: `${y}-12-31` };
    }
    if (view === 'month') {
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    }
    if (view === 'week') {
      const d = new Date(now);
      d.setDate(1);
      return { from: toYmd(d), to: toYmd(now) };
    }
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { from: toYmd(mon), to: toYmd(sun) };
  }, [view]);

  const load = useCallback(async () => {
    if (!token) return;
    const sum = await fetchReportSummary(token, range.from, range.to);
    setBalance(formatVnd(sum.result.balance));
    setExpense(formatVnd(sum.result.totalExpense));
    const ch = await fetchReportChart(token, view, range.from, range.to);
    const labelsL = ch.result.labels;
    const incomeL = ch.result.income.map((x) => Number(x));
    const expenseL = ch.result.expense.map((x) => Number(x));
    setLabels(labelsL);
    setInc(incomeL);
    setExp(expenseL);
    setSumInc(formatVnd(ch.result.summary.totalIncome));
    setSumExp(formatVnd(ch.result.summary.totalExpense));
  }, [token, view, range.from, range.to]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
    }, [load])
  );

  const chartLabels = labels.length ? labels : ['—'];

  return (
    <ScrollView style={styles.page}>
      <ScreenHeader title="Phân Tích" />
      <View style={styles.head}>
        <View style={styles.headRow}>
          <View>
            <Text style={styles.hSmall}>Số Dư</Text>
            <Text style={styles.hBig}>{balance}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.hSmall}>Chi Tiêu</Text>
            <Text style={[styles.hBig, { color: '#7DD3FC' }]}>{expense}</Text>
          </View>
        </View>
        <View style={styles.progressOuter}>
          <View style={[styles.progressInner, { width: '30%' }]} />
        </View>
        <Text style={styles.hint}>30% Mục Tiêu, 0 Mục Tiêu Sắp Đến Hạn</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.seg}>
          {(['day', 'week', 'month', 'year'] as const).map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.segItem, view === v && styles.segOn]}
              onPress={() => setView(v)}
            >
              <Text style={[styles.segTxt, view === v && styles.segTxtOn]}>
                {v === 'day' ? 'Ngày' : v === 'week' ? 'Tuần' : v === 'month' ? 'Tháng' : 'Năm'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartTitleRow}>
            <Text style={styles.chartTitle}>Thu Nhập & Chi Tiêu</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                <Ionicons name="search-outline" size={22} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
                <Ionicons name="calendar-outline" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
          <BarChart
            data={{
              labels: chartLabels,
              datasets: [
                {
                  data: inc.length ? inc.map((x) => Math.max(0, Number(x) / 1000)) : [0],
                },
              ],
            }}
            width={chartW}
            height={220}
            yAxisLabel=""
            yAxisSuffix="k"
            chartConfig={{
              backgroundColor: colors.white,
              backgroundGradientFrom: '#F1FFF3',
              backgroundGradientTo: '#F1FFF3',
              decimalPlaces: 0,
              color: (o = 1) => `rgba(22, 199, 154, ${o})`,
              labelColor: () => colors.textMuted,
            }}
            style={{ marginVertical: 8, borderRadius: 16 }}
            />
          <BarChart
            data={{
              labels: chartLabels,
              datasets: [
                {
                  data: exp.length ? exp.map((x) => Math.max(0, Number(x) / 1000)) : [0],
                },
              ],
            }}
            width={chartW}
            height={200}
            yAxisLabel=""
            yAxisSuffix="k"
            chartConfig={{
              backgroundColor: colors.white,
              backgroundGradientFrom: '#F1FFF3',
              backgroundGradientTo: '#F1FFF3',
              decimalPlaces: 0,
              color: (o = 1) => `rgba(21, 108, 247, ${o})`,
              labelColor: () => colors.textMuted,
            }}
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        </View>

        <View style={styles.sumRow}>
          <View style={styles.sumCol}>
            <Text style={styles.sumLabel}>Income</Text>
            <Text style={styles.sumVal}>{sumInc}</Text>
          </View>
          <View style={styles.sumCol}>
            <Text style={[styles.sumLabel, { color: colors.expenseBlue }]}>Expense</Text>
            <Text style={[styles.sumVal, { color: colors.expenseBlue }]}>{sumExp}</Text>
          </View>
        </View>

        <Text style={styles.targetsTitle}>My Targets</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bgPage },
  head: {
    backgroundColor: colors.primary,
    padding: 16,
    paddingBottom: 20,
  },
  headRow: { flexDirection: 'row', justifyContent: 'space-between' },
  hSmall: { color: colors.white, fontSize: 12, opacity: 0.9 },
  hBig: { color: colors.white, fontSize: 20, fontWeight: '800', marginTop: 4 },
  progressOuter: {
    height: 10,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressInner: { height: '100%', backgroundColor: '#111' },
  hint: { color: colors.white, fontSize: 12, marginTop: 8 },
  body: {
    marginTop: -8,
    backgroundColor: colors.bgMint,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  seg: {
    flexDirection: 'row',
    backgroundColor: '#DFF7E2',
    borderRadius: 20,
    padding: 4,
    marginBottom: 12,
  },
  segItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 16 },
  segOn: { backgroundColor: colors.primary },
  segTxt: { fontSize: 12, color: colors.text },
  segTxtOn: { color: colors.white, fontWeight: '700' },
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 12,
  },
  chartTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chartTitle: { fontWeight: '800', fontSize: 16, color: colors.text },
  sumRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
  sumCol: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
  },
  sumLabel: { fontSize: 12, color: colors.textMuted },
  sumVal: { fontSize: 18, fontWeight: '800', marginTop: 4, color: colors.text },
  targetsTitle: { marginTop: 24, fontWeight: '800', fontSize: 16 },
});
