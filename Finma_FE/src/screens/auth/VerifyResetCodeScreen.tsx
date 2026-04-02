import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authApi } from '../../api/authApi';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { AuthButton, AuthInput, AuthLayout } from './AuthShared';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyResetCode'>;

export const VerifyResetCodeScreen = ({ navigation, route }: Props) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const { email } = route.params;

  const onVerify = async () => {
    if (!code) {
      Alert.alert('Thiếu mã xác minh', 'Vui lòng nhập mã nhận được từ email.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.verifyResetCode({ email, code });
      Alert.alert('Xác minh', response.message || 'Mã xác minh hợp lệ.', [
        {
          text: 'Tiếp tục',
          onPress: () => navigation.navigate('ResetPassword', { email, code }),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Mã xác minh không hợp lệ';
      Alert.alert('Lỗi', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Xác minh mã" contentMode="center">
      <Text style={styles.helperText}>Nhập mã xác minh đã gửi tới {email}</Text>
      <AuthInput label="Mã xác minh" value={code} onChangeText={setCode} placeholder="VD: 123456" keyboardType="default" />

      <View style={styles.submitWrap}>
        <AuthButton title={loading ? 'Đang xác minh...' : 'Xác minh'} onPress={onVerify} disabled={loading} />
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  helperText: {
    color: colors.textSecondary,
    marginBottom: 18,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.poppins.regular,
  },
  submitWrap: {
    marginTop: 14,
  },
});
