import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authApi } from '../../api/authApi';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { saveAccessToken } from '../../utils/authTokenStorage';
import { API_CONFIG } from '../../api/config';
import {
  AuthButton,
  AuthInput,
  AuthLayout,
  DividerText,
  FooterInlineLink,
  PasswordInput,
  SocialButtons,
} from './AuthShared';
import EyeOnIcon from '../../../assets/icons/Property 1=Eye-On.svg';
import EyeOffIcon from '../../../assets/icons/Property 1=Eye-Off.svg';
import FacebookIcon from '../../../assets/icons/Facebook.svg';
import GoogleIcon from '../../../assets/icons/Google.svg';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const ENABLE_MOCK_LOGIN = false;

export const LoginScreen = ({ navigation }: Props) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigateToHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

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

      if (!response.accessToken) {
        throw new Error(response.message || 'Đăng nhập thất bại.');
      }

      await saveAccessToken(response.accessToken);

      if (Platform.OS === 'web') {
        navigateToHome();
        return;
      }

      Alert.alert('Đăng nhập', response.message || 'Đăng nhập thành công.', [
        {
          text: 'Vào Home',
          onPress: navigateToHome,
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đăng nhập thất bại';
      Alert.alert('Lỗi', message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    try {
      const authUrl = `${API_CONFIG.baseUrl}/auth/oauth2/authorize/${provider}`;

      if (Platform.OS === 'web') {
        window.location.href = authUrl;
        return;
      }

      // Mobile: dùng expo-web-browser
      const WebBrowser = require('expo-web-browser');
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'http://localhost:8081/oauth-callback'
      );

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const token = url.searchParams.get('token');
        if (token) {
          await saveAccessToken(token);
          navigateToHome();
        }
      }
    } catch (error) {
      const name = provider === 'google' ? 'Google' : 'Facebook';
      Alert.alert('Lỗi', `Đăng nhập ${name} thất bại.`);
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
          eyeIcon={EyeOnIcon}
          eyeOffIcon={EyeOffIcon}
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
        <SocialButtons
          facebookIcon={FacebookIcon}
          googleIcon={GoogleIcon}
          onPressFacebook={() => handleOAuthLogin('facebook')}
          onPressGoogle={() => handleOAuthLogin('google')}
        />
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
