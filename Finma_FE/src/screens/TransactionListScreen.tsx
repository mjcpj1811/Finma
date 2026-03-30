import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchReportSummary, fetchTransactions } from '../api/finmaApi';
import type { TransactionListItem } from '../api/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import type { TransactionStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { formatVnd } from '../utils/format';

type Nav = NativeStackNavigationProp<TransactionStackParamList, 'TransactionList'>;

export function TransactionListScreen({ navigation }: { navigation: Nav }) {
  const { token } = useAuth();
  const [items, setItems] = useState<TransactionListItem[]>([]);
  const [balance, setBalance] = useState('—');
  const [inc, setInc] = useState('—');
  const [exp, setExp] = useState('—');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'INCOME' | 'EXPENSE' | 'ALL'>('ALL');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const sum = await fetchReportSummary(token);
      setBalance(formatVnd(sum.result.balance));
      setInc(formatVnd(sum.result.totalIncome));
      setExp(formatVnd(sum.result.totalExpense));
      const list = await fetchTransactions(token, {
        type: tab === 'ALL' ? undefined : tab,
      });
      setItems(list.result ?? []);
    } finally {
      setLoading(false);
    }
  }, [token, tab]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    if (tab === 'ALL') return items;
    return items.filter((x) => x.type === tab);
  }, [items, tab]);

  const dataForList = useMemo(() => {
    const map = new Map<string, TransactionListItem[]>();
    for (const t of filtered) {
      const key = t.date?.slice(0, 7) || '—';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <View style={styles.page}>
      <ScreenHeader
        title="Giao Dịch"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />
      <View style={styles.green}>
        <View style={styles.balanceCard}>
          <Text style={styles.balLabel}>Tổng Số Dư</Text>
          <Text style={styles.balVal}>{balance}</Text>
        </View>
        <View style={styles.row2}>
          <View style={[styles.smallCard, { marginRight: 8 }]}>
            <Ionicons name="trending-up" size={18} color={colors.primary} />
            <Text style={styles.smLabel}>Thu Nhập</Text>
            <Text style={styles.smVal}>{inc}</Text>
          </View>
          <View style={[styles.smallCard, { marginLeft: 8, backgroundColor: colors.expenseBlue }]}>
            <Ionicons name="trending-down" size={18} color={colors.white} />
            <Text style={[styles.smLabel, { color: colors.white }]}>Chi Tiêu</Text>
            <Text style={[styles.smVal, { color: colors.white }]}>{exp}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.tabRow}>
          {(['ALL', 'INCOME', 'EXPENSE'] as const).map((x) => (
            <TouchableOpacity
              key={x}
              style={[styles.tabChip, tab === x && styles.tabChipOn]}
              onPress={() => setTab(x === 'ALL' ? 'ALL' : x)}
            >
              <Text style={[styles.tabChipTxt, tab === x && styles.tabChipTxtOn]}>
                {x === 'ALL' ? 'Tất cả' : x === 'INCOME' ? 'Thu' : 'Chi'}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => navigation.navigate('AddExpense', { mode: 'EXPENSE' })}>
            <Ionicons name="add-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
        ) : (
          <FlatList
            data={dataForList}
            keyExtractor={(x) => x[0]}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
            renderItem={({ item: [month, rows] }) => (
              <View>
                <Text style={styles.month}>{month}</Text>
                {rows.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.txRow}
                    onPress={() => navigation.navigate('TransactionDetail', { id: t.id })}
                  >
                    <View style={styles.txIcon}>
                      <Ionicons name="wallet-outline" size={18} color={colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txCat}>{t.category}</Text>
                      <Text style={styles.txTime}>{t.transactionDateTime || t.date}</Text>
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
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bgMint },
  green: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  balanceCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  balLabel: { color: colors.textMuted, fontSize: 13 },
  balVal: { fontSize: 28, fontWeight: '800', color: colors.black, marginTop: 4 },
  row2: { flexDirection: 'row' },
  smallCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
  },
  smLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  smVal: { fontSize: 16, fontWeight: '800', marginTop: 4, color: colors.black },
  sheet: {
    flex: 1,
    backgroundColor: colors.bgMint,
    marginTop: -12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  tabRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: colors.white,
  },
  tabChipOn: { backgroundColor: colors.primary },
  tabChipTxt: { fontSize: 12, color: colors.text },
  tabChipTxtOn: { color: colors.white, fontWeight: '700' },
  month: { fontWeight: '700', marginVertical: 8, color: colors.text },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.expenseBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  txCat: { fontWeight: '700', color: colors.text },
  txTime: { fontSize: 12, color: colors.expenseBlue, marginTop: 2 },
  txAmt: { fontWeight: '800' },
});
