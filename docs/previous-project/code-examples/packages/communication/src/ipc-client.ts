import * as ipc from "node-ipc";
import { CommunicationBase, MessageType } from "./communication-base";
import { AppMode } from "@church-copilot/shared";

export interface IPCClientOptions {
  serverId: string;
  retry?: number;
  maxRetries?: number;
  networkHost?: string;
  networkPort?: number;
  socketRoot?: string;
}

/**
 * IPC client for communication with server
 * Alternative to WebSocket for local process communication
 */
export class IPCCommunicationClient extends CommunicationBase {
  private options: IPCClientOptions;
  private isInitialized = false;

  constructor(appMode: AppMode, options: IPCClientOptions) {
    super(appMode);
    this.options = options;

    // Configure IPC
    ipc.config.id = `${appMode}_client_${Date.now()}`;
    ipc.config.retry = options.retry || 1500;
    ipc.config.maxRetries = options.maxRetries || 5;
    ipc.config.silent = false;

    if (options.networkHost && options.networkPort) {
      ipc.config.networkHost = options.networkHost;
      ipc.config.networkPort = options.networkPort;
    }

    if (options.socketRoot) {
      ipc.config.socketRoot = options.socketRoot;
    }
  }

  /**
   * Initialize IPC connection
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        ipc.connectTo(this.options.serverId, () => {
          const server = ipc.of[this.options.serverId];

          server.on("connect", () => {
            console.log(`IPC connected to server ${this.options.serverId}`);
            this.handleConnectionOpen();
            resolve();
          });

          server.on("disconnect", () => {
            console.log(
              `IPC disconnected from server ${this.options.serverId}`
            );
            this.handleConnectionClose();
          });

          server.on("error", (error: Error) => {
            console.error("IPC error:", error);
            this.emit("error", error);
            if (!this.isConnected) {
              reject(error);
            }
          });

          server.on("init_ack", (data: any) => {
            console.log("IPC initialization acknowledged by server");
          });

          server.on("message", (message: MessageType) => {
            this.handleIncomingMessage(message);
          });
        });

        // Set connection timeout
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error("IPC connection timeout"));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Close IPC connection
   */
  async close(): Promise<void> {
    if (this.isInitialized) {
      ipc.disconnect(this.options.serverId);
      this.isConnected = false;
      this.isInitialized = false;
      this.emit("disconnected");
    }
  }

  /**
   * Send message to server
   */
  async sendMessage(message: MessageType): Promise<void> {
    if (!this.isConnected) {
      throw new Error("IPC not connected");
    }

    const server = ipc.of[this.options.serverId];
    server.emit("message", message);
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
    console.log("IPC connected to server");

    // Send initialization message
    const server = ipc.of[this.options.serverId];
    server.emit("init", {
      appMode: this.appMode,
      timestamp: new Date(),
    });

    this.isConnected = true;
    this.isInitialized = true;
    this.emit("connected");
  }

  /**
   * Handle incoming message
   */
  private async handleIncomingMessage(message: MessageType): Promise<void> {
    try {
      // Handle regular messages
      await this.handleMessage(message);
    } catch (error) {
      console.error("Error handling IPC message:", error);
    }
  }

  /**
   * Handle connection close
   */
  private handleConnectionClose(): void {
    this.isConnected = false;
    this.isInitialized = false;
    this.emit("disconnected");
  }

  /**
   * Get connection status info
   */
  getConnectionInfo(): {
    connected: boolean;
    serverId: string;
  } {
    return {
      connected: this.isConnected,
      serverId: this.options.serverId,
    };
  }
}
