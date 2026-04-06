import { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { profileApi } from '../../api/profileApi';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'SettingsPassword'>;

export const SettingsPasswordScreen = ({ navigation }: Props) => {
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const onSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return;
    }

    setSaving(true);
    try {
      const response = await profileApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!response.success) {
        Alert.alert('Lỗi', response.message || 'Không thể đổi mật khẩu.');
        return;
      }

      navigation.navigate('SettingsPasswordSuccess');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title="Cài Đặt Mật Khẩu"
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
      />

      <View style={styles.mainPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Mật Khẩu Hiện Tại</Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              style={styles.input}
              placeholder="Nhập mật khẩu hiện tại"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Mật Khẩu Mới</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              style={styles.input}
              placeholder="Nhập mật khẩu mới"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Xác Nhận Mật Khẩu Mới</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.input}
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <Pressable style={styles.updateButton} onPress={onSave} disabled={saving}>
            <Text style={styles.updateText}>{saving ? 'Đang xử lý...' : 'Đổi Mật Khẩu'}</Text>
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
  fieldWrap: { gap: 6 },
  fieldLabel: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 14,
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
  updateButton: {
    marginTop: 8,
    alignSelf: 'center',
    minWidth: 140,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateText: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 13,
  },
});
