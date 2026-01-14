/**
 * Native Chat Module interface
 */

import { NativeModules, NativeEventEmitter } from 'react-native';
import type { ChatUser, ChatRoom, MessagePayload, ChatMessage, MessagesResponse, RoomsResponse } from './types';

interface NativeChatModuleInterface {
  initialize(userInfo: ChatUser): Promise<{ success: boolean }>;
  
  getRooms(): Promise<RoomsResponse>;
  
  getRoom(roomId: string): Promise<ChatRoom>;
  
  sendMessage(
    roomId: string,
    payload: MessagePayload
  ): Promise<ChatMessage>;
  
  subscribeToRoom(roomId: string): Promise<{ subscribed: boolean; roomId: string }>;
  
  unsubscribeFromRoom(roomId: string): Promise<{ unsubscribed: boolean; roomId: string }>;
  
  getMessages(
    roomId: string,
    limit: number,
    before?: string | null
  ): Promise<MessagesResponse>;
  
  markAsRead(roomId: string, messageId: string): Promise<{ success: boolean }>;
  
  createRoom(roomData: {
    name: string;
    description?: string;
    type?: string;
    memberUids?: string[];
  }): Promise<ChatRoom>;
  
  joinRoom(roomId: string): Promise<{ success: boolean; roomId: string }>;
  
  leaveRoom(roomId: string): Promise<{ success: boolean; roomId: string }>;
}

const { ChatModule } = NativeModules;

if (!ChatModule) {
  throw new Error(
    'ChatModule native module is not available. Make sure the native module is properly linked.'
  );
}

export const NativeChatModule = ChatModule as NativeChatModuleInterface;
export const ChatEventEmitter = new NativeEventEmitter(ChatModule);
