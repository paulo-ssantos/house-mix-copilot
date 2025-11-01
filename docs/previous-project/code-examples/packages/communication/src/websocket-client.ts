import WebSocket from "ws";
import { CommunicationBase, MessageType } from "./communication-base";
import { AppMode } from "@church-copilot/shared";

export interface WebSocketClientOptions {
  serverUrl: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
}

/**
 * WebSocket client for communication with server
 * Used by individual apps to connect to unified mode or communication hub
 */
export class WebSocketCommunicationClient extends CommunicationBase {
  private socket: WebSocket | null = null;
  private options: WebSocketClientOptions;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectDelay: number;
  private heartbeatInterval: number;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(appMode: AppMode, options: WebSocketClientOptions) {
    super(appMode);
    this.options = options;
    this.maxReconnectAttempts = options.reconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 3000;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
  }

  /**
   * Initialize WebSocket connection
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.options.serverUrl);

        this.socket.on("open", () => {
          this.handleConnectionOpen();
          resolve();
        });

        this.socket.on("message", (data: WebSocket.Data) => {
          this.handleIncomingMessage(data);
        });

        this.socket.on("close", (code: number, reason: string) => {
          this.handleConnectionClose(code, reason);
        });

        this.socket.on("error", (error: Error) => {
          console.error("WebSocket error:", error);
          this.emit("error", error);
          if (!this.isConnected) {
            reject(error);
          }
        });

        this.socket.on("ping", () => {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.pong();
          }
        });

        // Set connection timeout
        setTimeout(() => {
          if (!this.isConnected) {
            this.socket?.close();
            reject(new Error("Connection timeout"));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Close WebSocket connection
   */
  async close(): Promise<void> {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.isConnected = false;
    this.emit("disconnected");
  }

  /**
   * Send message to server
   */
  async sendMessage(message: MessageType): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    const messageData = JSON.stringify(message);
    this.socket.send(messageData);
  }

  /**
   * Broadcast message (same as send for client)
   */
  async broadcastMessage(message: Omit<MessageType, "target">): Promise<void> {
    await this.sendMessage({ ...message, target: "all" } as MessageType);
  }

  /**
   * Handle connection open
   */
  private handleConnectionOpen(): void {
    console.log("WebSocket connected to server");

    // Send initialization message
    const initMessage = {
      type: "init",
      appMode: this.appMode,
      timestamp: new Date(),
    };

    this.socket!.send(JSON.stringify(initMessage));

    this.isConnected = true;
    this.reconnectAttempts = 0;

    // Start heartbeat
    this.startHeartbeat();

    this.emit("connected");
  }

  /**
   * Handle incoming message
   */
  private async handleIncomingMessage(data: WebSocket.Data): Promise<void> {
    try {
      const messageData = data.toString();
      const message = JSON.parse(messageData);

      if (message.type === "init_ack") {
        console.log("Initialization acknowledged by server");
        return;
      }

      // Handle regular messages
      await this.handleMessage(message as MessageType);
    } catch (error) {
      console.error("Error handling WebSocket message:", error);
    }
  }

  /**
   * Handle connection close
   */
  private handleConnectionClose(code: number, reason: string): void {
    console.log(`WebSocket connection closed: ${code} - ${reason}`);

    this.isConnected = false;
    this.socket = null;

    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    this.emit("disconnected");

    // Attempt to reconnect
    this.scheduleReconnect();
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      this.emit("reconnectFailed");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(
      `Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimer = setTimeout(async () => {
      try {
        console.log(
          `Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
        );
        await this.initialize();
        this.emit("reconnected");
      } catch (error) {
        console.error("Reconnection failed:", error);
        this.scheduleReconnect();
      }
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
    }

    this.heartbeatTimer = setTimeout(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.ping();
        this.startHeartbeat(); // Schedule next heartbeat
      }
    }, this.heartbeatInterval);
  }

  /**
   * Force reconnection
   */
  async reconnect(): Promise<void> {
    if (this.isConnected) {
      await this.close();
    }

    this.reconnectAttempts = 0;
    await this.initialize();
  }

  /**
   * Get connection status info
   */
  getConnectionInfo(): {
    connected: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    serverUrl: string;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      serverUrl: this.options.serverUrl,
    };
  }
}
