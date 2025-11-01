import { defineEventHandler, createError, readBody } from "h3";
import {
  initializeDatabase,
  YouTubeVideoRepository,
} from "@church-copilot/database";
import { unlink } from "fs/promises";
import { existsSync } from "fs";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { videoId } = body;

    if (!videoId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Video ID is required",
      });
    }

    // Initialize database
    const db = await initializeDatabase();
    const dbInstance = db.getDb();
    const repo = new YouTubeVideoRepository(dbInstance);

    // Get the video record first to check file path
    const video = await repo.findByVideoId(videoId);
    if (!video) {
      throw createError({
        statusCode: 404,
        statusMessage: "Video not found",
      });
    }

    // Delete the file if it exists
    if (video.filePath && existsSync(video.filePath)) {
      try {
        await unlink(video.filePath);
        console.log(`Deleted file: ${video.filePath}`);
      } catch (fileErr) {
        console.warn(`Failed to delete file ${video.filePath}:`, fileErr);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete from database
    await repo.delete(video.id);

    return {
      success: true,
      message: "Video deleted successfully",
      videoId,
    };
  } catch (error: any) {
    console.error("YouTube delete API error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to delete video",
    });
  }
});
