import {
  initializeDatabase,
  ConfigurationRepository,
} from "@church-copilot/database";
import { defineEventHandler, getMethod, readBody, createError } from "h3";

const logConfig = (level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
  console.log(
    `%c${timestamp} [CONFIG-API-${level.toUpperCase()}]: ${message}`,
    level === "error"
      ? "color: #ff4444; font-weight: bold;"
      : level === "warn"
      ? "color: #ffaa00; font-weight: bold;"
      : "color: #44ff44;",
    data
  );
};

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  logConfig("info", `Configuration API called with method: ${method}`);

  if (method !== "POST") {
    logConfig("warn", `Method not allowed: ${method}`);
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  }

  try {
    const body = await readBody(event);

    logConfig("info", "Configuration save requested", {
      keys: Object.keys(body),
      data: body,
    });

    // Initialize database
    const db = await initializeDatabase();
    const dbInstance = db.getDb();
    const configRepo = new ConfigurationRepository(dbInstance);

    // Save each configuration key
    const results = [];
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string") {
        try {
          await configRepo.set(key, value);
          results.push({ key, status: "saved" });
          logConfig("info", `Configuration key saved: ${key} = ${value}`);
          console.log(`Configuration saved: ${key} = ${value}`);
        } catch (error) {
          logConfig("error", `Failed to save configuration key: ${key}`, error);
          console.error(`Failed to save configuration ${key}:`, error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          results.push({ key, status: "failed", error: errorMessage });
        }
      }
    }

    logConfig("info", "Configuration save completed", { results });

    return {
      success: true,
      message: "Configuration saved successfully",
      results,
    };
  } catch (error) {
    logConfig("error", "Configuration save failed", error);
    console.error("Failed to save configuration:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to save configuration",
    });
  }
});
