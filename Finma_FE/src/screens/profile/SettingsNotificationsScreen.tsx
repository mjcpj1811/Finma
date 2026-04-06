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
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { profileApi } from '../../api/profileApi';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { type NotificationSettingItem, type NotificationSettingsData } from '../../types/settings';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'SettingsNotifications'>;

export const SettingsNotificationsScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<NotificationSettingsData | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await profileApi.getNotificationSettings();
        setData(response);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const onToggle = async (key: string) => {
    if (!data) return;

    const nextItems: NotificationSettingItem[] = data.items.map((item) =>
      item.key === key ? { ...item, enabled: !item.enabled } : item,
    );

    setData({ ...data, items: nextItems });
    setSaving(true);
    try {
      await profileApi.updateNotificationSettings({ items: nextItems });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải thông báo...</Text>
        </View>
        <ScreenBottomNavigation activeTab="profile" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title="Thông Báo"
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
        showNotificationBadge={data.unreadNotifications > 0}
      />

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          {data.items.map((item) => (
            <View key={item.key} style={styles.row}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Pressable
                style={[styles.toggleTrack, item.enabled && styles.toggleTrackOn]}
                onPress={() => onToggle(item.key)}
                disabled={saving}
              >
                <View style={[styles.toggleThumb, item.enabled && styles.toggleThumbOn]} />
              </Pressable>
            </View>
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
    paddingTop: 22,
  },
  panelContent: { paddingBottom: 110, gap: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  toggleTrack: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#B8EBDD',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackOn: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { color: colors.white, fontFamily: typography.poppins.medium, fontSize: 14 },
});
