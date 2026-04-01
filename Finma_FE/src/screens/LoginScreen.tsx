import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

function mapLoginError(raw: string): string {
  if (raw.includes('Failed to fetch') || raw.includes('NetworkError') || raw === 'Mất kết nối') {
    return 'Mất kết nối — kiểm tra backend đã chạy và CORS (thường gặp khi test trên web).';
  }
  if (raw === 'Unauthenticated access') {
    return 'Sai tên đăng nhập hoặc mật khẩu.';
  }
  if (raw.toLowerCase().includes('user does not exist')) {
    return 'Tài khoản không tồn tại.';
  }
  return raw;
}

export function LoginScreen() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const onSubmit = async () => {
    setLoginError(null);
    if (!username.trim() || !password) {
      const msg = 'Nhập username và mật khẩu';
      setLoginError(msg);
      Alert.alert('Lỗi', msg);
      return;
    }
    setBusy(true);
    try {
      await signIn(username.trim(), password);
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : 'Đăng nhập thất bại';
      const msg = mapLoginError(raw);
      setLoginError(msg);
      Alert.alert('Lỗi', msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.logo}>Finma</Text>
      <Text style={styles.sub}>Đăng nhập để đồng bộ dữ liệu</Text>
      <TextInput
        style={styles.input}
        placeholder="Username hoặc email"
        autoCapitalize="none"
        value={username}
        onChangeText={(t) => {
          setLoginError(null);
          setUsername(t);
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        secureTextEntry
        value={password}
        onChangeText={(t) => {
          setLoginError(null);
          setPassword(t);
        }}
      />
      {loginError ? <Text style={styles.error}>{loginError}</Text> : null}
      <TouchableOpacity style={styles.btn} onPress={onSubmit} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Đăng nhập</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.bgPage,
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: 24,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  error: {
    color: '#c62828',
    marginBottom: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});
