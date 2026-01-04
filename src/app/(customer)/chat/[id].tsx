import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { ChatService } from '@/services/chat.service';
import { ChatMessage, ChatRoom } from '@/types/chat';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState<ChatMessage | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
  }, [id]);

  const loadMessages = async () => {
    if (typeof id !== 'string') return;
    try {
      const data = await ChatService.getMessages(id);
      setMessages(data);
      
      // Check for AI suggestion based on last message
      if (data.length > 0) {
        const lastMsg = data[data.length - 1];
        if (lastMsg.senderId !== 'u1') { // If last message is not from me
             const suggestion = await ChatService.getAISuggestion(id, lastMsg.text);
             setAiSuggestion(suggestion);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (text: string = inputText) => {
    if (!text.trim() || typeof id !== 'string') return;

    const tempId = Math.random().toString();
    const optimisticMessage: ChatMessage = {
      id: tempId,
      chatId: id,
      senderId: 'u1',
      text: text,
      type: 'text',
      timestamp: Date.now(),
      isRead: true,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setInputText('');
    setAiSuggestion(null); // Clear suggestion after sending

    try {
      await ChatService.sendMessage(id, text);
      // In real app, replace temp ID with real ID
    } catch (error) {
      console.error('Failed to send', error);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.type === 'system') {
      return (
        <View style={styles.systemMessageContainer}>
          <IconSymbol name="info.circle" size={16} color="#666" />
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }

    const isMe = item.senderId === 'u1';
    
    return (
      <View style={[
        styles.messageBubble, 
        isMe ? styles.myMessage : styles.theirMessage
      ]}>
        <Text style={[
          styles.messageText,
          isMe ? styles.myMessageText : styles.theirMessageText
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.timestamp,
          isMe ? styles.myTimestamp : styles.theirTimestamp
        ]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={28} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Pandit Ram Acharya</Text>
          <View style={styles.verifiedBadge}>
            <IconSymbol name="checkmark.circle.fill" size={14} color={Colors.light.primary} />
            <Text style={styles.verifiedText}>Verified Pandit</Text>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {aiSuggestion && (
        <View style={styles.suggestionContainer}>
          <View style={styles.suggestionHeader}>
            <IconSymbol name="sparkles" size={16} color={Colors.light.primary} />
            <Text style={styles.suggestionTitle}>AI Suggestion</Text>
          </View>
          <TouchableOpacity 
            style={styles.suggestionBubble}
            onPress={() => handleSend(aiSuggestion.text.replace('Suggested: ', '').replace(/"/g, ''))}
          >
            <Text style={styles.suggestionText}>
              {aiSuggestion.text.replace('Suggested: ', '').replace(/"/g, '')}
            </Text>
            <IconSymbol name="arrow.up.circle.fill" size={24} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
          onPress={() => handleSend()}
          disabled={!inputText.trim()}
        >
          <IconSymbol name="paperplane.fill" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  verifiedText: {
    fontSize: 12,
    color: Colors.light.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  systemMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 12,
    marginVertical: 16,
    alignSelf: 'center',
    maxWidth: '90%',
  },
  systemMessageText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    textAlign: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: 'white',
  },
  theirMessageText: {
    color: Colors.light.text,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  theirTimestamp: {
    color: '#999',
  },
  suggestionContainer: {
    padding: 16,
    backgroundColor: '#FFF9F0', // Light orange/yellow tint
    borderTopWidth: 1,
    borderTopColor: '#FFE0B2',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  suggestionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginRight: 12,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
