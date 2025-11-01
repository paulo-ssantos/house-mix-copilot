import { EventEmitter } from "events";
import {
  LiturgyState,
  StreamContentState,
  AppMode,
} from "@church-copilot/shared";

export interface CommunicationMessage {
  id: string;
  type: string;
  source: AppMode;
  target?: AppMode | "all";
  timestamp: Date;
  data?: any;
}

export interface LiturgyUpdateMessage extends CommunicationMessage {
  type: "liturgy_update";
  data: {
    liturgyId: string;
    state: LiturgyState;
    changes?: Partial<LiturgyState>;
  };
}

export interface StreamContentMessage extends CommunicationMessage {
  type: "stream_content";
  data: {
    content: StreamContentState;
    action: "show" | "hide" | "update";
  };
}

export interface ControlMessage extends CommunicationMessage {
  type: "control";
  data: {
    command: "play" | "pause" | "stop" | "next" | "previous" | "seek";
    target?: "main" | "stream" | "all";
    params?: any;
  };
}

export interface SystemMessage extends CommunicationMessage {
  type: "system";
  data: {
    event: "app_ready" | "app_closing" | "mode_change" | "error";
    details?: any;
  };
}

export interface SyncMessage extends CommunicationMessage {
  type: "sync_request" | "sync_response";
  data: {
    requestId?: string;
    dataType: "liturgy" | "settings" | "state" | "all";
    content?: any;
  };
}

export type MessageType =
  | LiturgyUpdateMessage
  | StreamContentMessage
  | ControlMessage
  | SystemMessage
  | SyncMessage;

export interface MessageHandler<T extends MessageType = MessageType> {
  (message: T): Promise<void> | void;
}

export abstract class CommunicationBase extends EventEmitter {
  protected appMode: AppMode;
  protected isConnected = false;
  protected messageHandlers = new Map<string, MessageHandler[]>();

  constructor(appMode: AppMode) {
    super();
    this.appMode = appMode;
  }

  /**
   * Initialize the communication system
   */
  abstract initialize(): Promise<void>;

  /**
   * Close the communication system
   */
  abstract close(): Promise<void>;

  /**
   * Send a message
   */
  abstract sendMessage(message: MessageType): Promise<void>;

  /**
   * Broadcast a message to all connected apps
   */
  abstract broadcastMessage(
    message: Omit<MessageType, "target">
  ): Promise<void>;

