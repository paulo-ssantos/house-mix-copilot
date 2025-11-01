import * as ipc from "node-ipc";
import { CommunicationBase, MessageType } from "./communication-base";
import { AppMode } from "@church-copilot/shared";

export interface IPCServerOptions {
  id: string;
  retry?: number;
  maxRetries?: number;
  networkHost?: string;
  networkPort?: number;
  socketRoot?: string;
}

interface ConnectedClient {
  id: string;
  appMode: AppMode;
  connectedAt: Date;
}

/**
 * IPC server for communication between apps
 * Alternative to WebSocket for local process communication
 */
export class IPCCommunicationServer extends CommunicationBase {
  private clients = new Map<string, ConnectedClient>();
  private options: IPCServerOptions;
  private isInitialized = false;

  constructor(appMode: AppMode, options: IPCServerOptions) {
    super(appMode);
    this.options = options;

    // Configure IPC
    ipc.config.id = options.id;
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
   * Initialize the IPC server
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        ipc.serve(() => {
          console.log(`IPC server ${this.options.id} started`);

          ipc.server.on("connect", (socket: any) => {
            console.log("IPC client connected:", socket.id);
          });

          ipc.server.on("disconnect", (socket: any) => {
            this.handleClientDisconnect(socket.id);
          });

          ipc.server.on("init", (data: any, socket: any) => {
            this.handleClientInit(data, socket);
          });

          ipc.server.on("message", (data: any, socket: any) => {
            this.handleClientMessage(data, socket);
          });

          this.isConnected = true;
          this.isInitialized = true;
          this.emit("connected");
          resolve();
        });

        ipc.server.start();
      } catch (error) {
        console.error("Failed to initialize IPC server:", error);
        reject(error);
      }
    });
  }

  /**
   * Close the IPC server
   */
  async close(): Promise<void> {
    if (this.isInitialized) {
      ipc.server.stop();
      this.clients.clear();
      this.isConnected = false;
      this.isInitialized = false;
      this.emit("disconnected");
    }
  }

  /**
   * Send message to specific client or all clients
   */
  async sendMessage(message: MessageType): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("IPC server not initialized");
    }

    if (message.target && message.target !== "all") {
      // Send to specific app mode
      const targetClients = Array.from(this.clients.entries()).filter(
        ([_, client]) => client.appMode === message.target
      );

      for (const [clientId, _] of targetClients) {
        ipc.server.emit(clientId, "message", message);
      }
    } else {
      // Broadcast to all clients
      await this.broadcastMessage(message);
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  async broadcastMessage(message: Omit<MessageType, "target">): Promise<void> {
    if (!this.isServerStarted) {
      throw new Error("IPC server not started");
    }

    for (const client of this.clients.values()) {
      ipc.server.emit(client.id, "message", { ...message, target: "all" });
    }
  }

  /**
   * Get connected clients info
   */
  getConnectedClients(): Array<{
    id: string;
    appMode: AppMode;
    connectedAt: Date;
  }> {
    return Array.from(this.clients.values()).map((client) => ({
      id: client.id,
      appMode: client.appMode,
      connectedAt: client.connectedAt,
    }));
  }

  /**
   * Get clients by app mode
   */
  getClientsByMode(appMode: AppMode): ConnectedClient[] {
    return Array.from(this.clients.values()).filter(
      (client) => client.appMode === appMode
    );
  }

  /**
   * Handle client initialization
   */
  private handleClientInit(data: any, socket: any): void {
    try {
      if (data.appMode) {
        const client: ConnectedClient = {
          id: socket.id,
          appMode: data.appMode,
          connectedAt: new Date(),
        };

        this.clients.set(socket.id, client);

        // Send acknowledgment
        ipc.server.emit(socket, "init_ack", {
          clientId: socket.id,
          timestamp: new Date(),
        });

        this.emit("clientConnected", client);
        console.log(`IPC client connected: ${socket.id} (${client.appMode})`);
      }
    } catch (error) {
      console.error("Error handling client init:", error);
    }
  }

  /**
   * Handle message from client
   */
  private async handleClientMessage(data: any, socket: any): Promise<void> {
    try {
      const message = data as MessageType;

      // Handle the message
      await this.handleMessage(message);

      // Forward to other clients if needed
      if (message.target === "all" || message.target !== this.appMode) {
        await this.sendMessage(message);
      }
    } catch (error) {
      console.error(`Error handling message from client ${socket.id}:`, error);
    }
  }

  /**
   * Handle client disconnect
   */
  private handleClientDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      this.emit("clientDisconnected", client);
      console.log(`IPC client disconnected: ${clientId} (${client.appMode})`);
    }
  }
}
