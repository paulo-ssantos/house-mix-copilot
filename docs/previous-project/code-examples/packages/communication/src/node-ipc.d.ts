declare module "node-ipc" {
  interface IPC {
    config: {
      id: string;
      retry: number;
      maxRetries: number;
      silent: boolean;
      networkHost?: string;
      networkPort?: number;
      socketRoot?: string;
    };
    serve(callback?: () => void): void;
    connectTo(id: string, callback?: () => void): void;
    disconnect(id: string): void;
    server: {
      start(): void;
      stop(): void;
      on(event: string, callback: (...args: any[]) => void): void;
      emit(socket: any, event: string, data?: any): void;
      emit(event: string, data?: any): void;
    };
    of: {
      [key: string]: {
        on(event: string, callback: (...args: any[]) => void): void;
        emit(event: string, data?: any): void;
      };
    };
  }

  const ipc: IPC;
  export = ipc;
}
