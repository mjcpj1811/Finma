import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NotificationBellButton } from './NotificationBellButton';
import { notificationApi } from '../api/notificationApi';
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
  const [derivedBadgeVisible, setDerivedBadgeVisible] = useState(false);
  const shouldUseDerivedBadge = typeof showNotificationBadge !== 'boolean';

  useFocusEffect(
    useCallback(() => {
      if (!shouldUseDerivedBadge) {
        return;
      }

      let active = true;

      const loadUnread = async () => {
        try {
          const unreadCount = await notificationApi.getUnreadCount();
          if (active) {
            setDerivedBadgeVisible(unreadCount > 0);
          }
        } catch {
          if (active) {
            setDerivedBadgeVisible(false);
          }
        }
      };

      void loadUnread();

      return () => {
        active = false;
      };
    }, [shouldUseDerivedBadge]),
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
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
            showBadge={shouldUseDerivedBadge ? derivedBadgeVisible : showNotificationBadge}
          />
        </View>
      </View>
    </SafeAreaView>
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
  safeArea: {
    backgroundColor: colors.primary,
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
