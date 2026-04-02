import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'SettingsPasswordSuccess'>;

export const SettingsPasswordSuccessScreen = ({ navigation }: Props) => {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="done" size={36} color={colors.white} />
        </View>
        <Text style={styles.text}>Đổi Mật Khẩu Thành Công</Text>
      </View>

      <Pressable style={styles.button} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.buttonText}>Quay Lại Cài Đặt</Text>
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    gap: 20,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#A6F0DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.white,
    fontFamily: typography.poppins.semibold,
    fontSize: 20,
  },
  button: {
    position: 'absolute',
    bottom: 48,
    minWidth: 160,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#A6F0DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 14,
  },
});
