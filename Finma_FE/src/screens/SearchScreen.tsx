import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchTransactions } from '../api/finmaApi';
import type { TransactionListItem } from '../api/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { formatVnd } from '../utils/format';

export function SearchScreen() {
  const { token } = useAuth();
  const [q, setQ] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE' | undefined>('EXPENSE');
  const [items, setItems] = useState<TransactionListItem[]>([]);

  const search = async () => {
    if (!token) return;
    const r = await fetchTransactions(token, { q: q.trim() || undefined, type });
    setItems(r.result ?? []);
  };

  return (
    <View style={styles.page}>
      <ScreenHeader title="Tìm Kiếm" />
      <View style={styles.box}>
        <TextInput
          style={styles.search}
          placeholder="Tìm kiếm..."
          value={q}
          onChangeText={setQ}
        />
        <Text style={styles.label}>Report</Text>
        <View style={styles.radioRow}>
          <TouchableOpacity style={styles.radio} onPress={() => setType('INCOME')}>
            <Text>{type === 'INCOME' ? '●' : '○'} Thu Nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.radio} onPress={() => setType('EXPENSE')}>
            <Text>{type === 'EXPENSE' ? '●' : '○'} Chi Tiêu</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.btn} onPress={search}>
          <Text style={styles.btnTxt}>Tìm</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={(x) => String(x.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item: t }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cat}>{t.category}</Text>
              <Text style={styles.note}>{t.note}</Text>
            </View>
            <Text style={{ fontWeight: '800', color: colors.expenseBlue }}>
              {t.type === 'EXPENSE' ? '-' : ''}
              {formatVnd(t.amount)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bgMint },
  box: { padding: 16 },
  search: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 14,
    marginBottom: 16,
  },
  label: { fontWeight: '700', marginBottom: 8 },
  radioRow: { flexDirection: 'row', gap: 24, marginBottom: 16 },
  radio: {},
  btn: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  btnTxt: { color: colors.white, fontWeight: '800' },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cat: { fontWeight: '700' },
  note: { fontSize: 12, color: colors.textMuted },
});
