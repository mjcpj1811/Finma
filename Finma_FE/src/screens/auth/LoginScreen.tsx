import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authApi } from '../../api/authApi';
import { RootStackParamList } from '../../navigation/RootNavigator';
import {
  AuthButton,
  AuthInput,
  AuthLayout,
  DividerText,
  FooterInlineLink,
  PasswordInput,
  SocialButtons,
} from './AuthShared';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const ICON_EYE = require('../../../assets/icons/Eye.png');
const ICON_EYE_OFF = require('../../../assets/icons/Eye-Pass.png');
const ICON_FACEBOOK = require('../../../assets/icons/Facebook.png');
const ICON_GOOGLE = require('../../../assets/icons/Google.png');

const ENABLE_MOCK_LOGIN = true;

export const LoginScreen = ({ navigation }: Props) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (ENABLE_MOCK_LOGIN) {
      navigation.replace('Home');
      return;
    }

    if (!usernameOrEmail || !password) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tài khoản và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login({ usernameOrEmail, password });
      Alert.alert('Đăng nhập', response.message || 'Đăng nhập thành công.', [
        {
          text: 'Vào Home',
          onPress: () => navigation.replace('Home'),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đăng nhập thất bại';
      Alert.alert('Lỗi', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Chào bạn, hãy đăng nhập để tiếp tục">
      <View style={styles.topSection}>
        <AuthInput
          label="Tên Đăng Nhập / Email"
          value={usernameOrEmail}
          onChangeText={setUsernameOrEmail}
          placeholder="example@example.com"
          keyboardType="email-address"
        />

        <PasswordInput
          label="Mật Khẩu"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          eyeIcon={ICON_EYE}
          eyeOffIcon={ICON_EYE_OFF}
        />

        <View style={styles.actionGroup}>
          <AuthButton title={loading ? 'Đang xử lý...' : 'Đăng nhập'} onPress={onLogin} disabled={loading} />

          <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </Pressable>

          <AuthButton title="Đăng ký" variant="secondary" onPress={() => navigation.navigate('Register')} />
        </View>
      </View>

      <View style={styles.bottomSection}>
        <DividerText text="hoặc đăng nhập với" />
        <SocialButtons facebookIcon={ICON_FACEBOOK} googleIcon={ICON_GOOGLE} />
        <FooterInlineLink prefix="Chưa có tài khoản?" linkText="Đăng ký" onPress={() => navigation.navigate('Register')} />
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  topSection: {
    marginTop: 30,
  },
  actionGroup: {
    gap: 10,
    marginTop: 30,
  },
  bottomSection: {
    // marginTop: 'auto',
    paddingTop: 100,
  },
  forgotText: {
    textAlign: 'center',
    color: colors.text,
    fontSize: 13,
    fontFamily: typography.poppins.medium,
  },
});
