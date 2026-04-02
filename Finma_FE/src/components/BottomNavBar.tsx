import { Image, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

type TabKey = 'home' | 'report' | 'exchange' | 'layers' | 'profile';

type Props = {
  activeTab: TabKey;
  onPress?: (tab: TabKey) => void;
};

const ICONS: Record<TabKey, number> = {
  home: require('../../assets/icons/home.png'),
  report: require('../../assets/icons/report.png'),
  exchange: require('../../assets/icons/transaction.png'),
  layers: require('../../assets/icons/category.png'),
  profile: require('../../assets/icons/profile.png'),
};

const TABS: TabKey[] = ['home', 'report', 'exchange', 'layers', 'profile'];

export const BottomNavBar = ({ activeTab, onPress }: Props) => {
  return (
    <View style={styles.wrapper}>
      {TABS.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <Pressable key={tab} onPress={() => onPress?.(tab)} style={[styles.iconButton, isActive && styles.activeButton]}>
            <Image source={ICONS[tab]} style={[styles.icon, isActive && styles.activeIcon]} resizeMode="contain" />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: 'transparent',
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: colors.primary,
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: colors.text,
  },
  activeIcon: {
    tintColor: colors.white,
  },
});
