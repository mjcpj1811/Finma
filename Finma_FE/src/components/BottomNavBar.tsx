import { Pressable, StyleSheet, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import HomeIcon from '../../assets/icons/Home.svg';
import ReportIcon from '../../assets/icons/report.svg';
import TransactionsIcon from '../../assets/icons/Transactions.svg';
import CategoryIcon from '../../assets/icons/Category.svg';
import ProfileIcon from '../../assets/icons/Profile.svg';
import { colors } from '../theme/colors';

export type TabKey = 'home' | 'report' | 'exchange' | 'layers' | 'profile';

type Props = {
  activeTab: TabKey;
  onPress?: (tab: TabKey) => void;
};

const ICONS: Record<TabKey, React.ComponentType<SvgProps>> = {
  home: HomeIcon,
  report: ReportIcon,
  exchange: TransactionsIcon,
  layers: CategoryIcon,
  profile: ProfileIcon,
};

const TABS: TabKey[] = ['home', 'report', 'exchange', 'layers', 'profile'];

export const BottomNavBar = ({ activeTab, onPress }: Props) => {
  return (
    <View style={styles.wrapper}>
      {TABS.map((tab) => {
        const isActive = tab === activeTab;
        const Icon = ICONS[tab];
        return (
          <Pressable key={tab} onPress={() => onPress?.(tab)} style={[styles.iconButton, isActive && styles.activeButton]}>
            <Icon width={24} height={24} color={isActive ? colors.white : colors.text} />
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
    paddingVertical: 0,
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
  },
});
