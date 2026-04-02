import { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomNavBar } from '../../components/BottomNavBar';
import { NotificationBellButton } from '../../components/NotificationBellButton';
import { profileApi } from '../../api/profileApi';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'SettingsDeleteAccount'>;

export const SettingsDeleteAccountScreen = ({ navigation }: Props) => {
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const onDelete = async () => {
    setDeleting(true);
    try {
      const response = await profileApi.deleteAccount({ password });
      if (!response.success) {
        Alert.alert('Lỗi', response.message || 'Không thể xóa tài khoản.');
        return;
      }

      Alert.alert('Đã xóa tài khoản', 'Tài khoản đã được xóa thành công.');
      navigation.navigate('Login');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color={colors.white} />
        </Pressable>

        <Text style={styles.headerTitle}>Xóa Tài Khoản</Text>

        <View style={styles.headerRightSlot}>
          <NotificationBellButton size={30} onPress={() => navigation.navigate('Notifications')} />
        </View>
      </View>

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          <Text style={styles.warningText}>Bạn Có Chắc Chắn Muốn Xóa Tài Khoản?</Text>

          <View style={styles.noteCard}>
            <Text style={styles.noteText}>
              Hành động này sẽ xóa vĩnh viễn toàn bộ dữ liệu của bạn và bạn sẽ không thể khôi phục lại được.
            </Text>
            <Text style={styles.noteText}>- Tất cả các khoản chi tiêu, thu nhập sẽ bị xóa.</Text>
            <Text style={styles.noteText}>- Dữ liệu cài đặt và lịch sử sẽ bị xóa.</Text>
            <Text style={styles.noteText}>- Bạn sẽ không thể đăng nhập lại tài khoản này.</Text>
          </View>

          <Text style={styles.confirmText}>
            Vui lòng nhập Mật Khẩu của Bạn Để Xác Nhận Việc Xóa Tài Khoản.
          </Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            placeholder="Nhập mật khẩu"
            placeholderTextColor={colors.textMuted}
          />

          <Pressable style={styles.deleteButton} onPress={onDelete} disabled={deleting}>
            <Text style={styles.deleteButtonText}>{deleting ? 'Đang xóa...' : 'Xóa Tài Khoản'}</Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </Pressable>
        </ScrollView>
      </View>

      <View style={styles.fixedBottomNav}>
        <BottomNavBar
          activeTab="profile"
          onPress={(tab) => {
            if (tab === 'home') navigation.navigate('Home');
            if (tab === 'report') navigation.navigate('Report');
            if (tab === 'exchange') navigation.navigate('Transactions');
            if (tab === 'layers') navigation.navigate('Categories');
            if (tab === 'profile') navigation.navigate('Profile');
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
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerRightSlot: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 24,
    lineHeight: 28,
  },
  mainPanel: {
    flex: 1,
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    marginTop: 22,
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  panelContent: { paddingBottom: 110 },
  warningText: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  noteCard: {
    backgroundColor: '#DFF7E2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 6,
  },
  noteText: {
    color: colors.textSecondary,
    fontFamily: typography.poppins.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  confirmText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },
  input: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#DFF7E2',
    paddingHorizontal: 14,
    color: colors.text,
    fontFamily: typography.poppins.regular,
    fontSize: 14,
    marginBottom: 14,
  },
  deleteButton: {
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  deleteButtonText: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 13,
  },
  cancelButton: {
    minHeight: 36,
    borderRadius: 18,
    backgroundColor: '#D4ECDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 13,
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
