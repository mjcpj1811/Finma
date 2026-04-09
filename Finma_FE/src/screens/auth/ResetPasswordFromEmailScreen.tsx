import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authApi } from '../../api/authApi';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { AuthButton, AuthLayout, PasswordInput } from './AuthShared';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPasswordFromEmail'>;

const ICON_EYE = require('../../../assets/icons/Eye.png');
const ICON_EYE_OFF = require('../../../assets/icons/Eye-Pass.png');

export const ResetPasswordFromEmailScreen = ({ navigation, route }: Props) => {
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Lấy token từ route params (React Navigation tự parse query params từ deep link)
  // Hoặc fallback lấy từ window.location trên web
  useEffect(() => {
    const paramToken = route.params?.token;

    if (paramToken) {
      setToken(paramToken);
      return;
    }

    // Fallback cho web nếu param không có
    if (Platform.OS === 'web') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        setToken(urlToken);
        return;
      }
    }

    Alert.alert('Lỗi', 'Không tìm thấy token. Vui lòng thử lại từ email.');
    navigation.replace('Login');
  }, [navigation, route.params]);

  const onReset = async () => {
    if (!token) {
      Alert.alert('Lỗi', 'Token không hợp lệ.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đủ mật khẩu mới và xác nhận.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Mật khẩu chưa khớp', 'Vui lòng kiểm tra lại phần xác nhận mật khẩu.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPasswordByToken({
        token,
        newPassword,
      });
      Alert.alert('Thành công', 'Mật khẩu đã được đổi thành công!', [
        {
          text: 'Đăng nhập',
          onPress: () => navigation.replace('Login'),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể đổi mật khẩu';
      Alert.alert('Lỗi', message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang xử lý...</Text>
      </View>
    );
  }

  return (
    <AuthLayout title="Đặt mật khẩu mới" contentMode="center">
      <PasswordInput
        label="Nhập Mật Khẩu Mới"
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="••••••••"
        eyeIcon={ICON_EYE}
        eyeOffIcon={ICON_EYE_OFF}
      />
      <PasswordInput
        label="Xác Nhận Mật Khẩu"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="••••••••"
        eyeIcon={ICON_EYE}
        eyeOffIcon={ICON_EYE_OFF}
      />

      <View style={styles.submitWrap}>
        <AuthButton title={loading ? 'Đang xử lý...' : 'Đổi Mật Khẩu'} onPress={onReset} disabled={loading} />
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  submitWrap: {
    marginTop: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    gap: 12,
  },
  loadingText: {
    color: colors.white,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
});
