import { Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'WelcomeTwo'>;

const WELCOME_TWO_IMAGE = require('../../../assets/img/onboarding-2.png');

export const WelcomeTwoScreen = ({ navigation }: Props) => {
  const onNext = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.wrapper}>
        <Text style={styles.title}>Bạn đã sẵn sàng tự{"\n"}kiểm soát tài chính{"\n"}của mình chưa?</Text>

        <View style={styles.card}>
          <View style={styles.illustrationCircle}>
            <Image source={WELCOME_TWO_IMAGE} style={styles.illustration} resizeMode="contain" />
          </View>

          <Pressable onPress={onNext} style={styles.nextButton}>
            <Text style={styles.nextText}>Tiếp</Text>
          </Pressable>

          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
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
    minHeight: '68%',
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
