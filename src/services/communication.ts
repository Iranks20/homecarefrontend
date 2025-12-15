import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import {
  CommunicationMessage,
  ConversationSummary,
  PaginatedResponse,
} from '../types';

export interface ConversationQueryParams {
  page?: number;
  limit?: number;
}

export interface MessageQueryParams extends ConversationQueryParams {
  conversationId?: string;
  search?: string;
  type?: CommunicationMessage['type'];
  priority?: CommunicationMessage['priority'];
}

export interface SendMessagePayload {
  recipientId: string;
  subject?: string;
  content: string;
  type?: CommunicationMessage['type'];
  priority?: CommunicationMessage['priority'];
  conversationId?: string;
  attachments?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateMessagePayload {
  subject?: string;
  content?: string;
  read?: boolean;
  status?: CommunicationMessage['status'];
  priority?: CommunicationMessage['priority'];
  attachments?: string[];
  metadata?: Record<string, any>;
}

function ensureIsoString(value?: string): string | undefined {
  if (!value) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString();
}

function normalizeMessage(raw: any): CommunicationMessage {
  if (!raw) {
    throw new Error('Invalid message payload received from API');
  }

  const source = raw.value ? { id: raw.id, ...raw.value } : raw;
  const {
    id,
    conversationId,
    senderId,
    senderName,
    recipientId,
    recipientName,
    subject,
    content,
    message,
    type,
    priority,
    status,
    read,
    createdAt,
    updatedAt,
    attachments,
    metadata,
  } = source;

  return {
    id: id ?? raw.id,
    conversationId: conversationId ?? raw.conversationId,
    senderId: senderId ?? source.fromUserId ?? '',
    senderName: senderName ?? source.fromUserName,
    recipientId: recipientId ?? source.toUserId ?? '',
    recipientName: recipientName ?? source.toUserName,
    subject: subject ?? source.title,
    content: content ?? message ?? '',
    type: (type ?? 'message') as CommunicationMessage['type'],
    priority: (priority ?? 'medium') as CommunicationMessage['priority'],
    status: (status ?? (read ? 'read' : 'sent')) as CommunicationMessage['status'],
    read: typeof read === 'boolean' ? read : status === 'read',
    createdAt: ensureIsoString(createdAt ?? raw.createdAt) ?? new Date().toISOString(),
    updatedAt: ensureIsoString(updatedAt ?? raw.updatedAt),
    attachments: attachments ?? [],
    metadata,
  };
}

function normalizeConversation(raw: any): ConversationSummary {
  if (!raw) {
    throw new Error('Invalid conversation payload received from API');
  }

  const lastMessage = raw.lastMessage ? normalizeMessage(raw.lastMessage) : null;
  const participants: string[] = Array.isArray(raw.participants)
    ? raw.participants
    : lastMessage
      ? [lastMessage.senderId, lastMessage.recipientId].filter(Boolean)
      : [];

  const participantNames =
    raw.participantNames ??
    (lastMessage
      ? {
          [lastMessage.senderId]: lastMessage.senderName ?? lastMessage.senderId,
          [lastMessage.recipientId]:
            lastMessage.recipientName ?? lastMessage.recipientId,
        }
      : undefined);

  return {
    id: raw.id ?? raw.conversationId ?? lastMessage?.conversationId ?? '',
    participants,
    participantNames,
    lastMessage:
      lastMessage ??
      normalizeMessage({
        id: raw.id,
        senderId: participants[0] ?? '',
        recipientId: participants[1] ?? '',
        content: '',
        type: 'message',
        priority: 'low',
        createdAt: raw.createdAt ?? new Date().toISOString(),
      }),
    unreadCount: raw.unreadCount ?? 0,
    createdAt:
      ensureIsoString(raw.createdAt) ??
      lastMessage?.createdAt ??
      new Date().toISOString(),
  };
}

function extractPaginatedResponse<T>(
  response: any,
  normalizer: (item: any) => T
): {
  items: T[];
  pagination?: PaginatedResponse<T>['pagination'];
} {
  if (!response) {
    return { items: [] };
  }

  const data = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.messages)
      ? response.messages
      : Array.isArray(response.conversations)
        ? response.conversations
        : Array.isArray(response)
          ? response
          : [];

  const items = data.map(normalizer);

  return {
    items,
    pagination: response.pagination,
  };
}

export class CommunicationService {
  async getConversations(
    params?: ConversationQueryParams
  ): Promise<{
    conversations: ConversationSummary[];
    pagination?: PaginatedResponse<ConversationSummary>['pagination'];
  }> {
    const response = await apiService.get<ConversationSummary[]>(
      API_ENDPOINTS.COMMUNICATION.CONVERSATIONS,
      { params }
    );

    const { items, pagination } = extractPaginatedResponse(
      response,
      normalizeConversation
    );

    return {
      conversations: items,
      pagination,
    };
  }

  async getConversationById(id: string): Promise<ConversationSummary> {
    const response = await apiService.get<ConversationSummary>(
      API_ENDPOINTS.COMMUNICATION.CONVERSATION_BY_ID(id)
    );

    const payload =
      response.data ??
      (response as unknown as { conversation: ConversationSummary })?.conversation;

    return normalizeConversation(payload ?? response);
  }

  async getMessages(
    params?: MessageQueryParams
  ): Promise<{
    messages: CommunicationMessage[];
    pagination?: PaginatedResponse<CommunicationMessage>['pagination'];
  }> {
    const response = await apiService.get<CommunicationMessage[]>(
      API_ENDPOINTS.COMMUNICATION.MESSAGES,
      { params }
    );

    const { items, pagination } = extractPaginatedResponse(
      response,
      normalizeMessage
    );

    return {
      messages: items,
      pagination,
    };
  }

  async getMessageById(id: string): Promise<CommunicationMessage> {
    const response = await apiService.get<CommunicationMessage>(
      API_ENDPOINTS.COMMUNICATION.MESSAGE_BY_ID(id)
    );

    const payload = response.data ?? response;

    return normalizeMessage(payload);
  }

  async sendMessage(payload: SendMessagePayload): Promise<CommunicationMessage> {
    const response = await apiService.post<CommunicationMessage>(
      API_ENDPOINTS.COMMUNICATION.SEND_MESSAGE,
      payload
    );

    const data = response.data ?? response;

    return normalizeMessage(data);
  }

  async updateMessage(
    id: string,
    payload: UpdateMessagePayload
  ): Promise<CommunicationMessage> {
    const response = await apiService.put<CommunicationMessage>(
      API_ENDPOINTS.COMMUNICATION.MESSAGE_BY_ID(id),
      payload
    );

    const data = response.data ?? response;

    return normalizeMessage(data);
  }

  async deleteMessage(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.COMMUNICATION.MESSAGE_BY_ID(id));
  }
}

export const communicationService = new CommunicationService();
export default communicationService;

