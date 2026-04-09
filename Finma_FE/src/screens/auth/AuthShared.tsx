import { type ReactNode, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type SvgIconComponent = React.ComponentType<SvgProps>;

type AuthLayoutProps = {
  title: string;
  children: ReactNode;
  contentMode?: 'top' | 'center';
};

type AuthInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

type PasswordInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  eyeIcon: SvgIconComponent;
  eyeOffIcon: SvgIconComponent;
};

type AuthButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
};

type SocialButtonsProps = {
  facebookIcon: SvgIconComponent;
  googleIcon: SvgIconComponent;
  onPressFacebook?: () => void;
  onPressGoogle?: () => void;
};

export const AuthLayout = ({ title, children, contentMode = 'top' }: AuthLayoutProps) => {
  const insets = useSafeAreaInsets();
  const headerTopPadding = Platform.OS === 'android' ? Math.max(insets.top, 20) : 20;
  const cardBottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 16) : 0;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.headerWrap, { paddingTop: headerTopPadding }]}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={[styles.card, { paddingBottom: cardBottomPadding }]}>
        <ScrollView
          contentContainerStyle={[styles.formContent, contentMode === 'center' && styles.formContentCentered]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export const AuthInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: AuthInputProps) => {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
    </View>
  );
};

export const PasswordInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  eyeIcon,
  eyeOffIcon,
}: PasswordInputProps) => {
  const [hidden, setHidden] = useState(true);
  const EyeIcon = hidden ? eyeOffIcon : eyeIcon;

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hidden}
          autoCapitalize="none"
          style={[styles.input, styles.passwordInput]}
        />
        <Pressable onPress={() => setHidden((prev) => !prev)} style={styles.eyeButton}>
          <EyeIcon width={18} height={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
};

export const AuthButton = ({ title, onPress, disabled = false, variant = 'primary' }: AuthButtonProps) => {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, isPrimary ? styles.buttonPrimary : styles.buttonSecondary, disabled && styles.buttonDisabled]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
};

export const DividerText = ({ text }: { text: string }) => <Text style={styles.dividerText}>{text}</Text>;

export const SocialButtons = ({ facebookIcon, googleIcon, onPressFacebook, onPressGoogle }: SocialButtonsProps) => {
  const FacebookIcon = facebookIcon;
  const GoogleIcon = googleIcon;

  return (
    <View style={styles.socialRow}>
      <Pressable style={styles.socialButton} onPress={onPressFacebook}>
        <FacebookIcon width={22} height={22} />
      </Pressable>
      <Pressable style={styles.socialButton} onPress={onPressGoogle}>
        <GoogleIcon width={22} height={22} />
      </Pressable>
    </View>
  );
};

export const FooterInlineLink = ({
  prefix,
  linkText,
  onPress,
}: {
  prefix: string;
  linkText: string;
  onPress: () => void;
}) => {
  return (
    <View style={styles.footerRow}>
      <Text style={styles.footerText}>{prefix} </Text>
      <Pressable onPress={onPress}>
        <Text style={styles.footerLink}>{linkText}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  headerWrap: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    color: colors.text,
    fontSize: 29,
    lineHeight: 30,
    fontFamily: typography.poppins.bold,
    textAlign: 'center',
    marginTop: 34,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    width: '100%',
    marginTop: 40,
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  formContent: {
    flexGrow: 1,
    paddingBottom: 26,
    minHeight: 610,
  },
  formContentCentered: {
    justifyContent: 'flex-start',
    paddingTop: 24,
  },
  fieldWrap: {
    marginBottom: 12,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.poppins.medium,
    marginBottom: 8,
  },
  input: {
    borderRadius: 14,
    backgroundColor: '#D4EDD8',
    height: 46,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 14,
    fontFamily: typography.poppins.regular,
  },
  passwordInput: {
    paddingRight: 46,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 11,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    width: 18,
    height: 18,
  },
  button: {
    borderRadius: 14,
    width: '100%',
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: '#CFE9D3',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.text,
    fontSize: 17,
    fontFamily: typography.poppins.semibold,
  },
  dividerText: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 12,
    marginVertical: 10,
    fontFamily: typography.poppins.regular,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  socialIcon: {
    width: 22,
    height: 22,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: typography.poppins.regular,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: typography.poppins.semibold,
  },
});