  /**
   * Register a message handler
   */
  on<T extends MessageType>(type: T["type"], handler: MessageHandler<T>): this {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler as MessageHandler);
    return this;
  }

  /**
   * Remove a message handler
   */
  off<T extends MessageType>(
    type: T["type"],
    handler: MessageHandler<T>
  ): this {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler as MessageHandler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    }
    return this;
  }

  /**
   * Handle incoming message
   */
  protected async handleMessage(message: MessageType): Promise<void> {
    try {
      // Check if message is targeted for this app
      if (
        message.target &&
        message.target !== "all" &&
        message.target !== this.appMode
      ) {
        return;
      }

      // Emit general message event
      this.emit("message", message);

      // Call specific handlers
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        for (const handler of handlers) {
          try {
            await handler(message);
          } catch (error) {
            console.error("Error in message handler:", error);
            this.emit("error", { error, message });
          }
        }
      }
    } catch (error) {
      console.error("Error handling message:", error);
      this.emit("error", { error, message });
    }
  }

  /**
   * Generate a unique message ID
   */
  protected generateMessageId(): string {
    return `${this.appMode}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  /**
   * Create a base message
   */
  protected createBaseMessage(
    type: string,
    target?: AppMode | "all"
  ): Omit<CommunicationMessage, "data"> {
    return {
      id: this.generateMessageId(),
      type,
      source: this.appMode,
      target,
      timestamp: new Date(),
    };
  }

  /**
   * Create liturgy update message
   */
  createLiturgyUpdateMessage(
    liturgyId: string,
    state: LiturgyState,
    changes?: Partial<LiturgyState>,
    target?: AppMode | "all"
  ): LiturgyUpdateMessage {
    return {
      ...this.createBaseMessage("liturgy_update", target),
      data: { liturgyId, state, changes },
    } as LiturgyUpdateMessage;
  }

  /**
   * Create stream content message
   */
  createStreamContentMessage(
    content: StreamContentState,
    action: "show" | "hide" | "update",
    target?: AppMode | "all"
  ): StreamContentMessage {
    return {
      ...this.createBaseMessage("stream_content", target),
      data: { content, action },
    } as StreamContentMessage;
  }

  /**
   * Create control message
   */
  createControlMessage(
    command: "play" | "pause" | "stop" | "next" | "previous" | "seek",
    commandTarget?: "main" | "stream" | "all",
    params?: any,
    messageTarget?: AppMode | "all"
  ): ControlMessage {
    return {
      ...this.createBaseMessage("control", messageTarget),
      data: { command, target: commandTarget, params },
    } as ControlMessage;
  }

  /**
   * Create system message
   */
  createSystemMessage(
    event: "app_ready" | "app_closing" | "mode_change" | "error",
    details?: any,
    target?: AppMode | "all"
  ): SystemMessage {
    return {
      ...this.createBaseMessage("system", target),
      data: { event, details },
    } as SystemMessage;
  }

  /**
   * Create sync message
   */
  createSyncMessage(
    type: "sync_request" | "sync_response",
    dataType: "liturgy" | "settings" | "state" | "all",
    content?: any,
    requestId?: string,
    target?: AppMode | "all"
  ): SyncMessage {
    return {
      ...this.createBaseMessage(type, target),
      data: { requestId, dataType, content },
    } as SyncMessage;
  }

  /**
   * Quick send methods
   */
  async sendLiturgyUpdate(
    liturgyId: string,
    state: LiturgyState,
    changes?: Partial<LiturgyState>,
    target?: AppMode | "all"
  ): Promise<void> {
    const message = this.createLiturgyUpdateMessage(
      liturgyId,
      state,
      changes,
      target
    );
    await this.sendMessage(message);
  }

  async sendStreamContent(
    content: StreamContentState,
    action: "show" | "hide" | "update",
    target?: AppMode | "all"
  ): Promise<void> {
    const message = this.createStreamContentMessage(content, action, target);
    await this.sendMessage(message);
  }

  async sendControl(
    command: "play" | "pause" | "stop" | "next" | "previous" | "seek",
    commandTarget?: "main" | "stream" | "all",
    params?: any,
    messageTarget?: AppMode | "all"
  ): Promise<void> {
    const message = this.createControlMessage(
      command,
      commandTarget,
      params,
      messageTarget
    );
    await this.sendMessage(message);
  }

  async sendSystemEvent(
    event: "app_ready" | "app_closing" | "mode_change" | "error",
    details?: any,
    target?: AppMode | "all"
  ): Promise<void> {
    const message = this.createSystemMessage(event, details, target);
    await this.sendMessage(message);
  }

  async requestSync(
    dataType: "liturgy" | "settings" | "state" | "all",
    target?: AppMode | "all"
  ): Promise<void> {
    const message = this.createSyncMessage(
      "sync_request",
      dataType,
      undefined,
      undefined,
      target
    );
    await this.sendMessage(message);
  }

  async respondSync(
    requestId: string,
    dataType: "liturgy" | "settings" | "state" | "all",
    content: any,
    target?: AppMode | "all"
  ): Promise<void> {
    const message = this.createSyncMessage(
      "sync_response",
      dataType,
      content,
      requestId,
      target
    );
    await this.sendMessage(message);
  }

  /**
   * Get connection status
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get app mode
   */
  get mode(): AppMode {
    return this.appMode;
  }
}
