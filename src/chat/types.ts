/**
 * TypeScript type definitions for Chat module
 */

export interface ChatUser {
  userId: string;
  displayName: string;
  photoURL?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  uid: string;
  displayName: string;
  photoURL?: string;
  text: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: number;
  edited?: boolean;
  editedAt?: number;
  metadata?: Record<string, any>;
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  createdBy: string;
  createdAt: number;
  memberCount: number;
  lastMessage?: string;
  lastMessageAt?: number;
  isActive: boolean;
}

export interface MessagePayload {
  text: string;
  type?: 'text' | 'image' | 'file';
  metadata?: Record<string, any>;
}

export interface MessagesResponse {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface RoomsResponse {
  rooms: ChatRoom[];
}

export type MessageStatus = 'PENDING' | 'SENDING' | 'SENT' | 'FAILED';

export type ChatEvent =
  | { type: 'message_added'; message: ChatMessage }
  | { type: 'message_ack'; localId: string; messageId: string }
  | { type: 'message_failed'; localId: string; reason?: string }
  | { type: 'sync_state'; state: 'syncing' | 'idle' }
  | { type: 'room_updated'; room: ChatRoom }
  | { type: 'typing'; userId: string };

export type ChatEventCallback = (event: ChatEvent) => void;
export type Unsubscribe = () => void;

export interface ChatSDK {
  /**
   * Initialize chat with user information
   */
  init(user: ChatUser): Promise<void>;

  /**
   * Get list of rooms for current user
   */
  getRooms(): Promise<RoomsResponse>;

  /**
   * Get details of a specific room
   */
  getRoom(roomId: string): Promise<ChatRoom>;

  /**
   * Send a message to a room
   */
  sendMessage(roomId: string, payload: MessagePayload): Promise<ChatMessage>;

  /**
   * Subscribe to room events (messages, typing, etc.)
   */
  subscribeRoom(roomId: string, callback: ChatEventCallback): Unsubscribe;

  /**
   * Get messages for a room with pagination
   */
  getMessages(
    roomId: string,
    limit?: number,
    before?: string
  ): Promise<MessagesResponse>;

  /**
   * Mark messages as read
   */
  markAsRead(roomId: string, messageId: string): Promise<void>;

  /**
   * Create a new chat room
   */
  createRoom(roomData: {
    name: string;
    description?: string;
    type?: 'public' | 'private' | 'direct';
    memberUids?: string[];
  }): Promise<ChatRoom>;

  /**
   * Join a room
   */
  joinRoom(roomId: string): Promise<void>;

  /**
   * Leave a room
   */
  leaveRoom(roomId: string): Promise<void>;
}
