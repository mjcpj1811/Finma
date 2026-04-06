import { useEffect } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Launch'>;

const LAUNCH_LOGO = require('../../../assets/img/logo-finma.png');

export const LaunchScreen = ({ navigation }: Props) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('WelcomeOne');
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Image source={LAUNCH_LOGO} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brandText}>FinMa</Text>
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
  logo: {
    width: 116,
    height: 116,
    marginBottom: 20,
  },
  brandText: {
    fontSize: 42,
    fontFamily: typography.poppins.bold,
    color: colors.white,
    letterSpacing: 0.3,
  },
});
