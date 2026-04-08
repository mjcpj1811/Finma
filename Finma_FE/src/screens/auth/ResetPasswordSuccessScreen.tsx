import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import SuccessIcon from '../../../assets/icons/Check Progress.svg';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPasswordSuccess'>;

export const ResetPasswordSuccessScreen = ({ navigation }: Props) => {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <SuccessIcon width={48} height={48} color={colors.white} />
        </View>
        <Text style={styles.title}>Đổi Mật Khẩu Thành Công</Text>

        <Pressable onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })} style={styles.loginButton}>
          <Text style={styles.loginText}>Đăng Nhập Ngay</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIcon: {
    width: 48,
    height: 48,
  },
  title: {
    color: colors.white,
    fontSize: 22,
    lineHeight: 30,
    fontFamily: typography.poppins.semibold,
    marginBottom: 28,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#F1FFF3',
    borderRadius: 14,
    paddingHorizontal: 26,
    paddingVertical: 13,
  },
  loginText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: typography.poppins.semibold,
  },
});
