import { request } from './httpClient';
import {
  type AskAssistantPayload,
  type AskAssistantResponse,
  type AssistantConversation,
  type AssistantMessage,
} from '../types/assistant';

const ASSISTANT_API_USE_MOCK = true;

const ASSISTANT_ENDPOINTS = {
  conversation: '/assistant/conversation',
  ask: '/assistant/ask',
};

const nowLabel = () => {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
};

const mockMessages: AssistantMessage[] = [
  { id: 'm1', role: 'assistant', text: 'Chào bạn, mình là trợ lý ảo tài chính của bạn.', timeLabel: '14:00' },
  { id: 'm2', role: 'assistant', text: 'Mình có thể hỗ trợ bạn điều gì hôm nay?', timeLabel: '14:00' },
  { id: 'm3', role: 'user', text: 'Chào bạn! Mình muốn ghi chi tiêu theo ngày thì làm sao?', timeLabel: '14:01' },
  {
    id: 'm4',
    role: 'assistant',
    text: 'Bạn vào menu trên cùng ở trang Chủ, sau đó thêm giao dịch và nhập ngày, số tiền, danh mục là được.',
    timeLabel: '14:03',
  },
  { id: 'm5', role: 'user', text: 'Ok, cảm ơn bạn nhiều.', timeLabel: '14:05' },
  {
    id: 'm6',
    role: 'assistant',
    text: 'Rất vui được hỗ trợ bạn. Hẹn gặp lại nhé!',
    timeLabel: '14:06',
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildMockReply = (message: string): AssistantMessage => {
  const lower = message.toLowerCase();

  if (lower.includes('chi tiêu') || lower.includes('expense')) {
    return {
      id: `r-${Date.now()}`,
      role: 'assistant',
      text: 'Bạn vào màn Giao Dịch, bấm dấu + để thêm chi tiêu, sau đó chọn ngày và danh mục phù hợp.',
      timeLabel: nowLabel(),
    };
  }

  if (lower.includes('ngân sách') || lower.includes('budget')) {
    return {
      id: `r-${Date.now()}`,
      role: 'assistant',
      text: 'Bạn có thể theo dõi ngân sách trong màn Phân Tích, mục mục tiêu và % đã sử dụng.',
      timeLabel: nowLabel(),
    };
  }

  return {
    id: `r-${Date.now()}`,
    role: 'assistant',
    text: 'Mình đã nhận câu hỏi. Bạn mô tả chi tiết hơn để mình hướng dẫn chính xác nhé.',
    timeLabel: nowLabel(),
  };
};

export const assistantApi = {
  getConversation: async (token?: string) => {
    if (ASSISTANT_API_USE_MOCK) {
      await sleep(120);
      return {
        unreadNotifications: 1,
        title: 'Trợ Lý Tài Chính',
        messages: mockMessages,
      } satisfies AssistantConversation;
    }

    return request<AssistantConversation>(ASSISTANT_ENDPOINTS.conversation, { token });
  },

  askAssistant: async (payload: AskAssistantPayload, token?: string) => {
    if (ASSISTANT_API_USE_MOCK) {
      await sleep(220);
      return {
        reply: buildMockReply(payload.message),
      } satisfies AskAssistantResponse;
    }

    return request<AskAssistantResponse>(ASSISTANT_ENDPOINTS.ask, {
      method: 'POST',
      body: payload,
      token,
    });
  },
};
