import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomNavBar } from '../../components/BottomNavBar';
import { NotificationBellButton } from '../../components/NotificationBellButton';
import { profileApi } from '../../api/profileApi';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { type ProfileData, type ProfileMenuKey } from '../../types/profile';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const iconByMenuKey: Record<ProfileMenuKey, keyof typeof MaterialIcons.glyphMap> = {
  edit: 'person-outline',
  settings: 'settings',
  help: 'support-agent',
  logout: 'logout',
};

export const ProfileScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await profileApi.getProfile();
        setProfile(response);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const onMenuPress = (key: ProfileMenuKey) => {
    if (key === 'edit') {
      navigation.navigate('EditProfile');
      return;
    }

    if (key === 'settings') {
      navigation.navigate('Settings');
      return;
    }

    if (key === 'help') {
      navigation.navigate('AIAssistant');
      return;
    }

    if (key === 'logout') {
      setShowLogoutModal(true);
      return;
    }

    Alert.alert('Thông báo', 'Mục này sẽ được cập nhật sau.');
  };

  const initials = useMemo(() => {
    if (!profile?.fullName) {
      return 'U';
    }

    return profile.fullName
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }, [profile?.fullName]);

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerRow}>
        <View style={styles.backButton} />

        <Text style={styles.headerTitle}>Hồ sơ</Text>

        <View style={styles.headerRightSlot}>
          <NotificationBellButton
            size={30}
            onPress={() => navigation.navigate('Notifications')}
            showBadge={profile.unreadNotifications > 0}
          />
        </View>
      </View>

      <View style={styles.mainPanel}>
        <View style={styles.avatarWrap}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{initials}</Text>
            </View>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          <View style={styles.nameBlock}>
            <Text style={styles.nameText}>{profile.fullName}</Text>
            <Text style={styles.idText}>ID: {profile.id}</Text>
          </View>

          <View style={styles.menuWrap}>
            {profile.menuItems.map((item) => (
              <Pressable key={item.key} style={styles.menuItem} onPress={() => onMenuPress(item.key)}>
                <View style={styles.menuIconWrap}>
                  <MaterialIcons name={iconByMenuKey[item.key]} size={24} color={colors.white} />
                </View>
                <Text style={styles.menuText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.fixedBottomNav}>
        <BottomNavBar
          activeTab="profile"
          onPress={(tab) => {
            if (tab === 'home') {
              navigation.navigate('Home');
            }
            if (tab === 'report') {
              navigation.navigate('Report');
            }
            if (tab === 'exchange') {
              navigation.navigate('Transactions');
            }
            if (tab === 'layers') {
              navigation.navigate('Categories');
            }
            if (tab === 'profile') {
              navigation.navigate('Profile');
            }
          }}
        />
      </View>

      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <View style={styles.logoutOverlay}>
          <View style={styles.logoutCard}>
            <Text style={styles.logoutTitle}>Đăng Xuất</Text>
            <Text style={styles.logoutMessage}>Bạn có chắc chắn muốn đăng xuất không?</Text>

            <Pressable
              style={styles.logoutConfirmButton}
              disabled={loggingOut}
              onPress={async () => {
                setLoggingOut(true);
                try {
                  await profileApi.logout();
                  setShowLogoutModal(false);
                  navigation.navigate('Login');
                } finally {
                  setLoggingOut(false);
                }
              }}
            >
              <Text style={styles.logoutConfirmText}>{loggingOut ? 'Đang xử lý...' : 'Đăng Xuất'}</Text>
            </Pressable>

            <Pressable
              style={styles.logoutCancelButton}
              disabled={loggingOut}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={styles.logoutCancelText}>Hủy</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightSlot: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    marginTop: 50,
    paddingHorizontal: 20,
    paddingTop: 70,
  },
  avatarWrap: {
    position: 'absolute',
    alignSelf: 'center',
    top: -50,
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    borderColor: colors.white,
    overflow: 'hidden',
    backgroundColor: '#4A5568',
    zIndex: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A5568',
  },
  avatarFallbackText: {
    color: colors.white,
    fontFamily: typography.poppins.bold,
    fontSize: 28,
  },
  panelContent: {
    paddingBottom: 110,
  },
  nameBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  nameText: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 34,
    lineHeight: 40,
  },
  idText: {
    color: '#667085',
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  menuWrap: {
    gap: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5B9EFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    color: '#1A1A1A',
    fontFamily: typography.poppins.medium,
    fontSize: 16,
  },
  fixedBottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#DFF7E2',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 10,
  },
  logoutOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoutCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    alignItems: 'center',
  },
  logoutTitle: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 24,
    lineHeight: 30,
    marginBottom: 4,
  },
  logoutMessage: {
    color: colors.textSecondary,
    fontFamily: typography.poppins.regular,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  logoutConfirmButton: {
    width: '100%',
    minHeight: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginBottom: 10,
  },
  logoutConfirmText: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 14,
  },
  logoutCancelButton: {
    width: '100%',
    minHeight: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4ECDD',
  },
  logoutCancelText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    color: colors.white,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
  },
});
