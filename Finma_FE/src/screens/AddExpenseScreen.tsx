import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createTransaction, fetchAccounts, fetchCategories } from '../api/finmaApi';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import type { TransactionStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { toApiDateTime } from '../utils/format';
import type { RouteProp } from '@react-navigation/native';

type Nav = NativeStackNavigationProp<TransactionStackParamList, 'AddExpense'>;
type R = RouteProp<TransactionStackParamList, 'AddExpense'>;

export function AddExpenseScreen({
  navigation,
  route,
}: {
  navigation: Nav;
  route: R;
}) {
  const mode = route.params?.mode ?? 'EXPENSE';
  const { token } = useAuth();
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [catId, setCatId] = useState<number | null>(null);
  const [accId, setAccId] = useState<number | null>(null);
  const [cats, setCats] = useState<{ id: number; name: string }[]>([]);
  const [accs, setAccs] = useState<{ id: number; name: string }[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const [accOpen, setAccOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const ct = mode === 'INCOME' ? 'INCOME' : 'EXPENSE';
      const [c, a] = await Promise.all([
        fetchCategories(token, ct),
        fetchAccounts(token),
      ]);
      setCats(c.result?.map((x) => ({ id: x.id, name: x.name })) ?? []);
      setAccs(a.result?.map((x) => ({ id: x.id, name: x.name })) ?? []);
    })().catch(() => undefined);
  }, [token, mode]);

  const onSave = async () => {
    if (!token || !catId || !accId) {
      Alert.alert('Lỗi', 'Chọn danh mục và nguồn tiền');
      return;
    }
    const num = Number(amount.replace(/[^\d]/g, ''));
    if (!num || num <= 0) {
      Alert.alert('Lỗi', 'Số tiền phải > 0');
      return;
    }
    setSaving(true);
    try {
      const body = {
        type: mode,
        amount: num,
        categoryId: catId,
        accountId: accId,
        note: note || title || undefined,
        transactionDate: toApiDateTime(date),
      };
      await createTransaction(token, body);
      Alert.alert('Thành công', 'Đã lưu giao dịch', [
        { text: 'OK', onPress: () => navigation.navigate('TransactionList') },
      ]);
    } catch (e: unknown) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không lưu được');
    } finally {
      setSaving(false);
    }
  };

  const titleStr = mode === 'INCOME' ? 'Thêm Thu Nhập' : 'Thêm Chi Tiêu';

  return (
    <View style={styles.page}>
      <ScreenHeader
        title={titleStr}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>Ngày</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
          <Text>{toApiDateTime(date)}</Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, d) => {
              if (Platform.OS === 'android') {
                setShowPicker(false);
              }
              if (event.type === 'dismissed') {
                if (Platform.OS === 'ios') setShowPicker(false);
                return;
              }
              if (d) setDate(d);
            }}
          />
        )}

        <Text style={styles.label}>Danh Mục</Text>
        <TouchableOpacity style={styles.input} onPress={() => setCatOpen(true)}>
          <Text>{cats.find((c) => c.id === catId)?.name || 'Chọn danh mục'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Số Tiền</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholder="30,000"
        />

        <Text style={styles.label}>Tiêu Đề</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Nguồn Tiền</Text>
        <TouchableOpacity style={styles.input} onPress={() => setAccOpen(true)}>
          <Text>{accs.find((a) => a.id === accId)?.name || 'Chọn nguồn tiền'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Nhập Chi Tiết</Text>
        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          multiline
          value={note}
          onChangeText={setNote}
          placeholder="Ghi chú"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={onSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveTxt}>Lưu</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={catOpen} transparent animationType="slide">
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setCatOpen(false)}>
          <View style={styles.modalBox}>
            {cats.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.opt}
                onPress={() => {
                  setCatId(c.id);
                  setCatOpen(false);
                }}
              >
                <Text>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={accOpen} transparent animationType="slide">
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setAccOpen(false)}>
          <View style={styles.modalBox}>
            {accs.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.opt}
                onPress={() => {
                  setAccId(a.id);
                  setAccOpen(false);
                }}
              >
                <Text>{a.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bgMint },
  form: { padding: 16, paddingBottom: 40 },
  label: { fontWeight: '700', marginBottom: 6, color: colors.text },
  input: {
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  saveTxt: { color: colors.white, fontWeight: '800', fontSize: 16 },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: colors.white,
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '50%',
  },
  opt: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
});
