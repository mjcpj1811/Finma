import { useEffect } from 'react';
import { ActivityIndicator, Platform, View, Text, StyleSheet } from 'react-native';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { saveAccessToken } from '../../utils/authTokenStorage';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'OAuthCallback'>;

export const OAuthCallbackScreen = ({ navigation }: Props) => {
  useEffect(() => {
    const handleToken = async () => {
      let token: string | null = null;

      if (Platform.OS === 'web') {
        const params = new URLSearchParams(window.location.search);
        token = params.get('token');
      }

      if (token) {
        await saveAccessToken(token);
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } else {
        navigation.replace('Login');
      }
    };

    handleToken();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>Đang xử lý đăng nhập...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    gap: 12,
  },
  text: {
    color: colors.white,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
});
