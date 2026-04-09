import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppScreenHeader } from '../../components/AppScreenHeader';
import { ScreenBottomNavigation } from '../../components/ScreenBottomNavigation';
import { notificationApi } from '../../api/notificationApi';
import { type NotificationGroup } from '../../types/notification';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export const NotificationScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [allRead, setAllRead] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const response = await notificationApi.getNotifications();
      setGroups(response);
      const hasUnread = response.some((group) => group.items.some((item) => !item.isRead));
      setAllRead(!hasUnread);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      setError(err.message || 'Không thể tải thông báo. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const onMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setGroups((prev) => 
        prev.map((group) => ({ 
          ...group, 
          items: group.items.map((item) => ({ ...item, isRead: true })) 
        }))
      );
      setAllRead(true);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const onMarkItemRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      await notificationApi.markAsRead(id);
      setGroups((prev) => {
        const nextGroups = prev.map((group) => ({
          ...group,
          items: group.items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
        }));
        
        const hasUnread = nextGroups.some((group) => group.items.some((item) => !item.isRead));
        setAllRead(!hasUnread);
        
        return nextGroups;
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Thông báo" onPressBack={() => navigation.goBack()} />

      <Pressable style={styles.readAllWrap} onPress={onMarkAllRead} disabled={loading || groups.length === 0}>
        <Text style={[styles.readAllText, groups.length === 0 && { opacity: 0.5 }]}>Đã đọc tất cả</Text>
        <View style={[styles.readAllCircle, groups.length === 0 && { opacity: 0.5 }]}>
          {allRead && groups.length > 0 ? <View style={styles.readAllDot} /> : null}
        </View>
      </Pressable>

      <View style={styles.panel}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>Đang tải thông báo...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <MaterialCommunityIcons name="alert-circle-outline" size={60} color={colors.expense} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => loadNotifications()}>
              <Text style={styles.retryText}>Thử lại</Text>
            </Pressable>
          </View>
        ) : groups.length === 0 ? (
          <ScrollView 
            contentContainerStyle={styles.centerContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} />}
          >
            <MaterialCommunityIcons name="bell-off-outline" size={80} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
            <Text style={styles.emptySubtitle}>Khi có thông báo quan trọng về tài chính, chúng tôi sẽ hiển thị ở đây.</Text>
          </ScrollView>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.listContent} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} />}
          >
            {groups.map((group) => (
              <View key={group.section} style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>{group.title}</Text>

                {group.items.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => onMarkItemRead(item.id, item.isRead)}
                    style={[styles.itemCard, !item.isRead ? styles.itemCardUnread : styles.itemCardRead]}
                  >
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      {!item.isRead && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.itemMessage}>{item.message}</Text>
                    {item.detail ? <Text style={styles.itemDetail}>{item.detail}</Text> : null}
                    <Text style={styles.itemTime}>{item.timeLabel}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <ScreenBottomNavigation activeTab="home" />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  readAllWrap: {
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  readAllText: {
    color: colors.white,
    fontFamily: typography.poppins.regular,
    fontSize: 13,
  },
  readAllCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readAllDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.white,
  },
  panel: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  loaderText: {
    color: colors.textSecondary,
    fontFamily: typography.poppins.regular,
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: colors.textSecondary,
    fontFamily: typography.poppins.regular,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 40,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: colors.white,
    fontFamily: typography.poppins.semibold,
    fontSize: 14,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 18,
    marginTop: 20,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontFamily: typography.poppins.regular,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 16,
    marginBottom: 12,
  },
  itemCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: colors.white,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 2,
  },
  itemCardUnread: {
    backgroundColor: '#E6F9F4',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  itemCardRead: {
    opacity: 0.8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemTitle: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 15,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
    marginTop: 6,
  },
  itemMessage: {
    color: colors.textSecondary,
    fontFamily: typography.poppins.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  itemDetail: {
    color: colors.blueDark,
    fontFamily: typography.poppins.medium,
    fontSize: 13,
    marginTop: 6,
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  itemTime: {
    color: colors.textMuted,
    fontFamily: typography.poppins.regular,
    fontSize: 11,
    marginTop: 10,
    textAlign: 'right',
  },
});
