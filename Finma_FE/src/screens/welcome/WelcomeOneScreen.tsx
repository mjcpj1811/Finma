import { Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'WelcomeOne'>;

const WELCOME_ONE_IMAGE = require('../../../assets/img/onboarding-1.png');

export const WelcomeOneScreen = ({ navigation }: Props) => {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.wrapper}>
        <Text style={styles.title}>Chào mừng đến với{"\n"}ứng dụng quản lý{"\n"}chi tiêu</Text>

        <View style={styles.card}>
          <View style={styles.illustrationCircle}>
            <Image source={WELCOME_ONE_IMAGE} style={styles.illustration} resizeMode="contain" />
          </View>

          <Pressable onPress={() => navigation.navigate('WelcomeTwo')} style={styles.nextButton}>
            <Text style={styles.nextText}>Tiếp</Text>
          </Pressable>

          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  wrapper: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
  },
  title: {
    color: colors.text,
    fontSize: 33,
    lineHeight: 43,
    fontFamily: typography.poppins.bold,
    textAlign: 'center',
    marginTop: 24,
  },
  card: {
    width: '100%',
    minHeight: '70%',
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 24,
    paddingBottom: 44,
  },
  illustrationCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.bgGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 54,
  },
  illustration: {
    width: 210,
    height: 210,
  },
  nextButton: {
    paddingHorizontal: 26,
    paddingVertical: 10,
  },
  nextText: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontFamily: typography.poppins.semibold,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C7D2D0',
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
});
