import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NotificationBellButton } from './NotificationBellButton';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  title: string;
  onPressBack?: () => void;
  onPressNotification?: () => void;
  showNotificationBadge?: boolean;
  notificationSize?: number;
};

export const AppScreenHeader = ({
  title,
  onPressBack,
  onPressNotification,
  showNotificationBadge,
  notificationSize = 30,
}: Props) => {
  return (
    <View style={styles.headerRow}>
      {onPressBack ? (
        <Pressable style={styles.leftSlot} onPress={onPressBack}>
          <MaterialIcons name="arrow-back" size={22} color={colors.white} />
        </Pressable>
      ) : (
        <View style={styles.leftSlot} />
      )}

      <Text style={styles.headerTitle}>{title}</Text>

      <View style={styles.rightSlot}>
        <NotificationBellButton
          size={notificationSize}
          onPress={onPressNotification}
          showBadge={showNotificationBadge}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSlot: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSlot: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 24,
    lineHeight: 28,
    textAlign: 'center',
  },
});
