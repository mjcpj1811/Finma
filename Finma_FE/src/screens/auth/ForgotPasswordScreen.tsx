import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authApi } from '../../api/authApi';
import { RootStackParamList } from '../../navigation/RootNavigator';
import {
  AuthButton,
  AuthInput,
  AuthLayout,
  DividerText,
  FooterInlineLink,
  SocialButtons,
} from './AuthShared';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ICON_FACEBOOK = require('../../../assets/icons/Facebook.png');
const ICON_GOOGLE = require('../../../assets/icons/Google.png');

export const ForgotPasswordScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const onContinue = async () => {
    if (!email) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.forgotPassword({ email });
      Alert.alert('Xác nhận', response.message || 'Mã xác minh đã được gửi.', [
        {
          text: 'Nhập mã',
          onPress: () => navigation.navigate('VerifyResetCode', { email }),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể gửi email xác minh';
      Alert.alert('Lỗi', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Quên mật khẩu">
      <View style={styles.topSection}>
        <AuthInput
          label="Nhập Email"
          value={email}
          onChangeText={setEmail}
          placeholder="example@example.com"
          keyboardType="email-address"
        />

        <View style={styles.submitWrap}>
          <AuthButton title={loading ? 'Đang gửi...' : 'Tiếp Tục'} onPress={onContinue} disabled={loading} />
        </View>
      </View>

      <View style={styles.bottomWrap}>
        <AuthButton title="Đăng Ký" variant="secondary" onPress={() => navigation.navigate('Register')} />
        <DividerText text="hoặc đăng nhập với" />
        <SocialButtons facebookIcon={ICON_FACEBOOK} googleIcon={ICON_GOOGLE} />
        <FooterInlineLink prefix="Đã có tài khoản?" linkText="Đăng nhập" onPress={() => navigation.replace('Login')} />
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  topSection: {
    marginTop: 6,
  },
  submitWrap: {
    marginTop: 26,
  },
  bottomWrap: {
    marginTop: 24,
    paddingTop: 8,
  },
});
