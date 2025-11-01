import { initializeDatabase } from "@church-copilot/database";
import { YouTubeAutoDownloadService } from "@church-copilot/ai-service";
import {
  defineEventHandler,
  getMethod,
  readBody,
  createError,
  getQuery,
} from "h3";

export default defineEventHandler(async (event) => {
  try {
    const method = getMethod(event);

    // Initialize database
    const db = await initializeDatabase();
    const dbInstance = db.getDb();
    const autoDownloadService = new YouTubeAutoDownloadService(dbInstance);

    switch (method) {
      case "POST":
        // Download YouTube videos from provided URLs
        const body = await readBody(event);
        const { urls, liturgyDate } = body;

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
          throw createError({
            statusCode: 400,
            statusMessage: "URLs array is required",
          });
        }

        const results = await autoDownloadService.downloadYouTubeLinks(
          urls,
          liturgyDate
        );

        return {
          success: true,
          results,
          summary: {
            total: results.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
          },
        };

      case "GET":
        // Get download history
        const query = getQuery(event);
        const limit = query.limit ? parseInt(query.limit as string) : 50;

        const history = await autoDownloadService.getDownloadHistory(limit);

        return {
          success: true,
          history,
        };

      default:
        throw createError({
          statusCode: 405,
          statusMessage: "Method Not Allowed",
        });
    }
  } catch (error) {
    console.error("YouTube download API error:", error);

    throw createError({
      statusCode: 500,
      statusMessage:
        error instanceof Error
          ? error.message
          : "Failed to handle YouTube download request",
    });
  }
});
