import { initializeDatabase } from "@church-copilot/database";
import { YouTubeAutoDownloadService } from "@church-copilot/ai-service";
import { defineEventHandler, getMethod, readBody, createError } from "h3";

const logYouTubeConfig = (level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
  console.log(
    `%c${timestamp} [YOUTUBE-CONFIG-${level.toUpperCase()}]: ${message}`,
    level === "error"
      ? "color: #ff4444; font-weight: bold;"
      : level === "warn"
      ? "color: #ffaa00; font-weight: bold;"
      : "color: #44ff44;",
    data
  );
};

export default defineEventHandler(async (event) => {
  try {
    const method = getMethod(event);

    logYouTubeConfig(
      "info",
      `YouTube config API called with method: ${method}`
    );

    // Initialize database
    const db = await initializeDatabase();
    const dbInstance = db.getDb();
    const autoDownloadService = new YouTubeAutoDownloadService(dbInstance);

    switch (method) {
      case "GET":
        logYouTubeConfig("info", "Getting YouTube configuration");
        // Get current configuration
        const config = await autoDownloadService.getConfig();
        logYouTubeConfig("info", "Retrieved YouTube configuration", config);
        return {
          success: true,
          config,
        };

      case "POST":
        // Update configuration
        const body = await readBody(event);
        logYouTubeConfig("info", "Updating YouTube configuration", {
          receivedConfig: body,
          downloadFolder: body?.downloadFolder,
        });

        await autoDownloadService.setConfig(body);
        logYouTubeConfig("info", "YouTube configuration updated in service");

        const updatedConfig = await autoDownloadService.getConfig();
        logYouTubeConfig(
          "info",
          "Retrieved updated YouTube configuration",
          updatedConfig
        );

        return {
          success: true,
          config: updatedConfig,
          message: "Configuration updated successfully",
        };

      default:
        logYouTubeConfig("warn", `Method not allowed: ${method}`);
        throw createError({
          statusCode: 405,
          statusMessage: "Method Not Allowed",
        });
    }
  } catch (error) {
    logYouTubeConfig("error", "YouTube config API error", error);
    console.error("YouTube config API error:", error);

    throw createError({
      statusCode: 500,
      statusMessage:
        error instanceof Error
          ? error.message
          : "Failed to handle YouTube configuration",
    });
  }
});
