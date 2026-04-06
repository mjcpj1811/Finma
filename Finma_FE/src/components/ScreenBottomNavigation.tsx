import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
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

  return (
    <View style={styles.fixedBottomNav}>
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
    bottom: 0,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    backgroundColor: '#DFF7E2',
    borderTopWidth: 1,
    borderColor: '#E1EDE6',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
  },
});
