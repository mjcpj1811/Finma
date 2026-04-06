import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { profileApi } from '../../api/profileApi';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { type ProfileData } from '../../types/profile';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export const EditProfileScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await profileApi.getProfile();
        setProfile(response);
        setFullName(response.fullName);
        setUsername(response.username);
        setPhone(response.phone);
        setEmail(response.email);
        setNotificationsEnabled(response.notificationsEnabled);
        setDarkModeEnabled(response.darkModeEnabled);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const onUpdate = async () => {
    if (!fullName.trim() || !username.trim() || !phone.trim() || !email.trim()) {
      return;
    }

    setSaving(true);
    try {
      await profileApi.updateProfile({
        fullName: fullName.trim(),
        username: username.trim(),
        phone: phone.trim(),
        email: email.trim(),
        notificationsEnabled,
        darkModeEnabled,
      });

      Alert.alert('Thành công', 'Đã cập nhật thông tin.');
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải thông tin...</Text>
        </View>
        <ScreenBottomNavigation activeTab="profile" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title="Chỉnh Sửa Thông Tin"
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
        showNotificationBadge={profile.unreadNotifications > 0}
      />

      <View style={styles.mainPanel}>
        <View style={styles.avatarWrap}>
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
          <Pressable style={styles.cameraBadge}>
            <MaterialIcons name="photo-camera" size={14} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          <View style={styles.nameBlock}>
            <Text style={styles.nameText}>{fullName}</Text>
            <Text style={styles.idText}>ID: {profile.id}</Text>
          </View>

          <Text style={styles.sectionTitle}>Thông Tin Tài Khoản</Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Tên Đăng Nhập</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              placeholder="Tên đăng nhập"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Số điện thoại</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
              placeholder="Số điện thoại"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Địa chỉ email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder="Địa chỉ email"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Thông Báo</Text>
            <Pressable
              style={[styles.toggleTrack, notificationsEnabled && styles.toggleTrackOn]}
              onPress={() => setNotificationsEnabled((prev) => !prev)}
            >
              <View style={[styles.toggleThumb, notificationsEnabled && styles.toggleThumbOn]} />
            </Pressable>
          </View>

          

          <Pressable style={styles.updateButton} onPress={onUpdate} disabled={saving}>
            <Text style={styles.updateText}>{saving ? 'Đang cập nhật...' : 'Cập Nhật'}</Text>
          </Pressable>
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
    borderRadius: 52,
  },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  panelContent: {
    paddingBottom: 110,
  },
  nameBlock: {
    alignItems: 'center',
    marginBottom: 22,
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
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 24,
    lineHeight: 30,
    marginBottom: 14,
  },
  fieldWrap: {
    marginBottom: 12,
    gap: 6,
  },
  fieldLabel: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 15,
  },
  input: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#DFF7E2',
    paddingHorizontal: 14,
    color: colors.text,
    fontFamily: typography.poppins.regular,
    fontSize: 14,
  },
  toggleRow: {
    marginTop: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 16,
  },
  toggleTrack: {
    width: 54,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#B8EBDD',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleTrackOn: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  updateButton: {
    marginTop: 16,
    alignSelf: 'center',
    minWidth: 132,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateText: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 15,
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
