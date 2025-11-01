// Client-safe logging composable for Nuxt 3
// Does not import winston to avoid browser compatibility issues

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  category?: string;
  [key: string]: any;
}

// Client-safe logger class
class SafeClientLogger {
  private formatTimestamp(): string {
    return new Date().toISOString().replace("T", " ").substring(0, 19);
  }

  private log(level: string, message: string, meta: any = {}) {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      ...meta,
    };

    // Console output with styling
    const styles: { [key: string]: string } = {
      error: "color: #ff4444; font-weight: bold;",
      warn: "color: #ffaa00; font-weight: bold;",
      info: "color: #44ff44;",
      debug: "color: #888888;",
    };

    console.log(
      `%c${entry.timestamp} [${level.toUpperCase()}]: ${message}`,
      styles[level] || "color: #ffffff;",
      meta
    );

    // Send to server API if in production and we're in the browser
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "production"
    ) {
      this.sendToServer(entry);
    }
  }

  private async sendToServer(entry: LogEntry) {
    try {
      // Only send to server if we're in the browser (client-side)
      if (
        typeof window !== "undefined" &&
        process.env.NODE_ENV === "production"
      ) {
        // Use fetch instead of $fetch to avoid potential issues
        await fetch("/api/logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(entry),
        });
      }
    } catch (error) {
      console.error("Failed to send log to server:", error);
    }
  }

  // User interaction logs
  userAction(action: string, data?: any) {
    this.log("info", `User Action: ${action}`, {
      action,
      data,
      category: "user-interaction",
    });
    console.log(`🎯 User Action: ${action}`, data);
  }

  // AI analysis logs
  aiAnalysis(input: string, output: any, duration?: number) {
    const inputLength = input.length;
    const outputItems = Array.isArray(output) ? output.length : 1;

    this.log("info", "AI Analysis", {
      inputLength,
      outputItems,
      duration,
      category: "ai-analysis",
    });

    console.log(
      `🤖 AI Analysis: ${inputLength} chars -> ${outputItems} items (${duration}ms)`
    );
  }

  // Liturgy management logs
  liturgyOperation(operation: string, liturgyId?: string, data?: any) {
    this.log("info", `Liturgy Operation: ${operation}`, {
      operation,
      liturgyId,
      data,
      category: "liturgy-management",
    });

    console.log(`⛪ Liturgy Operation: ${operation}`, data);
  }

  // System performance logs
  performance(operation: string, duration: number, metadata?: any) {
    this.log("debug", `Performance: ${operation}`, {
      operation,
      duration,
      metadata,
      category: "performance",
    });

    console.log(`⚡ Performance: ${operation} took ${duration}ms`, metadata);
  }

  // Error logs with context
  error(message: string, error?: Error, context?: any) {
    this.log("error", message, {
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
      context,
      category: "error",
    });

    console.error(`❌ Error: ${message}`, error, context);
  }

  // Security-related logs
  security(event: string, data?: any) {
    this.log("warn", `Security Event: ${event}`, {
      event,
      data,
      category: "security",
    });
    console.warn(`🔒 Security Event: ${event}`, data);
  }

  // System startup/shutdown logs
  system(event: string, data?: any) {
    this.log("info", `System Event: ${event}`, {
      event,
      data,
      category: "system",
    });
    console.log(`🔧 System: ${event}`, data);
  }
}

export const useLogger = () => {
  const logger = new SafeClientLogger();

  return {
    logger,
    userAction: logger.userAction.bind(logger),
    aiAnalysis: logger.aiAnalysis.bind(logger),
    liturgyOperation: logger.liturgyOperation.bind(logger),
    performance: logger.performance.bind(logger),
    error: logger.error.bind(logger),
    security: logger.security.bind(logger),
    system: logger.system.bind(logger),
  };
};

// Legacy support - create global loggers object
export const clientLoggers = {
  userAction: (action: string, data?: any) => {
    const { logger } = useLogger();
    logger.userAction(action, data);
  },

  aiAnalysis: (input: string, output: any, duration?: number) => {
    const { logger } = useLogger();
    logger.aiAnalysis(input, output, duration);
  },

  liturgyOperation: (operation: string, liturgyId?: string, data?: any) => {
    const { logger } = useLogger();
    logger.liturgyOperation(operation, liturgyId, data);
  },

  performance: (operation: string, duration: number, metadata?: any) => {
    const { logger } = useLogger();
    logger.performance(operation, duration, metadata);
  },

  error: (message: string, error?: Error, context?: any) => {
    const { logger } = useLogger();
    logger.error(message, error, context);
  },

  security: (event: string, data?: any) => {
    const { logger } = useLogger();
    logger.security(event, data);
  },

  system: (event: string, data?: any) => {
    const { logger } = useLogger();
    logger.system(event, data);
  },
};

// Default export for backward compatibility
export default useLogger;
