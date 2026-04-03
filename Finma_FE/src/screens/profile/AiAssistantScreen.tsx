import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { BottomNavBar } from '../../components/BottomNavBar';
import { assistantApi } from '../../api/assistantApi';
import { type RootStackParamList } from '../../navigation/RootNavigator';
import { type AssistantConversation, type AssistantMessage } from '../../types/assistant';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'AIAssistant'>;

export const AiAssistantScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState<AssistantConversation | null>(null);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const canSend = !sending && input.trim().length > 0;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await assistantApi.getConversation();
        setConversation(data);
      } catch {
        setConversation(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const onSend = async () => {
    if (!conversation || !input.trim()) {
      return;
    }

    const userMessage: AssistantMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: input.trim(),
      timeLabel: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setConversation({
      ...conversation,
      messages: [...conversation.messages, userMessage],
    });
    setInput('');
    setSending(true);

    try {
      const response = await assistantApi.askAssistant({ message: userMessage.text });
      setConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, response.reply],
        };
      });
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 60);
    } finally {
      setSending(false);
    }
  };

  if (loading || !conversation) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loaderText}>Đang tải trợ lý...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppScreenHeader
        title="Trợ lý AI"
        onPressBack={() => navigation.goBack()}
        onPressNotification={() => navigation.navigate('Notifications')}
        showNotificationBadge={conversation.unreadNotifications > 0}
      />

      <View style={styles.mainPanel}>
        <View style={styles.assistantTagWrap}>
          <Text style={styles.assistantTagText}>{conversation.title}</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {conversation.messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <View key={message.id} style={styles.messageBlock}>
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
                  <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>{message.text}</Text>
                </View>
                <Text style={[styles.timeText, isUser && styles.userTime]}>{message.timeLabel}</Text>
              </View>
            );
          })}
        </ScrollView>

      </View>

      <View style={styles.chatDock}>
        <View style={styles.inputWrap}>
          <Pressable style={styles.roundIcon}>
            <MaterialIcons name="photo-camera" size={16} color={colors.textSecondary} />
          </Pressable>

          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <Pressable style={styles.roundIcon}>
            <MaterialIcons name="keyboard-voice" size={16} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            style={[styles.sendIcon, !canSend && styles.sendIconDisabled]}
            onPress={onSend}
            disabled={!canSend}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <MaterialIcons name="send" size={15} color={colors.white} />
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.fixedBottomNav}>
        <BottomNavBar
          activeTab="profile"
          onPress={(tab) => {
            if (tab === 'home') navigation.navigate('Home');
            if (tab === 'report') navigation.navigate('Report');
            if (tab === 'exchange') navigation.navigate('Transactions');
            if (tab === 'layers') navigation.navigate('Categories');
            if (tab === 'profile') navigation.navigate('Profile');
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
    marginTop: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 152,
    overflow: 'hidden',
  },
  assistantTagWrap: {
    alignSelf: 'center',
    minWidth: 160,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DFF7E2',
    marginBottom: 10,
  },
  assistantTagText: {
    color: colors.text,
    fontFamily: typography.poppins.medium,
    fontSize: 12,
  },
  chatContent: {
    paddingBottom: 10,
    gap: 8,
  },
  messageBlock: {
    gap: 4,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#DFF7E2',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  bubbleText: {
    color: colors.textSecondary,
    fontFamily: typography.poppins.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  userBubbleText: {
    color: '#044D41',
  },
  timeText: {
    fontFamily: typography.poppins.regular,
    fontSize: 10,
    color: '#8FA7A0',
    marginLeft: 4,
  },
  userTime: {
    textAlign: 'right',
    marginRight: 4,
  },
  chatDock: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 84,
    zIndex: 8,
  },
  inputWrap: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  roundIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DFF7E2',
  },
  sendIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A5F4F',
  },
  sendIconDisabled: {
    opacity: 0.55,
  },
  input: {
    flex: 1,
    minHeight: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    color: colors.text,
    fontFamily: typography.poppins.regular,
    fontSize: 15,
  },
  fixedBottomNav: {
  position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 6,
    elevation: 10,
    backgroundColor: '#DFF7E2',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 10,
  },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { color: colors.white, fontFamily: typography.poppins.medium, fontSize: 14 },
});
