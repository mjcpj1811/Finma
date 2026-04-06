export type AssistantMessageRole = 'assistant' | 'user';

export type AssistantMessage = {
  id: string;
  role: AssistantMessageRole;
  text: string;
  timeLabel: string;
};

export type AssistantConversation = {
  unreadNotifications: number;
  title: string;
  messages: AssistantMessage[];
};

export type AskAssistantPayload = {
  message: string;
};

export type AskAssistantResponse = {
  reply: AssistantMessage;
};
