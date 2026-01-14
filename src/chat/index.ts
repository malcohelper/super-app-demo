/**
 * Chat SDK - Public API for mini-apps
 * 
 * This SDK provides a clean interface for mini-apps to interact with
 * the Chat platform service without knowing about Firebase implementation.
 */

import { NativeChatModule, ChatEventEmitter } from './NativeChatModule';
import type {
  ChatSDK as IChatSDK,
  ChatUser,
  ChatRoom,
  ChatMessage,
  MessagePayload,
  MessagesResponse,
  RoomsResponse,
  ChatEventCallback,
  Unsubscribe,
  ChatEvent,
} from './types';

class ChatSDKImpl implements IChatSDK {
  private initialized = false;
  private subscriptions = new Map<string, any>();

  /**
   * Initialize chat with user information
   */
  async init(user: ChatUser): Promise<void> {
    try {
      await NativeChatModule.initialize(user);
      this.initialized = true;
    } catch (error) {
      console.error('[ChatSDK] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get list of rooms for current user
   */
  async getRooms(): Promise<RoomsResponse> {
    this.ensureInitialized();
    try {
      return await NativeChatModule.getRooms();
    } catch (error) {
      console.error('[ChatSDK] Get rooms failed:', error);
      throw error;
    }
  }

  /**
   * Get details of a specific room
   */
  async getRoom(roomId: string): Promise<ChatRoom> {
    this.ensureInitialized();
    try {
      return await NativeChatModule.getRoom(roomId);
    } catch (error) {
      console.error('[ChatSDK] Get room failed:', error);
      throw error;
    }
  }

  /**
   * Send a message to a room
   */
  async sendMessage(roomId: string, payload: MessagePayload): Promise<ChatMessage> {
    this.ensureInitialized();
    try {
      return await NativeChatModule.sendMessage(roomId, payload);
    } catch (error) {
      console.error('[ChatSDK] Send message failed:', error);
      throw error;
    }
  }

  /**
   * Subscribe to room events (messages, typing, etc.)
   */
  subscribeRoom(roomId: string, callback: ChatEventCallback): Unsubscribe {
    this.ensureInitialized();

    // Subscribe to native events
    NativeChatModule.subscribeToRoom(roomId).catch((error) => {
      console.error('[ChatSDK] Subscribe to room failed:', error);
    });

    // Setup event listeners
    const listeners = [
      ChatEventEmitter.addListener('message_added', (data: any) => {
        if (data.message?.roomId === roomId) {
          callback({
            type: 'message_added',
            message: data.message,
          });
        }
      }),
      ChatEventEmitter.addListener('message_ack', (data: any) => {
        callback({
          type: 'message_ack',
          localId: data.localId,
          messageId: data.messageId,
        });
      }),
      ChatEventEmitter.addListener('message_failed', (data: any) => {
        callback({
          type: 'message_failed',
          localId: data.localId,
          reason: data.reason,
        });
      }),
      ChatEventEmitter.addListener('sync_state', (data: any) => {
        callback({
          type: 'sync_state',
          state: data.state,
        });
      }),
      ChatEventEmitter.addListener('room_updated', (data: any) => {
        if (data.room?.id === roomId) {
          callback({
            type: 'room_updated',
            room: data.room,
          });
        }
      }),
      ChatEventEmitter.addListener('typing', (data: any) => {
        callback({
          type: 'typing',
          userId: data.userId,
        });
      }),
    ];

    // Store subscription
    this.subscriptions.set(roomId, listeners);

    // Return unsubscribe function
    return () => {
      // Remove event listeners
      const subs = this.subscriptions.get(roomId);
      if (subs) {
        subs.forEach((listener: any) => listener.remove());
        this.subscriptions.delete(roomId);
      }

      // Unsubscribe from native
      NativeChatModule.unsubscribeFromRoom(roomId).catch((error) => {
        console.error('[ChatSDK] Unsubscribe from room failed:', error);
      });
    };
  }

  /**
   * Get messages for a room with pagination
   */
  async getMessages(
    roomId: string,
    limit: number = 50,
    before?: string
  ): Promise<MessagesResponse> {
    this.ensureInitialized();
    try {
      return await NativeChatModule.getMessages(roomId, limit, before || null);
    } catch (error) {
      console.error('[ChatSDK] Get messages failed:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(roomId: string, messageId: string): Promise<void> {
    this.ensureInitialized();
    try {
      await NativeChatModule.markAsRead(roomId, messageId);
    } catch (error) {
      console.error('[ChatSDK] Mark as read failed:', error);
      throw error;
    }
  }

  /**
   * Create a new chat room
   */
  async createRoom(roomData: {
    name: string;
    description?: string;
    type?: 'public' | 'private' | 'direct';
    memberUids?: string[];
  }): Promise<ChatRoom> {
    this.ensureInitialized();
    try {
      return await NativeChatModule.createRoom(roomData);
    } catch (error) {
      console.error('[ChatSDK] Create room failed:', error);
      throw error;
    }
  }

  /**
   * Join a room
   */
  async joinRoom(roomId: string): Promise<void> {
    this.ensureInitialized();
    try {
      await NativeChatModule.joinRoom(roomId);
    } catch (error) {
      console.error('[ChatSDK] Join room failed:', error);
      throw error;
    }
  }

  /**
   * Leave a room
   */
  async leaveRoom(roomId: string): Promise<void> {
    this.ensureInitialized();
    try {
      await NativeChatModule.leaveRoom(roomId);
    } catch (error) {
      console.error('[ChatSDK] Leave room failed:', error);
      throw error;
    }
  }

  /**
   * Ensure SDK is initialized before use
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        'ChatSDK is not initialized. Call chat.init() first.'
      );
    }
  }
}

// Export singleton instance
export const chat = new ChatSDKImpl();

// Export types
export type { ChatSDK, ChatUser, ChatRoom, ChatMessage, MessagePayload, ChatEvent } from './types';
