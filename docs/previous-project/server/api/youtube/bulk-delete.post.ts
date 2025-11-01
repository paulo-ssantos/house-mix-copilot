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
    const { action, videoIds } = body;

    if (!action || !["deleteAll", "deleteSelected"].includes(action)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid action. Use 'deleteAll' or 'deleteSelected'",
      });
    }

    if (
      action === "deleteSelected" &&
      (!videoIds || !Array.isArray(videoIds))
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "Video IDs array is required for deleteSelected action",
      });
    }

    // Initialize database
    const db = await initializeDatabase();
    const dbInstance = db.getDb();
    const repo = new YouTubeVideoRepository(dbInstance);

    let videosToDelete;

    if (action === "deleteAll") {
      // Get all completed videos
      videosToDelete = await repo.findByStatus("COMPLETED");
    } else {
      // Get specific videos by IDs
      videosToDelete = [];
      for (const videoId of videoIds) {
        const video = await repo.findByVideoId(videoId);
        if (video) {
          videosToDelete.push(video);
        }
      }
    }

    if (videosToDelete.length === 0) {
      return {
        success: true,
        message: "No videos to delete",
        deletedCount: 0,
      };
    }

    let deletedFiles = 0;
    let deletedRecords = 0;
    const errors: string[] = [];

    // Delete files and database records
    for (const video of videosToDelete) {
      try {
        // Delete the file if it exists
        if (video.filePath && existsSync(video.filePath)) {
          try {
            await unlink(video.filePath);
            deletedFiles++;
            console.log(`Deleted file: ${video.filePath}`);
          } catch (fileErr) {
            console.warn(`Failed to delete file ${video.filePath}:`, fileErr);
            errors.push(`Failed to delete file for ${video.title}: ${fileErr}`);
            // Continue with database deletion
          }
        }

        // Delete from database
        await repo.delete(video.id);
        deletedRecords++;
      } catch (dbErr) {
        console.error(`Failed to delete video ${video.videoId}:`, dbErr);
        errors.push(`Failed to delete ${video.title}: ${dbErr}`);
      }
    }

    return {
      success: true,
      message: `Bulk delete completed. Deleted ${deletedRecords} records and ${deletedFiles} files.`,
      deletedCount: deletedRecords,
      deletedFiles,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    console.error("YouTube bulk delete API error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to perform bulk delete",
    });
  }
});
