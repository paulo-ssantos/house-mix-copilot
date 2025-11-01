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

    // Open file based on platform
    let command: string;
    const platform = process.platform;

    switch (platform) {
      case "darwin": // macOS
        command = `open "${fullPath}"`;
        break;
      case "win32": // Windows
        command = `start "" "${fullPath}"`;
        break;
      case "linux": // Linux
      default:
        command = `xdg-open "${fullPath}"`;
        break;
    }

    try {
      await execAsync(command);
      return {
        success: true,
        message: "File opened successfully",
      };
    } catch (err) {
      console.error("Failed to open file:", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to open file",
      });
    }
  } catch (error: any) {
    console.error("System open-file API error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to open file",
    });
  }
});
