import { AppMode } from "@church-copilot/shared";
import { CommunicationBase } from "./communication-base";
import { WebSocketCommunicationServer } from "./websocket-server";
import { WebSocketCommunicationClient } from "./websocket-client";
import { IPCCommunicationServer } from "./ipc-server";
import { IPCCommunicationClient } from "./ipc-client";

export { CommunicationBase } from "./communication-base";
export { WebSocketCommunicationServer } from "./websocket-server";
export { WebSocketCommunicationClient } from "./websocket-client";
export { IPCCommunicationServer } from "./ipc-server";
export { IPCCommunicationClient } from "./ipc-client";

export type {
  CommunicationMessage,
  LiturgyUpdateMessage,
  StreamContentMessage,
  ControlMessage,
  SystemMessage,
  SyncMessage,
  MessageType,
  MessageHandler,
} from "./communication-base";

export type { WebSocketServerOptions } from "./websocket-server";
export type { WebSocketClientOptions } from "./websocket-client";
export type { IPCServerOptions } from "./ipc-server";
export type { IPCClientOptions } from "./ipc-client";

/**
 * Factory function to create communication instance based on mode
 */
export function createCommunication(
  appMode: AppMode,
  type: "websocket-server" | "websocket-client" | "ipc-server" | "ipc-client",
  options: any
): CommunicationBase {
  switch (type) {
    case "websocket-server":
      return new WebSocketCommunicationServer(appMode, options);
    case "websocket-client":
      return new WebSocketCommunicationClient(appMode, options);
    case "ipc-server":
      return new IPCCommunicationServer(appMode, options);
    case "ipc-client":
      return new IPCCommunicationClient(appMode, options);
    default:
      throw new Error(`Unknown communication type: ${type}`);
  }
}
