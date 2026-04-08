import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { type SettingsMenuData, type SettingsMenuItem } from '../../types/settings';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export const SettingsScreen = ({ navigation }: Props) => {
  // ✅ Data cứng (không gọi API)
  const data: SettingsMenuData = {
    unreadNotifications: 0,
    items: [
      { key: 'notifications', label: 'Thông Báo' },
      { key: 'password', label: 'Mật Khẩu' },
      { key: 'deleteAccount', label: 'Xóa Tài Khoản' },
    ],
  };

  // ✅ Navigate
  const onPressItem = (item: SettingsMenuItem) => {
    if (item.key === 'notifications') {
      navigation.navigate('SettingsNotifications');
    } else if (item.key === 'password') {
      navigation.navigate('SettingsPassword');
    } else if (item.key === 'deleteAccount') {
      navigation.navigate('SettingsDeleteAccount');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title="Cài Đặt"
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
        showNotificationBadge={false}
      />

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          {data.items.map((item) => (
            <Pressable
              key={item.key}
              style={styles.settingItem}
              onPress={() => onPressItem(item)}
            >
              <View style={styles.settingItemLeft}>
                <View style={styles.iconWrap}>
                  <MaterialIcons
                    name={
                      item.key === 'notifications'
                        ? 'notifications-active'
                        : item.key === 'password'
                          ? 'lock'
                          : 'delete-outline'
                    }
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.settingText}>{item.label}</Text>
              </View>

              <MaterialIcons
                name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScreenBottomNavigation activeTab="profile" />
    </SafeAreaView>
  );
};

// ====================
// 🎨 Styles
// ====================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  mainPanel: {
    flex: 1,
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    marginTop: 22,
    paddingHorizontal: 20,
    paddingTop: 26,
  },

  panelContent: {
    paddingBottom: 110,
    gap: 6,
  },

  settingItem: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DFF7E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 15,
  },
});