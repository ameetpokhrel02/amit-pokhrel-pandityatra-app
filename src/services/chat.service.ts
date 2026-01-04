import { ChatMessage, ChatRoom, ChatUser } from '../types/chat';

// Mock Users
const CURRENT_USER: ChatUser = { id: 'u1', name: 'Anita', role: 'customer' };
const PANDIT_USER: ChatUser = { id: 'p1', name: 'Pandit Ram Acharya', role: 'pandit', avatar: 'https://i.pravatar.cc/150?u=p1' };
const AI_USER: ChatUser = { id: 'ai', name: 'PanditYatra AI', role: 'ai' };

// Mock Chats
let chats: ChatRoom[] = [
  {
    id: 'c1',
    participants: [CURRENT_USER, PANDIT_USER],
    unreadCount: 1,
    status: 'active',
    context: {
      ritualType: 'Bratabandha',
      location: 'Kathmandu',
    },
    lastMessage: {
      id: 'm1',
      chatId: 'c1',
      senderId: 'p1',
      text: 'Namaste 🙏 Yes, I am available on 12th Ashwin.',
      type: 'text',
      timestamp: Date.now() - 1000 * 60 * 5, // 5 mins ago
      isRead: false,
    },
  },
];

let messages: Record<string, ChatMessage[]> = {
  'c1': [
    {
      id: 'm0',
      chatId: 'c1',
      senderId: 'system',
      text: '🔱 You are now chatting with Pandit Ram Acharya (Verified). Please keep communication respectful.',
      type: 'system',
      timestamp: Date.now() - 1000 * 60 * 60,
      isRead: true,
    },
    {
      id: 'm1',
      chatId: 'c1',
      senderId: 'u1',
      text: 'Namaste Pandit ji 🙏 I am planning Bratabandha for my son next month in Kathmandu. Are you available on 12th Ashwin?',
      type: 'text',
      timestamp: Date.now() - 1000 * 60 * 30,
      isRead: true,
    },
    {
      id: 'm2',
      chatId: 'c1',
      senderId: 'p1',
      text: 'Namaste 🙏 Yes, I am available on 12th Ashwin. Please confirm location and number of participants.',
      type: 'text',
      timestamp: Date.now() - 1000 * 60 * 5,
      isRead: false,
    },
  ],
};

export const ChatService = {
  getChats: async (): Promise<ChatRoom[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(chats), 500));
  },

  getMessages: async (chatId: string): Promise<ChatMessage[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(messages[chatId] || []), 500));
  },

  sendMessage: async (chatId: string, text: string): Promise<ChatMessage> => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      chatId,
      senderId: CURRENT_USER.id,
      text,
      type: 'text',
      timestamp: Date.now(),
      isRead: true,
    };

    if (!messages[chatId]) messages[chatId] = [];
    messages[chatId].push(newMessage);
    
    // Update last message in chat room
    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex > -1) {
      chats[chatIndex].lastMessage = newMessage;
    }

    return newMessage;
  },

  // Simulate AI Suggestion
  getAISuggestion: async (chatId: string, lastMessageText: string): Promise<ChatMessage | null> => {
    // Simple keyword matching for demo
    const lowerText = lastMessageText.toLowerCase();
    
    if (lowerText.includes('available') || lowerText.includes('date')) {
      return {
        id: 'ai_' + Date.now(),
        chatId,
        senderId: 'ai',
        text: 'Suggested: "Pandit ji, will you arrange samagri or should we provide it?"',
        type: 'ai_suggestion',
        timestamp: Date.now(),
        isRead: true,
        metadata: { suggestionAction: 'ask_samagri' }
      };
    }
    
    if (lowerText.includes('samagri')) {
       return {
        id: 'ai_' + Date.now(),
        chatId,
        senderId: 'ai',
        text: 'Suggested: "What is the total dakshina for this ritual?"',
        type: 'ai_suggestion',
        timestamp: Date.now(),
        isRead: true,
      };
    }

    return null;
  }
};
