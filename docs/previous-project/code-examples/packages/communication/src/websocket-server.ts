import { Server as WebSocketServer, WebSocket, RawData } from "ws";
import { CommunicationBase, MessageType } from "./communication-base";
import { AppMode } from "@church-copilot/shared";

export interface WebSocketServerOptions {
  port: number;
  host?: string;
  maxConnections?: number;
}

interface ConnectedClient {
  id: string;
  socket: WebSocket;
  appMode: AppMode;
  connectedAt: Date;
  lastPing: Date;
}

/**
 * WebSocket server for communication between apps
 * Used when running in unified mode or as communication hub
 */
export class WebSocketCommunicationServer extends CommunicationBase {
  private server: WebSocketServer | null = null;
  private clients = new Map<string, ConnectedClient>();
  private options: WebSocketServerOptions;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(appMode: AppMode, options: WebSocketServerOptions) {
    super(appMode);
    this.options = options;
  }

  /**
   * Initialize the WebSocket server
   */
  async initialize(): Promise<void> {
    try {
      this.server = new WebSocketServer({
        port: this.options.port,
        host: this.options.host || "localhost",
      });

      this.server.on("connection", (socket, request) => {
        this.handleNewConnection(socket, request);
      });

      this.server.on("error", (error) => {
        console.error("WebSocket server error:", error);
        this.emit("error", error);
      });

      // Start ping interval to check client connections
      this.pingInterval = setInterval(() => {
        this.pingClients();
      }, 30000); // Ping every 30 seconds

      this.isConnected = true;
      this.emit("connected");

      console.log(
        `WebSocket server listening on ${this.options.host || "localhost"}:${
          this.options.port
        }`
      );
    } catch (error) {
      console.error("Failed to initialize WebSocket server:", error);
      throw error;
    }
  }

  /**
   * Close the WebSocket server
   */
  async close(): Promise<void> {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Close all client connections
    for (const client of this.clients.values()) {
      client.socket.close();
    }
    this.clients.clear();

    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => {
          resolve();
        });
      });
      this.server = null;
    }

    this.isConnected = false;
    this.emit("disconnected");
  }

  /**
   * Send message to specific client or all clients
   */
  async sendMessage(message: MessageType): Promise<void> {
    if (!this.server) {
      throw new Error("WebSocket server not initialized");
    }

    const messageData = JSON.stringify(message);

    if (message.target && message.target !== "all") {
      // Send to specific app mode
      const targetClients = Array.from(this.clients.values()).filter(
        (client) => client.appMode === message.target
      );

      for (const client of targetClients) {
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.send(messageData);
        }
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
    if (!this.server) {
      throw new Error("WebSocket server not initialized");
    }

    const messageData = JSON.stringify({ ...message, target: "all" });

    for (const client of this.clients.values()) {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(messageData);
      }
    }
  }

  /**
   * Get connected clients info
   */
  getConnectedClients(): Array<{
    id: string;
    appMode: AppMode;
    connectedAt: Date;
    lastPing: Date;
  }> {
    return Array.from(this.clients.values()).map((client) => ({
      id: client.id,
      appMode: client.appMode,
      connectedAt: client.connectedAt,
      lastPing: client.lastPing,
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
   * Handle new client connection
   */
  private handleNewConnection(socket: WebSocket, request: any): void {
    const clientId = this.generateClientId();

    // Wait for initial message with app mode
    socket.once("message", (data) => {
      try {
        const initMessage = JSON.parse(data.toString());

        if (initMessage.type === "init" && initMessage.appMode) {
          const client: ConnectedClient = {
            id: clientId,
            socket,
            appMode: initMessage.appMode,
            connectedAt: new Date(),
            lastPing: new Date(),
          };

          this.clients.set(clientId, client);

          // Set up message handling
          socket.on("message", (data) => {
            this.handleClientMessage(clientId, data);
          });

          socket.on("close", () => {
            this.handleClientDisconnect(clientId);
          });

          socket.on("error", (error) => {
            console.error(`Client ${clientId} error:`, error);
            this.handleClientDisconnect(clientId);
          });

          socket.on("pong", () => {
            const client = this.clients.get(clientId);
            if (client) {
              client.lastPing = new Date();
            }
          });

          // Send acknowledgment
          socket.send(
            JSON.stringify({
              type: "init_ack",
              clientId,
              timestamp: new Date(),
            })
          );

          this.emit("clientConnected", client);
          console.log(`Client connected: ${clientId} (${client.appMode})`);
        } else {
          socket.close();
        }
      } catch (error) {
        console.error("Invalid init message from client:", error);
        socket.close();
      }
    });

    // Set timeout for init message
    setTimeout(() => {
      if (!this.clients.has(clientId)) {
        socket.close();
      }
    }, 5000);
  }

  /**
   * Handle message from client
   */
  private async handleClientMessage(
    clientId: string,
    data: RawData
  ): Promise<void> {
    try {
      const message = JSON.parse(data.toString()) as MessageType;

      // Update client last activity
      const client = this.clients.get(clientId);
      if (client) {
        client.lastPing = new Date();
      }

      // Handle the message
      await this.handleMessage(message);

      // Forward to other clients if needed
      if (message.target === "all" || message.target !== this.appMode) {
        await this.sendMessage(message);
      }
    } catch (error) {
      console.error(`Error handling message from client ${clientId}:`, error);
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
      console.log(`Client disconnected: ${clientId} (${client.appMode})`);
    }
  }

  /**
   * Ping all clients to check connection
   */
  private pingClients(): void {
    const now = new Date();
    const clientsToRemove: string[] = [];

    for (const [clientId, client] of this.clients) {
      if (client.socket.readyState === WebSocket.OPEN) {
        // Check if client hasn't responded in a while
        const timeSinceLastPing = now.getTime() - client.lastPing.getTime();
        if (timeSinceLastPing > 60000) {
          // 1 minute timeout
          clientsToRemove.push(clientId);
        } else {
          client.socket.ping();
        }
      } else {
        clientsToRemove.push(clientId);
      }
    }

    // Remove unresponsive clients
    for (const clientId of clientsToRemove) {
      this.handleClientDisconnect(clientId);
    }
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
