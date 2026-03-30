import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { fetchMyInfo, fetchReportSummary, fetchTransactions } from '../api/finmaApi';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { formatVnd, toYmd } from '../utils/format';
import type { TransactionListItem } from '../api/types';

export function HomeScreen() {
  const { token } = useAuth();
  const [name, setName] = useState('...');
  const [balance, setBalance] = useState('0');
  const [expense, setExpense] = useState('0');
  const [items, setItems] = useState<TransactionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'day' | 'week' | 'month'>('month');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const info = await fetchMyInfo(token);
      setName(info.result?.fullName || info.result?.username || 'Bạn');
      const sum = await fetchReportSummary(token);
      setBalance(formatVnd(sum.result.balance));
      setExpense(formatVnd(sum.result.totalExpense));
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const list = await fetchTransactions(token, {
        from: toYmd(start),
        to: toYmd(now),
      });
      setItems(list.result?.slice(0, 8) ?? []);
    } catch {
      setName('Bạn');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView
      style={styles.page}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greet}>Chào mừng {name}</Text>
            <Text style={styles.sub}>Hôm nay bạn thế nào?</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Tổng Dư</Text>
            <Text style={styles.summaryVal}>{balance}</Text>
          </View>
          <View style={styles.vsep} />
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Tổng Chi</Text>
            <Text style={[styles.summaryVal, { color: '#7DD3FC' }]}>-{expense}</Text>
          </View>
        </View>
        <View style={styles.progressOuter}>
          <View style={[styles.progressInner, { width: '30%' }]} />
        </View>
        <Text style={styles.progressHint}>30% ngân sách chi tiêu</Text>
      </View>

      <View style={styles.cardTeal}>
        <View style={styles.goalRow}>
          <View style={styles.goalLeft}>
            <Ionicons name="car-sport-outline" size={32} color={colors.white} />
            <Text style={styles.goalTxt}>Mục Tiêu Tiết Kiệm</Text>
          </View>
          <View style={styles.vsepLight} />
          <View style={styles.goalRight}>
            <Text style={styles.goalLine}>Tổng thu tuần trước</Text>
            <Text style={styles.goalAmt}>—</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.manageBtn} activeOpacity={0.85}>
        <Ionicons name="card-outline" size={22} color={colors.primary} />
        <Text style={styles.manageTxt}>Quản lý nguồn tiền</Text>
      </TouchableOpacity>

      <View style={styles.tabs}>
        {(['day', 'week', 'month'] as const).map((k) => (
          <TouchableOpacity
            key={k}
            style={[styles.tab, tab === k && styles.tabOn]}
            onPress={() => setTab(k)}
          >
            <Text style={[styles.tabTxt, tab === k && styles.tabTxtOn]}>
              {k === 'day' ? 'Ngày' : k === 'week' ? 'Tuần' : 'Tháng'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
      {loading ? (
        <ActivityIndicator style={{ margin: 24 }} color={colors.primary} />
      ) : (
        items.map((t) => (
          <View key={t.id} style={styles.txRow}>
            <View style={styles.txIcon}>
              <Ionicons name="pricetag-outline" size={20} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txTitle}>{t.category || '—'}</Text>
              <Text style={styles.txSub}>{t.transactionDateTime || t.date}</Text>
            </View>
            <Text
              style={[
                styles.txAmt,
                t.type === 'INCOME' ? { color: colors.black } : { color: colors.expenseBlue },
              ]}
            >
              {t.type === 'EXPENSE' ? '-' : ''}
              {formatVnd(t.amount)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bgPage },
  header: {
    backgroundColor: colors.primary,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greet: { color: colors.white, fontSize: 20, fontWeight: '700' },
  sub: { color: colors.white, opacity: 0.9, marginTop: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryLabel: { color: colors.white, fontSize: 12, opacity: 0.9 },
  summaryVal: { color: colors.white, fontSize: 20, fontWeight: '800',
    marginTop: 4 },
  vsep: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.4)' },
  progressOuter: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressInner: { height: '100%', backgroundColor: '#111' },
  progressHint: { color: colors.white, fontSize: 12, marginTop: 8 },
  cardTeal: {
    marginHorizontal: 16,
    marginTop: -8,
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 16,
  },
  goalRow: { flexDirection: 'row', alignItems: 'center' },
  goalLeft: { flex: 1, alignItems: 'center' },
  goalTxt: { color: colors.white, marginTop: 6, fontSize: 12 },
  vsepLight: { width: 1, height: 48, backgroundColor: 'rgba(255,255,255,0.35)' },
  goalRight: { flex: 1, paddingLeft: 12 },
  goalLine: { color: colors.white, fontSize: 12 },
  goalAmt: { color: colors.white, fontWeight: '700', marginTop: 4 },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    backgroundColor: '#DFF7E2',
    borderRadius: 16,
  },
  manageTxt: { color: colors.primary, fontWeight: '700' },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#DFF7E2',
    borderRadius: 20,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 16 },
  tabOn: { backgroundColor: colors.primary },
  tabTxt: { color: colors.text },
  tabTxtOn: { color: colors.white, fontWeight: '700' },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 20,
    fontWeight: '700',
    fontSize: 16,
    color: colors.text,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.expenseBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txTitle: { fontWeight: '700', color: colors.text },
  txSub: { fontSize: 12, color: colors.expenseBlue, marginTop: 2 },
  txAmt: { fontWeight: '700' },
});
