import { defineEventHandler, readBody, createError } from "h3";
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import path from "path";

const execAsync = promisify(exec);

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { filePath } = body;

    if (!filePath || typeof filePath !== "string") {
      throw createError({
        statusCode: 400,
        statusMessage: "File path is required",
      });
    }

    // Resolve the full path
    const fullPath = path.resolve(filePath);

    // Check if file exists
    if (!existsSync(fullPath)) {
      throw createError({
        statusCode: 404,
        statusMessage: "File not found",
      });
    }

    // Show file in folder based on platform
    let command: string;
    const platform = process.platform;

    switch (platform) {
      case "darwin": // macOS
        command = `open -R "${fullPath}"`;
        break;
      case "win32": // Windows
        command = `explorer /select,"${fullPath}"`;
        break;
      case "linux": // Linux
      default:
        // For Linux, try specific file managers first (same logic as open-downloads-folder)
        const parentDir = path.dirname(fullPath);
        const fileManagers = [
          "nautilus", // GNOME Files
          "dolphin", // KDE Dolphin
          "thunar", // XFCE Thunar
          "nemo", // Cinnamon Nemo
          "pcmanfm", // LXDE PCManFM
        ];

        // Try to find an available file manager
        let fileManager = null;
        for (const manager of fileManagers) {
          try {
            await execAsync(`which ${manager}`);
            fileManager = manager;
            break;
          } catch {
            continue; // Try next file manager
          }
        }

        if (fileManager) {
          // Use the found file manager to show the file location
          if (fileManager === "nautilus") {
            command = `${fileManager} --select "${fullPath}"`;
          } else if (fileManager === "dolphin") {
            command = `${fileManager} --select "${fullPath}"`;
          } else {
            // For other file managers, open parent directory
            command = `${fileManager} "${parentDir}"`;
          }
        } else {
          // Fallback to xdg-open with parent directory
          command = `xdg-open "${parentDir}"`;
        }
        break;
    }

    try {
      await execAsync(command);
      return {
        success: true,
        message: "File location opened successfully",
      };
    } catch (err) {
      console.error("Failed to show file location:", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to show file location",
      });
    }
  } catch (error: any) {
    console.error("System show-in-folder API error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to show file location",
    });
  }
});
