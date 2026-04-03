import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { BottomNavBar } from '../../components/BottomNavBar';
import { transactionApi } from '../../api/transactionApi';
import { type TransactionDetail } from '../../types/transaction';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'TransactionDetail'>;

const iconByKey: Record<TransactionDetail['iconKey'], { name: keyof typeof MaterialIcons.glyphMap; bg: string }> = {
  salary: { name: 'inventory-2', bg: '#4D9EFF' },
  food: { name: 'shopping-bag', bg: '#4D9EFF' },
  rent: { name: 'home', bg: '#4D9EFF' },
  transport: { name: 'directions-bus', bg: '#4D9EFF' },
  other: { name: 'restaurant-menu', bg: '#A8A8FF' },
};

const formatCurrency = (value: number) => value.toLocaleString('vi-VN');
const formatDate = (value: string) => new Date(value).toLocaleDateString('vi-VN');

export const TransactionDetailScreen = ({ navigation, route }: Props) => {
  const { transactionId } = route.params;

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true);
      try {
        const response = await transactionApi.getTransactionDetail(transactionId);
        setTransaction(response);
      } catch {
        setTransaction(null);
      } finally {
        setLoading(false);
      }
    };

    void loadDetail();
  }, [transactionId]);

  const onDelete = () => {
    Alert.alert('Xóa giao dịch', 'Bạn có chắc muốn xóa giao dịch này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await transactionApi.deleteTransaction(transactionId);
            navigation.goBack();
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loading || !transaction) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải chi tiết giao dịch...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const iconMeta = iconByKey[transaction.iconKey];

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title="Chi Tiết Giao Dịch"
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
      />

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentWrap}>
          <View style={styles.heroCard}>
            <View style={[styles.heroIconWrap, { backgroundColor: iconMeta.bg }]}>
              <MaterialIcons name={iconMeta.name} size={26} color={colors.white} />
            </View>
            <Text style={styles.heroTitle}>{transaction.title}</Text>
            <Text style={styles.heroAmount}>
              {transaction.type === 'expense' ? '-' : ''}
              {formatCurrency(transaction.amount)}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngày</Text>
              <Text style={styles.infoValue}>{formatDate(transaction.date)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Loại</Text>
              <Text style={styles.infoValue}>{transaction.type === 'expense' ? 'Chi Tiêu' : 'Thu Nhập'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Danh mục</Text>
              <Text style={styles.infoValue}>{transaction.categoryLabel}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nguồn tiền</Text>
              <Text style={styles.infoValue}>{transaction.sourceLabel}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ghi chú</Text>
              <Text style={styles.infoValue}>{transaction.detail || transaction.note || '-'}</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              style={styles.editButton}
              onPress={() => navigation.navigate('AddTransaction', { transactionId })}
            >
              <Text style={styles.editText}>Sửa</Text>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={onDelete} disabled={deleting}>
              <Text style={styles.deleteText}>{deleting ? 'Đang xóa...' : 'Xóa'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>

      <View style={styles.fixedBottomNav}>
        <BottomNavBar
          activeTab="exchange"
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
    paddingHorizontal: 16,
    paddingTop: 8,
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
  headerRightSlot: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.poppins.semibold,
    fontSize: 24,
    lineHeight: 28,
    textAlign: 'center',
  },
  mainPanel: {
    flex: 1,
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    paddingHorizontal: 18,
    paddingTop: 20,
    marginTop: 8,
  },
  contentWrap: {
    paddingBottom: 110,
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#DFF7E2',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 18,
  },
  heroAmount: {
    color: colors.blueDark,
    fontFamily: typography.poppins.bold,
    fontSize: 24,
  },
  infoCard: {
    backgroundColor: '#DFF7E2',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  infoLabel: {
    color: '#55716A',
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  editButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editText: {
    color: colors.white,
    fontFamily: typography.poppins.semibold,
    fontSize: 15,
  },
  deleteButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F06D6D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: colors.white,
    fontFamily: typography.poppins.semibold,
    fontSize: 15,
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
  fixedBottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#DFF7E2',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 10,
  },
});
