import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authApi } from '../../api/authApi';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { AuthButton, AuthLayout, PasswordInput } from './AuthShared';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

const ICON_EYE = require('../../../assets/icons/Eye.png');
const ICON_EYE_OFF = require('../../../assets/icons/Eye-Pass.png');

export const ResetPasswordScreen = ({ navigation, route }: Props) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { email, code } = route.params;

  const onReset = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đủ mật khẩu mới và xác nhận.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Mật khẩu chưa khớp', 'Vui lòng kiểm tra lại phần xác nhận mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.resetPassword({
        email,
        code,
        newPassword,
        confirmPassword,
      });
      Alert.alert('Đổi mật khẩu', response.message || 'Đổi mật khẩu thành công.', [
        {
          text: 'OK',
          onPress: () => navigation.replace('ResetPasswordSuccess'),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể đổi mật khẩu';
      Alert.alert('Lỗi', message);
    } finally {
      setLoading(false);
    }
  };

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
        label="Xác Nhận"
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
});
