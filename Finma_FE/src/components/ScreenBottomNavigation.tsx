import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type RootStackParamList } from '../navigation/RootNavigator';
import { BottomNavBar, type TabKey } from './BottomNavBar';

type Props = {
  activeTab: TabKey;
};

const targetRouteByTab: Record<TabKey, 'Home' | 'Report' | 'Transactions' | 'Categories' | 'Profile'> = {
  home: 'Home',
  report: 'Report',
  exchange: 'Transactions',
  layers: 'Categories',
  profile: 'Profile',
};

export const ScreenBottomNavigation = ({ activeTab }: Props) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 2) : Math.max(insets.bottom, 6);
  const sideInset = Platform.OS === 'android' ? insets.left + insets.right : 0;
  const bottomOffset = Platform.OS === 'ios' ? -insets.bottom : 0;

  return (
    <View
      style={[
        styles.fixedBottomNav,
        {
          bottom: bottomOffset,
          paddingBottom: bottomPadding,
          paddingLeft: 18 + (sideInset > 0 ? insets.left : 0),
          paddingRight: 18 + (sideInset > 0 ? insets.right : 0),
        },
      ]}
    >
      <BottomNavBar
        activeTab={activeTab}
        onPress={(tab) => {
          navigation.navigate(targetRouteByTab[tab]);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fixedBottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    backgroundColor: '#DFF7E2',
    borderTopWidth: 1,
    borderColor: '#E1EDE6',
    paddingTop: 6,
  },
});
