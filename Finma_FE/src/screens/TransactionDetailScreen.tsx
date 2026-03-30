import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { deleteTransaction, getTransactionDetail } from '../api/finmaApi';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import type { TransactionStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { formatVnd } from '../utils/format';

type Nav = NativeStackNavigationProp<TransactionStackParamList, 'TransactionDetail'>;
type R = RouteProp<TransactionStackParamList, 'TransactionDetail'>;

export function TransactionDetailScreen({
  navigation,
  route,
}: {
  navigation: Nav;
  route: R;
}) {
  const { token } = useAuth();
  const { id } = route.params;
  const [data, setData] = useState<{
    type: string;
    amount: number | string;
    categoryName?: string;
    accountName?: string;
    note?: string;
    transactionDate: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await getTransactionDetail(token, id);
      setData(r.result as never);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onDelete = () => {
    if (!token) return;
    Alert.alert('Xóa?', 'Giao dịch sẽ bị xóa', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(token, id);
            navigation.navigate('TransactionList');
          } catch (e: unknown) {
            Alert.alert('Lỗi', e instanceof Error ? e.message : 'Xóa thất bại');
          }
        },
      },
    ]);
  };

  if (loading || !data) {
    return (
      <View style={styles.page}>
        <ScreenHeader title="Chi tiết" onBack={() => navigation.goBack()} />
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <ScreenHeader title="Chi tiết" onBack={() => navigation.goBack()} />
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.k}>Loại: </Text>
          <Text>{data.type}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.k}>Số tiền: </Text>
          <Text>{formatVnd(data.amount)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.k}>Danh mục: </Text>
          <Text>{data.categoryName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.k}>Tài khoản: </Text>
          <Text>{data.accountName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.k}>Thời gian: </Text>
          <Text>{data.transactionDate}</Text>
        </View>
        {data.note ? (
          <View style={styles.row}>
            <Text style={styles.k}>Ghi chú: </Text>
            <Text style={{ flex: 1 }}>{data.note}</Text>
          </View>
        ) : null}
      </View>
      <TouchableOpacity style={styles.del} onPress={onDelete}>
        <Text style={styles.delTxt}>Xóa giao dịch</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bgMint },
  card: {
    margin: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
  },
  row: {
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  k: { fontWeight: '700' },
  del: {
    marginHorizontal: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c00',
    borderRadius: 12,
  },
  delTxt: { color: '#c00', fontWeight: '700' },
});
