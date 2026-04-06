import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authApi } from '../../api/authApi';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { AuthButton, AuthInput, AuthLayout, FooterInlineLink, PasswordInput } from './AuthShared';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const ICON_EYE = require('../../../assets/icons/Eye.png');
const ICON_EYE_OFF = require('../../../assets/icons/Eye-Pass.png');

export const RegisterScreen = ({ navigation }: Props) => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    if (!username || !fullName || !email || !phone || !birthDate || !password || !confirmPassword) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các trường.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Mật khẩu chưa khớp', 'Vui lòng nhập lại xác nhận mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.register({
        username,
        fullName,
        email,
        phone,
        birthDate,
        password,
        confirmPassword,
      });
      Alert.alert('Đăng ký', response.message || 'Tạo tài khoản thành công.', [
        {
          text: 'Đăng nhập',
          onPress: () => navigation.replace('Login'),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đăng ký thất bại';
      Alert.alert('Lỗi', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Đăng ký">
      <AuthInput label="Tên đăng nhập" value={username} onChangeText={setUsername} placeholder="finma_user" />
      <AuthInput label="Họ Tên" value={fullName} onChangeText={setFullName} placeholder="Nguyễn Văn A" autoCapitalize="words" />
      <AuthInput
        label="Địa chỉ email"
        value={email}
        onChangeText={setEmail}
        placeholder="example@example.com"
        keyboardType="email-address"
      />
      <AuthInput label="Số Điện Thoại" value={phone} onChangeText={setPhone} placeholder="+84 9xx xxx xxx" keyboardType="phone-pad" />
      <AuthInput label="Ngày Sinh" value={birthDate} onChangeText={setBirthDate} placeholder="Ngày / Tháng / Năm" />

      <PasswordInput
        label="Mật Khẩu"
        value={password}
        onChangeText={setPassword}
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
        <AuthButton title={loading ? 'Đang xử lý...' : 'Đăng Ký'} onPress={onRegister} disabled={loading} />
      </View>

      <FooterInlineLink prefix="Đã có tài khoản?" linkText="Đăng nhập" onPress={() => navigation.replace('Login')} />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  submitWrap: {
    marginTop: 4,
  },
});
