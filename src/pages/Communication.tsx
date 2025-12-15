import { useEffect, useMemo, useState } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  Filter,
  Plus,
  AlertCircle,
  Bell,
  Loader2,
} from 'lucide-react';
import { useApi, useApiMutation } from '../hooks/useApi';
import {
  communicationService,
  SendMessagePayload,
} from '../services/communication';
import { userService } from '../services/users';
import {
  CommunicationMessage,
  ConversationSummary,
  User,
} from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const DEFAULT_COMPOSE: Omit<SendMessagePayload, 'content'> & { content: string } = {
  recipientId: '',
  subject: '',
  content: '',
  priority: 'medium',
  type: 'message',
};

function formatDate(dateString: string): string {
  if (!dateString) {
    return '';
  }

  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getPriorityColor(priority: string | undefined): string {
  switch (priority) {
    case 'low':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'urgent':
      return 'bg-red-200 text-red-900';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getDisplayName(
  participantId: string,
  participantName: string | undefined,
  currentUser: User | null
): string {
  if (currentUser?.id === participantId) {
    return 'You';
  }
  return participantName ?? participantId;
}

export default function Communication() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState<'messages' | 'alerts' | 'compose'>(
    'messages'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    null
  );
  const [replyContent, setReplyContent] = useState('');
  const [composeForm, setComposeForm] = useState(DEFAULT_COMPOSE);

  const {
    data: conversationData,
    loading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations,
  } = useApi(() => communicationService.getConversations({ page: 1, limit: 50 }), []);

  const {
    data: alertsData,
    loading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
  } = useApi(() => communicationService.getMessages({ type: 'alert', page: 1, limit: 50 }), []);

  const {
    data: usersData,
    loading: usersLoading,
  } = useApi(() => userService.getUsers({ page: 1, limit: 100 }), []);

  const fetchMessages = () => {
    if (!selectedConversationId) {
      return Promise.resolve({
        messages: [] as CommunicationMessage[],
        pagination: undefined,
      });
    }

    return communicationService.getMessages({
      conversationId: selectedConversationId,
      page: 1,
      limit: 50,
    });
  };

  const {
    data: messagesData,
    loading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages,
  } = useApi(fetchMessages, [selectedConversationId]);

  const sendMessageMutation = useApiMutation(communicationService.sendMessage);

  const conversations = conversationData?.conversations ?? [];
  const alerts = alertsData?.messages ?? [];

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  useEffect(() => {
    setReplyContent('');
  }, [selectedConversationId]);

  const filteredConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const lastMessage = conversation.lastMessage;
      const participantNames = conversation.participantNames
        ? Object.values(conversation.participantNames).join(' ')
        : '';

      const haystack = [
        lastMessage?.subject,
        lastMessage?.content,
        participantNames,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [conversations, searchTerm]);

  const selectedConversation = useMemo<ConversationSummary | undefined>(
    () => conversations.find((conversation) => conversation.id === selectedConversationId),
    [conversations, selectedConversationId]
  );

  const conversationMessages = useMemo(() => {
    if (!messagesData?.messages) {
      return [] as CommunicationMessage[];
    }

    return [...messagesData.messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messagesData]);

  const conversationUnreadCount = useMemo(
    () =>
      conversations.reduce(
        (total, conversation) => total + (conversation.unreadCount ?? 0),
        0
      ),
    [conversations]
  );

  const participantOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role?: string }>();

    conversations.forEach((conversation) => {
      conversation.participants.forEach((participantId) => {
        if (participantId === user?.id) {
          return;
        }

        const participantName = conversation.participantNames?.[participantId];
        if (!map.has(participantId)) {
          map.set(participantId, {
            id: participantId,
            name: participantName ?? participantId,
          });
        }
      });
    });

    (usersData?.users ?? []).forEach((participant) => {
      if (participant.id === user?.id) {
        return;
      }

      map.set(participant.id, {
        id: participant.id,
        name: participant.name,
        role: participant.role,
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [conversations, usersData, user?.id]);

  const handleComposeChange = (
    field: keyof typeof composeForm,
    value: string
  ) => {
    setComposeForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSendMessage = async (payload: SendMessagePayload, successMessage: string) => {
    try {
      await sendMessageMutation.mutate(payload);

      addNotification({
        title: 'Message sent',
        message: successMessage,
        type: 'success',
        priority: 'medium',
        userId: user?.id ?? '',
        category: 'system',
      });

      await Promise.all([
        refetchConversations(),
        refetchMessages(),
        refetchAlerts(),
      ]);
    } catch (error: any) {
      addNotification({
        title: 'Unable to send message',
        message:
          error?.message ||
          'We could not deliver this message. Please try again in a moment.',
        type: 'error',
        priority: 'high',
        userId: user?.id ?? '',
        category: 'system',
      });
      throw error;
    }
  };

  const handleComposeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!composeForm.recipientId) {
      addNotification({
        title: 'Recipient required',
        message: 'Please select who should receive this message.',
        type: 'warning',
        priority: 'medium',
        userId: user?.id ?? '',
        category: 'system',
      });
      return;
    }

    const payload: SendMessagePayload = {
      recipientId: composeForm.recipientId,
      subject: composeForm.subject || undefined,
      content: composeForm.content,
      type: composeForm.type,
      priority: composeForm.priority,
    };

    await handleSendMessage(payload, 'Your message has been delivered.');
    setComposeForm(DEFAULT_COMPOSE);
    setActiveTab('messages');
  };

  const handleReplySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedConversation) {
      return;
    }

    const recipientId =
      selectedConversation.participants.find((participant) => participant !== user?.id) ??
      selectedConversation.participants[0];

    if (!recipientId) {
      addNotification({
        title: 'Reply unavailable',
        message: 'We could not determine who should receive this reply.',
        type: 'warning',
        priority: 'medium',
        userId: user?.id ?? '',
        category: 'system',
      });
      return;
    }

    const payload: SendMessagePayload = {
      recipientId,
      subject: selectedConversation.lastMessage.subject
        ? `Re: ${selectedConversation.lastMessage.subject}`
        : undefined,
      content: replyContent,
      type: 'message',
      priority: selectedConversation.lastMessage.priority ?? 'medium',
      conversationId: selectedConversation.id,
    };

    await handleSendMessage(payload, 'Reply sent successfully.');
    setReplyContent('');
  };

  const renderConversationCard = (conversation: ConversationSummary) => {
    const { lastMessage } = conversation;
    const recipientId =
      conversation.participants.find((participant) => participant !== user?.id) ??
      conversation.participants[0];

    const recipientName = conversation.participantNames?.[recipientId ?? ''];

    return (
      <button
        key={conversation.id}
        onClick={() => {
          setSelectedConversationId(conversation.id);
          setActiveTab('messages');
        }}
        className={`w-full text-left card transition border ${
          selectedConversationId === conversation.id
            ? 'border-primary-500 shadow-md'
            : 'border-transparent'
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-gray-900">
              {lastMessage.subject ?? 'No subject'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              To: {getDisplayName(recipientId ?? '', recipientName, user)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {conversation.unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                {conversation.unreadCount} new
              </span>
            )}
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                lastMessage.priority
              )}`}
            >
              {lastMessage.priority ?? 'medium'}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-700 mt-3 line-clamp-2">
          {lastMessage.content || 'No message content provided.'}
        </p>
        <p className="text-xs text-gray-500 mt-3">
          {formatDate(lastMessage.createdAt)}
        </p>
      </button>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Communication</h1>
        <p className="text-gray-600">
          Manage secure messages, alerts, and internal announcements
        </p>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'messages'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages ({conversationUnreadCount})
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'alerts'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bell className="h-4 w-4 mr-2" />
              Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('compose')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'compose'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Compose
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="card">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="pl-10 input-field"
                  />
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Filter className="h-4 w-4" />
                  {filteredConversations.length} of {conversations.length}
                </div>
              </div>
            </div>

            <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
              {conversationsLoading && (
                <div className="card flex items-center justify-center py-12 text-gray-500">
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Loading conversations...
                </div>
              )}

              {conversationsError && (
                <div className="card bg-red-50 border border-red-200 text-red-700">
                  We could not load conversations right now. Please try again shortly.
                </div>
              )}

              {!conversationsLoading && filteredConversations.length === 0 && (
                <div className="card text-center py-12 text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                  No conversations found.
                </div>
              )}

              {filteredConversations.map(renderConversationCard)}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      {selectedConversation.lastMessage.subject ?? 'Conversation'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Participants:{' '}
                      {selectedConversation.participants
                        .map((participantId) =>
                          getDisplayName(
                            participantId,
                            selectedConversation.participantNames?.[participantId],
                            user
                          )
                        )
                        .join(', ')}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                      selectedConversation.lastMessage.priority
                    )}`}
                  >
                    {selectedConversation.lastMessage.priority ?? 'medium'}
                  </span>
                </div>

                <div className="space-y-4 max-h-[24rem] overflow-y-auto pr-1">
                  {messagesLoading && (
                    <div className="flex items-center justify-center py-8 text-gray-500">
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Loading messages...
                    </div>
                  )}

                  {messagesError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                      Unable to load this conversation. Please refresh the page.
                    </div>
                  )}

                  {!messagesLoading && conversationMessages.length === 0 && (
                    <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500">
                      No messages yet. Start the conversation below.
                    </div>
                  )}

                  {conversationMessages.map((message) => {
                    const isOwnMessage = message.senderId === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`p-4 rounded-lg border ${
                          isOwnMessage ? 'bg-blue-50 border-blue-200' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">
                            {getDisplayName(message.senderId, message.senderName, user)}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{formatDate(message.createdAt)}</span>
                            <span className={`${getPriorityColor(message.priority)} px-2 py-0.5 rounded-full`}>
                              {message.priority ?? 'medium'}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-line">
                          {message.content}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleReplySubmit} className="mt-6 space-y-4">
                  <textarea
                    className="input-field h-24 resize-none"
                    placeholder="Type your reply..."
                    value={replyContent}
                    onChange={(event) => setReplyContent(event.target.value)}
                    disabled={sendMessageMutation.loading}
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="btn-primary flex items-center"
                      disabled={sendMessageMutation.loading || !replyContent.trim()}
                    >
                      {sendMessageMutation.loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send Reply
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="card h-full flex items-center justify-center text-gray-500">
                Select a conversation to view messages.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alertsLoading && (
            <div className="card flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Loading alerts...
            </div>
          )}

          {alertsError && (
            <div className="card bg-red-50 border border-red-200 text-red-700">
              We were unable to load alerts. Please refresh and try again.
            </div>
          )}

          {!alertsLoading && alerts.length === 0 && (
            <div className="card text-center py-12 text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-3 text-gray-400" />
              No alerts available. You're all caught up!
            </div>
          )}

          {alerts.map((alert) => (
            <div key={alert.id} className="card border border-yellow-200 bg-yellow-50">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      {alert.subject ?? 'System Alert'}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatDate(alert.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">
                    {alert.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'compose' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Compose Message</h2>
          <form className="space-y-6" onSubmit={handleComposeSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                <select
                  className="input-field"
                  value={composeForm.recipientId}
                  onChange={(event) =>
                    handleComposeChange('recipientId', event.target.value)
                  }
                  disabled={usersLoading && participantOptions.length === 0}
                  required
                >
                  <option value="">Select recipient...</option>
                  {participantOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                      {option.role ? ` (${option.role.replace(/-/g, ' ')})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  className="input-field"
                  value={composeForm.priority}
                  onChange={(event) =>
                    handleComposeChange('priority', event.target.value)
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  className="input-field"
                  value={composeForm.type}
                  onChange={(event) => handleComposeChange('type', event.target.value)}
                >
                  <option value="message">Message</option>
                  <option value="alert">Alert</option>
                  <option value="notification">Notification</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter message subject"
                  value={composeForm.subject}
                  onChange={(event) =>
                    handleComposeChange('subject', event.target.value)
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                className="input-field h-32 resize-none"
                placeholder="Enter your message..."
                value={composeForm.content}
                onChange={(event) =>
                  handleComposeChange('content', event.target.value)
                }
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary flex items-center"
                disabled={sendMessageMutation.loading}
              >
                {sendMessageMutation.loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Message
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

