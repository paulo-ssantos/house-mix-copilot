import {
  YouTubeDownloader,
  type VideoInfo,
} from "@church-copilot/youtube-service";
import {
  isValidYouTubeUrl,
  extractYouTubeVideoId,
  type YouTubeConfig,
} from "@church-copilot/shared";

const youtubeConfig: YouTubeConfig = {
  downloadPath: process.env.YOUTUBE_DOWNLOAD_PATH || "./downloads",
  preferredFormat: process.env.YOUTUBE_PREFERRED_FORMAT || "best[height<=720]",
  audioOnly: process.env.YOUTUBE_AUDIO_ONLY === "true",
  subtitles: process.env.YOUTUBE_SUBTITLES === "true",
  maxConcurrentDownloads: parseInt(process.env.YOUTUBE_MAX_CONCURRENT || "2"),
};

const downloader = new YouTubeDownloader(youtubeConfig);

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { url } = body;

    if (!url || typeof url !== "string") {
      throw createError({
        statusCode: 400,
        statusMessage: "URL is required and must be a string",
      });
    }

    if (!isValidYouTubeUrl(url)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid YouTube URL",
      });
    }

    // Check if yt-dlp is available
    const isAvailable = await downloader.isYtDlpAvailable();
    if (!isAvailable) {
      throw createError({
        statusCode: 500,
        statusMessage: "yt-dlp is not installed or not available in PATH",
      });
    }

    // Get video information
    const videoInfo: VideoInfo = await downloader.getVideoInfo(url);

    return {
      success: true,
      data: {
        ...videoInfo,
        url,
        downloadable: true,
        formats: videoInfo.formats?.slice(0, 10), // Limit formats for response size
      },
    };
  } catch (error: any) {
    console.error("YouTube info API error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to get video information",
    });
  }
});
