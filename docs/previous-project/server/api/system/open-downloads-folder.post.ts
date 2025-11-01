import { defineEventHandler, createError } from "h3";
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { initializeDatabase } from "@church-copilot/database";
import { YouTubeAutoDownloadService } from "@church-copilot/ai-service";

const execAsync = promisify(exec);

// Get the configured YouTube downloads folder from database settings
const getDownloadsFolder = async (): Promise<string> => {
  try {
    const db = await initializeDatabase();
    const dbInstance = db.getDb();
    const autoDownloadService = new YouTubeAutoDownloadService(dbInstance);
    const config = await autoDownloadService.getConfig();

    const configuredPath =
      config.downloadFolder || path.join(process.cwd(), "downloads", "youtube");
    return path.resolve(configuredPath);
  } catch (error) {
    console.warn(
      "Failed to get download folder from database, using default:",
      error
    );
    // Fallback to default path
    const defaultPath = path.join(process.cwd(), "downloads", "youtube");
    return path.resolve(defaultPath);
  }
};

export default defineEventHandler(async (event) => {
  try {
    const downloadsPath = await getDownloadsFolder();

    // Create directory if it doesn't exist
    if (!existsSync(downloadsPath)) {
      throw createError({
        statusCode: 404,
        statusMessage: "Downloads folder not found",
      });
    }

    // Open downloads folder based on platform
    let command: string;
    const platform = process.platform;

    switch (platform) {
      case "darwin": // macOS
        command = `open "${downloadsPath}"`;
        break;
      case "win32": // Windows
        command = `explorer "${downloadsPath}"`;
        break;
      case "linux": // Linux
      default:
        // Try specific file managers first, then fall back to xdg-open
        const fileManagers = [
          "nautilus", // GNOME Files
          "dolphin", // KDE Dolphin
          "thunar", // XFCE Thunar
          "nemo", // Cinnamon Nemo
          "pcmanfm", // LXDE PCManFM
          "ranger", // Terminal file manager
          "xdg-open", // Generic fallback
        ];

        // Find the first available file manager
        let fileManager = "xdg-open"; // default fallback
        for (const manager of fileManagers) {
          try {
            await execAsync(`which ${manager}`);
            fileManager = manager;
            break;
          } catch (err) {
            // Manager not found, try next one
            continue;
          }
        }

        // Special handling for different file managers
        if (fileManager === "ranger") {
          // Ranger needs terminal, skip it
          command = `xdg-open "${downloadsPath}"`;
        } else if (fileManager === "dolphin") {
          // Dolphin needs specific flag to select folder
          command = `${fileManager} "${downloadsPath}"`;
        } else {
          command = `${fileManager} "${downloadsPath}"`;
        }
        break;
    }

    try {
      await execAsync(command);
      return {
        success: true,
        message: "Downloads folder opened successfully",
        path: downloadsPath,
      };
    } catch (err) {
      console.error("Failed to open downloads folder:", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to open downloads folder",
      });
    }
  } catch (error: any) {
    console.error("System open-downloads-folder API error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to open downloads folder",
    });
  }
});
