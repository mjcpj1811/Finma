import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { fetchReportPie, fetchTransactions } from '../api/finmaApi';
import type { PieItem, TransactionListItem } from '../api/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { formatVnd, toYmd } from '../utils/format';
import type { ReportStackParamList } from '../navigation/types';

type CalNav = NativeStackNavigationProp<ReportStackParamList, 'Calendar'>;

export function CalendarScreen() {
  const navigation = useNavigation<CalNav>();
  const { token } = useAuth();
  const [day, setDay] = useState(new Date());
  const [mode, setMode] = useState<'pie' | 'list'>('pie');
  const [pie, setPie] = useState<PieItem[]>([]);
  const [list, setList] = useState<TransactionListItem[]>([]);

  const ymd = toYmd(day);

  const load = useCallback(async () => {
    if (!token) return;
    const p = await fetchReportPie(token, ymd, ymd);
    setPie(p.result ?? []);
    const t = await fetchTransactions(token, { from: ymd, to: ymd });
    setList(t.result ?? []);
  }, [token, ymd]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
    }, [load])
  );

  return (
    <View style={styles.page}>
      <ScreenHeader title="Lịch" onBack={() => navigation.goBack()} />
      <View style={styles.pad}>
        <Text style={styles.dateLbl}>Ngày đang xem: {ymd}</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.dayBtn}
            onPress={() => {
              const d = new Date(day);
              d.setDate(d.getDate() - 1);
              setDay(d);
            }}
          >
            <Text>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dayBtn}
            onPress={() => {
              const d = new Date(day);
              d.setDate(d.getDate() + 1);
              setDay(d);
            }}
          >
            <Text>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.seg}>
          <TouchableOpacity
            style={[styles.segBtn, mode === 'list' && styles.segOn]}
            onPress={() => setMode('list')}
          >
            <Text style={mode === 'list' ? styles.segTxtOn : styles.segTxt}>Giao Dịch</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segBtn, mode === 'pie' && styles.segOn]}
            onPress={() => setMode('pie')}
          >
            <Text style={mode === 'pie' ? styles.segTxtOn : styles.segTxt}>Danh Mục</Text>
          </TouchableOpacity>
        </View>

        {mode === 'pie' ? (
          <FlatList
            data={pie}
            keyExtractor={(x) => x.category}
            ListEmptyComponent={<Text style={styles.empty}>Không có dữ liệu chi tiêu</Text>}
            renderItem={({ item }) => (
              <View style={styles.pieRow}>
                <View style={[styles.dot, { backgroundColor: colors.expenseBlue }]} />
                <Text style={{ flex: 1 }}>{item.category}</Text>
                <Text style={{ fontWeight: '700' }}>{formatVnd(item.amount)}</Text>
              </View>
            )}
          />
        ) : (
          <FlatList
            data={list}
            keyExtractor={(x) => String(x.id)}
            ListEmptyComponent={<Text style={styles.empty}>Không có giao dịch</Text>}
            renderItem={({ item: t }) => (
              <View style={styles.txRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txCat}>{t.category}</Text>
                  <Text style={styles.txTime}>{t.transactionDateTime}</Text>
                </View>
                <Text style={{ color: t.type === 'EXPENSE' ? colors.expenseBlue : colors.black, fontWeight: '800' }}>
                  {t.type === 'EXPENSE' ? '-' : ''}
                  {formatVnd(t.amount)}
                </Text>
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
  pad: { padding: 16, flex: 1 },
  dateLbl: { fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  dayBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  seg: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  segBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#DFF7E2',
  },
  segOn: { backgroundColor: colors.primary },
  segTxt: { color: colors.text },
  segTxtOn: { color: colors.white, fontWeight: '800' },
  pieRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txCat: { fontWeight: '700' },
  txTime: { fontSize: 12, color: colors.expenseBlue, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 24, color: colors.textMuted },
});
