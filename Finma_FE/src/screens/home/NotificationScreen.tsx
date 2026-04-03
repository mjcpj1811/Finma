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
import { BottomNavBar } from '../../components/BottomNavBar';
import { notificationApi } from '../../api/notificationApi';
import { type NotificationGroup } from '../../types/notification';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export const NotificationScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [allRead, setAllRead] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      try {
        const response = await notificationApi.getNotifications();
        setGroups(response);
        const hasUnread = response.some((group) => group.items.some((item) => !item.isRead));
        setAllRead(!hasUnread);
      } finally {
        setLoading(false);
      }
    };

    void loadNotifications();
  }, []);

  const onMarkAllRead = async () => {
    await notificationApi.markAllRead();
    setGroups((prev) => prev.map((group) => ({ ...group, items: group.items.map((item) => ({ ...item, isRead: true })) })));
    setAllRead(true);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader title="Thông báo" onPressBack={() => navigation.goBack()} />

      <Pressable style={styles.readAllWrap} onPress={onMarkAllRead}>
        <Text style={styles.readAllText}>Đã đọc tất cả</Text>
        <View style={styles.readAllCircle}>{allRead ? <View style={styles.readAllDot} /> : null}</View>
      </Pressable>

      <View style={styles.panel}>
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loaderText}>Đang tải thông báo...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {groups.map((group) => (
              <View key={group.section} style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>{group.title}</Text>

                {group.items.map((item) => (
                  <View
                    key={item.id}
                    style={[styles.itemCard, !item.isRead ? styles.itemCardUnread : styles.itemCardRead]}
                  >
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemMessage}>{item.message}</Text>
                    {item.detail ? <Text style={styles.itemDetail}>{item.detail}</Text> : null}
                    <Text style={styles.itemTime}>{item.timeLabel}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.fixedBottomNav}>
        <BottomNavBar
          activeTab="home"
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
   paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
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
  headerTitle: {
    flex: 1,
    color: colors.text,
    textAlign: 'center',
    fontFamily: typography.poppins.semibold,
    fontSize: 24,
    lineHeight: 28,
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
    color: colors.textSecondary,
    fontFamily: typography.poppins.regular,
    fontSize: 13,
  },
  readAllCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readAllDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.textSecondary,
  },
  panel: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  loaderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loaderText: {
    color: colors.textSecondary,
    fontFamily: typography.poppins.regular,
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 96,
    gap: 20,
  },
  sectionWrap: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 13,
  },
  itemCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  itemCardUnread: {
    backgroundColor: '#D1F0E8',
  },
  itemCardRead: {
    borderBottomWidth: 1,
    borderBottomColor: '#DDE9E3',
    borderRadius: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
  },
  itemTitle: {
    color: colors.text,
    fontFamily: typography.poppins.semibold,
    fontSize: 14,
    marginBottom: 4,
  },
  itemMessage: {
    color: colors.textSecondary,
    fontFamily: typography.poppins.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  itemDetail: {
    color: colors.blueDark,
    fontFamily: typography.poppins.semibold,
    fontSize: 12,
    marginTop: 3,
  },
  itemTime: {
    color: colors.blueDark,
    fontFamily: typography.poppins.regular,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 8,
  },
  fixedBottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#DFF7E2',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 10,
  },
});
