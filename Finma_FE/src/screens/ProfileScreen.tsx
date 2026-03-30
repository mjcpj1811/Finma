import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

export function ProfileScreen() {
  const { signOut } = useAuth();
  return (
    <View style={styles.page}>
      <Text style={styles.title}>Hồ sơ</Text>
      <Text style={styles.hint}>Màn hình placeholder — do thành viên khác phụ trách.</Text>
      <TouchableOpacity style={styles.out} onPress={() => signOut()}>
        <Text style={styles.outTxt}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 24, backgroundColor: colors.bgPage },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  hint: { color: colors.textMuted, marginBottom: 24 },
  out: {
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  outTxt: { color: colors.primary, fontWeight: '800' },
});
