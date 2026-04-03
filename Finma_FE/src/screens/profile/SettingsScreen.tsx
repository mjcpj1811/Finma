import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { profileApi } from '../../api/profileApi';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { type SettingsMenuData, type SettingsMenuItem } from '../../types/settings';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export const SettingsScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SettingsMenuData | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await profileApi.getSettingsMenu();
        setData(response);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const onPressItem = (item: SettingsMenuItem) => {
    if (item.key === 'notifications') {
      navigation.navigate('SettingsNotifications');
      return;
    }
    if (item.key === 'password') {
      navigation.navigate('SettingsPassword');
      return;
    }
    if (item.key === 'deleteAccount') {
      navigation.navigate('SettingsDeleteAccount');
    }
  };

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải cài đặt...</Text>
        </View>
        <ScreenBottomNavigation activeTab="profile" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title="Cài Đặt"
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
        showNotificationBadge={data.unreadNotifications > 0}
      />

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          {data.items.map((item) => (
            <Pressable key={item.key} style={styles.settingItem} onPress={() => onPressItem(item)}>
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
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScreenBottomNavigation activeTab="profile" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerRightSlot: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 24,
    lineHeight: 28,
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
  panelContent: { paddingBottom: 110, gap: 6 },
  settingItem: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { color: colors.white, fontFamily: typography.poppins.medium, fontSize: 14 },
});
